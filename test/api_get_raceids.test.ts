import {DateTime} from 'luxon';
import {getRaceIds} from '../functions/api_get_raceids';
import {listObjects} from '../functions/common/awss3';
import {getEnvironment} from '../functions/common/get_environment';
import {getRaceDatePrefix} from '../functions/common/get_race_date_prefix';

jest.mock('../functions/common/awss3');
jest.mock('../functions/common/get_environment');
jest.mock('../functions/common/get_race_date_prefix');

const listObjectsMock = jest.mocked(listObjects);
const getEnvironmentMock = jest.mocked(getEnvironment);
const getRaceDatePrefixMock = jest.mocked(getRaceDatePrefix);

describe('api_get_raceids', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('getRaceIds', async () => {
    getEnvironmentMock.mockReturnValueOnce('TEST_CACHE_BUCKET');
    getRaceDatePrefixMock.mockReturnValueOnce('TEST_PREFIX/');
    listObjectsMock.mockResolvedValueOnce({
      objects: ['TEST_PREFIX/202401020304.gz'],
      prefixes: [],
    });
    const result = await getRaceIds(
      DateTime.fromISO('2024-01-02T00:00:00+09:00')
    );
    expect(result).toEqual({
      date: '2024-01-02',
      raceids: ['202401020304'],
    });
  });

  it('getRaceIds: 日付不正', async () => {
    await expect(() =>
      getRaceIds(DateTime.fromISO('2024-02-30T00:00:00+09:00'))
    ).rejects.toThrow();
  });
});
