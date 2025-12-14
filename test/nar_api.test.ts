import { readFileSync } from 'node:fs'
import { Template } from 'aws-cdk-lib/assertions'
import * as cdk from 'aws-cdk-lib'
import { NarApiStack } from '../lib/nar_api-stack'

const functionNames: readonly string[] = [
  'GetDayRacesUrlsFunction',
  'SqsToStateMachineFunction',
  'GetRaceUrlsFunction',
  'GetRaceFunction',
  'ApiFunction',
]

describe('NarApiStack', () => {
  let template: Template
  let stackName: string

  beforeAll(() => {
    const context = JSON.parse(readFileSync('cdk.context.json', 'utf-8'))
    const app = new cdk.App()
    const stack = new NarApiStack(app, 'Stack', context)
    template = Template.fromStack(stack)
    stackName = stack.stackName
  })

  it('Lambda Functions', () => {
    for (const functionName of functionNames) {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${stackName}-${functionName}`,
        Runtime: 'nodejs22.x',
      })
    }
  })
})
