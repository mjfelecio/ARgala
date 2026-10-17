import { nearbyRequestSchema } from '../_shared/contracts.ts';
import { createEndpoint } from '../_shared/endpoint.ts';
import { searchNearby } from '../_shared/places.ts';
import { access, placesDependencies } from '../_shared/runtime.ts';
Deno.serve(createEndpoint(nearbyRequestSchema, (input) => searchNearby(input, placesDependencies()), access));
