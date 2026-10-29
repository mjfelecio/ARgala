import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPhotoService } from './service';
import type { NativePhotoResult } from './types';

const native = vi.hoisted(() => ({
  probe: vi.fn(), uuid: vi.fn(), platform: { OS: 'android', Version: 36 },
  files: new Map<string, number>(), failedDeletes: new Set<string>(), copyGate: null as Promise<void> | null,
  save: vi.fn(), permissions: vi.fn(), request: vi.fn(), available: vi.fn(), share: vi.fn(),
  fileImports: vi.fn(), mediaImports: vi.fn(), sharingImports: vi.fn(),
}));
vi.mock('expo-modules-core', () => ({ requireOptionalNativeModule: native.probe, uuid: { v4: native.uuid } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { android: { package: 'com.mjfelecio.argala' } } } }));
vi.mock('react-native', () => ({ Platform: native.platform }));
vi.mock('expo-file-system', () => {
  native.fileImports();
  const join = (parts: (string | { uri: string })[]) => parts.map(p => (typeof p === 'string' ? p : p.uri).replace(/\/$/, '')).join('/');
  class File {
    uri: string; constructor(...parts: (string | { uri: string })[]) { this.uri = join(parts); }
    get exists() { return native.files.has(this.uri); }
    get size() { return native.files.get(this.uri) ?? 0; }
    get name() { return this.uri.split('/').at(-1)!; }
    get parentDirectory(): Directory { return new Directory(this.uri.slice(0, this.uri.lastIndexOf('/'))); }
    delete() { if (native.failedDeletes.has(this.uri)) throw new Error('PRIVATE_DELETE_FAILURE'); native.files.delete(this.uri); }
    async copy(destination: File) { if (native.copyGate) await native.copyGate; native.files.set(destination.uri, this.size); }
  }
  class Directory {
    uri: string; constructor(...parts: (string | { uri: string })[]) { this.uri = join(parts); }
    create() {}
    list() { return [...native.files.keys()].filter(p => p.startsWith(this.uri + '/')).map(p => new File(p)); }
  }
  return { File, Directory, Paths: { cache: { uri: 'file:///cache' } } };
});
vi.mock('expo-media-library', () => { native.mediaImports(); return { Asset: { create: native.save }, getPermissionsAsync: native.permissions, requestPermissionsAsync: native.request }; });
vi.mock('expo-sharing', () => { native.sharingImports(); return { isAvailableAsync: native.available, shareAsync: native.share }; });
const uuidA = '12345678-1234-4234-8234-123456789abc';
const uuidB = 'abcdefab-abcd-4abc-8abc-abcdefabcdef';
function nativeResult(name: string): NativePhotoResult {
  const path = `/storage/emulated/0/Android/data/com.mjfelecio.argala/files/Pictures/${name}.jpg`;
  native.files.set('file://' + path, 1024);
  return { success: true, url: path, errorCode: -1 };
}
const capture = () => vi.fn(async (name: string) => nativeResult(name));
beforeEach(() => {
  vi.clearAllMocks(); native.files.clear(); native.failedDeletes.clear(); native.copyGate = null; native.platform.Version = 36;
  native.probe.mockReset().mockReturnValue({}); native.uuid.mockReset().mockReturnValueOnce(uuidA).mockReturnValue(uuidB);
  native.save.mockResolvedValue({ id: 'gallery-asset' }); native.available.mockResolvedValue(true); native.share.mockResolvedValue(undefined);
  native.permissions.mockResolvedValue({ granted: true, canAskAgain: true }); native.request.mockResolvedValue({ granted: true });
});
describe('native AR photo boundary', () => {
  it('uses a private random native filename, copies to a local URI and removes the native original', async () => {
    const callback = capture(); const service = createPhotoService();
    const photo = await service.capture(callback, () => true);
    expect(callback).toHaveBeenCalledWith('argala-photo-' + uuidA);
    expect(photo.uri).toBe(`file:///cache/argala-ar-photo-v1/argala-photo-${uuidA}.jpg`);
    expect([...native.files.keys()]).toEqual([photo.uri]);
    photo.dispose(); expect(native.files.size).toBe(0);
  });
  it.each([[0, 'capture-failed'], [3, 'capture-write'], [6, 'unsupported']])('maps native failure %i to a stable code', async (errorCode, code) => {
    const callback = vi.fn(async () => ({ success: false, url: null, errorCode: Number(errorCode) }));
    await expect(createPhotoService().capture(callback, () => true)).rejects.toMatchObject({ code });
  });
  it.each(['https://private/image.jpg', '/storage/emulated/0/unrelated.jpg', '/storage/emulated/0/Android/data/other.app/files/Pictures/argala-photo-123.jpg', '/storage/emulated/0/Android/data/com.mjfelecio.argala/files/Pictures/../private.jpg'])('rejects malformed or foreign native result %s without deleting it', async path => {
    native.files.set('file://' + path, 1024);
    const callback = vi.fn(async () => ({ success: true, url: path, errorCode: -1 }));
    await expect(createPhotoService().capture(callback, () => true)).rejects.toMatchObject({ code: 'capture-failed' });
    expect(native.files.has('file://' + path)).toBe(true);
  });
  it('rejects a foreign directory with an embedded own-app suffix', async () => {
    let unexpected = '';
    const callback = vi.fn(async (name: string) => {
      unexpected = `/storage/emulated/0/Android/data/foreign.app/files/Android/data/com.mjfelecio.argala/files/Pictures/${name}.jpg`;
      native.files.set('file://' + unexpected, 1024);
      return { success: true, url: unexpected, errorCode: -1 };
    });
    await expect(createPhotoService().capture(callback, () => true)).rejects.toMatchObject({ code: 'capture-failed' });
    expect(native.files.has('file://' + unexpected)).toBe(true);
  });
  it('never reuses a filename held by an older preview even if the random source collides', async () => {
    native.uuid.mockReset().mockReturnValue(uuidA);
    const first = await createPhotoService().capture(capture(), () => true);
    const newerCapture = capture();
    await expect(createPhotoService().capture(newerCapture, () => true)).rejects.toMatchObject({ code: 'capture-write' });
    expect(newerCapture).not.toHaveBeenCalled(); expect(native.files.has(first.uri)).toBe(true); first.dispose();
  });
  it('fences late native results after foreground/frame retirement and removes only that capture', async () => {
    const result = Promise.withResolvers<NativePhotoResult>(); let current = true;
    const callback = vi.fn((_name: string) => result.promise); const service = createPhotoService();
    const work = service.capture(callback, () => current);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce());
    current = false; result.resolve(nativeResult(callback.mock.calls[0][0]));
    await expect(work).rejects.toMatchObject({ code: 'capture-failed' });
    expect(native.files.size).toBe(0);
  });
  it('serializes native capture across separate services until settlement', async () => {
    const result = Promise.withResolvers<NativePhotoResult>(); const callback = vi.fn((_name: string) => result.promise);
    const first = createPhotoService().capture(callback, () => false);
    // A retired owner must never start native work in the first place.
    await expect(first).rejects.toMatchObject({ code: 'capture-failed' });
    expect(callback).not.toHaveBeenCalled();
    const held = createPhotoService().capture(callback, () => true);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce());
    await expect(createPhotoService().capture(capture(), () => true)).rejects.toMatchObject({ code: 'busy' });
    result.resolve(nativeResult(callback.mock.calls[0][0])); const photo = await held; photo.dispose();
  });
  it('cleans both files when retirement occurs during an asynchronous cache copy', async () => {
    const gate = Promise.withResolvers<void>(); native.copyGate = gate.promise; let current = true;
    const callback = capture(); const work = createPhotoService().capture(callback, () => current);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce()); current = false; gate.resolve();
    await expect(work).rejects.toMatchObject({ code: 'capture-failed' }); expect(native.files.size).toBe(0);
  });
  it('fails clearly when a required native module is missing without invoking native capture', async () => {
    native.probe.mockReturnValue(null); const callback = capture();
    await expect(createPhotoService().capture(callback, () => true)).rejects.toMatchObject({ code: 'unavailable' });
    expect(callback).not.toHaveBeenCalled();
  });
  it('saves once, retries a rejected save, and does not request read access on modern Android', async () => {
    const photo = await createPhotoService().capture(capture(), () => true);
    native.save.mockRejectedValueOnce(new Error('SECRET'));
    await expect(photo.save(() => true)).rejects.toMatchObject({ code: 'save-failed' });
    await Promise.all([photo.save(() => true), photo.save(() => true)]); await photo.save(() => true);
    expect(native.save).toHaveBeenCalledTimes(2); expect(native.save).toHaveBeenLastCalledWith(photo.uri);
    expect(native.permissions).not.toHaveBeenCalled(); expect(native.request).not.toHaveBeenCalled(); photo.dispose();
  });
  it('checks then explicitly requests only legacy write permission on Android 10 and older', async () => {
    native.platform.Version = 29; native.permissions.mockResolvedValue({ granted: false, canAskAgain: true });
    const photo = await createPhotoService().capture(capture(), () => true);
    expect(native.request).not.toHaveBeenCalled(); await photo.save(() => true);
    expect(native.permissions).toHaveBeenCalledWith(true, []); expect(native.request).toHaveBeenCalledWith(true, []); photo.dispose();
  });
  it('does not prompt or save when its owner retires during the permission read', async () => {
    native.platform.Version = 28; const permission = Promise.withResolvers<{ granted: boolean; canAskAgain: boolean }>();
    native.permissions.mockReturnValue(permission.promise);
    const photo = await createPhotoService().capture(capture(), () => true); let current = true;
    const work = photo.save(() => current); await vi.waitFor(() => expect(native.permissions).toHaveBeenCalledOnce());
    current = false; photo.dispose(); permission.resolve({ granted: false, canAskAgain: true });
    await expect(work).rejects.toMatchObject({ code: 'save-failed' });
    expect(native.request).not.toHaveBeenCalled(); expect(native.save).not.toHaveBeenCalled(); expect(native.files.size).toBe(0);
  });
  it('maps legacy permission denial without repeated prompts when Android disallows asking again', async () => {
    native.platform.Version = 28;
    native.permissions.mockResolvedValue({ granted: false, canAskAgain: false });
    const photo = await createPhotoService().capture(capture(), () => true);
    await expect(photo.save(() => true)).rejects.toMatchObject({ code: 'save-permission' });
    expect(native.request).not.toHaveBeenCalled(); expect(native.save).not.toHaveBeenCalled(); photo.dispose();
  });
  it('retains the shared file while Android chooser is active, including owner disposal, and deletes after dismissal', async () => {
    const photo = await createPhotoService().capture(capture(), () => true);
    const chooser = Promise.withResolvers<void>(); native.share.mockReturnValue(chooser.promise);
    const sharing = photo.share(() => true); await vi.waitFor(() => expect(native.share).toHaveBeenCalledOnce());
    photo.dispose(); expect(native.files.has(photo.uri)).toBe(true);
    // A second share from another owner cannot supersede the pending native chooser.
    const newer = await createPhotoService().capture(capture(), () => true);
    await expect(newer.share(() => true)).rejects.toMatchObject({ code: 'busy' });
    expect(native.files.has(photo.uri)).toBe(true); chooser.resolve(); await sharing;
    expect(native.files.has(photo.uri)).toBe(false); expect(native.files.has(newer.uri)).toBe(true);
    expect(native.share).toHaveBeenCalledWith(photo.uri, { mimeType: 'image/jpeg' }); newer.dispose();
  });
  it('never opens a share chooser after its availability check loses the owner', async () => {
    const available = Promise.withResolvers<boolean>(); native.available.mockReturnValue(available.promise);
    const photo = await createPhotoService().capture(capture(), () => true); let current = true;
    const work = photo.share(() => current); await vi.waitFor(() => expect(native.available).toHaveBeenCalledOnce());
    current = false; photo.dispose(); available.resolve(true);
    await expect(work).rejects.toMatchObject({ code: 'share-failed' }); expect(native.share).not.toHaveBeenCalled();
  });
  it('maps unavailable share and media modules without native error display', async () => {
    const photo = await createPhotoService().capture(capture(), () => true);
    native.available.mockResolvedValue(false);
    await expect(photo.share(() => true)).rejects.toMatchObject({ code: 'share-unavailable' });
    native.probe.mockImplementation(name => name === 'ExpoMediaLibraryNext' ? null : {});
    await expect(photo.save(() => true)).rejects.toMatchObject({ code: 'unavailable' }); photo.dispose();
  });
  it('prunes abandoned app-owned cache and native files while preserving unrelated photos', async () => {
    const cacheOrphan = 'file:///cache/argala-ar-photo-v1/argala-photo-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg';
    const nativeOrphan = 'file:///storage/emulated/0/Android/data/com.mjfelecio.argala/files/Pictures/argala-photo-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.jpg';
    native.files.set(cacheOrphan, 10); native.files.set(nativeOrphan, 10); native.files.set('file:///cache/unrelated.jpg', 10);
    const photo = await createPhotoService().capture(capture(), () => true);
    expect(native.files.has(cacheOrphan)).toBe(false); expect(native.files.has(nativeOrphan)).toBe(false);
    expect(native.files.has('file:///cache/unrelated.jpg')).toBe(true); photo.dispose();
  });
  it('does not accumulate photo history when temporary deletion fails', async () => {
    const photo = await createPhotoService().capture(capture(), () => true);
    native.failedDeletes.add(photo.uri); photo.dispose();
    const callback = capture();
    await expect(createPhotoService().capture(callback, () => true)).rejects.toMatchObject({ code: 'capture-write' });
    expect(callback).not.toHaveBeenCalled();
    native.failedDeletes.clear();
    const retry = await createPhotoService().capture(callback, () => true);
    expect(native.files.has(photo.uri)).toBe(false); retry.dispose();
  });
});
