// Demo-mode stage playback controller for "Was It Just Me?" (TASK-202606131312).
//
// The seeded scenario (see simulator.ts) is stamped across an hour of history and
// the UI exposes a scrubber over it. On stage, an operator wants the timeline to
// advance ITSELF — play / pause / change speed — so the "historical replay"
// required by the PRD (Simulation mode) runs hands-free instead of needing a hand
// on the slider. This module is the pure, deterministic clock for that: given the
// wall-clock elapsed since the last tick and a playback speed, it computes the new
// scrubber position. It owns NO timer and NO DOM — the UI drives it with whatever
// ticker it likes (setInterval/rAF) and reads back the position. That keeps the
// stepping logic unit-testable with node:test and free of platform APIs.
//
// Pure module: no UI, no DOM, no network, no fs, no LLM, no platform APIs, and no
// signal/privacy data at all — it only moves an integer cursor over [0, maxStep].

/** Discrete playback speeds offered on stage (multipliers of the base rate). */
export const PLAYBACK_SPEEDS = [1, 2, 4] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/**
 * Base advance rate: scrubber steps per real second at 1x. The scrubber's steps
 * are LIVE_WINDOW_MS-wide frames of the timeline; advancing ~1 frame/sec at 1x
 * walks a one-hour, ten-minute-window demo (~6 frames) in a few seconds, which is
 * a comfortable stage pace — bump to 2x/4x to skim, or scrub by hand.
 */
export const BASE_STEPS_PER_SECOND = 1;

export interface PlaybackTickResult {
  /** New cursor position, clamped to [0, maxStep]. */
  step: number;
  /** True when the cursor reached the end (maxStep) on this tick. */
  reachedEnd: boolean;
}

/**
 * Advance a playback cursor.
 *
 * @param current   current integer step (will be clamped into range first)
 * @param maxStep   last valid step (>= 0); the timeline's final frame
 * @param speed     playback speed multiplier
 * @param elapsedMs wall-clock ms since the previous tick (>= 0)
 * @param carryMs   fractional ms left over from the previous tick (>= 0); lets a
 *                  fast ticker accumulate sub-step progress without rounding loss
 * @returns the new step, whether the end was reached, and the carry to feed back
 *
 * Deterministic and pure: identical inputs always yield identical outputs. The
 * cursor only moves forward (playback is forward replay); reaching maxStep is
 * reported via `reachedEnd` so the caller can stop, loop, or hand off to live.
 */
export function advancePlayback(
  current: number,
  maxStep: number,
  speed: PlaybackSpeed,
  elapsedMs: number,
  carryMs = 0,
): PlaybackTickResult & { carryMs: number } {
  const max = Math.max(0, Math.floor(maxStep));
  let cur = Math.min(max, Math.max(0, Math.floor(current)));
  const e = Math.max(0, elapsedMs) + Math.max(0, carryMs);

  if (max === 0) {
    // Nothing to advance over — already at the (only) frame, which is the end.
    return { step: 0, reachedEnd: true, carryMs: 0 };
  }

  const msPerStep = 1000 / (BASE_STEPS_PER_SECOND * speed);
  const wholeSteps = Math.floor(e / msPerStep);
  const carry = e - wholeSteps * msPerStep;

  cur = Math.min(max, cur + wholeSteps);
  return { step: cur, reachedEnd: cur >= max, carryMs: carry };
}

/**
 * Decide whether playback should auto-start on load.
 *
 * On boot the demo can narrate itself hands-free by auto-playing the seeded
 * timeline — but only when Demo mode is on AND the visitor has not asked for
 * reduced motion. Respecting `prefers-reduced-motion` means we never force
 * animation: a reduced-motion visitor keeps the static-but-fully-functional
 * view. Pure (two booleans in, one boolean out) so it stays DOM-free and
 * unit-testable alongside advancePlayback.
 *
 * @param demoOn               true when Demo mode is enabled
 * @param prefersReducedMotion true when the user prefers reduced motion
 */
export function shouldAutoPlay(
  demoOn: boolean,
  prefersReducedMotion: boolean,
): boolean {
  return demoOn && !prefersReducedMotion;
}
