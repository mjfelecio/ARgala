import { z } from 'zod';
import { walkingRequestSchema, walkingRouteSchema, routePreviewRequestSchema, routePreviewSchema, type RoutePreview, type WalkingRoute } from './contracts.ts';
import { ApiError } from './errors.ts';
import { googleJson, type GoogleDependencies } from './google.ts';
const googleRoute = z.object({ distanceMeters: z.number().int().nonnegative(), duration: z.string().regex(/^\d+(\.\d{1,9})?s$/), polyline: z.object({ encodedPolyline: z.string().min(1).max(100000) }), warnings: z.array(z.string()).default([]) });
export async function computeRoutePreview(input: unknown, dependencies: GoogleDependencies): Promise<RoutePreview> {
  const request = routePreviewRequestSchema.parse(input);
  const payload = await googleJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.warnings' },
    body: JSON.stringify({ origin: { location: { latLng: request.origin } }, destination: { location: { latLng: request.destination } }, travelMode: request.mode === 'walking' ? 'WALK' : 'DRIVE', languageCode: request.language, units: 'METRIC' }),
  }, dependencies);
  const parsed = z.object({ routes: z.array(googleRoute).default([]) }).safeParse(payload);
  if (!parsed.success) throw new ApiError('UPSTREAM_INVALID', 502, 'The provider returned invalid route data.');
  const route = parsed.data.routes[0];
  if (!route) throw new ApiError('ROUTE_UNAVAILABLE', 404, `No ${request.mode} route is available for this destination.`);
  return routePreviewSchema.parse({ mode: request.mode, distanceMeters: route.distanceMeters, durationSeconds: Number(route.duration.slice(0, -1)), encodedPolyline: route.polyline.encodedPolyline, warnings: route.warnings });
}

/** Installed-client compatibility: keep the existing walking contract unchanged. */
export async function computeWalkingRoute(input: unknown, dependencies: GoogleDependencies): Promise<WalkingRoute> {
  const request = walkingRequestSchema.parse(input);
  return walkingRouteSchema.parse(await computeRoutePreview({ ...request, mode: 'walking' }, dependencies));
}
