import { detailsRequestSchema } from '../_shared/contracts.ts';
import { createEndpoint } from '../_shared/endpoint.ts';
import { getPlaceDetails } from '../_shared/places.ts';
import { access, placesDependencies } from '../_shared/runtime.ts';
Deno.serve(createEndpoint(detailsRequestSchema, (input) => getPlaceDetails(input, placesDependencies()), access));
