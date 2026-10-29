import Constants from 'expo-constants';
import { requireOptionalNativeModule, uuid } from 'expo-modules-core';
import { Platform } from 'react-native';
import { PhotoFailure, type NativeCapture, type PhotoError, type PhotoResource, type PhotoService } from './types';

type FileSystem = typeof import('expo-file-system');
type PhotoFile = import('expo-file-system').File;
// Engineering memory/disk budgets, not device performance acceptance targets.
const MAX_PHOTO_BYTES = 24 * 1024 * 1024;
const MAX_RETAINED_PHOTOS = 3;
const NAME = /^argala-photo-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.jpg$/;
const resources = new Set<string>();
const protectedUris = new Set<string>();
const cleanupDebt = new Map<string, PhotoFile>();
// A timed-out native call cannot be cancelled. Keep its lock until settlement,
// including across React remounts, rather than overlap screenshot/chooser work.
let capturing = false;
let saving = false;
let sharing = false;

function requireModule(name: string) {
  if (Platform.OS !== 'android' || !requireOptionalNativeModule(name)) throw new PhotoFailure('unavailable');
}
function assertOwner(isCurrent: () => boolean, code: PhotoError) {
  if (!isCurrent()) throw new PhotoFailure(code);
}
function safeDelete(file: PhotoFile) {
  try { if (file.exists) file.delete(); cleanupDebt.delete(file.uri); }
  catch { cleanupDebt.set(file.uri, file); }
}
function requireCleanStorage() {
  for (const file of cleanupDebt.values()) safeDelete(file);
  // Fail clearly instead of accumulating private captures after deletion failure.
  if (cleanupDebt.size > 0) throw new PhotoFailure('capture-write');
}
function prune(directory: import('expo-file-system').Directory, fs: FileSystem) {
  try {
    for (const file of directory.list()) {
      if (file instanceof fs.File && NAME.test(file.name) && !protectedUris.has(file.uri)) safeDelete(file);
    }
  } catch { /* Missing/inaccessible old files do not authorize any broader cleanup. */ }
}
/** Reject all paths except this app's exact random name in native Pictures. */
function nativeFile(path: unknown, name: string, fs: FileSystem): PhotoFile {
  const appId = Constants.expoConfig?.android?.package;
  const storageRoot = typeof path === 'string' ? path.match(/^\/storage\/(?:emulated\/\d+|self\/primary|[A-Za-z0-9_-]+)(?=\/Android\/data\/)/)?.[0] : null;
  if (!storageRoot || !appId || !/^[\w]+(?:\.[\w]+)+$/.test(appId) ||
    path !== `${storageRoot}/Android/data/${appId}/files/Pictures/${name}.jpg`) throw new PhotoFailure('capture-failed');
  return new fs.File('file://' + path);
}
function wrap(error: unknown, fallback: PhotoError) {
  return error instanceof PhotoFailure ? error : new PhotoFailure(fallback);
}

