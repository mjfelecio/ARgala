import { walkingRequestSchema } from '../_shared/contracts.ts';
import { createEndpoint } from '../_shared/endpoint.ts';
import { computeWalkingRoute } from '../_shared/routes.ts';
import { access, routesDependencies } from '../_shared/runtime.ts';
Deno.serve(createEndpoint(walkingRequestSchema, (input) => computeWalkingRoute(input, routesDependencies()), access));
