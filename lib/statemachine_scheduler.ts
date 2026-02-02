import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as scheduler from 'aws-cdk-lib/aws-scheduler'
import * as targets from 'aws-cdk-lib/aws-scheduler-targets'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'

export interface StateMachineSchedulerProps {
  readonly scheduleExpression: string;
  readonly scheduleTimeZone: string;
  readonly stateMachine: sfn.StateMachine;
  readonly state?: string;
}

export class StateMachineScheduler extends Construct {
  constructor (scope: Construct, id: string, props: StateMachineSchedulerProps) {
    super(scope, id)

    const targetProps: targets.ScheduleTargetBaseProps = props.state
      ? {
          input: scheduler.ScheduleTargetInput.fromText(props.state),
        }
      : {}

    // eslint-disable-next-line no-new
    new scheduler.Schedule(this, 'Default', {
      schedule: scheduler.ScheduleExpression.expression(
        props.scheduleExpression, cdk.TimeZone.of(props.scheduleTimeZone)),
      timeWindow: scheduler.TimeWindow.flexible(cdk.Duration.minutes(10)),
      target: new targets.StepFunctionsStartExecution(props.stateMachine, targetProps),
    })
  }
}
