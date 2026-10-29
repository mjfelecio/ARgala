export type NativePhotoResult = { success: boolean; url: string | null; errorCode: number };
export type NativeCapture = (fileName: string) => Promise<NativePhotoResult>;
export type PhotoError = 'unavailable' | 'busy' | 'capture-failed' | 'capture-write' | 'unsupported' | 'timeout' | 'save-failed' | 'save-permission' | 'share-failed' | 'share-unavailable' | 'preview-failed';
export class PhotoFailure extends Error {
  constructor(readonly code: PhotoError) { super(code); }
}
export type PhotoSnapshot = { photoUri: string | null; saved: boolean; busy: 'capture' | 'save' | 'share' | null; error: PhotoError | null };
export type PhotoResource = { uri: string; save(isCurrent: () => boolean): Promise<void>; share(isCurrent: () => boolean): Promise<void>; dispose(): void };
export type PhotoService = { capture(nativeCapture: NativeCapture, isCurrent: () => boolean): Promise<PhotoResource> };
