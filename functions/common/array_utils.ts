export function chunk<T> (input: T[], size: number): T[][] {
  return input.reduce((arr: T[][], item, idx) => {
    return idx % size === 0
      ? [...arr, [item]]
      : [...arr.slice(0, -1), [...(arr.at(-1) ?? []), item]]
  }, [])
}
