import { useEffect } from 'react';
import { ViroMaterials } from '@reactvision/react-viro';
import { useCSSVariable } from 'uniwind';
/** Adapt the existing CSS theme only where the native 3D renderer needs values. */
export function useArNativeStyle() {
  const [brand, surface, edge, text, font] = useCSSVariable(['--color-brand-primary', '--color-ar-panel', '--color-ar-edge', '--color-white', '--font-sans']) as string[];
  useEffect(() => {
    ViroMaterials.createMaterials({
      argalaRingSurface: { diffuseColor: surface, lightingModel: 'Constant' },
      argalaRingEdge: { diffuseColor: edge, lightingModel: 'Constant' },
      argalaRingAction: { diffuseColor: brand, lightingModel: 'Constant' },
    });
  }, [brand, surface, edge]);
  return {
    text: (fontSize: number, align: 'left' | 'center' = 'center', weight: '400' | '600' = '400') => ({
      fontFamily: (typeof font === 'string' ? font : 'PlusJakartaSans').replaceAll("'", '').replaceAll('"', ''), fontSize, color: text,
      fontWeight: weight, textAlign: align, textAlignVertical: 'center' as const,
    }),
  };
}
export type ArNativeStyle = ReturnType<typeof useArNativeStyle>;
