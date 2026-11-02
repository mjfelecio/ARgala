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
  expect(declarations.get('--color-mint')).toBe('#E8F8F0');
  expect(declarations.get('--color-page')).toBe('#FCFBF7');
  expect(declarations.get('--color-page-mint')).toBe('var(--color-page)');
  expect(declarations.get('--background')).toBe('var(--color-page)');
  expect(declarations.get('--color-seafoam')).toBe('#42D5A5');
  expect(declarations.get('--color-ar-panel')).toBe('#102724');
  expect(declarations.get('--color-ar-edge')).toBe('#71DCD2');
  // Logo geometry and identity remain locked.
  expect(declarations.get('--color-logo-seafoam')).toBe('#42D5A5');
  expect(declarations.get('--color-logo-ink')).toBe('var(--color-brand-strong)');
  expect(declarations.get('--color-logo-ivory')).toBe('#FCFBF7');
  expect(declarations.get('--color-brand-primary')).toBe('#247A53');
  expect(declarations.get('--accent-foreground')).toBe('var(--color-white)');
  expect(declarations.get('--color-route')).toBe('#2A72E5');
  expect(declarations.get('--color-route-area')).toBe('color-mix(in srgb, var(--color-route) 8%, transparent)');

  const resolve = (name: string): string => {
    const value = declarations.get(name)!;
    const alias = /^var\((--[\w-]+)\)$/.exec(value);
    return alias ? resolve(alias[1]) : value;
  };
  const luminance = (hex: string) => {
    const channels = hex.slice(1).match(/../g)!.map(channel => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  // Check emitted values, rather than trusting the kit's reference contrast report.
  for (const [foreground, background] of [
    ['--accent-foreground', '--accent'],
    ['--color-ink', '--color-page'],
    ['--color-ink-secondary', '--color-page'],
    ['--color-white', '--color-ar-panel'],
    ['--color-brand-strong', '--color-seafoam'],
    ['--color-logo-ink', '--color-logo-seafoam'],
    ['--color-logo-ink', '--color-logo-ivory'],
  ]) {
    const values = [luminance(resolve(foreground)), luminance(resolve(background))].sort((a, b) => b - a);
    expect((values[0] + 0.05) / (values[1] + 0.05), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
  }

  // Button reads every variant's highlight color, even for primary buttons.
  for (const name of ['default-hover', 'danger-hover', 'danger-soft-hover', 'default-foreground', 'accent-foreground']) {
    expect(declarations.has(`--color-${name}`), name).toBe(true);
  }
});
