# Requirements Document

## Introduction

TaskFlow is a production-quality, frontend-only project management SaaS application built with React 19, TypeScript, and Vite. It addresses pain points common in tools like Trello by providing deeper productivity insights, intelligent (rule-based) task prioritization, rich workload visualization, and a streamlined user experience. All data is persisted via localStorage through a replaceable service/storage layer, so the architecture can be connected to a REST API in the future without modifying the UI.

The application targets individual users and small teams who need a clean, modern, and fast planning tool with workspaces, boards, drag-and-drop task management, filtering/sorting, analytics, and a smart productivity assistant — all with zero backend dependency.

---

## Glossary

- **Application**: The TaskFlow frontend SaaS application.
- **User**: The person interacting with the Application in a browser.
- **Workspace**: A top-level organizational container (e.g., Personal, College, Office, Hackathon) that groups related Boards.
- **Board**: A named, configurable Kanban-style board belonging to a Workspace, containing one or more Columns.
- **Column**: A named vertical lane within a Board (e.g., Backlog, To Do, In Progress, Review, Done) that holds Tasks.
- **Task**: The core unit of work, belonging to a Column, with metadata including title, description, priority, labels, due date, estimated hours, checklist items, comments, and activity history.
- **Checklist**: An ordered list of sub-items attached to a Task, each with a completion state.
- **Comment**: A timestamped text note attached to a Task.
- **Activity**: An immutable log entry recording a change event on a Task or Board (created, edited, moved, completed, deleted).
- **Priority**: An enumerated urgency level for a Task: Low, Medium, High, or Urgent.
- **Label**: A user-defined color-tagged text tag attachable to Tasks for categorization.
- **Dashboard**: The Application's home screen displaying aggregated productivity statistics and recent activity.
- **Analytics Page**: A dedicated page presenting visual charts and metrics about Tasks across all Workspaces.
- **Productivity Assistant**: A rule-based (non-AI) system that analyses Task data and surfaces actionable suggestions to the User.
- **Theme**: The Application's color scheme — Light, Dark, or System (follows OS preference).
- **StorageService**: The storage abstraction layer that reads/writes persisted data, currently backed by localStorage.
- **Zustand Store**: A client-side state management unit managing a specific domain (Workspace, Board, Task, Theme, Analytics).
- **Drag-and-Drop**: The interaction for reordering Tasks within a Column or moving Tasks between Columns using @hello-pangea/dnd.

---

## Requirements

### Requirement 1: Data Persistence via Replaceable Storage Layer

**User Story:** As a User, I want my workspaces, boards, tasks, and preferences persisted across browser sessions, so that I never lose my work.

#### Acceptance Criteria

1. THE StorageService SHALL read and write all Application state (Workspaces, Boards, Columns, Tasks, Activities, Theme preference) to localStorage using namespaced keys.
2. WHEN the Application initialises, THE StorageService SHALL hydrate all Zustand Stores from localStorage before rendering any content.
3. WHEN any Zustand Store state changes, THE StorageService SHALL persist the updated state to localStorage within 300 ms.
4. THE StorageService SHALL expose a typed interface (`get`, `set`, `remove`, `clear`) so that it can be replaced with a REST API client without modifying any UI component or Zustand Store.
5. IF localStorage is unavailable or throws a quota error, THEN THE StorageService SHALL catch the error, log a warning to the browser console, and continue operating with in-memory state for the current session.
6. THE Application SHALL function correctly after a full page reload, restoring the exact previous state including active Workspace, active Board, and Theme preference.

---

### Requirement 2: Workspace Management

**User Story:** As a User, I want to create, rename, and delete Workspaces, so that I can separate work across different contexts (Personal, College, Office, Hackathon).

#### Acceptance Criteria

