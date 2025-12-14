import { getEnvironment } from '../functions/common/get_environment'

let env: NodeJS.ProcessEnv

describe('getEnvironment', () => {
  beforeAll(() => {
    env = { ...process.env }
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('getEnvironment', () => {
    process.env.GET_ENVIRONMENT_TEST = 'GET_ENVIRONMENT_TEST_VALUE'
    expect(getEnvironment('GET_ENVIRONMENT_TEST')).toBe(
      'GET_ENVIRONMENT_TEST_VALUE'
    )
  })

  it('getEnvironment: not found', () => {
    expect(() => getEnvironment('GET_ENVIRONMENT_TEST')).toThrow()
  })
})
