// The headline "answer" copy for "Was It Just Me?".
//
// PRIVACY POSTURE: this module sees ONLY an aggregate count of signals currently
// in view — never a coordinate, a timestamp, or anything per-sender. It turns a
// bare count into the reassuring collective-noticing message that is the whole
// point of the product, reframed for live vs. historical viewing. Pure and
// dependency-free so it runs in the browser, Node, and tests unchanged.

export type AnswerTone = "empty" | "alone" | "together";

export interface Answer {
  text: string;
  tone: AnswerTone;
}

/**
 * Compute the headline answer from the aggregate `count` of signals in view and
 * whether the operator is watching live (true) or scrubbing history (false).
 *
 * Tones:
 *   - "empty"     (count <= 0): nobody noticed in this window — quiet.
 *   - "alone"     (count === 1): it might just be you — a single signal.
 *   - "together"  (count >= 2): the payoff — it wasn't just you.
 */
export function answerFor(count: number, isLive: boolean): Answer {
  // Guard against bad input (NaN/negative) so the UI never shows "NaN nearby".
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;

  if (n <= 0) {
    return {
      text: isLive
        ? "Quiet here right now — nobody nearby has noticed anything."
        : "Nothing was noticed nearby in this window.",
      tone: "empty",
    };
  }
  if (n === 1) {
    return {
      text: isLive
        ? "So far it might just be you — one signal nearby."
        : "Just one signal nearby in this window.",
      tone: "alone",
    };
  }
  return {
    text: isLive
      ? `It wasn’t just you — ${n} nearby noticed something too.`
      : `${n} nearby noticed something in this window.`,
    tone: "together",
  };
}