1. THE Application SHALL support a minimum of 1 and a maximum of 20 simultaneous Workspaces.
2. WHEN the User creates a Workspace, THE Application SHALL require a non-empty name of 1–50 characters and assign a UUID.
3. WHEN the User renames a Workspace, THE WorkspaceService SHALL update the name and record an Activity entry.
4. WHEN the User deletes a Workspace, THE Application SHALL display a confirmation dialog before permanently removing the Workspace and all of its Boards, Columns, and Tasks.
5. THE Application SHALL persist the ID of the currently active Workspace and restore it on reload.
6. WHEN no Workspaces exist, THE Application SHALL display a prompt guiding the User to create the first Workspace.
7. THE Application SHALL seed at least one default Workspace (e.g., "Personal") on first launch when no persisted data is present.

---

### Requirement 3: Board Management

**User Story:** As a User, I want to create, rename, reorder, and delete Boards within a Workspace, so that I can organise my projects clearly.

#### Acceptance Criteria

1. THE Application SHALL support a minimum of 1 and a maximum of 50 Boards per Workspace.
2. WHEN the User creates a Board, THE BoardService SHALL require a non-empty name of 1–80 characters, assign a UUID, and initialise the Board with five default Columns: Backlog, To Do, In Progress, Review, Done.
3. WHEN the User renames a Board, THE BoardService SHALL update the name and persist the change.
4. WHEN the User deletes a Board, THE Application SHALL display a confirmation dialog and then remove the Board and all of its Columns and Tasks.
5. THE Application SHALL display the list of Boards for the active Workspace in the sidebar navigation.
6. THE Application SHALL persist the ID of the currently active Board per Workspace and restore it on reload.

---

### Requirement 4: Column Management

**User Story:** As a User, I want to add, rename, reorder, and delete Columns on a Board, so that I can customise my workflow stages.

#### Acceptance Criteria

1. THE Application SHALL support a minimum of 1 and a maximum of 10 Columns per Board.
2. WHEN the User adds a Column, THE BoardService SHALL require a non-empty name of 1–50 characters, assign a UUID, and append the Column to the end of the Board's Column list.
3. WHEN the User renames a Column, THE BoardService SHALL update the Column name and persist the change immediately.
4. WHEN the User deletes a Column that contains Tasks, THE Application SHALL display a confirmation dialog warning that all contained Tasks will be deleted.
5. WHEN the User reorders Columns via Drag-and-Drop, THE BoardService SHALL update and persist the Column order within 100 ms of the drop event.
6. THE Application SHALL display Columns in their persisted order from left to right on the Board view.

---

### Requirement 5: Task Creation and Editing

**User Story:** As a User, I want to create detailed Tasks with rich metadata, so that I can capture all relevant information about a unit of work.

#### Acceptance Criteria

1. WHEN the User creates a Task, THE TaskService SHALL require a non-empty title of 1–200 characters and assign a UUID and a creation timestamp.
2. THE TaskService SHALL accept the following optional Task fields: description (plain text, max 5 000 characters), Priority (Low | Medium | High | Urgent, default Medium), Labels (array of user-defined strings, max 10 per Task), due date (ISO 8601 date), estimated hours (positive number, max 999), Checklist items (ordered array, max 50 items per Task), and Comments (array).
3. WHEN a Task is saved, THE TaskService SHALL record a "Task Created" Activity entry containing the Task ID, title, Column ID, and timestamp.
4. WHEN a Task field is updated, THE TaskService SHALL record a "Task Edited" Activity entry specifying which field changed, the previous value, and the new value.
5. THE Task form SHALL validate all fields using Zod schemas and display inline error messages for constraint violations before submission.
6. WHEN the User opens a Task, THE Application SHALL display a modal with all Task fields, the Checklist, Comments, and Activity history in a single scrollable view.

---

### Requirement 6: Task Checklist and Subtasks

**User Story:** As a User, I want to add a checklist of subtasks to a Task, so that I can track granular steps within a single Task.

#### Acceptance Criteria

1. THE Application SHALL allow the User to add, edit, reorder, and delete Checklist items within a Task.
2. WHEN the User marks a Checklist item as complete, THE TaskService SHALL update the item's completion state and persist the change.
3. THE Task card on the Board SHALL display a progress indicator showing completed Checklist items out of total (e.g., "3 / 5").
4. WHEN all Checklist items are marked complete, THE Application SHALL visually highlight the progress indicator to signal full completion.
5. THE Application SHALL support a maximum of 50 Checklist items per Task.

