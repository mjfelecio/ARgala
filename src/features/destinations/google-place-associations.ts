import type { FeaturedDestinationId } from './catalog';

/** Public listing evidence: docs/design/explore-cleanup/google-place-associations.md.
 * Display identity only. Never an AR activation policy or route entrance.
 * D02/D07 remain deliberately unmatched until their exact listing is verified.
 */
const associations: Partial<Record<FeaturedDestinationId, string>> = {
  D01: 'ChIJVREKfDnlBzMRfl4RQPJlsoU',
  D03: 'ChIJR-Le6-3kBzMRh7dhK8rZPAw',
  D04: 'ChIJw9UbztH3BzMRacBZ92EsYZw',
  D05: 'ChIJKbrUq5zxBzMRL7306BmXue4',
  D06: 'ChIJV4vCg4zxBzMROhJPn8Hz9DY',
  D08: 'ChIJ4f0tMujlBzMRGLcx2nl2Mtc',
  D09: 'ChIJ5XvVgmT3BzMRqp2AP1xolmQ',
  D10: 'ChIJT-SmSnzxBzMRLcvH4JvP5XI',
};
export const displayGooglePlaceId = (id: FeaturedDestinationId): string | undefined => associations[id];
