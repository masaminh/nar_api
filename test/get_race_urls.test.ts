import axios from 'axios'
import type { Context } from 'aws-lambda'
import { handler } from '../functions/get_race_urls'

jest.mock('axios')
jest.mock('@aws-lambda-powertools/logger')
jest.mock('@aws-lambda-powertools/tracer')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('get_races_urls', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('正常系', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: `
        <html><body><div class="raceTable">
        <table>
        <tr class="data">
        <td/><td/><td/><td/>
        <td><a href="https://example.com/raceurl1"/></td>
        </tr>
        </table>
        </div></body></html>
        `,
    })
    const response = await handler(
      [{ messageId: 'MESSAGEID1', body: 'https://example.com/url1' }],
      {} as Context
    )
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('https://example.com/url1', {
      responseType: 'text',
    })
    expect(response).toEqual({
      messages: [
        [{ Id: expect.any(String), MessageBody: 'https://example.com/raceurl1' }],
      ],
      messageIdMap: { MESSAGEID1: [expect.any(String)] },
      failedMessageIds: [],
    })
  })

  it('axiosで例外', async () => {
    mockAxios.get.mockRejectedValueOnce(new Error())
    const response = await handler(
      [{ messageId: 'MESSAGEID1', body: 'https://example.com/url1' }],
      {} as Context
    )
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('https://example.com/url1', {
      responseType: 'text',
    })
    expect(response).toEqual({
      messages: [],
      messageIdMap: {},
      failedMessageIds: ['MESSAGEID1'],
    })
  })

  it('不正なevent', async () => {
    await expect(() => handler({}, {} as Context)).rejects.toThrow()
  })
})