---

### Requirement 7: Task Comments

**User Story:** As a User, I want to add comments to a Task, so that I can record notes and decisions related to that Task.

#### Acceptance Criteria

1. WHEN the User submits a Comment, THE TaskService SHALL attach the Comment to the Task with a UUID, text content (1–1 000 characters), and a creation timestamp.
2. THE Application SHALL display Comments in chronological order within the Task modal.
3. WHEN the User deletes a Comment, THE TaskService SHALL remove it from the Task and persist the change.
4. THE Application SHALL display the total number of Comments on the Task card on the Board.

---

### Requirement 8: Drag-and-Drop Task Management

**User Story:** As a User, I want to drag Tasks within and between Columns, so that I can quickly update their status and priority ordering.

#### Acceptance Criteria

1. THE Application SHALL implement Drag-and-Drop using @hello-pangea/dnd for all Task reordering and column-transfer interactions.
2. WHEN the User drags a Task to a new position within the same Column, THE TaskService SHALL update and persist the Task order within that Column.
3. WHEN the User drags a Task to a different Column, THE TaskService SHALL update the Task's Column assignment, record a "Task Moved" Activity entry (including source Column, destination Column, and timestamp), and persist the change.
4. WHILE a Task is being dragged, THE Application SHALL display a visual placeholder in the drop target position.
5. WHEN a drop event completes, THE Application SHALL animate the Task card into its new position using Framer Motion with a duration of no more than 300 ms.
6. THE Application SHALL support keyboard-accessible Drag-and-Drop in accordance with @hello-pangea/dnd's built-in keyboard interaction model.

---

### Requirement 9: Task Completion

**User Story:** As a User, I want to mark Tasks as complete, so that I can track finished work and see it reflected in my productivity metrics.

#### Acceptance Criteria

1. WHEN the User marks a Task as complete (by moving it to the "Done" Column or toggling a completion control), THE TaskService SHALL set a `completedAt` timestamp on the Task and record a "Task Completed" Activity entry.
2. WHEN a completed Task is moved back to a non-Done Column, THE TaskService SHALL clear the `completedAt` timestamp and record a "Task Reopened" Activity entry.
3. THE Dashboard SHALL count completed Tasks in its statistics using the `completedAt` field.
4. THE Analytics Page SHALL include completed Tasks in all relevant metrics.

---

### Requirement 10: Task Deletion

**User Story:** As a User, I want to delete Tasks I no longer need, so that my boards stay clean and relevant.

#### Acceptance Criteria

1. WHEN the User initiates Task deletion, THE Application SHALL display a confirmation dialog before removing the Task.
2. WHEN a Task is confirmed for deletion, THE TaskService SHALL remove the Task from its Column, record a "Task Deleted" Activity entry, and persist the change.
3. THE Application SHALL remove the Task card from the Board view immediately upon confirmed deletion using an exit animation.

---

### Requirement 11: Dashboard Statistics

**User Story:** As a User, I want a Dashboard home screen with animated stat cards, so that I can immediately understand my productivity status.

#### Acceptance Criteria

1. THE Dashboard SHALL display the following eight stat cards: Total Tasks, Completed Tasks, In Progress Tasks, Overdue Tasks, High Priority Tasks, Weekly Completion Percentage, Productivity Score, and Recent Activity.
2. WHEN the Dashboard loads, THE Application SHALL animate each stat card sequentially using Framer Motion with a stagger delay of no more than 100 ms per card.
3. THE Application SHALL calculate Overdue Tasks as Tasks with a due date earlier than the current date and a `completedAt` value of null.
4. THE Application SHALL calculate Weekly Completion Percentage as the ratio of Tasks completed in the past 7 days to total Tasks active in the past 7 days, expressed as a percentage rounded to one decimal place.
5. THE Application SHALL calculate Productivity Score as a value between 0 and 100 derived from completion rate, overdue ratio, and high-priority completion rate.
6. THE Dashboard SHALL display a Recent Activity feed showing the 10 most recent Activity entries across all Workspaces, sorted by timestamp descending.
7. WHEN statistics change due to Task or Board updates, THE Dashboard SHALL re-render the affected stat cards within one render cycle without a full page reload.

