export type ReadingSize = 'small' | 'standard' | 'large';
export const readingSizes: readonly ReadingSize[] = ['small', 'standard', 'large'];
export function readReadingSize(raw: string | null): ReadingSize {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (value && typeof value === 'object' && 'version' in value && value.version === 1 && 'size' in value && readingSizes.includes(value.size as ReadingSize)) return value.size as ReadingSize;
  } catch { /* Use a local default; never rewrite general preferences. */ }
  return 'standard';
}
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
/** One instance per application owner serializes across native-scene remounts. */
export function createReadingStore(storage: Storage) {
  const key = 'argala.ar-reading.v1'; let tail: Promise<unknown> = Promise.resolve();
  return {
    async read() { await tail; return readReadingSize(await storage.getItem(key)); },
    write(size: ReadingSize) {
      const next = tail.then(() => storage.setItem(key, JSON.stringify({ version: 1, size })));
      tail = next.catch(() => undefined); return next;
    },
  };
}
