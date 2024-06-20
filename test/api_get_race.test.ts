import {gzipSync} from 'node:zlib';
import {getRace} from '../functions/api_get_race';
import {getEnvironment} from '../functions/common/get_environment';
import {getRaceDatePrefix} from '../functions/common/get_race_date_prefix';
import {getObject as S3GetObject} from '../functions/common/awss3';
import {Readable} from 'node:stream';

jest.mock('../functions/common/get_environment');
jest.mock('../functions/common/get_race_date_prefix');
jest.mock('../functions/common/awss3');

const getEnvironmentMock = jest.mocked(getEnvironment);
const getRaceDatePrefixMock = jest.mocked(getRaceDatePrefix);
const S3GetObjectMock = jest.mocked(S3GetObject);

describe('api_get_race', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('getRace', async () => {
    const html = `
    <html>
      <body>
        <div class="raceTitle">
          <h3>レース名</h3>
        </div>
        <table>
          <tr class="tBorder">
            <td class="horseNum">1</td>
            <td>
              <a class="horseName" href="/?k_lineageLoginCode=HORSEID1">馬名1</a>
            </td>
          </tr>
          <tr class="tBorder">
            <td class="horseNum">2</td>
            <td>
              <a class="horseName" href="/?k_lineageLoginCode=HORSEID2">馬名2</a>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
    const unziped = gzipSync(Buffer.from(html));
    getEnvironmentMock.mockReturnValueOnce('TEST_CACHE_BUCKET');
    getRaceDatePrefixMock.mockReturnValueOnce('TEST_PREFIX');
    S3GetObjectMock.mockResolvedValueOnce(Readable.from(Buffer.from(unziped)));

    const result = await getRace('202401020304');
    expect(result).toEqual({
      raceId: '202401020304',
      date: '2024-01-02',
      place: '帯広',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [
        {horseNumber: 1, horseId: 'HORSEID1', horseName: '馬名1'},
        {horseNumber: 2, horseId: 'HORSEID2', horseName: '馬名2'},
      ],
    });
  });

  it('getRace: 未知の競馬場コード', async () => {
    const html = `
    <html>
      <body>
        <div class="raceTitle">
          <h3>レース名</h3>
        </div>
        <table>
          <tr class="tBorder">
            <td class="horseNum">1</td>
            <td>
              <a class="horseName" href="/?k_lineageLoginCode=HORSEID1">馬名1</a>
            </td>
          </tr>
          <tr class="tBorder">
            <td class="horseNum">2</td>
            <td>
              <a class="horseName" href="/?k_lineageLoginCode=HORSEID2">馬名2</a>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
    const unziped = gzipSync(Buffer.from(html));
    getEnvironmentMock.mockReturnValueOnce('TEST_CACHE_BUCKET');
    getRaceDatePrefixMock.mockReturnValueOnce('TEST_PREFIX');
    S3GetObjectMock.mockResolvedValueOnce(Readable.from(Buffer.from(unziped)));

    const result = await getRace('202401029904');
    expect(result).toEqual({
      raceId: '202401029904',
      date: '2024-01-02',
      place: '',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [
        {horseNumber: 1, horseId: 'HORSEID1', horseName: '馬名1'},
        {horseNumber: 2, horseId: 'HORSEID2', horseName: '馬名2'},
      ],
    });
  });

  it('getRace: 馬IDなし', async () => {
    const html = `
    <html>
      <body>
        <div class="raceTitle">
          <h3>レース名</h3>
        </div>
        <table>
          <tr class="tBorder">
            <td class="horseNum">1</td>
            <td>
              <a class="horseName" href="/?k_lineageLoginCode=HORSEID1">馬名1</a>
            </td>
          </tr>
          <tr class="tBorder">
            <td class="horseNum">2</td>
            <td>
              <a class="horseName" href="/">馬名2</a>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
    const unziped = gzipSync(Buffer.from(html));
    getEnvironmentMock.mockReturnValueOnce('TEST_CACHE_BUCKET');
    getRaceDatePrefixMock.mockReturnValueOnce('TEST_PREFIX');
    S3GetObjectMock.mockResolvedValueOnce(Readable.from(Buffer.from(unziped)));

    const result = await getRace('202401020304');

    expect(result).toEqual({
      raceId: '202401020304',
      date: '2024-01-02',
      place: '帯広',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [
        {horseNumber: 1, horseId: 'HORSEID1', horseName: '馬名1'},
        {horseNumber: 2, horseId: undefined, horseName: '馬名2'},
      ],
    });
  });

  it('getRace: ID長不正', async () => {
    await expect(() => getRace('2024010203041')).rejects.toThrow();
  });

  it('getRace: ID日付不正', async () => {
    await expect(() => getRace('202402300304')).rejects.toThrow();
  });
});
