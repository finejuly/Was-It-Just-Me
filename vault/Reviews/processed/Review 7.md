Don't allow map moving/zoom in/zoom out for now.

---
**TRIAGED (Loop #16):** → TASK-202606131720 (done). Disabled all map pan/zoom
inputs + removed the +/- control in `src/ui/mapView.ts`, and made `sendSignal()`
recenter the now-fixed view on each new dot (`src/main.ts`) so a sent signal is
always visible (also addresses ISSUE-202606131705 "no dot after signaling").
Verified tests 66/66; privacy-core SHA unchanged.
