export function firstErrors<K extends string>(
  fieldErrors: Partial<Record<K, string[] | undefined>>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const key of Object.keys(fieldErrors) as K[]) {
    const first = fieldErrors[key]?.[0];
    if (first) out[key] = first;
  }
  return out;
}