import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {LambdaFunction} from './lamda_function';

interface GetDayRacesUrlsStateMachineProps {
  readonly stackName: string;
  readonly queue: sqs.Queue;
}

export class GetDayRacesUrlsStateMachine extends Construct {
  readonly stateMachine: sfn.StateMachine;

  constructor(
    scope: Construct,
    id: string,
    props: GetDayRacesUrlsStateMachineProps
  ) {
    super(scope, id);

    const {lambdaFunction} = new LambdaFunction(this, 'Function', {
      stackName: props.stackName,
      functionName: 'GetDayRacesUrlsFunction',
      entry: 'functions/get_dayraces_urls.ts',
      handler: 'handler',
      timeout: cdk.Duration.minutes(1),
    });

    const funcTask = new sfnTasks.LambdaInvoke(this, 'GetDayRacesUrls', {
      lambdaFunction,
      payloadResponseOnly: true,
    });

    const mapTask = new sfn.Map(this, 'SendToQueueMap', {
      itemsPath: '$.messages',
      itemSelector: {
        'messages.$': '$$.Map.Item.Value',
      },
    });
    mapTask.itemProcessor(
      new sfnTasks.CallAwsService(this, 'SendToQueue', {
        service: 'sqs',
        action: 'sendMessageBatch',
        parameters: {
          'Entries.$': '$.messages',
          QueueUrl: props.queue.queueUrl,
        },
        iamAction: 'sqs:SendMessage',
        iamResources: [props.queue.queueArn],
      })
    );

    this.stateMachine = new sfn.StateMachine(this, 'Default', {
      definitionBody: sfn.DefinitionBody.fromChainable(funcTask.next(mapTask)),
      tracingEnabled: true,
    });
  }
}
