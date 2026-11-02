import { readFileSync } from 'node:fs';

// Native-boundary mocks read the real app tokens. The CSS compilation test
// separately checks Tailwind emission, semantics and contrast.
const declarations = new Map([...readFileSync(new URL('../../global.css', import.meta.url), 'utf8')
  .matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
export function themeVariable(name: string): string {
  if (name === '--theme') return 'light';
  const value = declarations.get(name) ?? declarations.get(name.replace('--color-', '--'));
  // Library-only animation tokens are inert at the mocked native boundary;
  // their actual imported declarations are covered by theme.test.ts.
  if (!value) return declarations.get('--color-brand-primary')!;
  return value.startsWith('var(') ? themeVariable(value.slice(4, -1)) : value;
}
