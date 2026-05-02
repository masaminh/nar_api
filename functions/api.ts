import express, { Request, Response, NextFunction } from 'express'
import { DateTime } from 'luxon'
import * as Log from './common/log'
import { getRaceIds } from './api_get_raceids'
import { getRace } from './api_get_race'

const app = express()
app.disable('x-powered-by')

/** @types/express 5 では route param が string 以外になり得るための絞り込み */
export function raceidRouteParamIsString (value: unknown): value is string {
  return typeof value === 'string'
}

function asyncWrapper (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Log.info(`start: ${req.url}`)
    fn(req, res, next)
      .then(() => Log.info(`end: ${req.url}`))
      .catch(next)
  }
}

app.get(
  '/raceids',
  asyncWrapper(async (req, res) => {
    let date: DateTime
    const paramDate = req.query.date

    if (!paramDate) {
      date = DateTime.now().setZone('Asia/Tokyo')
    } else if (typeof paramDate === 'string') {
      date = DateTime.fromISO(paramDate).setZone('Asia/Tokyo')
      if (!date.isValid) {
        res.status(400).send('Bad date parameter')
        return
      }
    } else {
      res.status(400).send('Bad date parameter')
      return
    }

    const raceids = await getRaceIds(date)
    res.json(raceids)
  })
)

export async function handleGetRaceRequest (
  req: Request,
  res: Response
): Promise<void> {
  const raceidParam = req.params.raceid
  if (!raceidRouteParamIsString(raceidParam)) {
    res.status(400).send('Bad raceid parameter')
    return
  }
  const raceid = raceidParam

  if (raceid.length !== 12) {
    res.status(400).send('Bad raceid parameter')
    return
  }

  if (!DateTime.fromISO(raceid.slice(0, 8)).isValid) {
    res.status(400).send('Bad raceid parameter')
    return
  }

  const race = await getRace(raceid)
  res.json(race)
}

app.get(
  '/races/:raceid',
  asyncWrapper(handleGetRaceRequest)
)

app.all('/:wildcard', (req, res) => {
  res.sendStatus(404)
})

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  Log.error('error', err)
  res.sendStatus(500)
})

export default app
