import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import stream from 'node:stream';
import timers from 'node:timers/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import {DateTime} from 'luxon';
import axios, {AxiosResponse} from 'axios';
import type {SQSBatchResponse, SQSEvent} from 'aws-lambda';
import middy from '@middy/core';
import {injectLambdaContext} from '@aws-lambda-powertools/logger/middleware';
import {captureLambdaHandler} from '@aws-lambda-powertools/tracer/middleware';
import {getLogger, getTracer} from './common/powertools';
import * as awsS3 from './common/awss3';
import {getEnvironment} from './common/get_environment';
import {getRaceDatePrefix} from './common/get_race_date_prefix';

const logger = getLogger('INFO');
const tracer = getTracer();

const cacheBucket = getEnvironment('CACHE_BUCKET');

async function getRaceHandler(event: SQSEvent): Promise<SQSBatchResponse> {
  const failedMessageIds: string[] = [];

  for (const record of event.Records) {
    const startTime = Date.now();
    const raceUrl = record.body;

    const url = new URL(raceUrl);
    const raceDateString = url.searchParams.get('k_raceDate');
    const placeCodeString = url.searchParams.get('k_babaCode');
    const raceNumberString = url.searchParams.get('k_raceNo');

    if (
      raceDateString === null ||
      placeCodeString === null ||
      raceNumberString === null
    ) {
      // URLが正しくない時は再試行してもエラーになるので上位に通知しない
      logger.error('bad url', {url});
      continue;
    }

    let response: AxiosResponse;

    try {
      response = await axios.get(raceUrl, {responseType: 'stream'});
      logger.info('axios.get', {url: raceUrl, status: response.status});
    } catch (e) {
      failedMessageIds.push(record.messageId);
      logger.error('axios error', e as Error);
      continue;
    }

    const raceDate = DateTime.fromFormat(raceDateString, 'yyyy/MM/dd');
    const raceDatePrefix = getRaceDatePrefix(raceDate);
    const placeCode = placeCodeString.padStart(2, '0');
    const raceNumber = raceNumberString.padStart(2, '0');
    const raceID = `${raceDate.toFormat('yyyyMMdd')}${placeCode}${raceNumber}`;
    const key = `${raceDatePrefix}${raceID}.gz`;

    const tempPath = path.join(os.tmpdir(), randomUUID());
    await stream.promises.pipeline(
      response.data,
      zlib.createGzip(),
      fs.createWriteStream(tempPath)
    );

    await awsS3.upload(cacheBucket, key, fs.createReadStream(tempPath));

    await fs.promises.rm(tempPath);

    const endTime = Date.now();
    const elappsed = endTime - startTime;

    if (elappsed < 1000) {
      await timers.setTimeout(1000 - elappsed);
    }
  }

  return {
    batchItemFailures: failedMessageIds.map(value => ({itemIdentifier: value})),
  };
}

export const handler = middy(getRaceHandler)
  .use(injectLambdaContext(logger, {logEvent: true}))
  .use(captureLambdaHandler(tracer));
