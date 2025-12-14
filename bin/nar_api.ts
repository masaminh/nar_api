#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { NarApiStack } from '../lib/nar_api-stack'

const app = new cdk.App()
const stackName = app.node.tryGetContext('stackName')
const stage = app.node.tryGetContext('stage')
const cacheBucket = app.node.tryGetContext('cacheBucket')
const cachePrefix = app.node.tryGetContext('cachePrefix')
const scheduleExpression = app.node.tryGetContext('scheduleExpression')
const scheduleTimeZone = app.node.tryGetContext('scheduleTimeZone')
// eslint-disable-next-line no-new
new NarApiStack(app, 'NarApiStack', {
  stackName,
  stage,
  cacheBucket,
  cachePrefix,
  scheduleExpression,
  scheduleTimeZone,
})
