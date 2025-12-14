import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { StateMachineScheduler } from './statemachine_scheduler'
import { GetDayRacesUrlsStateMachine } from './get_dayraces_urls_statemachine'
import { GetRaceUrlsStateMachine } from './get_race_urls_statemachine'
import { QueueToStateMachine } from './queue_to_statemachine'
import { RaceQueue } from './race_queue'
import { ApiFunction } from './api_function'

interface NarApiStackProps extends cdk.StackProps {
  stage: string;
  cacheBucket: string;
  cachePrefix: string;
  scheduleExpression: string;
  scheduleTimeZone: string;
}

export class NarApiStack extends cdk.Stack {
  constructor (scope: Construct, id: string, props: NarApiStackProps) {
    super(scope, id, props)

    const raceQueue = new RaceQueue(this, 'RaceQueue', {
      stackName: this.stackName,
      cacheBucket: props.cacheBucket,
      cachePrefix: props.cachePrefix,
    })

    const getRacesUrlsStateMachine = new GetRaceUrlsStateMachine(
      this,
      'GetRaceUrlsStateMachine',
      {
        stackName: this.stackName,
        queue: raceQueue.queue,
      }
    )

    const dayRaceQueue = new QueueToStateMachine(this, 'DayRaceQueue', {
      stackName: this.stackName,
      stateMachine: getRacesUrlsStateMachine.stateMachine,
    })

    const getDayRacesUrlsStateMachine = new GetDayRacesUrlsStateMachine(
      this,
      'GetDayRacesUrlsStateMachine',
      {
        stackName: this.stackName,
        queue: dayRaceQueue.queue,
      }
    )

    // eslint-disable-next-line no-new
    new StateMachineScheduler(this, 'GetDayRacesUrlsScheduler', {
      scheduleExpression: props.scheduleExpression,
      scheduleTimeZone: props.scheduleTimeZone,
      stateMachine: getDayRacesUrlsStateMachine.stateMachine,
    })

    // eslint-disable-next-line no-new
    new ApiFunction(this, 'ApiFunction', {
      stackName: this.stackName,
      stage: props.stage,
      cacheBucket: props.cacheBucket,
      cachePrefix: props.cachePrefix,
    })
  }
}