function createResource(file: PhotoFile): PhotoResource {
  let disposed = false;
  let users = 0;
  let saved = false;
  let savePending: Promise<void> | null = null;
  let sharePending: Promise<void> | null = null;
  resources.add(file.uri);
  function cleanup() {
    if (!disposed || users > 0) return;
    safeDelete(file); protectedUris.delete(file.uri); resources.delete(file.uri);
  }
  async function withLease(work: () => Promise<void>, fallback: PhotoError) {
    users++;
    try { await work(); } catch (error) { throw wrap(error, fallback); }
    finally { users--; cleanup(); }
  }
  return {
    uri: file.uri,
    dispose() { disposed = true; cleanup(); },
    save(isCurrent) {
      if (disposed || !isCurrent()) return Promise.reject(new PhotoFailure('save-failed'));
      if (saved) return Promise.resolve();
      if (savePending) return savePending;
      if (saving) return Promise.reject(new PhotoFailure('busy'));
      saving = true;
      savePending = withLease(async () => {
        requireModule('ExpoMediaLibraryNext');
        const library = await import('expo-media-library');
        assertOwner(isCurrent, 'save-failed');
        // SDK57's AssetLegacyFactory runs below API30 and requires WRITE.
        // API30+ app-owned MediaStore writes need no library/read permission.
        if (Number(Platform.Version) < 30) {
          let permission = await library.getPermissionsAsync(true, []);
          assertOwner(isCurrent, 'save-failed');
          if (!permission.granted && permission.canAskAgain) {
            permission = await library.requestPermissionsAsync(true, []);
            assertOwner(isCurrent, 'save-failed');
          }
          if (!permission.granted) throw new PhotoFailure('save-permission');
        }
        assertOwner(isCurrent, 'save-failed');
        await library.Asset.create(file.uri);
        saved = true;
      }, 'save-failed').finally(() => { saving = false; savePending = null; });
      return savePending;
    },
    share(isCurrent) {
      if (disposed || !isCurrent()) return Promise.reject(new PhotoFailure('share-failed'));
      if (sharePending) return sharePending;
      if (sharing) return Promise.reject(new PhotoFailure('busy'));
      sharing = true;
      sharePending = withLease(async () => {
        requireModule('ExpoSharing');
        const library = await import('expo-sharing');
        assertOwner(isCurrent, 'share-failed');
        const available = await library.isAvailableAsync();
        assertOwner(isCurrent, 'share-failed');
        if (!available) throw new PhotoFailure('share-unavailable');
        // Do not delete a leased file when AR backgrounds/unmounts for the
        // chooser. Settlement means dismissal, never verified delivery.
        await library.shareAsync(file.uri, { mimeType: 'image/jpeg' });
      }, 'share-failed').finally(() => { sharing = false; sharePending = null; });
      return sharePending;
    },
  };
}

async function capture(nativeCapture: NativeCapture, isCurrent: () => boolean): Promise<PhotoResource> {
  assertOwner(isCurrent, 'capture-failed');
  if (capturing || resources.size >= MAX_RETAINED_PHOTOS) throw new PhotoFailure('busy');
  requireCleanStorage();
  capturing = true;
  let original: PhotoFile | undefined;
  let cache: PhotoFile | undefined;
  let retained = false;
  try {
    // FileSystem is the exact SDK57 module name; old APKs must never evaluate
    // a new package which eagerly requires its absent native implementation.
    requireModule('FileSystem');
    const fs = await import('expo-file-system');
    assertOwner(isCurrent, 'capture-failed');
    const name = 'argala-photo-' + uuid.v4().toLowerCase();
    if (!NAME.test(name + '.jpg')) throw new PhotoFailure('unavailable');
    const directory = new fs.Directory(fs.Paths.cache, 'argala-ar-photo-v1');
    directory.create({ intermediates: true, idempotent: true });
    prune(directory, fs);
    requireCleanStorage();
    const candidate = new fs.File(directory, name + '.jpg');
    if (protectedUris.has(candidate.uri) || candidate.exists) throw new PhotoFailure('capture-write');
    cache = candidate;
    protectedUris.add(cache.uri);
    assertOwner(isCurrent, 'capture-failed');
    // The caller pins takeScreenshot(name, false): native gallery=true can
    // report screenshot success even when its gallery write fails.
    const result = await nativeCapture(name);
    // A native failure may include a partial file; only own exact paths may be
    // deleted. Malformed/foreign URLs never become a deletion target.
    if (result?.url) original = nativeFile(result.url, name, fs);
    if (!result || result.success !== true) {
      throw new PhotoFailure(result?.errorCode === 3 ? 'capture-write' : result?.errorCode === 6 ? 'unsupported' : 'capture-failed');
    }
    if (!original || !original.exists) throw new PhotoFailure('capture-failed');
    protectedUris.add(original.uri);
    prune(original.parentDirectory, fs);
    requireCleanStorage();
    assertOwner(isCurrent, 'capture-failed');
    if (original.size <= 0 || original.size > MAX_PHOTO_BYTES) throw new PhotoFailure('capture-write');
    await original.copy(cache);
    assertOwner(isCurrent, 'capture-failed');
    if (!cache.exists || cache.size <= 0 || cache.size > MAX_PHOTO_BYTES) throw new PhotoFailure('capture-write');
    const resource = createResource(cache); retained = true;
    return resource;
  } catch (error) { throw wrap(error, 'capture-failed'); }
  finally {
    if (original) { safeDelete(original); protectedUris.delete(original.uri); }
    if (cache && !retained) { safeDelete(cache); protectedUris.delete(cache.uri); }
    capturing = false;
  }
}
export function createPhotoService(): PhotoService {
  return { capture };
}
