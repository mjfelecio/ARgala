import { getDestination, featuredDestinationIds, type Destination, type FeaturedDestinationId } from '@/features/destinations/catalog';
import { z } from 'zod';
import { ARRIVAL_REMINDERS } from '@/config/limits';
export const REMINDER_RADIUS_METERS = ARRIVAL_REMINDERS.radiusMeters;
export const MAX_REMINDERS = ARRIVAL_REMINDERS.maxDestinations;
export const REMINDER_TASK = 'argala-destination-nearby-v1';
export const REMINDER_CHANNEL = 'destination-nearby';
export const tokenSchema = z.string().regex(/^[a-z0-9-]{8,80}$/);
export const selectionSchema = z.object({ destinationId:z.enum(featuredDestinationIds), generation:tokenSchema, consented:z.literal(true), locale:z.enum(['en','ja','ko']), claimed:z.boolean() }).strict();
export type ReminderSelection = z.infer<typeof selectionSchema>;
export const ownerSchema = z.object({version:z.literal(1),selections:z.array(selectionSchema).max(MAX_REMINDERS)}).strict().refine(x=>new Set(x.selections.map(s=>s.destinationId)).size===x.selections.length);
export const activeSchema = z.object({principalId:z.string().min(1).max(200),registrationId:tokenSchema}).strict().nullable();
export type ActiveReminderOwner = z.infer<typeof activeSchema>;
export type ReminderRegion = {identifier:string;latitude:number;longitude:number;radius:number;notifyOnEnter:true;notifyOnExit:false};
export type ReminderError = 'reminders.unavailable'|'reminders.storageFailed'|'reminders.permissions'|'reminders.failed'|'reminders.pointMissing'|'reminders.limit';
let sequence=0;
export const newGeneration=()=>`${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2,14)}`;
/** Resolve IDs back to the bundled catalog: callers cannot supply geographic authority. */
export function reminderDestination(id:unknown):Destination|null {
 const d=getDestination(id);if(!d)return null;
 return (d.ar?.activation?.point&&d.ar.activation.pointApprovalReference)||(d.center&&d.centerApprovalReference)?d:null;
}
export function reminderPoint(d:Destination){return d.ar?.activation?.point??d.center!;}
export const regionIdentifier=(registrationId:string,s:ReminderSelection)=>`${registrationId}:${s.destinationId}:${s.generation}`;
export const notificationIdentifier=(s:ReminderSelection)=>`argala-reminder-${s.generation}`;
export function parseRegionIdentifier(value:unknown){if(typeof value!=='string')return null;const [registrationId,destinationId,generation,...extra]=value.split(':');if(extra.length||!tokenSchema.safeParse(registrationId).success||!tokenSchema.safeParse(generation).success||!reminderDestination(destinationId))return null;return {registrationId,destinationId:destinationId as FeaturedDestinationId,generation};}
