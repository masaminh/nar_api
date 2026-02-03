import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { NarApiStack } from '../lib/nar_api-stack'

const ignoreAssetHashSerializer = {
  test: (val: unknown) => typeof val === 'string',
  serialize: (val: string) => {
    return `"${val.replace(/([A-Fa-f0-9]{64}.zip)/, 'HASH-REPLACED.zip')}"`
  },
}

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
  expect.addSnapshotSerializer(ignoreAssetHashSerializer)

  // 生成したテンプレートとスナップショットが同じか検証
  expect(template).toMatchSnapshot()
})
