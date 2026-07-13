<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Added principles: I. User-Value Slices; II. Local-First Privacy;
  III. Accessible by Default; IV. Test-First Delivery; V. Simplicity and Traceability
- Added sections: Product Constraints; Spec-Driven Workflow
- Removed sections: none
- Templates:
  - ✅ .specify/templates/plan-template.md (existing Constitution Check is aligned)
  - ✅ .specify/templates/spec-template.md (existing scenarios and measurable outcomes are aligned)
  - ✅ .specify/templates/tasks-template.md (updated to require test tasks)
- Follow-up TODOs: none
-->
# Gym Planner Constitution

## Core Principles

### I. User-Value Slices
Every feature MUST be expressed as a prioritized, independently testable user journey.
The first journey MUST provide a usable minimum product without depending on lower-priority
stories. Requirements MUST describe user outcomes before implementation choices. This keeps
the demonstration understandable to product, design, and engineering audiences.

### II. Local-First Privacy
Workout plans and progress data MUST remain on the user's device. The first release MUST NOT
require an account, remote service, analytics tracker, or network connection after initial page
load. Stored data MUST be limited to information required for planning and completing workouts.

### III. Accessible by Default
All core journeys MUST be usable with keyboard-only navigation and MUST expose meaningful
semantics and visible focus states. Text and interactive controls MUST meet WCAG 2.2 AA contrast
expectations. Layouts MUST remain usable from 375 px through desktop widths.

### IV. Test-First Delivery
Automated tests are NON-NEGOTIABLE. For each user story, behavioral tests MUST be written before
the implementation and observed failing for the intended reason. Implementation proceeds through
red, green, and refactor. A story is incomplete until its tests and the full regression suite pass.

### V. Simplicity and Traceability
The solution MUST use the smallest architecture that satisfies the specification. Each task MUST
reference a user story or cross-cutting requirement and name concrete file paths. New dependencies,
abstractions, or infrastructure MUST be justified in the implementation plan; speculative scope is
prohibited.

## Product Constraints

The first release is a single-user browser application for planning and completing gym sessions.
It MUST operate without authentication or a backend. It MUST avoid medical, injury-rehabilitation,
nutrition, social, coaching, and wearable-integration features. User-facing guidance MUST not imply
medical or professional fitness advice.

## Spec-Driven Workflow

Every feature MUST pass through constitution, specification, clarification, planning, requirements
checklist, task generation, cross-artifact analysis, implementation, and convergence/validation.
No implementation may begin while a critical ambiguity, constitution violation, incomplete quality
checklist, or uncovered buildable requirement remains. Generated artifacts are reviewable project
records and MUST stay consistent when decisions change.

## Governance

This constitution supersedes conflicting project guidance. Amendments MUST include a rationale,
an impact assessment for dependent Spec Kit artifacts, and a semantic version change. MAJOR changes
remove or redefine a principle, MINOR changes add or materially expand governance, and PATCH changes
clarify wording without changing obligations. Every plan and implementation review MUST document
compliance; unjustified violations block delivery.

**Version**: 1.0.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-07-13
