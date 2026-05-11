# Test Plan — TodoMVC (React)

**Application Under Test:** https://demo.playwright.dev/todomvc/#/
**Author:** QA Engineering
**Scope:** Functional coverage of core todo-list features (create list, add item, complete item, delete item) plus negative and edge-case scenarios.

---

## Feature Overview (as observed in the AUT)

| Element | Description |
|---|---|
| `New Todo` input | Header input with placeholder *"What needs to be done?"*. Submits on `Enter`. |
| Todo item label | Text of a todo. Double-click to edit. |
| Todo checkbox | Round toggle on the left of each item. Marks item complete/active. |
| Destroy button (`×`) | Appears on hover. Removes the item. |
| Toggle-all (`❯`) | Arrow above the list. Marks all items complete/active. |
| Items-left counter | Footer text *"N items left"* (singular *"1 item left"*). |
| Filters | `All`, `Active`, `Completed` links in the footer. |
| `Clear completed` button | Footer button. Visible only when ≥ 1 item is completed. |
| Footer & toggle-all | Hidden when the list is empty. |

---

## 1. Positive Flows

### TC-001 — Empty list is rendered on first visit
- **Preconditions:** Local storage cleared; browser opened to base URL.
- **Steps:**
  1. Navigate to `https://demo.playwright.dev/todomvc/#/`.
- **Expected result:**
  - Page title is `React • TodoMVC`.
  - Heading `todos` is visible.
  - Input field with placeholder `What needs to be done?` is focused and empty.
  - Footer (counter, filters, `Clear completed`) and toggle-all arrow are NOT visible.
- **Priority:** High

### TC-002 — A single todo is created
- **Preconditions:** Empty list.
- **Steps:**
  1. Click the `What needs to be done?` input.
  2. Type `Buy milk`.
  3. Press `Enter`.
- **Expected result:**
  - List contains exactly one item with label `Buy milk`.
  - The item's checkbox is unchecked.
  - Input field is cleared and remains focused.
  - Footer becomes visible and shows `1 item left`.
  - Toggle-all arrow becomes visible.
- **Priority:** High

### TC-003 — Four todos are added sequentially (AC #1 + AC #2)
- **Preconditions:** Empty list.
- **Steps:**
  1. Type `Buy milk` + `Enter`.
  2. Type `Walk the dog` + `Enter`.
  3. Type `Pay bills` + `Enter`.
  4. Type `Read book` + `Enter`.
- **Expected result:**
  - List contains 4 items in insertion order: `Buy milk`, `Walk the dog`, `Pay bills`, `Read book`.
  - Counter shows `4 items left`.
  - All checkboxes are unchecked.
- **Priority:** High

### TC-004 — A todo is marked as completed (AC #3)
- **Preconditions:** List contains 4 items from TC-003.
- **Steps:**
  1. Click the checkbox of `Walk the dog`.
- **Expected result:**
  - `Walk the dog` checkbox becomes checked.
  - `Walk the dog` label gets the `completed` style (strike-through, dimmed).
  - Counter changes to `3 items left`.
  - `Clear completed` button is visible in the footer.
  - Other 3 items remain unchanged.
- **Priority:** High

### TC-005 — A completed todo can be re-opened (un-completed)
- **Preconditions:** `Walk the dog` is completed (TC-004).
- **Steps:**
  1. Click the checkbox of `Walk the dog` again.
- **Expected result:**
  - Checkbox becomes unchecked, strike-through removed.
  - Counter changes back to `4 items left`.
  - `Clear completed` button is hidden again.
- **Priority:** Medium

### TC-006 — A todo is removed via the destroy (×) button (AC #4)
- **Preconditions:** List contains 4 items from TC-003.
- **Steps:**
  1. Hover over `Pay bills`.
  2. Click the `×` button that appears on the right side.
- **Expected result:**
  - `Pay bills` is removed from the DOM/list.
  - List length is 3; order is `Buy milk`, `Walk the dog`, `Read book`.
  - Counter shows `3 items left`.
- **Priority:** High

### TC-007 — `Clear completed` removes only completed items
- **Preconditions:** 4 items exist; `Buy milk` and `Pay bills` are completed.
- **Steps:**
  1. Click `Clear completed`.
- **Expected result:**
  - `Buy milk` and `Pay bills` are removed.
  - `Walk the dog` and `Read book` remain in the list, in original relative order.
  - Counter shows `2 items left`.
  - `Clear completed` button is hidden.
