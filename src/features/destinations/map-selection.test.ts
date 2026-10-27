import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { queryClient } from '@/lib/query';
import { destinationSchema, getDestination } from './catalog';
import { featuredMapPlace, matchedFeaturedDestination, setFeaturedSelection, featuredSelectionOptions } from './map-selection';
it('retains a separate curated selection through navigation without provider description or Google namespace', () => {
 const client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
 try {
  setFeaturedSelection(client, 'pilot-aclc');
  expect(client.getQueryData(featuredSelectionOptions('pilot-aclc').queryKey)).toEqual({ destinationId: 'pilot-aclc' });
  const place = featuredMapPlace(getDestination('pilot-aclc')!);
  expect(place).toMatchObject({ provider: 'curated', source: 'curated', coordinates: getDestination('pilot-aclc')!.center });
  expect(place).not.toHaveProperty('description'); expect(place).not.toHaveProperty('mapsUri');
 } finally { client.clear(); }
});
it('uses exact approved provider identity only and rejects names, close coordinates and ambiguous associations', () => {
 const pilot = getDestination('pilot-aclc')!;
 const place = { ...featuredMapPlace(pilot)!, provider: 'google', providerId: 'exact-id' };
 expect(matchedFeaturedDestination(place, [pilot])).toBeNull();
 const approved = destinationSchema.parse({ ...pilot, ar: { ...pilot.ar, providerAssociation: { providerId: 'exact-id', approvalReference: 'Synthetic test approval' } } });
 expect(matchedFeaturedDestination(place, [approved])?.id).toBe('pilot-aclc');
 expect(matchedFeaturedDestination({ ...place, providerId: 'similar-name' }, [approved])).toBeNull();
 const ambiguous = destinationSchema.parse({ ...approved, id: 'D01' });
 expect(matchedFeaturedDestination(place, [approved, ambiguous])).toBeNull();
});
