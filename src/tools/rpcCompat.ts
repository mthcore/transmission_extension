/** RPC version where Transmission switched to snake_case (4.1+) */
export const RPC_VERSION_SNAKE_CASE = 18;

/** Convert a key to snake_case: kebab-case → snake, camelCase → snake */
function toSnakeCase(key: string): string {
  if (key.includes('-')) return key.replace(/-/g, '_');
  return key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}

/** Convert all argument keys to snake_case (outgoing, for Transmission 4.1+) */
export function toSnakeCaseKeys(args: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    result[toSnakeCase(k)] = v;
  }
  return result;
}

/** Read a key trying snake_case then kebab-case (incoming from Transmission 4.1+) */
export function readKey<T>(obj: Record<string, unknown>, kebabKey: string, fallback: T): T {
  const snakeKey = kebabKey.replace(/-/g, '_');
  return (obj[snakeKey] ?? obj[kebabKey] ?? fallback) as T;
}
