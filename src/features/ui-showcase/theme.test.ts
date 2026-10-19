import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compile } from '@tailwindcss/node';
import { expect, it } from 'vitest';

it('emits HeroUI runtime colors even without matching utility classes', async () => {
  const entrypoint = new URL('../../../global.css', import.meta.url);
  // Use the installed UniWind compiler dependency and actual CSS imports. Native
  // component mocks cannot detect Tailwind pruning colors used only by hooks.
  const compiler = await compile(await readFile(entrypoint, 'utf8'), {
    base: fileURLToPath(new URL('.', entrypoint)),
    onDependency() {},
  });
  const output = compiler.build([]);
  const declarations = new Map(
    [...output.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  );

  expect(declarations.get('--color-accent-hover')).toBe('var(--color-brand-strong)');
  expect(declarations.get('--color-accent-soft')).toBe('var(--color-mint)');
  expect(declarations.get('--color-accent-soft-foreground')).toBe('var(--color-brand-strong)');
  expect(declarations.get('--color-brand-strong')).toBe('#174D38');
  expect(declarations.get('--color-mint')).toBe('#E7F4EC');
  expect(declarations.get('--color-route')).toBe('#2A72E5');
  expect(declarations.get('--color-route-area')).toBe('color-mix(in srgb, var(--color-route) 8%, transparent)');

  // Button reads every variant's highlight color, even for primary buttons.
  for (const name of ['default-hover', 'danger-hover', 'danger-soft-hover', 'default-foreground', 'accent-foreground']) {
    expect(declarations.has(`--color-${name}`), name).toBe(true);
  }
});
