import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const cameraPath = 'node_modules/expo-camera/android/src/main/java/expo/modules/camera/ExpoCameraView.kt';

it('uses the transform-compatible Android preview before creating its surface provider', () => {
  const source = readFileSync(cameraPath, 'utf8');
  const initializer = source.match(/private var previewView = PreviewView\(context\)\.apply \{([^}]+)\}/)?.[1];
  expect(initializer).toContain('implementationMode = PreviewView.ImplementationMode.COMPATIBLE');
});

it('builds the patched camera from source rather than its precompiled Android artifact', () => {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
  expect(manifest.expo?.autolinking?.android?.buildFromSource).toContain('expo-camera');
});

