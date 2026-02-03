import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as scheduler from 'aws-cdk-lib/aws-scheduler'
import * as targets from 'aws-cdk-lib/aws-scheduler-targets'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'

export interface StateMachineSchedulerProps {
  readonly scheduleExpression: string;
  readonly scheduleTimeZone: string;
  readonly stateMachine: sfn.StateMachine;
}

export class StateMachineScheduler extends Construct {
  constructor (scope: Construct, id: string, props: StateMachineSchedulerProps) {
    super(scope, id)

    // eslint-disable-next-line no-new
    new scheduler.Schedule(this, 'Default', {
      schedule: scheduler.ScheduleExpression.expression(
        props.scheduleExpression, cdk.TimeZone.of(props.scheduleTimeZone)),
      timeWindow: scheduler.TimeWindow.flexible(cdk.Duration.minutes(10)),
      target: new targets.StepFunctionsStartExecution(props.stateMachine, {}),
    })
  }
}
