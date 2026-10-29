import { PhotoFailure, type NativeCapture, type PhotoError, type PhotoResource, type PhotoService, type PhotoSnapshot } from './types';
export const PHOTO_DEADLINE_MS = 15_000;
const empty = (): PhotoSnapshot => ({ photoUri: null, saved: false, busy: null, error: null });
type Operation = { current: boolean; cancel(): void };
/** One disposable foreground/frame owner. Native promises remain independently leased. */
export class ArPhotoController {
  private nativeCapture: NativeCapture | null = null;
  private state = empty();
  private resource: PhotoResource | null = null;
  private operation: Operation | null = null;
  constructor(private service: PhotoService, private publish: (state: PhotoSnapshot) => void) {}
  activate(capture: NativeCapture) { this.nativeCapture = capture; }
  retire() {
    this.nativeCapture = null;
    this.operation?.cancel(); this.operation = null;
    this.resource?.dispose(); this.resource = null;
    // Retirement is teardown, never a React publication after unmount.
    this.state = empty();
  }
  snapshot() { return this.state; }
  private set(next: PhotoSnapshot) { this.state = next; this.publish(next); }
  private async run(kind: NonNullable<PhotoSnapshot['busy']>, work: (current: () => boolean) => Promise<void>, fallback: PhotoError) {
    if (!this.nativeCapture || this.operation) return;
    let cancel!: () => void;
    const cancelled = new Promise<void>(resolve => { cancel = resolve; });
    const operation: Operation = { current: true, cancel: () => { operation.current = false; cancel(); } };
    this.operation = operation;
    this.set({ ...this.state, busy: kind, error: null });
    const current = () => this.operation === operation && operation.current && this.nativeCapture !== null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { operation.current = false; reject(new PhotoFailure('timeout')); }, PHOTO_DEADLINE_MS);
    });
    try { await Promise.race([work(current), cancelled, timeout]); }
    catch (error) {
      if (this.operation === operation) this.set({ ...this.state, error: error instanceof PhotoFailure ? error.code : fallback });
    } finally {
      clearTimeout(timer);
      if (this.operation === operation) { operation.current = false; this.operation = null; this.set({ ...this.state, busy: null }); }
    }
  }
  async capture() {
    if (!this.nativeCapture || this.resource) return;
    const capture = this.nativeCapture;
    await this.run('capture', async current => {
      const resource = await this.service.capture(capture, current);
      if (!current()) { resource.dispose(); return; }
      this.resource = resource;
      this.set({ photoUri: resource.uri, saved: false, busy: 'capture', error: null });
    }, 'capture-failed');
  }
  async save() {
    const resource = this.resource;
    if (!resource || this.state.saved) return;
    await this.run('save', async current => {
      await resource.save(current);
      if (current() && this.resource === resource) this.set({ ...this.state, saved: true });
    }, 'save-failed');
  }
  async share() {
    const resource = this.resource;
    if (!resource) return;
    await this.run('share', current => resource.share(current), 'share-failed');
  }
  previewFailed() { if (this.resource) this.set({ ...this.state, error: 'preview-failed' }); }
  discard() {
    if (!this.nativeCapture || this.operation) return;
    this.resource?.dispose(); this.resource = null; this.set(empty());
  }
}
