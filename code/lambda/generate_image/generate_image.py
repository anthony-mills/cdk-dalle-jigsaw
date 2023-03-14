import datetime
import hashlib
import json
import logging
import os
import random

import boto3
import botocore
import openai
import requests

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", logging.DEBUG))

s3_client = boto3.resource("s3", os.environ.get("AWS_REGION", "us-east-1"))

# Name of the S3 bucket to store your generated images
image_bucket = os.getenv("IMAGE_BUCKET", "")

# Name of the generated image manifest
manifest_file = os.getenv("IMAGE_MANIFEST", "manifest.json")

# Dimensions of the image to be generated
image_size = os.getenv("IMAGE_SIZE", "1024x1024")

# Bucket path for image storage ( prefix )
image_path = os.getenv("IMAGE_PATH", "images/")

# API key for interacting with the OpenAI models
openai.api_key = os.getenv("OPENAI_API_KEY", "")

# Source for the quote
quote_api = "https://zenquotes.io/api/random"

def store_image(image_url: str, headline: str) -> str:
    """ Store the generated image to an S3 bucket. """
    req_for_image = requests.get(image_url, stream=True)
    s3_key = image_path + hashlib.sha256(str.encode(image_url)).hexdigest() + ".png"
    file_object_from_req = req_for_image.raw
    req_data = file_object_from_req.read()
    metadata = {"headline": headline}
    s3_client.Object(image_bucket, s3_key).put(Body=req_data, Metadata=metadata)

    return s3_key


def image_manifest(s3_key: str, quote: str, author: str, image_type: str):
    try:
        s3_resp = s3_client.Object(image_bucket, image_path + manifest_file).get()["Body"].read().decode("utf-8");
        manifest = json.loads(s3_resp)
    except botocore.exceptions.ClientError as e:
        manifest = []

    try:
        now = datetime.datetime.now()
        manifest.insert(0, {"key": s3_key, "quote": quote, "author": author, "image_type": image_type, "time": now.strftime("%d-%m-%Y %I:%M %p %Z")})
        s3_client.Object(image_bucket, image_path + manifest_file).put(Body=json.dumps(manifest))
    except botocore.exceptions.ClientError as e:
        logger.error(f"Error writing image manifest: {e}")


def generate_image(img_desc: str, image_num=1) -> str:
    """ Generate an image based on the provided description. """
    try:
        response = openai.Image.create(
            prompt=img_desc,
            n=image_num,
            size=image_size
        )

        image_url = response["data"][0]["url"]
        logger.info(f"API returned image URL: {image_url}")

        return image_url
    except openai.error.OpenAIError as e:
        logger.error(f"OpenAPI Error {e}")


def get_quote() -> dict:
    """ Get a quote for the image. """
    try:
        resp = (requests.get(quote_api).json())[0]

        print(resp.get("q", ""))

        if ("a" in resp) == False or ("q" in resp) == False :
            raise Exception("Empty quote object returned.")
        return resp

    except e as error:
        logger.error(f"Error retrieving quote: {error}")

def image_type() -> str:
    return random.choice(["Cartoon", "B & W Photo", "Charcoal Sketch", "Photo", "Pixel Art", "Painting"])

def handler(event, context):
    """ Lambda entry point. """
    quote, image_cat = get_quote(), image_type()

    image_desc = f"{quote.get('q', '')} - {image_cat}"
    image_url = generate_image(image_desc)
    s3_key = store_image(image_url, image_desc)
    image_manifest(s3_key, quote.get('q', ''), quote.get('a', ''), image_cat)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"msg": f"Generate image for description: {image_desc}", "error": ""}, indent=4)
    }


if __name__ == "__main__":
    handler(None, None)