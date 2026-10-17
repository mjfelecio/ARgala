import { walkingRequestSchema, walkingRouteSchema, type WalkingRequest, type WalkingRoute } from '../../../supabase/functions/_shared/contracts';
import { invokeEdge } from '@/lib/edge';
export type { WalkingRequest, WalkingRoute };
export const routeService = { walking: (request: WalkingRequest): Promise<WalkingRoute> => invokeEdge('walking-route', walkingRequestSchema.parse(request), walkingRouteSchema) };