- **Priority:** High

### TC-008 — Toggle-all marks every item complete, then active
- **Preconditions:** 4 active items.
- **Steps:**
  1. Click the toggle-all `❯` arrow.
  2. Observe the list.
  3. Click toggle-all again.
- **Expected result:**
  - After step 1: all 4 checkboxes are checked, counter shows `0 items left`, `Clear completed` is visible.
  - After step 3: all 4 checkboxes are unchecked, counter shows `4 items left`, `Clear completed` is hidden.
- **Priority:** Medium

### TC-009 — Filter `Active` shows only uncompleted items
- **Preconditions:** 4 items, `Walk the dog` and `Read book` are completed.
- **Steps:**
  1. Click filter `Active`.
- **Expected result:**
  - Only `Buy milk` and `Pay bills` are visible.
  - URL hash becomes `#/active`.
  - `Active` link is highlighted as selected.
  - Counter still shows `2 items left`.
- **Priority:** Medium

### TC-010 — Filter `Completed` shows only completed items
- **Preconditions:** Same as TC-009.
- **Steps:**
  1. Click filter `Completed`.
- **Expected result:**
  - Only `Walk the dog` and `Read book` are visible.
  - URL hash becomes `#/completed`.
  - `Completed` link is highlighted.
- **Priority:** Medium

### TC-011 — Filter `All` restores full list
- **Preconditions:** A filter (e.g. `Active`) is active.
- **Steps:**
  1. Click filter `All`.
- **Expected result:**
  - All 4 items are visible in original order.
  - URL hash becomes `#/`.
- **Priority:** Medium

### TC-012 — A todo can be edited via double-click
- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click the label `Buy milk`.
  2. Replace text with `Buy almond milk`.
  3. Press `Enter`.
- **Expected result:**
  - Item is now displayed as `Buy almond milk`.
  - List length is unchanged.
  - Counter is unchanged.
- **Priority:** Medium

### TC-013 — Edited todo is saved when input loses focus (blur)
- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click `Buy milk`.
  2. Append ` (2L)` so text reads `Buy milk (2L)`.
  3. Click anywhere outside the edit input.
- **Expected result:**
  - Item label is `Buy milk (2L)`.
- **Priority:** Medium

### TC-014 — Todos persist after page reload (local storage)
- **Preconditions:** 4 items exist; `Buy milk` is completed.
- **Steps:**
  1. Refresh the page (`F5`).
- **Expected result:**
  - All 4 items are still present, in original order.
  - `Buy milk` is still completed; others are active.
  - Counter shows `3 items left`.
- **Priority:** High

---

## 2. Negative Flows

### TC-101 — Empty submission does NOT create a todo
- **Preconditions:** Empty list.
- **Steps:**
  1. Click the input.
  2. Press `Enter` without typing anything.
- **Expected result:**
  - No item is added to the list.
  - Footer remains hidden.
- **Priority:** High

### TC-102 — Whitespace-only submission does NOT create a todo
- **Preconditions:** Empty list.
- **Steps:**
  1. Type three spaces `"   "`.
  2. Press `Enter`.
- **Expected result:**
  - No item is added (list and footer remain empty/hidden).
  - **Observed behavior:** the input is NOT cleared (whitespace remains in the field). Documented as a finding — see *Ambiguities & Gaps* §13.
- **Priority:** High

### TC-103 — Editing a todo to empty string removes the item
- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click `Buy milk`.
  2. Clear all text.
  3. Press `Enter`.
- **Expected result:**
  - `Buy milk` is removed from the list (TodoMVC spec behavior).
  - Counter decreases by 1.
- **Priority:** Medium

### TC-104 — `Escape` during edit cancels changes
- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click `Buy milk`.
  2. Type ` extra`.
  3. Press `Escape` before pressing Enter.
- **Expected result:**
  - Item label is still `Buy milk` (changes discarded).
  - Edit mode exits.
- **Priority:** Low

### TC-105 — Removing the last completed item hides `Clear completed`
- **Preconditions:** Exactly 1 completed item exists.
- **Steps:**
  1. Click the destroy `×` of that item.
- **Expected result:**
  - Item is removed.
  - `Clear completed` button disappears immediately.
- **Priority:** Medium

### TC-106 — Removing the last item hides footer and toggle-all
- **Preconditions:** Exactly 1 todo exists.
- **Steps:**
  1. Delete it via `×`.
- **Expected result:**
  - List is empty.
  - Footer, filters, counter and toggle-all `❯` are all hidden.
