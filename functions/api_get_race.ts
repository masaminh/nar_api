import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createGunzip} from 'node:zlib';
import {DateTime} from 'luxon';
import * as cheerio from 'cheerio';
import {getRaceDatePrefix} from './common/get_race_date_prefix';
import {getEnvironment} from './common/get_environment';
import {getObject as S3GetObject} from './common/awss3';

const placeMap = new Map<string, string>([
  ['03', '帯広'],
  ['36', '門別'],
  ['10', '盛岡'],
  ['11', '水沢'],
  ['18', '浦和'],
  ['19', '船橋'],
  ['20', '大井'],
  ['21', '川崎'],
  ['22', '金沢'],
  ['23', '笠松'],
  ['24', '名古屋'],
  ['27', '園田'],
  ['28', '姫路'],
  ['31', '高知'],
  ['32', '佐賀'],
]);

type HorseType = {
  horseNumber: number | undefined;
  horseId: string | undefined;
  horseName: string;
};

type ReturnType = {
  raceId: string;
  date: string;
  place: string;
  raceNumber: number;
  raceName: string;
  horses: HorseType[];
};

export async function getRace(raceId: string): Promise<ReturnType> {
  if (raceId.length !== 12) {
    throw new Error('raceId.length must be 12');
  }

  const date = DateTime.fromISO(raceId.slice(0, 8));
  if (!date.isValid) {
    throw new Error('date.isValid must be true');
  }

  const bucket = getEnvironment('CACHE_BUCKET');
  const prefix = getRaceDatePrefix(date);

  const objectStream = await S3GetObject(bucket, `${prefix}${raceId}.gz`);
  const buftrans = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk);
    },
  });

  const bufs: Buffer[] = [];
  buftrans.on('data', chunk => {
    bufs.push(chunk);
  });

  await pipeline(objectStream, createGunzip(), buftrans);

  const $ = cheerio.load(Buffer.concat(bufs));
  const raceName = $('.raceTitle h3').text();
  const place = placeMap.get(raceId.slice(8, 10)) ?? '';
  const raceNumber = parseInt(raceId.slice(10, 12));

  const horses: HorseType[] = [];
  $('tr.tBorder').each((i, el) => {
    const horseNameAnchor = $('a.horseName', el);
    let horseId: string | undefined = undefined;
    const href = horseNameAnchor.attr('href');
    if (href !== undefined) {
      const url = new URL(href, 'https://example.com/');
      horseId = url.searchParams.get('k_lineageLoginCode') ?? undefined;
    }

    horses.push({
      horseNumber: parseInt($('td.horseNum', el).text()),
      horseId,
      horseName: horseNameAnchor.text(),
    });
  });

  return {
    raceId,
    date: date.toISODate(),
    place,
    raceNumber,
    raceName,
    horses,
  };
}
