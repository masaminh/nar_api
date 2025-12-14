import * as Log from '../functions/common/log'

describe('log', () => {
  beforeEach(() => {
    Log.uninitialize()
  })

  it('info: message', () => {
    const logger: Log.ILogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    Log.initialize({ logger })
    Log.info('test')
    expect(logger.info).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledWith('test')
  })

  it('info: message, error', () => {
    const logger: Log.ILogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    Log.initialize({ logger })
    Log.info('test', new Error())
    expect(logger.info).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledWith('test', expect.any(Error))
  })

  it('warn: message', () => {
    const logger: Log.ILogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    Log.initialize({ logger })
    Log.warn('test')
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith('test')
  })

  it('warn: message, error', () => {
    const logger: Log.ILogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    Log.initialize({ logger })
    Log.warn('test', new Error())
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith('test', expect.any(Error))
  })

  it('error: message', () => {
    const logger: Log.ILogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    Log.initialize({ logger })
    Log.error('test')
    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith('test')
  })

  it('error: message, error', () => {
    const logger: Log.ILogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    Log.initialize({ logger })
    Log.error('test', new Error())
    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith('test', expect.any(Error))
  })
})
