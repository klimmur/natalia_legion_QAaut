# Test Plan: Program List Filtering and Display

**Feature:** Program list filtering and display
**Module:** Programs Management — Programs page
**Reference Programs:** "Web Development 2026", "Data Science 2026", "Informatique & IA - Niveau 2", "Test Program"

---

## 1. Positive Flows

### TC-001 — Programs page renders a list with each program's name and description
- **Preconditions:**
  - User is logged in with permission to view programs.
  - At least three programs exist: "Web Development 2026" (Description: "Front-end and back-end fundamentals."), "Data Science 2026" (Description: "Statistics, ML, and data engineering."), "Informatique & IA - Niveau 2" (Description: "Cours d'introduction à l'IA.").
- **Steps:**
  1. Navigate to the Programs page (e.g., via the main navigation).
- **Expected result:**
  - The Programs page loads without errors.
  - Each program is rendered as a row/card showing at least:
    - **Name** (e.g., "Web Development 2026")
    - **Description** (e.g., "Front-end and back-end fundamentals.")
  - The values displayed match what is stored for each program (no truncation that hides essential info, no placeholder text).
  - The number of rendered items equals the total number of programs in the dataset (within the current page if pagination applies).
- **Priority:** High

### TC-002 — Empty state appears when no programs exist
- **Preconditions:** No programs exist in the system (clean database).
- **Steps:**
  1. Navigate to the Programs page.
- **Expected result:**
  - A clearly visible empty-state message indicates no programs have been created (e.g., "No programs yet").
  - A prompt to create the first program is shown — typically a primary call-to-action button (e.g., "Create program" / "Create your first program").
  - No empty list rows, skeleton placeholders, or "0 results" search-style messages remain on screen.
- **Priority:** High

### TC-003 — Empty-state CTA opens the program creation flow
- **Preconditions:** Same as TC-002.
- **Steps:**
  1. On the empty Programs page, click the **Create program** CTA.
- **Expected result:** The Program creation form opens (modal or new route, per design). The user can complete and submit it. After successful creation, the empty state is replaced by a list containing the new program.
- **Priority:** High

### TC-004 — Newly created program appears in the list immediately
- **Preconditions:** User is on the Programs page; permission to create programs.
- **Steps:**
  1. Create a new program "QA Automation 2026" with Description "End-to-end testing with Playwright.".
  2. Submit the form.
- **Expected result:** The Programs list re-renders to include "QA Automation 2026" with its description, without requiring a manual page refresh. The empty state (if previously visible) is gone.
- **Priority:** High

### TC-005 — Program data persists across reloads and sessions
- **Preconditions:** Programs from TC-001 exist.
- **Steps:**
  1. Navigate to the Programs page.
  2. Refresh the browser (F5).
  3. Log out and log back in.
- **Expected result:** The list shows the same programs with the same names and descriptions in each step. No data loss or order change beyond the documented sort rule.
- **Priority:** High

### TC-006 — List ordering follows the documented default sort
- **Preconditions:** Multiple programs exist with varied creation dates and names.
- **Steps:**
  1. Navigate to the Programs page.
  2. Note the order of programs.
- **Expected result:** Programs are ordered consistently with the documented default (e.g., most recently created first, or alphabetical by name). Order is stable across reloads when underlying data is unchanged.
- **Priority:** Medium

### TC-007 — Long descriptions are displayed without breaking layout
- **Preconditions:** A program "Comprehensive Web Bootcamp" has a Description of ~500 characters of normal prose.
- **Steps:**
  1. Navigate to the Programs page.
- **Expected result:** The description is shown either in full (with wrapping) or truncated with a clear affordance to view the full text (ellipsis + tooltip, "show more" link, or detail page). The row layout remains aligned; no overflow into adjacent rows.
- **Priority:** Medium

### TC-008 — Programs with special characters and Unicode render correctly
- **Preconditions:** Programs exist with names "Informatique & IA - Niveau 2" and "Программа 2026 — Веб 🚀". Their descriptions include ampersands, accented characters, and emoji.
- **Steps:** Navigate to the Programs page.
- **Expected result:** Names and descriptions are rendered exactly as stored, with no HTML entity escaping artifacts (no literal `&amp;`), no mojibake, and proper RTL/LTR direction where applicable.
- **Priority:** High

---

## 2. Negative Flows

### TC-101 — User without view permission cannot see the program list
- **Preconditions:** User is logged in with a role that lacks programs:read permission.
- **Steps:** Navigate to the Programs page (or attempt to).
- **Expected result:** Either the navigation entry is hidden, or the page returns a clear access-denied message (403). No program names/descriptions are leaked to this user via the UI or via the underlying API call.
- **Priority:** High

