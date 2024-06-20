import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import {LambdaFunction} from './lamda_function';

interface ApiFunctionProps {
  readonly stackName: string;
  readonly stage: string;
  readonly cacheBucket: string;
  readonly cachePrefix: string;
}

export class ApiFunction extends Construct {
  constructor(scope: Construct, id: string, props: ApiFunctionProps) {
    super(scope, id);

    const {lambdaFunction: func} = new LambdaFunction(this, 'Default', {
      stackName: props.stackName,
      entry: 'functions/api_handler.ts',
      handler: 'handler',
      functionName: 'ApiFunction',
      memorySize: 160,
      timeout: cdk.Duration.seconds(30),
      environment: {
        CACHE_BUCKET: props.cacheBucket,
        CACHE_PREFIX: props.cachePrefix,
      },
    });

    const bucket = s3.Bucket.fromBucketName(
      this,
      'CacheBucket',
      props.cacheBucket
    );

    bucket.grantRead(func);

    const url = func.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new ssm.StringParameter(this, 'ApiUrlParameter', {
      parameterName: `/${props.stage}/NarApi/Url`,
      stringValue: url.url,
    });
  }
}
