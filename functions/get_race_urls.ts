import {randomUUID} from 'node:crypto';
import {URL} from 'node:url';
import * as cheerio from 'cheerio';
import axios, {AxiosResponse} from 'axios';
import middy from '@middy/core';
import {injectLambdaContext} from '@aws-lambda-powertools/logger/middleware';
import {captureLambdaHandler} from '@aws-lambda-powertools/tracer/middleware';
import {isObject, isString} from './common/type_utils';
import {getLogger, getTracer} from './common/powertools';
import {chunk} from './common/array_utils';

const logger = getLogger('INFO');
const tracer = getTracer();

type SendMessageType = {
  Id: string;
  MessageBody: string;
};

type OutputType = {
  messages: SendMessageType[][];
  messageIdMap: Record<string, string[]>;
  failedMessageIds: string[];
};

type SqsMessageType = {
  messageId: string;
  body: string;
};

type InputType = SqsMessageType[];

function isSqsMessageType(arg: unknown): arg is SqsMessageType {
  return (
    isObject<SqsMessageType>(arg) &&
    isString(arg.messageId) &&
    isString(arg.body)
  );
}

function isInputType(arg: unknown): arg is InputType {
  return Array.isArray(arg) && arg.every(isSqsMessageType);
}

async function getRaceUrlsHandler(input: unknown): Promise<OutputType> {
  if (!isInputType(input)) {
    throw new Error('Invalid input');
  }

  const flatMessages: SendMessageType[] = [];
  const messageIdMap: Record<string, string[]> = {};
  const failedMessageIds: string[] = [];

  for (const message of input) {
    const dayRaceUrl = message.body;
    let response: AxiosResponse;

    try {
      response = await axios.get(dayRaceUrl, {responseType: 'text'});
    } catch (e: unknown) {
      failedMessageIds.push(message.messageId);
      logger.error('axios error', e as Error);
      continue;
    }

    messageIdMap[message.messageId] = [];
    const $ = cheerio.load(response.data);
    $('.raceTable table:first-child .data > td:nth-child(5) > a').each(
      (i, el) => {
        const href = $(el).attr('href');

        if (href !== undefined) {
          const url = new URL(href, dayRaceUrl);
          const id = randomUUID();
          flatMessages.push({
            Id: id,
            MessageBody: url.toString(),
          });
          messageIdMap[message.messageId].push(id);
        }

        return true;
      },
    );
  }

  const messages = chunk(flatMessages, 10);
  return {
    messages,
    messageIdMap,
    failedMessageIds,
  };
}

export const handler = middy(getRaceUrlsHandler)
  .use(injectLambdaContext(logger, {logEvent: true}))
  .use(captureLambdaHandler(tracer));