### TC-102 — Unauthenticated request to the programs endpoint is rejected
- **Preconditions:** No active session (logged out / no cookie / no token).
- **Steps:**
  1. Send a GET request directly to the programs list endpoint without authentication.
- **Expected result:** Server responds 401. No program data returned. The Programs page in the browser redirects to login.
- **Priority:** High

### TC-103 — Server error during list fetch shows a user-facing error, not a crash
- **Preconditions:** Backend is forced to return 500 for the programs list endpoint.
- **Steps:** Navigate to the Programs page.
- **Expected result:** A user-friendly error state is shown (e.g., "We couldn't load programs. Try again."). A retry control is visible. The empty-state (which implies "no programs exist") is **not** shown — the error must be distinguishable from "no data".
- **Priority:** High

### TC-104 — Network failure shows an error state, not the empty state
- **Preconditions:** DevTools network is set to Offline.
- **Steps:** Navigate to (or refresh) the Programs page.
- **Expected result:** Offline/network error state is shown with a retry option. The "no programs yet" empty state is not shown. Once the network is restored and the user retries, the list loads normally.
- **Priority:** High

### TC-105 — Slow API response does not show the empty state prematurely
- **Preconditions:** Programs exist; backend is throttled to a 5-second response.
- **Steps:** Navigate to the Programs page.
- **Expected result:** A loading indicator (spinner / skeleton rows) is shown until data arrives. The empty state is **not** rendered while loading. After data arrives, the actual list appears.
- **Priority:** High

### TC-106 — Empty state's CTA respects create-program permissions
- **Preconditions:** No programs exist; user lacks programs:create permission.
- **Steps:** Navigate to the Programs page.
- **Expected result:** The empty-state message is shown, but the "Create program" CTA is hidden or disabled. The copy guides the user appropriately (e.g., "No programs yet. Contact an administrator to create one."). Direct attempts to call the create endpoint return 403.
- **Priority:** Medium

### TC-107 — Deleted programs are not displayed in the list
- **Preconditions:** A program "Test Program" was deleted.
- **Steps:** Navigate to the Programs page.
- **Expected result:** "Test Program" does not appear in the list. (Soft-deleted/archived items follow the documented rule — see Ambiguities.)
- **Priority:** High

### TC-108 — XSS payload in name or description does not execute on the list page
- **Preconditions:** A program exists with Name `<script>alert('xss')</script>` and Description `<img src=x onerror=alert(1)>`.
- **Steps:** Navigate to the Programs page.
- **Expected result:** No script executes. The values render as plain, escaped text. No console errors related to unsafe HTML rendering.
- **Priority:** High

### TC-109 — Malformed/partial program data does not crash the page
- **Preconditions:** API returns a list where one record is missing the description (e.g., `description: null`) and another has an unexpected extra field.
- **Steps:** Navigate to the Programs page.
- **Expected result:** All well-formed rows are rendered. The record with a missing description shows a documented fallback (empty string, "—", or "No description" — must be consistent and intentional). Extra/unknown fields are ignored. No row breaks the entire list rendering.
- **Priority:** Medium

### TC-110 — Direct URL deep link to the Programs page enforces auth and permissions
- **Steps:**
  1. While logged out, paste the Programs page URL into the address bar.
  2. While logged in as a non-permitted role, do the same.
- **Expected result:** Logged out → redirected to login, then to the Programs page after success (or to an explicit landing). Non-permitted role → access-denied or redirect, never a list of programs.
- **Priority:** Medium

### TC-111 — User cannot manipulate the URL to bypass the empty state
- **Preconditions:** No programs exist.
- **Steps:**
  1. Modify the Programs page URL to include a `?page=2` or `?ids=fake-id` style query.
- **Expected result:** Empty state remains correctly shown (or a clear "no programs" / "not found" state). No fabricated rows or stack traces.
- **Priority:** Low

---

## 3. Edge Cases

### TC-201 — Single-program list still renders correctly
- **Preconditions:** Exactly one program exists ("Web Development 2026").
- **Steps:** Navigate to the Programs page.
- **Expected result:** Single row/card is rendered with name and description. No empty state is shown. Layout (alignment, spacing, headers if any) is correct for a single item.
- **Priority:** Medium

### TC-202 — Large dataset renders within performance budget
- **Preconditions:** ≥ 1,000 programs exist (or the documented "large" threshold).
- **Steps:** Navigate to the Programs page.
- **Expected result:** Page is interactive within the documented performance target (e.g., < 2 s TTI). Pagination, infinite scroll, or virtualization is used per spec — the browser does not freeze, and memory does not balloon. No duplicated rows when scrolling/paginating.
- **Priority:** Medium

