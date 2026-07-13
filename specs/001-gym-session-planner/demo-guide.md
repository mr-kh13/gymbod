# Ten-Minute Demo Guide: From Vague Idea to Working Gym Planner

## Demo goal

Show that Spec Kit turns an ambiguous product idea into a chain of reviewable decisions and then
keeps implementation traceable to those decisions.

Keep the app and these files open before starting:

1. `spec.md`
2. `plan.md`
3. `tasks.md`
4. The running app at `http://localhost:4173`

## 0:00–1:00 — Start with the vague request

Say:

> Our starting request was simply: “Build a small gym planner.” If an agent jumps directly to code,
> it has to silently decide what planner means, what data exists, and when the feature is done.

Show the workflow once:

```text
Constitution → Specify → Clarify → Plan → Checklist → Tasks → Analyze → Implement → Validate
```

## 1:00–2:00 — Constitution

Open `.specify/memory/constitution.md` and highlight only three rules:

- local-first privacy
- accessible by default
- test-first delivery

Explain that the constitution creates durable constraints for every later artifact.

## 2:00–3:30 — Specification and clarification

Open `spec.md`. Show the three independently testable stories and the clarification record:

> Reusable workouts, active sessions, and recent history—not calendar scheduling.

Point to one acceptance scenario and one measurable outcome. Emphasize that the specification says
**what and why**, while deliberately avoiding frameworks and file structures.

## 3:30–4:45 — Plan and design artifacts

Open `plan.md` and show the technical decision: static HTML/CSS/JavaScript, local storage adapter,
and Node's built-in test runner. Briefly mention the accompanying research, data model, UI contract,
and quickstart walkthrough.

Say:

> The spec chose the outcome; the plan chose the implementation. Keeping those decisions separate
> makes both easier to review.

## 4:45–5:45 — Checklist and analysis gates

Show `checklists/ux-resilience.md` and explain that it tests the quality of requirements, not the app.
Then show the analysis result from `validation.md`: 13 functional requirements covered, all tasks
well-formed, and no unresolved constitution or consistency findings.

## 5:45–6:45 — Tasks and test-first implementation

Open `tasks.md`. Show phases by user story and the test-before-implementation ordering. Mention the
observed red phases and the final 23/23 passing test suite.

## 6:45–9:00 — Live product demo

Use the prepared `Push day` plan or create one quickly:

1. Show the reusable workout and start it.
2. Mark one set complete.
3. Refresh to prove local persistence.
4. Finish the partial session.
5. Open History and inspect the immutable result.

If live interaction is risky, use the already-populated browser data and begin at step 2.

## 9:00–10:00 — Close

Show `validation.md`, especially the 375 px and 1440 px results.

Finish with:

> Spec Kit did not make the product decisions disappear. It made them explicit, reviewable, and
> connected to tests and implementation. The useful shift is from “ask AI to code” to “give AI a
> development process with checkpoints.”

## Five-minute Q&A preparation

**Is this too much process for every change?**

Use the lean Specify → Plan → Tasks → Implement path for small, well-understood work. Add clarification,
checklists, and analysis when ambiguity or risk justifies them.

**Who owns the specification?**

Designers, product partners, and engineers review different parts, but the artifact is shared. AI drafts;
the team owns the decisions.

**Does Spec Kit guarantee good code?**

No. It improves context and traceability. Tests, review, browser validation, and human judgment remain
necessary.

**Why was there no `/speckit.converge` command?**

The installed Spec Kit 0.8.15 Codex skill bundle did not include a convergence skill. This project
completed the same outcome through automated tests, quickstart execution, responsive browser checks,
and the recorded validation report.

**What did we intentionally skip?**

`taskstoissues` was not used because it would create external GitHub issues and adds no value to a
local ten-minute demo. All core delivery phases and the three local quality enhancements were used.
