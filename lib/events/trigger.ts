import {Construct} from "constructs";
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import {aws_events_targets, aws_lambda} from "aws-cdk-lib";

export class LambdaTrigger {
    public constructor(protected scope:Construct) {}

    /**
     * Trigger the image generation lambda periodically via a cron like event
     *
     * @param {aws_lambda.Function} lambdaFunc
     *
     * @return {void}
     *
     * @public
     */
    public cronTrigger(lambdaFunc: aws_lambda.Function): void
    {
        let lambdaRule = new Rule(this.scope, 'LambdaScheduleRule', {
            schedule: Schedule.cron({ minute: '0', hour: '5' }),
        });

        lambdaRule.addTarget(new aws_events_targets.LambdaFunction(lambdaFunc));
    }
}