---

### Requirement 12: Analytics Page

**User Story:** As a User, I want a dedicated Analytics page with visual charts, so that I can understand patterns in my productivity over time.

#### Acceptance Criteria

1. THE Analytics Page SHALL display the following six visualisations: Task Distribution by Column, Priority Distribution, Completion Rate over time, Weekly Productivity trend, Most Active Workspace, and Estimated Hours vs Completed Hours.
2. THE Application SHALL render all visualisations using pure React, Tailwind CSS, and SVG/CSS-based progress indicators — without importing an external charting library.
3. THE Analytics Page SHALL allow the User to filter visualisation data by Workspace using a dropdown selector.
4. WHEN no Tasks exist, THE Analytics Page SHALL display an empty-state illustration with a prompt to create the first Task.
5. THE Analytics Page SHALL update all visualisations in real time as Tasks are created, updated, or deleted.

---

### Requirement 13: Activity Timeline

**User Story:** As a User, I want a complete Activity timeline, so that I can audit what has happened across all my Tasks and Boards.

#### Acceptance Criteria

1. THE Application SHALL record an immutable Activity entry for each of the following events: Task Created, Task Edited, Task Moved, Task Completed, Task Reopened, Task Deleted, Board Created, Board Renamed, Board Deleted, Column Created, Column Renamed, Column Deleted.
2. THE Activity Timeline view SHALL display all Activity entries in reverse-chronological order (newest first).
3. THE Activity Timeline view SHALL display for each entry: event type, affected entity name, Workspace and Board context, and human-readable relative timestamp (e.g., "2 hours ago").
4. THE Application SHALL persist all Activity entries to the StorageService without a maximum retention limit.
5. THE Dashboard's Recent Activity feed SHALL display the 10 most recent Activity entries.

---

### Requirement 14: Search

**User Story:** As a User, I want to instantly search Tasks by title across all Boards and Workspaces, so that I can find any Task quickly.

#### Acceptance Criteria

1. THE Application SHALL provide a global search input accessible from the top navigation bar on all pages.
2. WHEN the User types in the search input, THE Application SHALL filter and display matching Tasks within 50 ms of each keystroke (debounced at 150 ms).
3. THE Application SHALL match Tasks whose titles contain the search query as a case-insensitive substring.
4. THE Search results view SHALL display each matching Task with its title, Workspace name, Board name, Column name, and Priority.
5. WHEN the User selects a search result, THE Application SHALL navigate to the relevant Board and open the Task modal.
6. WHEN the search input is cleared, THE Application SHALL dismiss the search results and restore the previous view.

---

### Requirement 15: Filtering and Sorting

**User Story:** As a User, I want to filter and sort Tasks on a Board, so that I can focus on the most relevant Tasks.

#### Acceptance Criteria

1. THE Board view SHALL provide filter controls for: Priority (multi-select: Low, Medium, High, Urgent), Labels (multi-select), and Due Date (Today, This Week, Overdue, No Due Date).
2. WHEN the User applies one or more filters, THE Application SHALL display only Tasks matching all active filter conditions in all Columns simultaneously.
3. THE Board view SHALL provide sort controls for: Priority (Urgent → Low), Due Date (earliest first), Newest (creation date descending), Oldest (creation date ascending), and Alphabetical (A–Z).
4. WHEN the User applies a sort, THE Application SHALL reorder Tasks within each Column according to the selected sort criterion.
5. WHEN filters or sorts are active, THE Application SHALL display a visible indicator and a "Clear Filters" control.
6. THE Application SHALL persist active filter and sort selections per Board across sessions.

