import { Logger } from '@aws-lambda-powertools/logger'
import { Tracer } from '@aws-lambda-powertools/tracer'

const serviceName = 'nar_api'

type LoggerOptionType = NonNullable<ConstructorParameters<typeof Logger>[0]>
type LogLevelType = LoggerOptionType['logLevel']

export function getLogger (logLevel: LogLevelType) {
  return new Logger({ logLevel, serviceName })
}

export function getTracer () {
  return new Tracer({ serviceName })
}
