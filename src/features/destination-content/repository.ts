import { CONTENT_MAX_BYTES, contentManifestSchema, utf8Length, type ContentManifest } from './model';

export type ContentStorage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
export class ContentRepository {
  private queue: Promise<unknown> = Promise.resolve();
  private readonly key: string;
  constructor(private storage: ContentStorage, projectUrl: string) {
    this.key = `argala.destination-content.v1:${encodeURIComponent(new URL(projectUrl).origin)}`;
  }
  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation);
    this.queue = next.catch(() => {});
    return next;
  }
  private async read(): Promise<ContentManifest | null> {
    // An I/O failure is distinct from invalid cached data; never overwrite an unread snapshot.
    const raw = await this.storage.getItem(this.key);
    if (raw === null || utf8Length(raw) > CONTENT_MAX_BYTES) return null;
    try {
      const parsed = contentManifestSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch { return null; }
  }
  open() { return this.serial(() => this.read()); }
  install(value: unknown, isCurrent: () => boolean): Promise<ContentManifest> {
    return this.serial(async () => {
      const next = contentManifestSchema.parse(value);
      const previous = await this.read();
      if (!isCurrent()) throw new Error('content.retired');
      if (previous && next.revision < previous.revision) return previous;
      if (previous?.revision === next.revision) {
        if (JSON.stringify(previous) !== JSON.stringify(next)) throw new Error('content.revisionConflict');
        return previous;
      }
      await this.storage.setItem(this.key, JSON.stringify(next));
      return next;
    });
  }
}
