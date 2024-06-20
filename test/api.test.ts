import request from 'supertest';
import app from '../functions/api';
import {getRaceIds} from '../functions/api_get_raceids';
import {getRace} from '../functions/api_get_race';

jest.mock('@aws-lambda-powertools/logger');
jest.mock('@aws-lambda-powertools/tracer');
jest.mock('../functions/api_get_raceids');
jest.mock('../functions/api_get_race');

const mockGetRaceIds = jest.mocked(getRaceIds);
const mockGetRace = jest.mocked(getRace);

describe('api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('/raceidsの呼び出し', async () => {
    mockGetRaceIds.mockResolvedValue({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    });
    const result = await request(app).get('/raceids');
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    });
  });

  it('/raceids: パラメータあり', async () => {
    mockGetRaceIds.mockResolvedValue({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    });
    const result = await request(app).get('/raceids?date=2024-01-02');
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    });
  });

  it('/raceids: 不正な日付パラメータ', async () => {
    mockGetRaceIds.mockResolvedValue({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    });
    const result = await request(app).get('/raceids?date=2024-01-40');
    expect(result.status).toBe(400);
  });

  it('/raceids: パラメータが複数', async () => {
    mockGetRaceIds.mockResolvedValue({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    });
    const result = await request(app).get(
      '/raceids?date=2024-01-02&date=2024-01-02'
    );
    expect(result.status).toBe(400);
  });

  it('/racesの呼び出し', async () => {
    mockGetRace.mockResolvedValue({
      raceId: '202401020304',
      date: '2024-01-02',
      place: '場所',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [],
    });
    const result = await request(app).get('/races/202401020304');
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      raceId: '202401020304',
      date: '2024-01-02',
      place: '場所',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [],
    });
  });

  it('/races: レースID長不正', async () => {
    mockGetRace.mockResolvedValue({
      raceId: '202401020304',
      date: '2024-01-02',
      place: '場所',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [],
    });
    const result = await request(app).get('/races/2024010203040');
    expect(result.status).toBe(400);
  });

  it('/races: レースIDの日付不正', async () => {
    mockGetRace.mockResolvedValue({
      raceId: '202401020304',
      date: '2024-01-02',
      place: '場所',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [],
    });
    const result = await request(app).get('/races/202401400304');
    expect(result.status).toBe(400);
  });

  it('存在しないURL', async () => {
    const result = await request(app).get('/races');
    expect(result.status).toBe(404);
  });

  it('/raceidsの呼び出し', async () => {
    mockGetRaceIds.mockRejectedValue(new Error());
    const result = await request(app).get('/raceids');
    expect(result.status).toBe(500);
  });
});