### TC-203 — Pagination boundaries display correctly
- **Preconditions:** Page size is N (e.g., 20). Total programs = N + 1.
- **Steps:**
  1. Navigate to the Programs page (page 1 of 2).
  2. Go to page 2.
  3. Go back to page 1.
- **Expected result:** Page 1 shows N items, page 2 shows the remaining 1, and there are no overlaps or missing items. Page indicators ("1 of 2") are accurate. Returning to page 1 shows the original N items in the same order.
- **Priority:** Medium

### TC-204 — Empty state copy and CTA labels match design
- **Preconditions:** No programs exist.
- **Steps:** Navigate to the Programs page.
- **Expected result:** Empty-state heading, body copy, and CTA label match the documented design content (e.g., heading "No programs yet", body "Programs help you organize cohorts.", CTA "Create program"). Strings come from the localization system, not hard-coded.
- **Priority:** Medium

### TC-205 — Empty state is localized
- **Preconditions:** No programs exist; user's app language is set to a supported locale (e.g., French).
- **Steps:** Navigate to the Programs page.
- **Expected result:** Empty-state message, prompt, and CTA appear in the selected language with no untranslated keys/placeholders. Layout adapts to text length without overflow.
- **Priority:** Medium

### TC-206 — Programs with empty/whitespace-only descriptions render a defined fallback
- **Preconditions:** A program "Beta Cohort" exists with Description = "" (empty); another exists with Description = "   " (whitespace only). (Assuming the data model permits this.)
- **Steps:** Navigate to the Programs page.
- **Expected result:** A consistent fallback ("No description", "—", or just an empty cell — must be documented) is shown for both. No raw whitespace artifacts. Layout remains aligned.
- **Priority:** Low

### TC-207 — Very long names are handled without breaking layout
- **Preconditions:** A program with a name at the documented maximum length exists.
- **Steps:** Navigate to the Programs page.
- **Expected result:** Name wraps or truncates with ellipsis + tooltip per design. Adjacent columns/rows are unaffected. Full name is reachable via tooltip or detail view.
- **Priority:** Medium

### TC-208 — Multiline descriptions are displayed reasonably
- **Preconditions:** A program description contains explicit newlines: "Line one.\nLine two.\nLine three.".
- **Steps:** Navigate to the Programs page.
- **Expected result:** Either newlines are preserved (when the design allows multiline cells) or normalized to single spaces consistently. No raw `\n` characters; no unexpected paragraph breaks that misalign rows.
- **Priority:** Low

### TC-209 — Sorting (if implemented) reorders correctly
- **Preconditions:** Sorting is part of the feature (e.g., column headers clickable).
- **Steps:**
  1. Click the **Name** column header.
  2. Click again to reverse direction.
- **Expected result:** List sorts ascending then descending by name; sort indicator (arrow) reflects the current direction; a stable secondary sort (e.g., by id) prevents row reshuffling among ties.
- **Priority:** Medium

### TC-210 — Filtering (if implemented) returns only matching programs
- **Preconditions:** Filter UI exists (e.g., status filter, category filter); programs cover multiple categories.
- **Steps:**
  1. Apply a filter (e.g., Category = "Software").
  2. Clear the filter.
- **Expected result:** Only matching programs are shown when the filter is applied. The result count reflects the filter. Clearing returns the full list. URL reflects the active filter (or matches documented behavior) so the state is shareable/bookmarkable.
- **Priority:** Medium

### TC-211 — Search (if implemented) matches expected substrings
- **Preconditions:** Programs include "Web Development 2026", "Data Science 2026".
- **Steps:**
  1. Type "Web" in the search field.
  2. Clear the input.
- **Expected result:** With "Web" entered, only "Web Development 2026" appears. Clearing restores all programs. Search results visually distinguish the "no matches" state from the "no programs exist" empty state.
- **Priority:** Medium

### TC-212 — Search "no matches" state is distinct from the global empty state
- **Preconditions:** Programs exist.
- **Steps:** Type a query that matches nothing (e.g., "zzzzz").
- **Expected result:** A "No programs match 'zzzzz'" (or equivalent) message is shown — not the "no programs yet — create one" empty state. A "Clear search" affordance is offered.
- **Priority:** High

