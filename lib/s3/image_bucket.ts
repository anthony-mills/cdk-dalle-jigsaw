import {aws_iam, aws_s3, aws_s3_deployment} from 'aws-cdk-lib';
import {Construct} from "constructs";
import stackConfig from "../../config/stack_config";
import {BucketAccessControl} from "aws-cdk-lib/aws-s3";

export class ImageBucket {
    public constructor(protected scope:Construct) {
        if (stackConfig.s3_bucket_name.length < 1) {
            throw ("A bucket name needs to be added to the config for saving the generate images.")
        }
    }

    /**
     * Create an S3 bucket to hold any generated images.
     *
     * @return {aws_s3.Bucket} stackBucket
     *
     * @public
     */
    public createImageBucket() : aws_s3.Bucket
    {
        let stackBucket = new aws_s3.Bucket(this.scope, stackConfig.s3_bucket_name, {
            encryption: aws_s3.BucketEncryption.S3_MANAGED,
            enforceSSL: false,
            accessControl: BucketAccessControl.PUBLIC_READ,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html'
        });

        stackBucket.addToResourcePolicy(
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            principals: [new aws_iam.AnyPrincipal()],
            actions: ['s3:GetObject'],
            resources: [`${stackBucket.bucketArn}/*`],
          }),
        );

        new aws_s3_deployment.BucketDeployment(this.scope, 'DeployWebsite', {
            sources: [aws_s3_deployment.Source.asset('code/website')],
            destinationBucket: stackBucket
        });

        return stackBucket;
    }
}