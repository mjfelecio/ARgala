import { routePreviewRequestSchema } from '../_shared/contracts.ts';
import { createEndpoint } from '../_shared/endpoint.ts';
import { computeRoutePreview } from '../_shared/routes.ts';
import { access, routesDependencies } from '../_shared/runtime.ts';
Deno.serve(createEndpoint(routePreviewRequestSchema, input => computeRoutePreview(input, routesDependencies()), access));