### TC-213 — Recently deleted program disappears from the list immediately
- **Preconditions:** "Test Program" exists; user has the Programs page open.
- **Steps:** Delete "Test Program" via its row's delete action.
- **Expected result:** The list updates immediately to remove that row (no manual refresh needed). Total count decreases by 1. If "Test Program" was the only program, the empty state appears.
- **Priority:** High

### TC-214 — Recently edited program reflects updates in the list immediately
- **Preconditions:** "Web Development 2026" exists; user has the Programs page open.
- **Steps:** Edit "Web Development 2026" — change Name to "Web Development 2026 - Updated" and update Description.
- **Expected result:** The same row updates in place to show the new name and description without a manual refresh. Order/position follows the documented sort rule (no flicker that loses scroll position unnecessarily).
- **Priority:** High

### TC-215 — Programs list is accessible
- **Preconditions:** At least three programs exist.
- **Steps:**
  1. Navigate the page using only the keyboard.
  2. Inspect with a screen reader.
- **Expected result:**
  - Each row/card is reachable in a logical tab order.
  - Roles and labels (e.g., `role="list"` / `role="listitem"`, or proper table semantics) are correct.
  - Names and descriptions are programmatically associated with their containing row.
  - The empty state announces meaningfully on screen readers (heading + CTA reachable by tab).
- **Priority:** Medium

### TC-216 — Responsive layout adapts to small viewports
- **Steps:**
  1. Open the Programs page at 1280×800.
  2. Resize the viewport to 375×667 (mobile).
- **Expected result:** Layout adapts (rows reflow into cards, controls collapse into menus). Names/descriptions remain readable; no horizontal scroll required to see name and description.
- **Priority:** Medium

### TC-217 — Multiple sessions stay reasonably consistent
- **Preconditions:** User opens the Programs page in two tabs (A and B).
- **Steps:** In tab A, create a new program.
- **Expected result:** In tab B, the new program appears either in real time (if live updates are documented) or after the user refreshes/returns to the tab. No stale "no programs yet" empty state if data exists.
- **Priority:** Low

---

## Summary Coverage Matrix

| Acceptance Criterion | Covered by |
|---|---|
| Display program list with name and description | TC-001, TC-005, TC-007, TC-008, TC-201, TC-202, TC-207, TC-208, TC-214 |
| Empty state when no programs exist (message + create prompt) | TC-002, TC-003, TC-106, TC-204, TC-205 |
| Implicit: permissions, errors, loading, security, search/filter, accessibility | TC-101–TC-111, TC-203, TC-206, TC-209–TC-217 |

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **"Key details" is undefined.** The first AC mentions only name and description. Are other fields expected (status, dates, owner, category, enrollment count)? Layout-level tests (TC-001, TC-008) assume only the two named fields.
2. **Default sort order is not specified** (TC-006). Most-recent-first vs. alphabetical?
3. **Pagination strategy is not specified.** Page size, infinite scroll, or virtualization (TC-202, TC-203)?
4. **Search/filter/sort are not in the ACs at all.** Are they part of the feature ("filtering and display")? TC-209–TC-212 assume their presence based on the feature title; this needs explicit confirmation.
5. **Loading state is not specified** (TC-105). Skeleton vs. spinner; minimum visible duration; behavior on slow networks.
6. **Error vs. empty distinction is not specified** (TC-103, TC-104). The empty state and the error state must look and read differently — this should be a requirement, not an implementation detail.
7. **Description truncation rules are not specified** (TC-007, TC-208). Wrap, ellipsis with tooltip, or "show more"? Multiline preservation?
8. **Permissions model is not specified** (TC-101, TC-106, TC-110). Who can view? Who can create? CTA visibility rules.
9. **Soft-delete/archived program visibility is not specified** (TC-107). Are archived programs shown by default, hidden, or behind a toggle?
10. **Real-time updates between sessions are not specified** (TC-217). Push updates, polling, or refresh-on-focus?
11. **Empty/null description handling is not specified** (TC-206, TC-109). Required field at create time? Display fallback string?
12. **Empty-state CTA wording and behavior are not specified** (TC-003, TC-204). Exact label, route, modal vs. page.
13. **Localization scope is not specified** (TC-205). Are user-entered names/descriptions localizable, or only system strings?
14. **Accessibility requirements are not specified** (TC-215). Semantic markup, focus order, screen reader expectations for both list and empty state.
15. **Performance budget is not specified** (TC-202). What is "acceptable" for large datasets?
16. **Responsive breakpoints are not specified** (TC-216). Which viewport widths must be supported?
17. **URL/state behavior for filters/search is not specified** (TC-210, TC-211). Is the filter state in the URL, in local storage, or ephemeral?
