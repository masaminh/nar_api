import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as eventSource from 'aws-cdk-lib/aws-lambda-event-sources'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { LambdaFunction } from './lamda_function'

interface RaceQueueProps {
  readonly stackName: string;
  readonly cacheBucket: string;
  readonly cachePrefix: string;
}

export class RaceQueue extends Construct {
  readonly queue: sqs.Queue

  constructor (scope: Construct, id: string, props: RaceQueueProps) {
    super(scope, id)

    this.queue = new sqs.Queue(this, 'Default', {
      visibilityTimeout: cdk.Duration.minutes(5),
      retentionPeriod: cdk.Duration.minutes(15),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    })

    const { lambdaFunction: func } = new LambdaFunction(this, 'Function', {
      stackName: props.stackName,
      functionName: 'GetRaceFunction',
      entry: 'functions/get_race.ts',
      handler: 'handler',
      timeout: cdk.Duration.minutes(5),
      environment: {
        CACHE_BUCKET: props.cacheBucket,
        CACHE_PREFIX: props.cachePrefix,
      },
    })

    func.addEventSource(
      new eventSource.SqsEventSource(this.queue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(60),
        reportBatchItemFailures: true,
        maxConcurrency: 2,
      })
    )

    const bucket = s3.Bucket.fromBucketName(this, 'Bucket', props.cacheBucket)
    bucket.grantWrite(func)
  }
}
