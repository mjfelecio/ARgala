import { expect, it } from 'vitest';
import { destinationSchema, getDestination } from './catalog';
import { destinationToRoutePlace, destinationIdForRoutePlace } from './routing';
it.each(['en', 'ja', 'ko'] as const)('keeps the supplied %s destination name in the captured route target', language => {
 const destination = getDestination('D01')!;
 expect(destinationToRoutePlace(destination, language)?.name).toBe(destination.localizedNames![language]!.value);
});
it('routes all nine locally confirmed visitor entrances', () => {
 for (let i = 1; i <= 9; i++) expect(destinationToRoutePlace(getDestination(`D0${i}`)!)?.coordinates).toEqual(getDestination(`D0${i}`)!.routeEntrance);
});
it('uses the independently approved accessible entrance rather than the destination center', () => {
 const destination = destinationSchema.parse({ id: 'D01', provisionalName: 'Synthetic site', center: { latitude: 0, longitude: 0 }, centerApprovalReference: 'Test', routeEntrance: { latitude: 0.01, longitude: 0.01 }, routeEntranceApprovalReference: 'Test' });
 const place = destinationToRoutePlace(destination)!;
 expect(place).toEqual({ id: 'destination:D01', providerId: 'curated_D01', provider: 'curated', source: 'curated', name: 'Synthetic site', coordinates: destination.routeEntrance, attributions: [] });
 expect(destinationIdForRoutePlace(place)).toBe('D01');
 for (const patch of [{ provider: 'google' }, { source: 'discovery' }, { providerId: 'curated_D02' }, { id: 'destination:D10' }] as const) expect(destinationIdForRoutePlace({ ...place, ...patch })).toBeNull();
});
it('rejects unapproved or invalid entrances without accepting a verified center as a substitute', () => {
 const destination = { ...getDestination('D01')!, routeEntrance: undefined, routeEntranceApprovalReference: undefined };
 expect(destinationToRoutePlace({ ...destination, center: { latitude: 0, longitude: 0 }, centerApprovalReference: 'Test' })).toBeNull();
 expect(destinationToRoutePlace({ ...destination, routeEntrance: { latitude: 0, longitude: 0 } })).toBeNull();
 expect(destinationToRoutePlace({ ...destination, routeEntrance: { latitude: NaN, longitude: 0 }, routeEntranceApprovalReference: 'Test' })).toBeNull();
});
