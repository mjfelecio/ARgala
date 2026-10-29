// Synthetic test data only; never imported by application code.
export function manifest(revision = 1) {
  const locales = Object.fromEntries(['en', 'ja', 'ko'].map(locale => [locale, { value: `Synthetic test ${locale}`, approvalReference: 'synthetic-test-only' }]));
  return { schemaVersion: 1, catalogVersion: 1, revision, approvalStatus: 'approved', destinations: [
    { id: 'pilot-aclc', contentVersion: `test-${revision}`, tiles: [{ id: 'overview', role: 'overview', title: locales, body: locales }] },
  ] };
}
