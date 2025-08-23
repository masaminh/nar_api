import {randomUUID} from 'node:crypto';
import {URL} from 'node:url';
import {DateTime} from 'luxon';
import * as cheerio from 'cheerio';
import axios from 'axios';
import middy from '@middy/core';
import {injectLambdaContext} from '@aws-lambda-powertools/logger/middleware';
import {captureLambdaHandler} from '@aws-lambda-powertools/tracer/middleware';
import {isObject, isString} from './common/type_utils';
import {getLogger, getTracer} from './common/powertools';
import {chunk} from './common/array_utils';

const logger = getLogger('INFO');
const tracer = getTracer();

const NAR_CALENDAR_URL =
  'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop';

type SendMessageType = {
  Id: string;
  MessageBody: string;
};

type OutputType = {
  messages: SendMessageType[][];
};

type InputType = {
  time: string;
};

function isInputType(arg: unknown): arg is InputType {
  return isObject<InputType>(arg) && isString(arg.time);
}

function getDayRaceUrlString(
  startTime: DateTime,
  href: string | undefined,
): string | undefined {
  if (href === undefined) {
    return undefined;
  }
  const url = new URL(href, NAR_CALENDAR_URL);
  const raceDateParam = url.searchParams.get('k_raceDate');
  if (raceDateParam === null) {
    return undefined;
  }
  const raceDate = DateTime.fromFormat(raceDateParam, 'yyyy/MM/dd');
  if (raceDate < startTime) {
    return undefined;
  }

  return url.toString();
}

async function getDayRacesUrlsHandler(input: unknown): Promise<OutputType> {
  if (!isInputType(input)) {
    throw new Error('Invalid input');
  }

  const eventTime = DateTime.fromISO(input.time).setZone('Asia/Tokyo');
  if (!eventTime.isValid) {
    throw new Error('Invalid event time');
  }

  const endTime = eventTime.plus({days: 7});

  const dateTimes =
    eventTime.month === endTime.month ? [eventTime] : [eventTime, endTime];

  const urls: string[] = [];
  const startTime = eventTime.startOf('day');

  for (const dateTime of dateTimes) {
    const response = await axios.get(NAR_CALENDAR_URL, {
      params: {k_year: dateTime.year, k_month: dateTime.month},
      responseType: 'text',
    });
    const $ = cheerio.load(response.data);

    $('.schedule a').each((i, el) => {
      const href = $(el).attr('href');
      const urlString = getDayRaceUrlString(startTime, href);
      if (urlString !== undefined) {
        urls.push(urlString);
      }
      return true;
    });
  }

  const messages = chunk(
    urls.map(v => ({Id: randomUUID(), MessageBody: v})),
    10,
  );
  return {
    messages,
  };
}

export const handler = middy(getDayRacesUrlsHandler)
  .use(injectLambdaContext(logger, {logEvent: true}))
  .use(captureLambdaHandler(tracer));
