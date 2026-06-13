 I want to build a product for Claude Build Day. This should be a serious hackathon submission designed to look impressive in a live demo and compete for the $100K credit prize.

Product name: Was It Just Me?

Concept: A privacy-preserving neighborhood signal map. When someone notices something unusual nearby but it is not clearly an emergency, they can send a very quick anonymous signal.

The core interaction should be extremely low-friction. Users should be able to send a signal immediately using a hotkey, shortcut, or simple tap/long-press, without opening a complex reporting flow.

The app should not ask users to classify what happened. The main action is simply: “I noticed something.”

During normal use, the app should run quietly in the background with minimal energy usage, so users can trigger a signal quickly when they notice something.

The app visualizes signals on a map as privacy-randomized dots, not exact locations. Dots should be intentionally jittered or bucketed so the sender’s real location cannot be inferred.

The app should also provide an optional heatmap view to show broader signal density.

It should support both live view and historical view. Users should be able to adjust the time window or scrub through previous signals to see what happened earlier.

The app should avoid crime-reporting, surveillance, policing, or confirmed-incident framing. It should only show that people nearby noticed something, without claiming what actually happened.

It should include a strong demo mode because the hackathon demo cannot depend on real users. Demo mode should simulate signals appearing nearby, scattered false signals, heatmap changes, hotkey-triggered signals, background behavior, and historical replay.

Runtime should not require Claude or any LLM. Claude is used to build the app, not as a product dependency.

Please include: product summary, problem, target users, goals, non-goals, core UX, hotkey/background behavior, MVP requirements, map behavior, privacy rules, time/history behavior, simulation mode, data model, testing requirements.

The final PRD should be clear enough for Claude to use as an implementation brief for building the app.