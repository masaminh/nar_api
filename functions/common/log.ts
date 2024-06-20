export type LogFunction = {
  (message: string): void;
  (message: string, error: Error): void;
};

export interface ILogger {
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
}

let logger: ILogger | undefined;

export interface Config {
  logger: ILogger;
}

export function initialize(config: Config) {
  logger = config.logger;
}

export function uninitialize() {
  logger = undefined;
}

export function info(message: string): void;
export function info(message: string, err: Error): void;
export function info(
  ...args: [message: string] | [message: string, err: Error]
): void {
  if (logger) {
    if (args.length === 1) {
      logger.info(args[0]);
    } else {
      logger.info(args[0], args[1]);
    }
  }
}

export function warn(message: string): void;
export function warn(message: string, err: Error): void;
export function warn(
  ...args: [message: string] | [message: string, err: Error]
): void {
  if (logger) {
    if (args.length === 1) {
      logger.warn(args[0]);
    } else {
      logger.warn(args[0], args[1]);
    }
  }
}

export function error(message: string): void;
export function error(message: string, err: Error): void;
export function error(
  ...args: [message: string] | [message: string, err: Error]
): void {
  if (logger) {
    if (args.length === 1) {
      logger.error(args[0]);
    } else {
      logger.error(args[0], args[1]);
    }
  }
}
