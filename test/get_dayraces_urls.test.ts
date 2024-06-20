import type {Context} from 'aws-lambda';
import axios from 'axios';
import {handler} from '../functions/get_dayraces_urls';

jest.mock('axios');
jest.mock('@aws-lambda-powertools/logger');
jest.mock('@aws-lambda-powertools/tracer');

const mockAxios = axios as jest.Mocked<typeof axios>;

const NAR_CALENDAR_URL =
  'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop';

describe('get_dayraces_urls', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('正常系', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: `
        <html><body><div class="schedule">
        <a href="https://www.keiba.go.jp/url1?k_raceDate=2024%2f01%2f02"/>
        <a href="https://www.keiba.go.jp/url2?k_raceDate=2024%2f01%2f02"/>
        </div></body></html>
      `,
    });
    const response = await handler(
      {time: '2024-01-02T03:04:05Z'},
      {} as Context
    );
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(NAR_CALENDAR_URL, {
      params: {k_year: 2024, k_month: 1},
      responseType: 'text',
    });
    expect(response).toEqual({
      messages: [
        [
          {
            Id: expect.any(String),
            MessageBody:
              'https://www.keiba.go.jp/url1?k_raceDate=2024%2f01%2f02',
          },
          {
            Id: expect.any(String),
            MessageBody:
              'https://www.keiba.go.jp/url2?k_raceDate=2024%2f01%2f02',
          },
        ],
      ],
    });
  });

  it('正常系(月またぎ)', async () => {
    mockAxios.get
      .mockResolvedValueOnce({
        data: `
      <html><body><div class="schedule">
      <a href="https://www.keiba.go.jp/url1?k_raceDate=2024%2f01%2f31"/>
      <a href="https://www.keiba.go.jp/url2?k_raceDate=2024%2f01%2f31"/>
      </div></body></html>
      `,
      })
      .mockResolvedValueOnce({
        data: `
      <html><body><div class="schedule">
      <a href="https://www.keiba.go.jp/url1?k_raceDate=2024%2f02%2f01"/>
      <a href="https://www.keiba.go.jp/url2?k_raceDate=2024%2f02%2f01"/>
      </div></body></html>
      `,
      });
    const response = await handler(
      {time: '2024-01-31T03:04:05Z'},
      {} as Context
    );
    expect(mockAxios.get).toHaveBeenCalledTimes(2);
    expect(mockAxios.get).toHaveBeenNthCalledWith(1, NAR_CALENDAR_URL, {
      params: {k_year: 2024, k_month: 1},
      responseType: 'text',
    });
    expect(mockAxios.get).toHaveBeenNthCalledWith(2, NAR_CALENDAR_URL, {
      params: {k_year: 2024, k_month: 2},
      responseType: 'text',
    });
    expect(response).toEqual({
      messages: [
        [
          {
            Id: expect.any(String),
            MessageBody:
              'https://www.keiba.go.jp/url1?k_raceDate=2024%2f01%2f31',
          },
          {
            Id: expect.any(String),
            MessageBody:
              'https://www.keiba.go.jp/url2?k_raceDate=2024%2f01%2f31',
          },
          {
            Id: expect.any(String),
            MessageBody:
              'https://www.keiba.go.jp/url1?k_raceDate=2024%2f02%2f01',
          },
          {
            Id: expect.any(String),
            MessageBody:
              'https://www.keiba.go.jp/url2?k_raceDate=2024%2f02%2f01',
          },
        ],
      ],
    });
  });

  it('正常系(前日以前を除外)', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: `
      <html><body><div class="schedule">
      <a href="https://www.keiba.go.jp/url1?k_raceDate=2024%2f01%2f01"/>
      <a href="https://www.keiba.go.jp/url2?k_raceDate=2024%2f01%2f02"/>
      </div></body></html>
      `,
    });
    const response = await handler(
      {time: '2024-01-02T03:04:05Z'},
      {} as Context
    );
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(NAR_CALENDAR_URL, {
      params: {k_year: 2024, k_month: 1},
      responseType: 'text',
    });
    expect(response).toEqual({
      messages: [
        [
          {
            Id: expect.any(String),
            MessageBody:
              'https://www.keiba.go.jp/url2?k_raceDate=2024%2f01%2f02',
          },
        ],
      ],
    });
  });

  it('リンクがないAタグ、必要なパラメータのないAタグ', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: `
      <html><body><div class="schedule">
      <a/>
      <a href="https://www.keiba.go.jp/url2"/>
      <a href="https://www.keiba.go.jp/url3?k_raceDate=2024%2f01%2f02"/>
      </div></body></html>
      `,
    });
    const response = await handler(
      {time: '2024-01-02T03:04:05Z'},
      {} as Context
    );
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(NAR_CALENDAR_URL, {
      params: {k_year: 2024, k_month: 1},
      responseType: 'text',
    });
    expect(response).toEqual({
      messages: [
        [
          {
            Id: expect.any(String),
            MessageBody:
              'https://www.keiba.go.jp/url3?k_raceDate=2024%2f01%2f02',
          },
        ],
      ],
    });
  });

  it('不正なevent', async () => {
    await expect(() => handler({}, {} as Context)).rejects.toThrow();
  });

  it('不正な時刻', async () => {
    await expect(() =>
      handler({time: '2024-02-30T00:00:00Z'}, {} as Context)
    ).rejects.toThrow();
  });
});
