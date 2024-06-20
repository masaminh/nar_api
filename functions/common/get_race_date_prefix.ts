import {DateTime} from 'luxon';
import {getEnvironment} from './get_environment';

export function getRaceDatePrefix(date: DateTime): string {
  const cachePrefix = getEnvironment('CACHE_PREFIX');

  return `${cachePrefix}/RACE/${date.toFormat('yyyy/LL/dd/')}`;
}
