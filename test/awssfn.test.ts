import {SFNClient, StartSyncExecutionCommand} from '@aws-sdk/client-sfn';
import {mockClient} from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import {startSyncExecution} from '../functions/common/awssfn';

const sfnMock = mockClient(SFNClient);

describe('awssfn', () => {
  afterEach(() => {
    sfnMock.reset();
  });

  it('startSyncExecution', async () => {
    sfnMock.on(StartSyncExecutionCommand).resolves({
      output: '{"KEY": "BODY"}',
    });
    const result = await startSyncExecution('ARN', {key: 'body'});
    expect(sfnMock).toHaveReceivedCommandWith(StartSyncExecutionCommand, {
      input: JSON.stringify({key: 'body'}),
      stateMachineArn: 'ARN',
    });
    expect(result).toEqual({KEY: 'BODY'});
  });

  it('startSyncExecution: undefined', async () => {
    sfnMock.on(StartSyncExecutionCommand).resolves({
      output: undefined,
    });
    const result = await startSyncExecution('ARN', {key: 'body'});
    expect(sfnMock).toHaveReceivedCommandWith(StartSyncExecutionCommand, {
      input: JSON.stringify({key: 'body'}),
      stateMachineArn: 'ARN',
    });
    expect(result).toBeUndefined();
  });
});
