import {SFNClient, StartSyncExecutionCommand} from '@aws-sdk/client-sfn';
import {getTracer} from './powertools';

const tracer = getTracer();
const client = tracer.captureAWSv3Client(new SFNClient());

export async function startSyncExecution(
  stateMachineArn: string | undefined,
  input: object,
): Promise<unknown> {
  const command = new StartSyncExecutionCommand({
    stateMachineArn,
    input: JSON.stringify(input),
  });
  const {output} = await client.send(command);
  return output === undefined ? undefined : JSON.parse(output);
}
