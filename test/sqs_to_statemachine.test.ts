import type {Context, SQSBatchResponse, SQSRecord} from 'aws-lambda';
import {startSyncExecution} from '../functions/common/awssfn';
import {handler} from '../functions/sqs_to_statemachine';

jest.mock('@aws-lambda-powertools/logger');
jest.mock('@aws-lambda-powertools/tracer');
jest.mock('../functions/common/get_environment', () => ({
  getEnvironment: (name: string) => {
    if (name === 'STATE_MACHINE_ARN') {
      return 'STATE_MACHINE_ARN_VALUE';
    }
    throw new Error(`unexpected name: ${name}`);
  },
}));
jest.mock('../functions/common/awssfn');

const mockStartSyncExecution = startSyncExecution as jest.MockedFunction<
  typeof startSyncExecution
>;

describe('sqs_to_statemachine', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('正常系', async () => {
    const startSyncExecutionResponse: SQSBatchResponse = {
      batchItemFailures: [{itemIdentifier: '1'}],
    };
    mockStartSyncExecution.mockResolvedValueOnce(startSyncExecutionResponse);

    const response = await handler(
      {Records: [{messageId: '1'} as SQSRecord]},
      {} as Context,
    );

    expect(response).toEqual(startSyncExecutionResponse);
    expect(mockStartSyncExecution).toHaveBeenCalledTimes(1);
    expect(mockStartSyncExecution).toHaveBeenCalledWith(
      'STATE_MACHINE_ARN_VALUE',
      [{messageId: '1'} as SQSRecord],
    );
  });
});
