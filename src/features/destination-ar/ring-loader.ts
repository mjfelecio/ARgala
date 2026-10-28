/** Called only after support and permission preflight; no native view is created here. */
export async function loadRingScene() { return (await import('./destination-ring-scene')).DestinationRingSceneHost; }
