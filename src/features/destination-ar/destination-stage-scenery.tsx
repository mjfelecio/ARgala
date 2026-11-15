import { ViroNode, ViroPolyline } from '@reactvision/react-viro';
import { useReducedMotion } from 'react-native-reanimated';
import type { Basis } from './scene-geometry';
import type { Vector3 } from './types';
import type { ExhibitStageProfile } from './exhibit-stage';

type Contour = Readonly<{ points: Vector3[]; vegetation: boolean }>;
type Point = readonly [number, number];
const line = (points: readonly Point[], vegetation = false, depth = 0): Contour => ({ points: points.map(([x, y]) => [x, y, depth]), vegetation });
const ellipse = (x: number, y: number, width: number, height: number): Contour => line(Array.from({ length: 33 }, (_, i) => {
  const angle = i * Math.PI / 16; return [x + Math.cos(angle) * width, y + Math.sin(angle) * height] as Point;
}));

function fern(): Contour[] {
  return [-1, 1].flatMap(side => {
    const stem = line([[side * 0.9, -0.9], [side * 1.1, -0.35], [side * 1.22, 0.22], [side * 1.18, 0.65]], true);
    return [stem, ...Array.from({ length: 5 }, (_, index) => {
      const y = -0.55 + index * 0.22; const x = 1 + index * 0.04;
      const reach = 0.33 - index * 0.035;
      return line([[side * (x - reach), y + 0.16], [side * x, y], [side * (x + reach), y + 0.22]], true, 0.02);
    })];
  });
}
function basin(): Contour[] {
  return [0, 1, 2].map(index => line([[-1.65 + index * 0.13, 0.62 - index * 0.15], [-1.34, 0.31 - index * 0.15], [-1.1, -0.6 - index * 0.08], [-0.55, -0.95 - index * 0.07], [0.55, -0.95 - index * 0.07], [1.1, -0.6 - index * 0.08], [1.34, 0.31 - index * 0.15], [1.65 - index * 0.13, 0.62 - index * 0.15]], false, index * 0.025)).concat([
    ellipse(0, -0.94, 0.72, 0.07), ellipse(0, -0.94, 0.5, 0.045),
    line([[-1.65, 0.65], [-1.3, 0.85], [-0.95, 0.68], [-0.38, 0.79], [0.1, 0.69], [0.75, 0.85], [1.25, 0.71], [1.65, 0.85]]),
  ]);
}
function roots(): Contour[] {
  const river: Point[] = [[-1.65, -1.08], [-1.15, -0.96], [-0.55, -1.06], [0.1, -0.88], [0.65, -0.95], [1.2, -0.78], [1.65, -0.9]];
  return [line(river), line(river.map(([x, y]) => [x, y - 0.1])) , ...[-1, 1].flatMap(side => [0, 1, 2].map(index => {
    const x = side * (1.05 + index * 0.22); const y = 0.53 - index * 0.08;
    return line([[x, y], [x - side * 0.04, -0.24], [x - side * 0.2, -0.68], [x - side * 0.36, -0.88], [x - side * 0.2, -0.68], [x + side * 0.18, -0.84]], true);
  }))];
}
function fields(): Contour[] {
  return [
    ...Array.from({ length: 9 }, (_, index) => {
      const x = -1.6 + index * 0.4;
      return line([[x, -1.14], [x * 0.72, -0.92], [x * 0.42, -0.7]], true);
    }),
    line([[-1.6, 0.69], [-0.8, 0.78], [0, 0.72], [0.8, 0.78], [1.6, 0.69]]),
    ...[-1.2, -0.6, 0, 0.6, 1.2].map(x => line([[x - 0.09, 0.74], [x, 0.6], [x + 0.09, 0.74]], true)),
  ];
}
function fairway(): Contour[] {
  return [0, 1, 2].map(index => line([[-1.6, -0.98 - index * 0.08], [-0.95, -0.72 - index * 0.08], [-0.4, -0.84 - index * 0.08], [0.2, -0.77 - index * 0.08], [0.8, -0.88 - index * 0.08], [1.6, -0.68 - index * 0.08]])).concat(
    [-1, 1].flatMap(side => [0, 1].map(index => {
      const x = side * (1.16 + index * 0.29); const top = 0.52 - index * 0.14;
      return line([[x, -0.72], [x, top - 0.3], [x - 0.18, top - 0.24], [x - 0.23, top - 0.08], [x - 0.1, top + 0.04], [x + 0.1, top + 0.04], [x + 0.23, top - 0.08], [x + 0.18, top - 0.24], [x, top - 0.3]], true);
    })),
  );
}
function ridges(): Contour[] {
  return [0, 1, 2, 3].map(index => line([[-1.7, -0.1 - index * 0.2], [-1.15, 0.18 - index * 0.18], [-0.72, 0.06 - index * 0.18], [-0.15, 0.66 - index * 0.18], [0.28, 0.32 - index * 0.18], [0.95, 0.94 - index * 0.18], [1.7, 0.42 - index * 0.18]], false, index * 0.03)).concat([
    line([[-1.3, -1.12], [-0.75, -0.96], [0.15, -1.06], [0.66, -0.87], [1.3, -0.94]], true),
    line([[-1.5, -1.2], [-0.8, -1.05], [0.12, -1.15], [0.8, -0.97], [1.5, -1.04]]),
  ]);
}
function garden(): Contour[] {
  return [0, 1, 2].map(index => line([[-1.55 + index * 0.16, -1.1 + index * 0.1], [-0.92, -0.88 + index * 0.1], [-0.3, -1 + index * 0.1], [0.35, -0.85 + index * 0.1], [0.94, -0.98 + index * 0.1], [1.55 - index * 0.16, -0.78 + index * 0.1]], true)).concat([
    line([[-1.6, 0.47], [-1.06, 0.65], [-0.6, 0.51], [0, 0.9], [0.56, 0.64], [1.13, 0.82], [1.6, 0.57]]),
    ...[-1, 1].flatMap(side => {
      const x = side * 1.17; const y = 0.04;
      const flower = line(Array.from({ length: 51 }, (_, index) => {
        const angle = index * Math.PI / 25; const radius = 0.17 + 0.055 * Math.cos(angle * 5);
        return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius] as Point;
      }), true);
      return [flower, line([[x, y - 0.12], [x, -0.49], [x - side * 0.16, -0.34], [x, -0.4]], true)];
    }),
  ]);
}
function coast(): Contour[] {
  return [0, 1, 2, 3].map(index => line(Array.from({ length: 33 }, (_, i) => {
    const x = -1.65 + i * 3.3 / 32;
    return [x, -0.91 - index * 0.07 + Math.sin(x * 4 + index * 0.4) * 0.025] as Point;
  }))).concat([
    line([[-1.65, 0.68], [-0.95, 0.68], [-0.4, 0.75], [0.5, 0.75], [1.1, 0.68], [1.65, 0.68]]),
    line([[-1.4, -0.68], [-1.4, 0.1], [-1.62, 0.24], [-1.4, 0.1], [-1.15, 0.27]], true),
    line([[1.27, -0.64], [1.36, 0.19], [1.1, 0.34], [1.36, 0.19], [1.63, 0.33]], true),
  ]);
}
// Computed once. No frame callbacks, external assets, anchors or running effects.
const contours = { shoreline: [], fern: fern(), basin: basin(), roots: roots(), fields: fields(), fairway: fairway(), ridges: ridges(), garden: garden(), coast: coast() } satisfies Record<ExhibitStageProfile['theme'], Contour[]>;
export const stageContours = (theme: ExhibitStageProfile['theme']): readonly Contour[] => contours[theme];

export function DestinationStageScenery({ basis, profile }: { basis: Basis; profile: ExhibitStageProfile }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return <ViroNode testID={`exhibit-${profile.theme}-scenery`} ignoreEventHandling scale={[0.65, 1.1, 1]} position={[basis.forward[0] * 2.8, 0.08, basis.forward[2] * 2.8]} rotation={[0, basis.yaw, 0]}>
    {stageContours(profile.theme).map((contour, index) => <ViroPolyline key={index} ignoreEventHandling renderingOrder={-1} points={contour.points}
      thickness={0.0035} materials={contour.vegetation ? 'argalaRingAction' : 'argalaRingEdge'} opacity={contour.vegetation ? 0.5 : 0.34} />)}
  </ViroNode>;
}
