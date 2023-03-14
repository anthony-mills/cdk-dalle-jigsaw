import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {ImageManagement} from "./lambda/images"
import {LambdaTrigger} from "./events/trigger";
import {ImageBucket} from "./s3/image_bucket";
import {aws_s3} from "aws-cdk-lib";

export class DalleImgStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    let imageBucket: aws_s3.Bucket = (new ImageBucket(this)).createImageBucket();
    this.stackOutputs("ImageBucket", imageBucket.bucketName, imageBucket.bucketArn);

    // Output the URL for the bucket
    new cdk.CfnOutput(this, "ImageBucketURL", { value: imageBucket.bucketWebsiteUrl });

    let lambdaMgt = new ImageManagement(this, imageBucket);
    let generateImage = lambdaMgt.generateImageFunc();
    this.stackOutputs("GenerateImageFunc", generateImage.functionName, generateImage.functionArn);

    (new LambdaTrigger(this)).cronTrigger(generateImage);
  }

  /**
   * Create CloudFormation outputs for resources contained within the stack
   *
   * @protected
   */
  protected stackOutputs(exportName: string, resourceName: string, resourceArn: string)
  {
    new cdk.CfnOutput(this, exportName, { value: resourceName });
    new cdk.CfnOutput(this, `${exportName}ARN`, { value: resourceArn });
  }
}
