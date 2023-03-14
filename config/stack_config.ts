import * as cdk from 'aws-cdk-lib';

const stackConfig =  {
    // The name of the stack
    stack_name: "dalle-img",
    // Stack timezone
    stack_timezone: process.env.TZ ?? "Australia/Melbourne",
    // OPENAI.com API Key
    openai_api_key: process.env.OPENAI_API_KEY ?? "",
    // Name of bucket to store images
    s3_bucket_name: "dalleimg",
    // The path or prefix to use for storing images in the bucket
    s3_image_path: "images/",
    // The dimensions you would like created from the DALL-E model
    dalle_image_size: "512x512",
    // Default removal policy for CDK resources created
    default_removal_policy: cdk.RemovalPolicy.DESTROY,
    tags: {
        'Usage': 'Experiment'
    }
}

stackConfig.tags = {
    ...stackConfig.tags,
    ...{
        'CdkStack' : stackConfig.stack_name
    }
}


export default stackConfig;