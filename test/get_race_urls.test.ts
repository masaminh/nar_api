import axios from 'axios'
import type { Context } from 'aws-lambda'
import { handler } from '../functions/get_race_urls'

vitest.mock('axios')
vitest.mock('@aws-lambda-powertools/logger')
vitest.mock('@aws-lambda-powertools/tracer')

const mockAxiosGet = vitest.spyOn(axios, 'get')

describe('get_races_urls', () => {
  afterEach(() => {
    vitest.resetAllMocks()
  })

  it('正常系', async () => {
    mockAxiosGet.mockResolvedValueOnce({
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
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)
    expect(mockAxiosGet).toHaveBeenCalledWith('https://example.com/url1', {
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
    mockAxiosGet.mockRejectedValueOnce(new Error('test'))
    const response = await handler(
      [{ messageId: 'MESSAGEID1', body: 'https://example.com/url1' }],
      {} as Context
    )
    expect(mockAxiosGet).toHaveBeenCalledTimes(1)
    expect(mockAxiosGet).toHaveBeenCalledWith('https://example.com/url1', {
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