---

### Requirement 16: Smart Productivity Assistant

**User Story:** As a User, I want rule-based productivity suggestions surfaced inline, so that I can proactively manage overdue tasks, high-effort items, and deadline pressure without needing an AI service.

#### Acceptance Criteria

1. THE Productivity Assistant SHALL operate entirely client-side using deterministic rule evaluation — no external API calls, no LLM, no ML model.
2. WHEN a Task's due date is within 24 hours and the Task is not complete, THE Productivity Assistant SHALL surface a "Deadline approaching" warning on the Task card and in the Assistant panel.
3. WHEN a Task's due date has passed and the Task is not complete, THE Productivity Assistant SHALL surface an "Overdue" alert on the Task card and in the Assistant panel.
4. WHEN a Task has an estimated hours value greater than 8 and has no Checklist items, THE Productivity Assistant SHALL suggest splitting the Task into smaller subtasks.
5. WHEN a Task with Priority Urgent has remained in the same Column for more than 3 days without modification, THE Productivity Assistant SHALL surface a "Stalled high-priority task" warning.
6. THE Productivity Assistant SHALL compute a daily Productivity Score (0–100) and display it on the Dashboard and in the Assistant panel.
7. THE Productivity Assistant panel SHALL display a maximum of 10 active suggestions, sorted by severity (Overdue > Deadline approaching > Stalled > Split suggestion).
8. WHEN no suggestions are active, THE Productivity Assistant panel SHALL display a positive feedback message.

---

### Requirement 17: Theme Management

**User Story:** As a User, I want to switch between Light, Dark, and System themes, so that the Application matches my environment and preference.

#### Acceptance Criteria

1. THE Application SHALL support three theme modes: Light, Dark, and System.
2. WHEN the User selects Light or Dark, THE Application SHALL apply the corresponding Tailwind CSS class to the root `<html>` element and persist the selection to the StorageService.
3. WHEN the User selects System, THE Application SHALL apply the theme that matches the OS-level `prefers-color-scheme` media query and update it automatically if the OS preference changes.
4. THE Application SHALL restore the persisted theme preference on every page load before the first paint to prevent a flash of incorrect theme.
5. WHEN the theme changes, THE Application SHALL transition all affected elements using a CSS transition of no more than 200 ms.

---

### Requirement 18: Responsive Layout

**User Story:** As a User, I want the Application to be usable on Desktop, Tablet, and Mobile screen sizes, so that I can manage tasks from any device.

#### Acceptance Criteria

