import type { SQSBatchResponse, SQSEvent } from 'aws-lambda'
import middy from '@middy/core'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware'
import * as awsSfn from './common/awssfn'
import { getLogger, getTracer } from './common/powertools'
import { getEnvironment } from './common/get_environment'

const logger = getLogger('INFO')
const tracer = getTracer()

const stateMachineArn = getEnvironment('STATE_MACHINE_ARN')

async function sqsToStatemachineHandler (
  event: SQSEvent
): Promise<SQSBatchResponse> {
  const output = await awsSfn.startSyncExecution(
    stateMachineArn,
    event.Records
  )
  return output as SQSBatchResponse
}

export const handler = middy(sqsToStatemachineHandler)
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
