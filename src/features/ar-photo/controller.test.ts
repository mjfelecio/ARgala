import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ArPhotoController, PHOTO_DEADLINE_MS } from './controller';
import type { PhotoResource, PhotoService, PhotoSnapshot } from './types';

function setup() {
  const resource: PhotoResource = { uri: 'file:///private/cache/photo.jpg', save: vi.fn(async () => {}), share: vi.fn(async () => {}), dispose: vi.fn() };
  const service: PhotoService = { capture: vi.fn(async () => resource) };
  const snapshots: PhotoSnapshot[] = [];
  const controller = new ArPhotoController(service, state => snapshots.push(state));
  const nativeCapture = vi.fn();
  controller.activate(nativeCapture);
  return { controller, resource, service, nativeCapture, snapshots };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('AR photo ownership', () => {
  it('captures only on explicit action and coalesces duplicate capture presses', async () => {
    const { controller, service } = setup();
    expect(service.capture).not.toHaveBeenCalled();
    const a = controller.capture(); const b = controller.capture();
    await Promise.all([a, b]);
    expect(service.capture).toHaveBeenCalledOnce();
    expect(controller.snapshot().photoUri).toBe('file:///private/cache/photo.jpg');
    expect(controller.snapshot().busy).toBeNull();
  });
  it('keeps a single preview until explicit discard and never deletes the gallery copy', async () => {
    const { controller, resource, service } = setup();
    await controller.capture(); await controller.save(); await controller.capture();
    expect(service.capture).toHaveBeenCalledOnce();
    expect(controller.snapshot().saved).toBe(true);
    controller.discard();
    expect(resource.dispose).toHaveBeenCalledOnce();
    expect(controller.snapshot().photoUri).toBeNull();
    await controller.capture(); expect(service.capture).toHaveBeenCalledTimes(2);
  });
  it('bounds a hung capture, retires its authority and disposes the late image', async () => {
    const { controller, resource, service } = setup();
    const result = Promise.withResolvers<PhotoResource>();
    vi.mocked(service.capture).mockReturnValue(result.promise);
    const pending = controller.capture();
    const owner = vi.mocked(service.capture).mock.calls[0][1];
    await vi.advanceTimersByTimeAsync(PHOTO_DEADLINE_MS);
    await pending;
    expect(controller.snapshot().error).toBe('timeout');
    expect(owner()).toBe(false);
    result.resolve(resource); await Promise.resolve(); await Promise.resolve();
    expect(resource.dispose).toHaveBeenCalledOnce();
    expect(controller.snapshot().photoUri).toBeNull();
  });
  it.each(['background', 'exit', 'principal', 'native-frame'])('retires pending capture on %s and ignores old callbacks after reactivation', async () => {
    const { controller, resource, service, nativeCapture } = setup();
    const result = Promise.withResolvers<PhotoResource>();
    vi.mocked(service.capture).mockReturnValueOnce(result.promise);
    const pending = controller.capture();
    controller.retire(); controller.activate(nativeCapture);
    const currentResource = { ...resource, uri: 'file:///private/cache/current.jpg', dispose: vi.fn() };
    vi.mocked(service.capture).mockResolvedValueOnce(currentResource);
    await controller.capture();
    result.resolve(resource); await pending;
    expect(resource.dispose).toHaveBeenCalledOnce();
    expect(currentResource.dispose).not.toHaveBeenCalled();
    expect(controller.snapshot().photoUri).toBe(currentResource.uri);
  });
  it('does not save, share or capture after retirement', async () => {
    const { controller, resource, service } = setup();
    await controller.capture(); controller.retire();
    await controller.save(); await controller.share(); await controller.capture();
    expect(resource.save).not.toHaveBeenCalled(); expect(resource.share).not.toHaveBeenCalled();
    expect(service.capture).toHaveBeenCalledOnce();
    expect(controller.snapshot().photoUri).toBeNull();
  });
  it('deduplicates a successful save and allows an explicit retry after failure', async () => {
    const { controller, resource } = setup(); await controller.capture();
    vi.mocked(resource.save).mockRejectedValueOnce(new Error('SECRET_NATIVE_PATH'));
    await controller.save(); expect(controller.snapshot().error).toBe('save-failed');
    expect(controller.snapshot().saved).toBe(false);
    await Promise.all([controller.save(), controller.save()]);
    expect(resource.save).toHaveBeenCalledTimes(2);
    expect(controller.snapshot().saved).toBe(true);
    await controller.save(); expect(resource.save).toHaveBeenCalledTimes(2);
  });
  it('share dismissal clears pending state without claiming share success', async () => {
    const { controller, resource } = setup(); await controller.capture(); await controller.share();
    expect(resource.share).toHaveBeenCalledOnce();
    expect(controller.snapshot()).toMatchObject({ saved: false, busy: null, error: null });
    expect(Object.keys(controller.snapshot())).not.toContain('shared');
  });
  it('a retired late save cannot mark a newer preview as saved', async () => {
    const { controller, resource, service, nativeCapture } = setup(); await controller.capture();
    const saved = Promise.withResolvers<void>(); vi.mocked(resource.save).mockReturnValue(saved.promise);
    const saving = controller.save(); controller.retire(); controller.activate(nativeCapture);
    const newer = { ...resource, uri: 'file:///new.jpg', save: vi.fn(), dispose: vi.fn() };
    vi.mocked(service.capture).mockResolvedValue(newer); await controller.capture();
    saved.resolve(); await saving;
    expect(controller.snapshot()).toMatchObject({ saved: false, photoUri: newer.uri });
    expect(newer.dispose).not.toHaveBeenCalled();
  });
});
