import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as logs from 'aws-cdk-lib/aws-logs'

interface LambdaFunctionProps {
  readonly stackName: string;
  readonly entry: string;
  readonly handler: string;
  readonly functionName: string;
  readonly memorySize?: number;
  readonly timeout: cdk.Duration;
  readonly environment?: { [key: string]: string };
}

export class LambdaFunction extends Construct {
  readonly lambdaFunction: lambda.Function

  constructor (scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id)

    this.lambdaFunction = new lambdaNodejs.NodejsFunction(this, 'Default', {
      entry: props.entry,
      handler: props.handler,
      functionName: `${props.stackName}-${props.functionName}`,
      architecture: lambda.Architecture.ARM_64,
      memorySize: props.memorySize,
      timeout: props.timeout,
      tracing: lambda.Tracing.ACTIVE,
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: props.environment,
      logGroup: new logs.LogGroup(this, 'LogGroup', {
        logGroupName: `${props.stackName}/${props.functionName}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    })
  }
}
