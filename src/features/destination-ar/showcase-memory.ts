import { destinationIds, type DestinationId } from '@/features/destinations/catalog';
type Snapshot = Readonly<{ generation: number; stamps: readonly DestinationId[]; introductions: readonly DestinationId[] }>;
/** A showcase root owns this memory. It never reads or writes the real journal. */
export class ShowcaseMemory {
  private snapshot: Snapshot = Object.freeze({ generation: 0, stamps: [], introductions: [] });
  private listeners = new Set<() => void>();
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private record(field: 'stamps' | 'introductions', id: string, generation: number) {
    if (generation !== this.snapshot.generation || !destinationIds.some(value => value === id) || this.snapshot[field].includes(id as DestinationId)) return;
    this.snapshot = Object.freeze({ ...this.snapshot, [field]: Object.freeze([...this.snapshot[field], id as DestinationId]) });
    this.listeners.forEach(listener => listener());
  }
  recordEstablished(id: string, generation: number) { this.record('stamps', id, generation); }
  completeIntroduction(id: string, generation: number) { this.record('introductions', id, generation); }
  reset() { this.snapshot = Object.freeze({ generation: this.snapshot.generation + 1, stamps: [], introductions: [] }); this.listeners.forEach(listener => listener()); }
}