- **Priority:** Medium

### TC-107 — Completed items are not shown on `Active` filter
- **Preconditions:** All items are completed.
- **Steps:**
  1. Click filter `Active`.
- **Expected result:**
  - Visible list is empty.
  - Counter shows `0 items left`.
  - Footer + filter links remain visible (because items still exist in storage).
- **Priority:** Medium

### TC-108 — Active items are not shown on `Completed` filter
- **Preconditions:** All items are active.
- **Steps:**
  1. Click filter `Completed`.
- **Expected result:**
  - Visible list is empty.
  - Counter still reflects active items count.
- **Priority:** Medium

### TC-109 — Clicking destroy on one item does not affect siblings
- **Preconditions:** 3 items: `A`, `B`, `C`.
- **Steps:**
  1. Delete `B`.
- **Expected result:**
  - `A` and `C` remain unchanged (text, order, state).
  - Counter is `2 items left`.
- **Priority:** High

### TC-110 — Counter pluralization (`1 item left` vs. `N items left`)
- **Preconditions:** Empty list.
- **Steps:**
  1. Add `Task 1` → observe counter.
  2. Add `Task 2` → observe counter.
  3. Complete `Task 1` → observe counter.
  4. Complete `Task 2` → observe counter.
- **Expected result:**
  - After step 1: `1 item left` (singular).
  - After step 2: `2 items left` (plural).
  - After step 3: `1 item left`.
  - After step 4: `0 items left`.
- **Priority:** Low

---

## 3. Edge Cases

### TC-201 — Leading/trailing whitespace is trimmed on creation
- **Preconditions:** Empty list.
- **Steps:**
  1. Type `"   Buy milk   "`.
  2. Press `Enter`.
- **Expected result:**
  - Item is stored & displayed as `Buy milk` (whitespace trimmed).
- **Priority:** Medium

### TC-202 — Very long todo (255 chars) is accepted and not truncated
- **Preconditions:** Empty list.
- **Steps:**
  1. Type a 255-character string (e.g., `A` repeated 255 times).
  2. Press `Enter`.
- **Expected result:**
  - Item is added.
  - Full 255-character text is stored (verify via DOM/local storage).
  - UI wraps text without breaking layout.
- **Priority:** Medium

### TC-203 — Extreme length (2 000 chars) is still accepted
- **Preconditions:** Empty list.
- **Steps:**
  1. Paste a 2 000-character string.
  2. Press `Enter`.
- **Expected result:**
  - Item is added; full text is preserved; layout does not collapse.
- **Priority:** Low

### TC-204 — Special characters & emoji are preserved
- **Preconditions:** Empty list.
- **Steps:**
  1. Add `<script>alert(1)</script>`.
  2. Add `"; DROP TABLE todos; --`.
  3. Add `Café — déjà vu ☕️🎉`.
- **Expected result:**
  - All three items are displayed as plain text (no script execution, no injection).
  - Characters render correctly (including unicode/emoji).
- **Priority:** High (security)

### TC-205 — Duplicate todos are allowed
- **Preconditions:** Empty list.
- **Steps:**
  1. Add `Buy milk`.
  2. Add `Buy milk` again.
- **Expected result:**
  - Two separate items with identical text exist.
  - Counter shows `2 items left`.
  - Each item can be completed/edited/deleted independently.
- **Priority:** Medium

### TC-206 — Single-character todo
- **Preconditions:** Empty list.
- **Steps:**
  1. Add `a`.
- **Expected result:**
  - Item with text `a` is created.
  - Counter shows `1 item left`.
- **Priority:** Low

### TC-207 — Large list (100 items) performs adequately
- **Preconditions:** Empty list.
- **Steps:**
  1. Programmatically (or via repeated typing) add 100 items.
  2. Toggle-all on, then off.
  3. Click `Clear completed` after toggling all on.
- **Expected result:**
  - All 100 items are added.
  - Toggle-all updates every checkbox.
  - `Clear completed` removes all 100 items at once.
  - UI remains responsive (< 2 s for each bulk action).
- **Priority:** Low

### TC-208 — Filter state survives page reload
- **Preconditions:** Mixed list (active + completed); filter `Active` selected (`#/active`).
- **Steps:**
  1. Refresh the page.
- **Expected result:**
  - URL hash is still `#/active`.
  - Only active items are visible.
- **Priority:** Medium

