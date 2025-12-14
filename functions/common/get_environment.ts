export function getEnvironment (name: string): string {
  const env = process.env[name]

  if (!env) {
    throw new Error(`Environment variable ${name} is required`)
  }

  return env
}