1. THE Application SHALL render correctly and be fully functional at viewport widths of 320 px (Mobile), 768 px (Tablet), and 1 280 px+ (Desktop).
2. WHILE the viewport width is below 768 px, THE Application SHALL replace the persistent sidebar with a slide-in navigation drawer toggled by a hamburger button.
3. WHILE the viewport width is below 1 024 px, THE Board view SHALL display Columns in a horizontally scrollable single row.
4. THE Application SHALL use Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`) exclusively for all responsive layout rules — no custom media query overrides in CSS files.
5. THE Application SHALL not require horizontal scrolling on the Dashboard or Analytics pages at any supported viewport width.

---

### Requirement 19: Accessibility

**User Story:** As a User using keyboard navigation or assistive technologies, I want the Application to be accessible, so that I can use it without a mouse.

#### Acceptance Criteria

1. THE Application SHALL assign descriptive `aria-label` attributes to all interactive elements that lack visible text labels (icon buttons, close buttons, drag handles).
2. THE Application SHALL manage focus correctly when modals open (focus moves to the first interactive element) and close (focus returns to the triggering element).
3. THE Application SHALL render all modals using a `role="dialog"` with `aria-modal="true"` and a visible close mechanism.
4. THE Application SHALL ensure all text and interactive element colour combinations meet WCAG 2.1 Level AA contrast requirements (minimum 4.5:1 for normal text, 3:1 for large text and UI components).
5. THE Application SHALL provide visible focus indicators on all interactive elements that are not suppressed by `outline: none` without a replacement.
6. WHEN the User presses the Escape key while a modal is open, THE Application SHALL close the modal and return focus to the triggering element.

---

### Requirement 20: Performance Optimisation

**User Story:** As a User, I want the Application to feel fast and responsive even with many Tasks and Boards, so that the UI never blocks my workflow.

#### Acceptance Criteria

1. THE Application SHALL apply `React.memo` to all Task card, Column, and stat card components to prevent unnecessary re-renders.
2. THE Application SHALL use `useMemo` for all derived data computations (filtered task lists, analytics calculations, productivity score) that depend on store state.
3. THE Application SHALL use `useCallback` for all event handler props passed to memoised child components.
4. THE Application SHALL implement route-level code splitting using `React.lazy` and `Suspense` so that the Analytics and Activity Timeline pages are loaded on demand.
5. THE Application SHALL display skeleton loader components in place of stat cards and Task cards while data is being read from the StorageService during the initial hydration phase.
6. WHEN a Board contains more than 100 Tasks in a single Column, THE Application SHALL virtualise the Task list to maintain a frame rate of 60 fps during scroll.

---

### Requirement 21: Animations and Visual Design

**User Story:** As a User, I want the Application to feel polished and premium, so that using it is a pleasant and focused experience.

#### Acceptance Criteria

1. THE Application SHALL animate page transitions using Framer Motion `AnimatePresence` with a fade-and-slide duration of no more than 300 ms.
2. THE Application SHALL animate Task card mount and unmount using Framer Motion with a vertical slide and fade.
3. THE Application SHALL animate stat card entry on the Dashboard using Framer Motion with a stagger of 80 ms per card.
4. THE Application SHALL apply hover animations to all interactive cards and buttons using Framer Motion or Tailwind CSS `transition` utilities.
5. THE Application SHALL use a design language consistent with premium SaaS products (Linear, Notion, Vercel Dashboard): large spacing, rounded corners (`rounded-xl`, `rounded-2xl`), soft shadows, neutral colour palette, and modern sans-serif typography.
6. THE Application SHALL implement skeleton loaders using animated shimmer gradients for all content that loads asynchronously.

---

### Requirement 22: TypeScript Type Safety

**User Story:** As a developer, I want strict TypeScript types across the entire codebase, so that type errors are caught at compile time and the code is self-documenting.

#### Acceptance Criteria

1. THE Application SHALL define and export TypeScript interfaces for all domain entities: `Workspace`, `Board`, `Column`, `Task`, `ChecklistItem`, `Comment`, `Activity`, `AnalyticsData`, and `UserPreferences`.
2. THE Application SHALL compile with `"strict": true` in `tsconfig.json` with zero TypeScript errors.
3. THE Application SHALL not use the `any` type anywhere in the source code — all unknowns SHALL be typed using `unknown` with explicit type guards.
4. THE Application SHALL define Zod schemas for all user-input forms that are kept in sync with the corresponding TypeScript interfaces.
5. THE Zustand Stores SHALL be fully typed, including state shape, action signatures, and selector return types.

---

### Requirement 23: Project Scaffolding and Developer Experience

**User Story:** As a developer, I want the project to run immediately with standard commands and deploy to Vercel without configuration, so that onboarding and CI/CD are frictionless.

#### Acceptance Criteria

1. THE Application SHALL be scaffolded with Vite and the React TypeScript template, runnable with `npm install && npm run dev`.
2. THE Application SHALL build successfully with `npm run build` producing a `dist/` folder containing a deployable static site.
3. THE Application SHALL be deployable to Vercel without any additional configuration files beyond those generated by Vite.
4. THE Application's root directory SHALL contain a `README.md` with the following sections: Project Motivation, Features, Architecture Overview, Folder Structure, Tech Stack, Installation, Future Improvements, Deployment Instructions, and a Screenshots placeholder section.
5. THE Application SHALL include an `.eslintrc` or `eslint.config.js` configured for React and TypeScript, with zero lint errors in the production build.
