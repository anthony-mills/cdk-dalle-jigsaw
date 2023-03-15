# OpenAI DALL-E Image Jigsaw Generation Stack

A simple AWS CDK stack written in Typescript that will deploy a serverless application, to create an image using the DallE AI image generation model.
The generated image is then stored in a S3 bucket, configured as a static website that will serve the image to visitors as a jigsaw puzzle.

### Stack Infrastructure:

The stack is made up of three main components, these are:

* Python Lambda function for image generation.
* A public S3 bucket used for hosting the jigsaw website and holding generated images.
* A cron like event bridge rule to run the image generation Lambda once per day.

![CDK Stack Contents](images/stack_resources.png?raw=true "CDK Stack")

### Configuration / Prerequisites

At a minimum to deploy you are going to need the AWS CLI tool and an active environment configured for the stack to get deployed to.

Beyond that you will also need an [OpenAI API key](https://platform.openai.com/playground), which allows the Lambda function to interact with the DallE image generation model.

The OpenAI key can either be added to the application config file in config/stack_config.ts. Or passed to the stack at the time of deployment i.e. _OPENAI_API_KEY="myopenaiapikey" npx cdk deploy_

### Getting Started

Install the required javascript libraries for the stack:

_npm install_ 

After you have set up an active AWS profile for your environment, you will need to bootstrap your AWS account. 
This is a one time process and will create IAM roles and other associated that will allow the CDK Framework to do things within your account.

_npx cdk bootstrap_

Once you have reached this step make sure you have gotten an [OpenAI API key](https://platform.openai.com/playground) and added it to your stack config or to the environment via the OPENAI_API_KEY variable.

Failure to do so will result in the stack quitting when you try to continue:

![Missing OpenAI API Key](images/missing_api_key.png?raw=true "No API Key")

From this point you can either synthesize a CloudFormation template to see what resources will be created in your account with:

_npx cdk synth_

Or just dive straight in with deploying the stack:

_npx cdk deploy_

Which when successful will display a bunch of CloudFormation outputs like the following:

![CDK Stack Outputs](images/deployed_stack.png?raw=true "Dalle Image Stack Outputs")

**Note**: If you have role issues when trying to deploy the stack. Try using the flag --asset-parallelism=false.

You can now open the URL provided by the ImageBucketURL output in a browser, and you will see something similar to:


![Public S3 Bucket Website](images/jigsaw.png?raw=true "Generated Jigsaw")

Every day a Lambda function that is part of the stack will be triggered by an EventBridge rule ( at 5am UTC ).
This function will then pull a quote from [Zen Quotes](https://zenquotes.io/), feed it to the DallE image generation model to create an AI vision of the quote.
The generated image is then saved to the public S3 bucket for transformation into jigsaw when a visitor visits the static website URL.

### Why??

What is the point of all this? No concrete reason, I heard that OpenAI had opened the API for the DallE model to the public, and it seemed like a fun weekend project to play with. 

Interacting with the API and saving the images seemed like a perfect fit for a simple serverless architecture. 
From that point it just made sense to then wrap the application up together as a CDK stack for ease of managing the required cloud infrastructure.

### Special Thanks

* The [HeadBreaker](https://github.com/flbulgarelli/headbreaker) JS library that is used to turn the generated AI image into a puzzle.

* [Zen Quotes](https://zenquotes.io/) for their super easy to use API.

### Licence

Copyright (C) 2023 [Anthony Mills](https://www.anthony-mills.com)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.