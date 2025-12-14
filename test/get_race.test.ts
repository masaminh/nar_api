import { Readable } from 'node:stream'
import axios from 'axios'
import type { Context, SQSRecord } from 'aws-lambda'
import { upload } from '../functions/common/awss3'
import { handler } from '../functions/get_race'

jest.mock('axios')
jest.mock('@aws-lambda-powertools/logger')
jest.mock('@aws-lambda-powertools/tracer')
jest.mock('../functions/common/get_environment', () => ({
  getEnvironment: (name: string) => {
    if (name === 'CACHE_BUCKET') {
      return 'CACHE_BUCKET_VALUE'
    }
    if (name === 'CACHE_PREFIX') {
      return 'CACHE_PREFIX_VALUE'
    }
    throw new Error(`unexpected name: ${name}`)
  },
}))
jest.mock('../functions/common/awss3')

const mockAxios = axios as jest.Mocked<typeof axios>
const mockUpload = upload as jest.MockedFunction<typeof upload>

describe('get_races', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('正常系・不正URLパラメータ・Axiosエラー', async () => {
    mockAxios.get
      .mockResolvedValueOnce({
        data: Readable.from(Buffer.from('<html><body></body></html>')),
      })
      .mockRejectedValueOnce(new Error('test'))

    const response = await handler(
      {
        Records: [
          {
            body: 'https://example.com/url1?k_raceDate=2024%2f01%2f02&k_raceNo=3&k_babaCode=4',
            messageId: 'MESSAGEID1',
          } as SQSRecord,
          {
            body: 'https://example.com/url2',
            messageId: 'MESSAGEID2',
          } as SQSRecord,
          {
            body: 'https://example.com/url3?k_raceDate=2025%2f05%2f06&k_raceNo=7&k_babaCode=8',
            messageId: 'MESSAGEID3',
          } as SQSRecord,
        ],
      },
      {} as Context
    )
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenNthCalledWith(
      1,
      'https://example.com/url1?k_raceDate=2024%2f01%2f02&k_raceNo=3&k_babaCode=4',
      { responseType: 'stream' }
    )
    expect(mockAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://example.com/url3?k_raceDate=2025%2f05%2f06&k_raceNo=7&k_babaCode=8',
      { responseType: 'stream' }
    )
    expect(mockUpload).toHaveBeenCalledTimes(1)
    expect(mockUpload.mock.calls[0][0]).toBe('CACHE_BUCKET_VALUE')
    expect(mockUpload.mock.calls[0][1]).toBe(
      'CACHE_PREFIX_VALUE/RACE/2024/01/02/202401020403.gz'
    )
    expect(response).toEqual({
      batchItemFailures: [{ itemIdentifier: 'MESSAGEID3' }],
    })
  })
})
