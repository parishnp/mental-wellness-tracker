/** Return a shallow copy of `obj` without the given keys (type-safe, no mutation). */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const drop = new Set<keyof T>(keys);
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!drop.has(key)) result[key as string] = obj[key];
  }
  return result as Omit<T, K>;
}
