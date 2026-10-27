import { placesSearchRequestSchema } from '../_shared/contracts.ts';
import { createEndpoint } from '../_shared/endpoint.ts';
import { searchPlaces } from '../_shared/places.ts';
import { access, placesDependencies } from '../_shared/runtime.ts';
Deno.serve(createEndpoint(placesSearchRequestSchema, input => searchPlaces(input, placesDependencies()), access));
