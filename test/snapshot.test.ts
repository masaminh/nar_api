import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { NarApiStack } from '../lib/nar_api-stack'

test('snapshot test', () => {
  const app = new cdk.App()

  const stack = new NarApiStack(app, 'MyTestStack', {
    env: { region: 'ap-northeast-1' },
    stackName: 'STACKNAME',
    stage: 'STAGE',
    cacheBucket: 'cachebucket',
    cachePrefix: 'CACHEPREFIX',
    scheduleExpression: 'cron(0 0 * * ? *)',
    scheduleTimeZone: 'Asia/Tokyo',
  })

  // スタックからテンプレート(JSON)を生成
  const template = Template.fromStack(stack).toJSON()

  // 生成したテンプレートとスナップショットが同じか検証
  expect(template).toMatchSnapshot()
})
