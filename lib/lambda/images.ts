import * as cdk from 'aws-cdk-lib';
import {Construct} from "constructs";
import {aws_iam, aws_lambda, aws_s3} from "aws-cdk-lib";
import stackConfig from "../../config/stack_config";
import stack_config from "../../config/stack_config";
export class ImageManagement {
    protected functionName: string = "GenerateDalleImage";

    // Memory allocated to the function in MB
    protected functionMemory: number = 256;

    // Function timeout in seconds
    protected functionTimeout: number = 90

    // Image bucket to be used by the Lambdas for image storage
    protected imageBucket: aws_s3.Bucket;

    // Layer containing the required dependencies for the Lambdas
    protected lambdaLayer: aws_lambda.LayerVersion;

    // Execution IAM role for the Lambda functions
    protected executionRole: aws_iam.IRole;

    public constructor(protected scope:Construct, imageBucket: aws_s3.Bucket) {
        if (stackConfig.openai_api_key.length < 1) {
            throw ("Config file needs an API key from OpenAPI.com added.")
        }

        this.lambdaLayer = new aws_lambda.LayerVersion(this.scope, `${this.functionName}DependencyLayer`, {
            code: aws_lambda.Code.fromAsset("code/lambda/generate_image_deps.zip"),
            compatibleArchitectures: [aws_lambda.Architecture.X86_64],
        });
        this.imageBucket = imageBucket;
        this.executionRole = this.createExecutionRole(imageBucket.bucketArn);
    }

    /**
     * Create a Lambda function to request image generation with the Dalle API
     *
     * @return {aws_lambda.Function} lambdaFunc
     *
     * @public
     */
    public generateImageFunc() : aws_lambda.Function
    {
        return new aws_lambda.Function(
            this.scope,
            this.functionName,
            {
                functionName: this.functionName,
                code: aws_lambda.Code.fromAsset("code/lambda/generate_image"),
                runtime: aws_lambda.Runtime.PYTHON_3_8,
                layers: [this.lambdaLayer],
                handler: "generate_image.handler",
                memorySize: this.functionMemory,
                timeout: cdk.Duration.seconds(this.functionTimeout),
                role: this.executionRole,
                environment: {
                    TZ: stackConfig.stack_timezone,
                    OPENAI_API_KEY: stack_config.openai_api_key,
                    IMAGE_BUCKET: this.imageBucket.bucketName,
                    IMAGE_PATH: stack_config.s3_image_path ?? "",
                    IMAGE_SIZE: stack_config.dalle_image_size ?? "1024x1024"
                }
            }
        );
    }

    /**
     * Create an execution role for use with the Generate Image function
     *
     * @param {string} imageBucket
     * @return {aws_iam.IRole} iamRole
     *
     * @protected
     */
    protected createExecutionRole(imageBucket: string) : aws_iam.IRole
    {
        let iamRole = new aws_iam.Role(this.scope, `${this.functionName}ExecRole`, {
            assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
            description: "IAM role to be assumed by the Image Generation Lambda",
        })

        let lambdaPolicy = new aws_iam.ManagedPolicy(this.scope, `${this.functionName}ExecPolicy`, {
            statements: [
                this.s3Permissions(imageBucket)
            ]
        });

        iamRole.addManagedPolicy(lambdaPolicy);
        iamRole.addManagedPolicy(aws_iam.ManagedPolicy.fromManagedPolicyArn(
            this.scope,
            "AWSBasicLambdaExecPolicy",
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ));

        return iamRole;
    }

    /**
     * Define S3 actions allowed by the Lambda for S3
     *
     * @param {string} imageBucket
     * @return {aws_iam.PolicyStatement}
     *
     * @protected
     */
    protected s3Permissions(imageBucket: string) : aws_iam.PolicyStatement
    {
        return new cdk.aws_iam.PolicyStatement({
            actions: [
                "s3:DeleteObject",
                "s3:GetObject",
                "s3:ListAllMyBuckets",
                "s3:ListBucket",
                "s3:PutObject"
            ],
            resources: [
                `${imageBucket}/*`
            ],
        });
    }
}
