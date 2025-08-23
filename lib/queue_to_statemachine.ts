import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as eventSource from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import {LambdaFunction} from './lamda_function';

interface QueueToStateMachineProps {
  readonly stackName: string;
  readonly stateMachine: sfn.StateMachine;
}

export class QueueToStateMachine extends Construct {
  readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: QueueToStateMachineProps) {
    super(scope, id);

    this.queue = new sqs.Queue(this, 'Default', {
      visibilityTimeout: cdk.Duration.minutes(5),
      retentionPeriod: cdk.Duration.minutes(15),
    });

    // 本当はEventBridge Pipesを使いたかったが、MaxConcurrencyの制御ができないため、
    // Lambdaで実装する
    const {lambdaFunction: func} = new LambdaFunction(this, 'Function', {
      stackName: props.stackName,
      functionName: 'SqsToStateMachineFunction',
      entry: 'functions/sqs_to_statemachine.ts',
      handler: 'handler',
      timeout: cdk.Duration.minutes(5),
      environment: {
        STATE_MACHINE_ARN: props.stateMachine.stateMachineArn,
      },
    });

    func.addEventSource(
      new eventSource.SqsEventSource(this.queue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(60),
        reportBatchItemFailures: true,
        maxConcurrency: 2,
      }),
    );

    props.stateMachine.grantStartSyncExecution(func);
  }
}
