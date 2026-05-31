import type { Request, Response } from 'express'
import request from 'supertest'
import app, {
  handleGetRaceRequest,
  raceidRouteParamIsString,
} from '../functions/api.js'
import { getRaceIds } from '../functions/api_get_raceids.js'
import { getRace } from '../functions/api_get_race.js'

vitest.mock('@aws-lambda-powertools/logger')
vitest.mock('@aws-lambda-powertools/tracer')
vitest.mock('../functions/api_get_raceids.js')
vitest.mock('../functions/api_get_race.js')

const mockGetRaceIds = vitest.mocked(getRaceIds)
const mockGetRace = vitest.mocked(getRace)

describe('raceidRouteParamIsString', () => {
  it('文字列なら true', () => {
    expect(raceidRouteParamIsString('202401020304')).toBe(true)
  })

  it('配列なら false（@types/express 5 で params が string[] になり得るための分岐）', () => {
    expect(raceidRouteParamIsString(['202401020304'])).toBe(false)
  })

  it('undefined なら false', () => {
    expect(raceidRouteParamIsString(undefined)).toBe(false)
  })

  it('数値なら false', () => {
    expect(raceidRouteParamIsString(202401020304)).toBe(false)
  })
})

describe('api', () => {
  afterEach(() => {
    vitest.resetAllMocks()
  })

  it('/raceidsの呼び出し', async () => {
    mockGetRaceIds.mockResolvedValue({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    })
    const result = await request(app).get('/raceids')
    expect(result.status).toBe(200)
    expect(result.body).toEqual({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    })
  })

  it('/raceids: パラメータあり', async () => {
    mockGetRaceIds.mockResolvedValue({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    })
    const result = await request(app).get('/raceids?date=2024-01-02')
    expect(result.status).toBe(200)
    expect(result.body).toEqual({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    })
  })

  it('/raceids: 不正な日付パラメータ', async () => {
    mockGetRaceIds.mockResolvedValue({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    })
    const result = await request(app).get('/raceids?date=2024-01-40')
    expect(result.status).toBe(400)
  })

  it('/raceids: パラメータが複数', async () => {
    mockGetRaceIds.mockResolvedValue({
      date: '2024-01-02',
      raceids: ['RACEID1', 'RACEID2'],
    })
    const result = await request(app).get(
      '/raceids?date=2024-01-02&date=2024-01-02'
    )
    expect(result.status).toBe(400)
  })

  it('/racesの呼び出し', async () => {
    mockGetRace.mockResolvedValue({
      raceId: '202401020304',
      date: '2024-01-02',
      time: '12:34',
      place: '場所',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [],
    })
    const result = await request(app).get('/races/202401020304')
    expect(result.status).toBe(200)
    expect(result.body).toEqual({
      raceId: '202401020304',
      date: '2024-01-02',
      time: '12:34',
      place: '場所',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [],
    })
  })

  it('/races: レースID長不正', async () => {
    mockGetRace.mockResolvedValue({
      raceId: '202401020304',
      date: '2024-01-02',
      time: '12:34',
      place: '場所',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [],
    })
    const result = await request(app).get('/races/2024010203040')
    expect(result.status).toBe(400)
  })

  it('/races: レースIDの日付不正', async () => {
    mockGetRace.mockResolvedValue({
      raceId: '202401020304',
      date: '2024-01-02',
      time: '12:34',
      place: '場所',
      raceNumber: 4,
      raceName: 'レース名',
      horses: [],
    })
    const result = await request(app).get('/races/202401400304')
    expect(result.status).toBe(400)
  })

  it('/races: raceid が文字列でないとき handleGetRaceRequest が 400', async () => {
    const send = vitest.fn()
    const status = vitest.fn().mockReturnValue({ send })
    const req = {
      params: { raceid: ['202401020304'] },
    } as unknown as Request
    const res = { status, send } as unknown as Response

    await handleGetRaceRequest(req, res)

    expect(status).toHaveBeenCalledWith(400)
    expect(send).toHaveBeenCalledWith('Bad raceid parameter')
    expect(mockGetRace).not.toHaveBeenCalled()
  })

  it('存在しないURL', async () => {
    const result = await request(app).get('/races')
    expect(result.status).toBe(404)
  })

  it('/raceidsの呼び出し', async () => {
    mockGetRaceIds.mockRejectedValue(new Error('test'))
    const result = await request(app).get('/raceids')
    expect(result.status).toBe(500)
  })
})
