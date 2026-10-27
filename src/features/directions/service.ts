import { walkingRequestSchema, walkingRouteSchema, routePreviewRequestSchema, routePreviewSchema, type RoutePreviewRequest, type RoutePreview, type WalkingRequest, type WalkingRoute } from '../../../supabase/functions/_shared/contracts';
import { invokeEdge } from '@/lib/edge';
export type { WalkingRequest, WalkingRoute };
export const routeService = { preview: (request: RoutePreviewRequest): Promise<RoutePreview> => invokeEdge('route-preview', routePreviewRequestSchema.parse(request), routePreviewSchema), walking: (request: WalkingRequest): Promise<WalkingRoute> => invokeEdge('walking-route', walkingRequestSchema.parse(request), walkingRouteSchema) };
