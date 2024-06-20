import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {LambdaFunction} from './lamda_function';

interface GetRaceUrlsStateMachineProps {
  readonly stackName: string;
  readonly queue: sqs.Queue;
}

export class GetRaceUrlsStateMachine extends Construct {
  readonly stateMachine: sfn.StateMachine;

  constructor(
    scope: Construct,
    id: string,
    props: GetRaceUrlsStateMachineProps
  ) {
    super(scope, id);

    const {lambdaFunction} = new LambdaFunction(this, 'Function', {
      stackName: props.stackName,
      functionName: 'GetRaceUrlsFunction',
      entry: 'functions/get_race_urls.ts',
      handler: 'handler',
      timeout: cdk.Duration.minutes(1),
    });

    const funcTask = new sfnTasks.LambdaInvoke(this, 'GetRaceUrls', {
      lambdaFunction,
      payloadResponseOnly: true,
    });

    const mapTask = new sfn.Map(this, 'SendToQueueMap', {
      itemsPath: '$.messages',
      itemSelector: {
        'messages.$': '$$.Map.Item.Value',
      },
      resultPath: '$.mapresult',
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
      definitionBody: sfn.DefinitionBody.fromChainable(
        funcTask.next(mapTask).next(
          new sfn.Pass(this, 'Pass', {
            result: sfn.Result.fromObject({batchItemFailures: []}),
          })
        )
      ),
      stateMachineType: sfn.StateMachineType.EXPRESS,
      logs: {
        destination: new logs.LogGroup(this, 'LogGroup', {
          logGroupName: `${props.stackName}/GetRaceUrlsStateMachine`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        includeExecutionData: true,
        level: sfn.LogLevel.ALL,
      },
      tracingEnabled: true,
    });
  }
}
