import {Construct} from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

export interface StateMachineSchedulerProps {
  readonly scheduleExpression: string;
  readonly scheduleTimeZone: string;
  readonly stateMachine: sfn.StateMachine;
  readonly state?: string;
}

export class StateMachineScheduler extends Construct {
  constructor(scope: Construct, id: string, props: StateMachineSchedulerProps) {
    super(scope, id);

    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });

    props.stateMachine.grantStartExecution(role);

    new scheduler.CfnSchedule(this, 'Default', {
      scheduleExpression: props.scheduleExpression,
      scheduleExpressionTimezone: props.scheduleTimeZone,
      flexibleTimeWindow: {mode: 'OFF'},
      target: {
        arn: props.stateMachine.stateMachineArn,
        roleArn: role.roleArn,
      },
      state: props.state,
    });
  }
}