### TC-209 — Direct navigation to filter hash works
- **Preconditions:** Mixed list exists.
- **Steps:**
  1. Navigate directly to `https://demo.playwright.dev/todomvc/#/completed`.
- **Expected result:**
  - Only completed items are listed.
  - `Completed` filter is highlighted.
- **Priority:** Low

### TC-210 — Navigating to an unknown hash falls back to `All`
- **Preconditions:** Mixed list exists.
- **Steps:**
  1. Navigate to `https://demo.playwright.dev/todomvc/#/foobar`.
- **Expected result:**
  - All items are visible (graceful fallback) OR no filter is highlighted.
  - No JavaScript errors in console.
- **Priority:** Low

### TC-211 — Adding then immediately deleting the same item
- **Preconditions:** Empty list.
- **Steps:**
  1. Add `Temp`.
  2. Hover, click `×` within 1 s.
- **Expected result:**
  - Item is added then removed; list returns to empty state with footer hidden.
- **Priority:** Low

### TC-212 — Toggle-all with mixed state completes all (not toggles each)
- **Preconditions:** 3 items: 1 completed, 2 active.
- **Steps:**
  1. Click toggle-all.
- **Expected result:**
  - All 3 items become completed (per TodoMVC spec: if any item is active, toggle-all marks all complete).
- **Priority:** Medium

### TC-213 — Editing preserves completed state
- **Preconditions:** Item `Buy milk` is completed.
- **Steps:**
  1. Double-click and rename to `Buy oat milk`.
- **Expected result:**
  - Renamed item is still completed (checkbox checked, strike-through retained).
- **Priority:** Low

### TC-214 — Whitespace-only edit removes the item
- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click `Buy milk`.
  2. Replace all text with `"   "` (spaces only).
  3. Press `Enter`.
- **Expected result:**
  - Trimmed value is empty → item is removed (consistent with TC-103).
- **Priority:** Low

---

## Coverage Matrix

| Acceptance Criterion | Covering Test Cases |
|---|---|
| AC #1 — Create a todo list | TC-001, TC-002, TC-003 |
| AC #2 — Add 4 items | TC-003 |
| AC #3 — Finish item → expect finished | TC-004, TC-005, TC-008 |
| AC #4 — Remove item → expect removed | TC-006, TC-007, TC-105, TC-106, TC-109, TC-211 |

---

## Ambiguities & Gaps in the ACs

1. **"Create a todo list" is vague.** The app has no explicit "create list" action — opening the page implicitly provides a single list. Should the AC really say *"open the application and confirm an empty list state"*?
2. **"Add items (4)" — no content rules.** Length limits, allowed characters (unicode/emoji/HTML), trimming, and duplicates are not specified. Tests TC-201–TC-205 assume sensible defaults.
3. **"Finish item. Expect to be finished."** — No visual contract is defined (strike-through? checkbox? color?). Test TC-004 asserts both the checkbox state and the "completed" styling, but this should be confirmed with design.
4. **"Remove item from the list."** — No mention of the destroy `×` button, `Clear completed`, or whether edit-to-empty should also remove. Behavior assumed from TodoMVC spec.
5. **No persistence requirement.** Local-storage persistence (TC-014, TC-208) is a TodoMVC spec behavior — should be added to ACs explicitly.
6. **No filter behavior is mentioned.** `All / Active / Completed` filters (TC-009–TC-011, TC-208–TC-210) are core to TodoMVC but absent from the ACs.
7. **No `Toggle-all` behavior is mentioned.** TC-008 and TC-212 cover it; needs an AC.
8. **No edit behavior is mentioned.** Double-click-to-edit (TC-012, TC-013, TC-103, TC-104, TC-213, TC-214) is not in the ACs.
9. **No accessibility / keyboard navigation requirements.** Tab-order, ARIA labels, screen-reader announcements were not requested but should be discussed.
10. **No cross-browser / responsive requirements.** Should the test plan run on Chromium, Firefox, WebKit, and mobile viewports? Currently assumed all three desktop browsers via `playwright.config.ts`.
11. **No performance / scale criteria.** TC-207 uses 100 items as a soft target — needs a concrete SLA.
12. **No security requirements.** TC-204 covers XSS by assumption; explicit AC would be valuable.
13. **Input-clearing inconsistency (discovered during automation).** When the user submits a whitespace-only string, the app correctly rejects the todo BUT does not clear the input field — see TC-102. Empty submission (TC-101) does not have anything to clear. AC should specify whether the input must be cleared in both cases.
