export type VisualQuality = 'standard' | 'reduced';
/** Local JS scheduling pressure, not a renderer FPS, hardware tier or thermal measurement. */
export class SchedulingQualityPolicy {
  private previous: number | null = null;
  private delayed = 0;
  private quality: VisualQuality = 'standard';
  get current() { return this.quality; }
  pause() { this.previous = null; this.delayed = 0; }
  observe(now: number): VisualQuality {
    if (!Number.isFinite(now)) { this.pause(); return this.quality; }
    const previous = this.previous; this.previous = now;
    if (previous === null) return this.quality;
    const gap = now - previous;
    if (gap < 0 || gap > 60000) { this.delayed = 0; return this.quality; }
    this.delayed = gap > 1250 ? this.delayed + 1 : 0;
    if (this.delayed >= 3) this.quality = 'reduced';
    return this.quality;
  }
}
