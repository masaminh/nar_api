import serverlessExpress from '@codegenie/serverless-express';
import {injectLambdaContext} from '@aws-lambda-powertools/logger/middleware';
import {captureLambdaHandler} from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import app from './api';
import * as Log from './common/log';
import {getLogger, getTracer} from './common/powertools';

const logger = getLogger('INFO');
const tracer = getTracer();

Log.initialize({logger});

export const handler = middy(serverlessExpress({app}))
  .use(injectLambdaContext(logger, {logEvent: true}))
  .use(captureLambdaHandler(tracer));
