// In-memory signal store for the UI. Holds the current set of privacy-safe
// SignalRecords and notifies subscribers on change. It NEVER holds or derives
// raw coordinates — only the SignalRecords the core produces.

import type { SignalRecord } from "../core/privacy.ts";

type Listener = (records: readonly SignalRecord[]) => void;

export class SignalStore {
  private records: SignalRecord[] = [];
  private listeners = new Set<Listener>();

  /** Replace the whole set (e.g. when (re)loading a demo scenario). */
  set(records: readonly SignalRecord[]): void {
    this.records = [...records];
    this.emit();
  }

  /** Append one signal (e.g. a live "I noticed something" trigger). */
  add(record: SignalRecord): void {
    this.records.push(record);
    this.emit();
  }

  /** Current records, ascending by coarsened time. */
  all(): readonly SignalRecord[] {
    return [...this.records].sort((a, b) => a.t - b.t);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.all());
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    const snapshot = this.all();
    for (const fn of this.listeners) fn(snapshot);
  }
}
