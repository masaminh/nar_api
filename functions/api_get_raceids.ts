import { DateTime } from 'luxon'
import { listObjects as S3ListObjects } from './common/awss3.js'
import { getEnvironment } from './common/get_environment.js'
import { getRaceDatePrefix } from './common/get_race_date_prefix.js'

type ReturnType = {
  date: string;
  raceids: string[];
}

export async function getRaceIds (
  date: DateTime<true> | DateTime<false>
): Promise<ReturnType> {
  if (!date.isValid) {
    throw new Error('date.isValid must be true')
  }

  const cacheBucket = getEnvironment('CACHE_BUCKET')

  const prefix = getRaceDatePrefix(date)
  const { objects } = await S3ListObjects(cacheBucket, prefix)
  const raceids = objects.map(p => p.replace(prefix, '').replace('.gz', ''))

  return {
    date: date.toISODate(),
    raceids,
  }
}
