# Test Plan: Edit Existing Program Details

**Feature:** Edit existing program details
**Module:** Programs Management
**Reference Program:** "Web Development 2026"

---

## 1. Positive Flows

### TC-001 — Edit form opens pre-populated with current program data
- **Preconditions:**
  - User is logged in with permission to edit programs.
  - Program "Web Development 2026" exists in the Programs list.
  - User is on the Programs page.
- **Steps:**
  1. Locate the row for "Web Development 2026".
  2. Click the edit (pencil) icon on that row.
- **Expected result:**
  - The Edit Program modal/form opens.
  - The Name field shows "Web Development 2026".
  - All other fields (Description, Start Date, End Date, Status, Category, etc.) are pre-populated with the program's current saved values.
  - No field is blank unless it was empty at save time.
- **Priority:** High

### TC-002 — Saving a changed Name updates the program list immediately
- **Preconditions:** Edit modal for "Web Development 2026" is open.
- **Steps:**
  1. Clear the Name field.
  2. Enter "Web Development 2026 - Updated".
  3. Click **Save**.
- **Expected result:**
  - The modal closes without error.
  - A success indication is shown (toast/notification, if applicable).
  - The Programs list re-renders and shows "Web Development 2026 - Updated" in the same row, without requiring a manual refresh.
  - The old name "Web Development 2026" no longer appears in the list.
- **Priority:** High

### TC-003 — Editing only the Description preserves all other fields
- **Preconditions:** Edit modal for an existing program is open with all current values loaded.
- **Steps:**
  1. Note the current values of Name, Start Date, End Date, Status, and any other visible fields.
  2. Change only the Description field to "Updated curriculum focused on modern frameworks.".
  3. Click **Save**.
  4. Re-open the same program for editing.
- **Expected result:**
  - The Description shows the new text.
  - Name, Start Date, End Date, Status, and all untouched fields remain identical to step 1.
- **Priority:** High

### TC-004 — Edits persist after page refresh
- **Preconditions:** Program "Web Development 2026" was just renamed to "Web Development 2026 - Updated" via TC-002.
- **Steps:**
  1. Refresh the Programs page (F5 / browser reload).
- **Expected result:** The list still shows "Web Development 2026 - Updated"; the change is persisted server-side.
- **Priority:** High

### TC-005 — Edits are visible to a second user/session
- **Preconditions:** Program was renamed in session A; session B is logged in as another user with view access.
- **Steps:**
  1. In session B, navigate to the Programs page (or refresh it).
- **Expected result:** Session B sees the updated name "Web Development 2026 - Updated".
- **Priority:** Medium

### TC-006 — Cancel discards changes
- **Preconditions:** Edit modal for "Web Development 2026" is open.
- **Steps:**
  1. Change the Name to "Discarded Name".
  2. Click **Cancel** (or close the modal via the X icon / Esc key).
- **Expected result:**
  - The modal closes.
  - The Programs list still shows "Web Development 2026" — unchanged.
- **Priority:** High

### TC-007 — Save button enables only after a valid change
- **Preconditions:** Edit modal opened with current data.
- **Steps:**
  1. Observe the Save button state with no edits.
  2. Type a single character into the Name field.
  3. Revert the field back to its original value.
- **Expected result:**
  - With no edits, Save is disabled (or saving is a no-op).
  - After a real change, Save becomes enabled.
  - After reverting to the original value, Save returns to its no-change state.
- **Priority:** Medium

---

## 2. Negative Flows

### TC-101 — Empty Name is rejected
- **Preconditions:** Edit modal for "Web Development 2026" is open.
- **Steps:**
  1. Clear the Name field.
  2. Click **Save**.
- **Expected result:**
  - Inline validation error: "Name is required" (or equivalent).
  - Modal stays open.
  - No request is sent / no change is persisted.
  - The Programs list still shows "Web Development 2026".
- **Priority:** High

### TC-102 — Whitespace-only Name is rejected
- **Preconditions:** Edit modal is open.
- **Steps:**
  1. Set Name to "   " (spaces only).
  2. Click **Save**.
- **Expected result:** Same validation error as TC-101; no save occurs.
- **Priority:** High

### TC-103 — Duplicate program name is rejected
- **Preconditions:** Two programs exist: "Web Development 2026" and "Data Science 2026".
- **Steps:**
  1. Open "Web Development 2026" for editing.
  2. Change the Name to "Data Science 2026".
  3. Click **Save**.
- **Expected result:**
  - Backend rejects with a clear error (e.g., "A program with this name already exists").
  - Modal remains open with the entered name still visible for correction.
  - List remains unchanged.
- **Priority:** High

### TC-104 — Name exceeding maximum length is rejected
- **Preconditions:** Edit modal is open. Assume max length = N (e.g., 100 chars).
- **Steps:**
  1. Paste a string of N+1 characters into Name.
  2. Click **Save**.
- **Expected result:** Validation error indicates max length; either input is truncated to N at entry time, or save is blocked with a message. No partial truncation is silently saved.
- **Priority:** Medium

### TC-105 — Invalid date range (End Date before Start Date) is rejected
- **Preconditions:** Edit modal is open.
- **Steps:**
  1. Set Start Date to 2026-09-01.
  2. Set End Date to 2026-08-01.
  3. Click **Save**.
- **Expected result:** Validation error: "End Date must be after Start Date." Save is blocked.
- **Priority:** High

### TC-106 — Server error during save preserves user input
- **Preconditions:** Edit modal is open; backend is configured/forced to return 500 on PUT.
- **Steps:**
  1. Change Name to "Web Development 2026 - Updated".
  2. Click **Save**.
- **Expected result:**
  - User-visible error message (e.g., "Could not save changes. Please try again.").
  - Modal stays open with the user's entered values intact.
  - The Programs list is unchanged.
- **Priority:** High

### TC-107 — Network loss during save is handled gracefully
- **Preconditions:** Edit modal is open. DevTools network is set to Offline.
- **Steps:**
  1. Change Description.
  2. Click **Save**.
- **Expected result:** Friendly error/retry message; modal does not close; no stale optimistic update is left in the list.
- **Priority:** Medium

### TC-108 — User without edit permission cannot edit
- **Preconditions:** User logged in with read-only role; program "Web Development 2026" exists.
- **Steps:**
  1. Open the Programs page.
- **Expected result:** Edit icon is hidden or disabled. If the edit endpoint is hit directly, server responds with 403 and the UI shows an authorization error.
- **Priority:** High

### TC-109 — Concurrent edit conflict is detected
- **Preconditions:** User A and User B both open the same program for editing.
- **Steps:**
  1. User A changes the Name and clicks Save (succeeds).
  2. User B (still on stale data) changes the Description and clicks Save.
- **Expected result:** User B receives a conflict notification (e.g., "This program was modified by someone else. Please reload.") rather than silently overwriting User A's change.
- **Priority:** Medium

### TC-110 — Editing a program that was deleted in another session
- **Preconditions:** User A has the edit modal open for "Web Development 2026"; User B deletes the program.
- **Steps:**
  1. User A clicks Save.
- **Expected result:** Clear error such as "Program no longer exists." Modal closes or directs the user back to the list, which reflects the deletion.
- **Priority:** Medium

### TC-111 — Closing the modal with unsaved changes warns the user
- **Preconditions:** Edit modal is open; user has typed changes.
- **Steps:**
  1. Click outside the modal / press Esc / click X.
- **Expected result:** Confirmation dialog: "You have unsaved changes. Discard them?" with Discard / Keep editing options. No save without explicit confirmation.
- **Priority:** Medium

---

## 3. Edge Cases

### TC-201 — Name with leading/trailing whitespace is trimmed
- **Steps:**
  1. Edit Name to "  Web Development 2026 - Updated  ".
  2. Save.
  3. Re-open the program.
- **Expected result:** Stored and displayed value is "Web Development 2026 - Updated" (trimmed). No duplicate-name false positives caused by leading/trailing spaces.
- **Priority:** Medium

### TC-202 — Name at exactly the max length saves successfully
- **Steps:**
  1. Set Name to a string of exactly N characters (the documented max).
  2. Save.
- **Expected result:** Save succeeds; full N-character name appears in the list (with truncation/ellipsis at display level only, not in storage).
- **Priority:** Medium

### TC-203 — Name with special characters and punctuation is accepted
- **Steps:**
  1. Set Name to `Web Dev 2026 — C++/C#, JS & TS (Advanced) #1`.
  2. Save.
- **Expected result:** Saved verbatim and rendered correctly in the list (no HTML entity escaping issues, no truncation at first ampersand or hash).
- **Priority:** Medium

### TC-204 — Name with Unicode and emoji is accepted
- **Steps:**
  1. Set Name to "Веб-разработка 2026 🚀 — 程式設計".
  2. Save.
- **Expected result:** Saved and displayed correctly across the list, edit modal, and detail views; sorting/search behave reasonably.
- **Priority:** Medium

### TC-205 — XSS payload in Name and Description is rendered as text
- **Steps:**
  1. Set Name to `<script>alert('xss')</script>`.
  2. Set Description to `<img src=x onerror=alert(1)>`.
  3. Save.
- **Expected result:** No script executes. The values are escaped/rendered as plain text everywhere they appear (list, edit modal, detail view).
- **Priority:** High

### TC-206 — SQL-injection-like input in Name is treated as plain text
- **Steps:**
  1. Set Name to `Robert'); DROP TABLE Programs;--`.
  2. Save.
- **Expected result:** Saved as a literal string; Programs table and other data remain intact.
- **Priority:** High

### TC-207 — Description supports very large but allowed input
- **Steps:**
  1. Paste a Description at the documented maximum length.
  2. Save.
- **Expected result:** Save succeeds; full content is retrieved correctly when re-opening the program.
- **Priority:** Low

### TC-208 — Saving the same values without any changes
- **Steps:**
  1. Open "Web Development 2026" for editing.
  2. Without modifying anything, click **Save**.
- **Expected result:** Either Save is disabled (preferred), or the request is a successful no-op that closes the modal and leaves the list unchanged. No spurious "updated" toast.
- **Priority:** Low

### TC-209 — Renaming back to the original name after another change
- **Steps:**
  1. Rename "Web Development 2026" to "Temp Name" and save.
  2. Edit the same program and rename it back to "Web Development 2026".
  3. Save.
- **Expected result:** Save succeeds; no false duplicate-name error from the program's own previous record.
- **Priority:** Medium

### TC-210 — Rapid double-click on Save submits only once
- **Steps:**
  1. Make a valid change.
  2. Double-click **Save** quickly.
- **Expected result:** Exactly one update request is issued. Save button is disabled while in-flight. List shows a single update, not duplicates or two notifications.
- **Priority:** Medium

### TC-211 — Edit reflects in any related views (detail page, dashboards)
- **Steps:**
  1. Save a name change.
  2. Navigate to the Program detail page and any dashboards/widgets referencing the program.
- **Expected result:** All views reflect the new name without a hard refresh (or after the documented cache window).
- **Priority:** Medium

### TC-212 — Long name in list view truncates visually but tooltip shows full value
- **Steps:**
  1. Save a max-length name.
  2. Hover the row in the Programs list.
- **Expected result:** Visible cell may truncate with ellipsis; the full value is available via tooltip or detail view. Layout does not break.
- **Priority:** Low

### TC-213 — Browser back button after Save does not reopen modal with stale data
- **Steps:**
  1. Save a change.
  2. Press the browser Back button.
- **Expected result:** User is not returned to a stale edit modal that could be re-submitted; navigation behaves consistently with the rest of the app.
- **Priority:** Low

### TC-214 — Keyboard accessibility of the edit form
- **Steps:**
  1. Open the edit modal using only the keyboard (Tab to edit icon, Enter).
  2. Tab through every field; edit Name; press Enter or Tab to Save and activate it.
  3. Press Esc to close.
- **Expected result:** Focus order is logical, focus is trapped inside the modal, all fields are reachable, Save and Cancel are activatable via keyboard, and Esc behaves consistently with TC-111.
- **Priority:** Medium

---

## Summary Coverage Matrix

| Acceptance Criterion | Covered by |
|---|---|
| Open program for editing — pre-populated form | TC-001 |
| Successfully edit a program name | TC-002, TC-004, TC-005, TC-007 |
| Edit preserves unchanged fields | TC-003 |
| Implicit: validation, permissions, persistence | TC-101–TC-110, TC-201–TC-214 |

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Field set is undefined.** The ACs reference "Name" and "Description" but do not enumerate the full set of editable fields (Start Date, End Date, Status, Category, Capacity, Location, Instructor, etc.). Field-level test cases (TC-105, TC-202, TC-207) rely on assumptions.
2. **Validation rules are unspecified:**
   - Maximum/minimum length for Name and Description.
   - Whether Name is required (TC-101 assumes yes).
   - Whether names must be unique (TC-103 assumes yes).
   - Allowed character set for Name (Unicode, emoji, punctuation).
   - Date range rules (TC-105 assumes End ≥ Start).
3. **Trim behavior is unspecified.** Should leading/trailing whitespace be trimmed on save (TC-201)?
4. **No-change save behavior is unspecified.** Should the Save button be disabled when nothing changed (TC-007, TC-208)?
5. **Cancel/close behavior is unspecified.** Whether unsaved-changes warning is required (TC-111).
6. **Permissions model is unspecified.** Which roles can edit programs (TC-108)?
7. **Concurrency strategy is unspecified.** Last-write-wins vs. optimistic locking with conflict detection (TC-109).
8. **Audit/history requirements not stated.** Should edits be tracked (who/when/what changed)? Not testable without a requirement.
9. **Notifications/feedback unspecified.** The AC says "modal closes" and "list shows updated value" but does not state whether a success toast/notification is required.
10. **Real-time update scope unspecified.** "Immediately shows updated name" — does this mean the local list only, or also other open sessions/dashboards (TC-005, TC-211)?
11. **Display truncation rules unspecified** for very long names in the list (TC-212).
12. **Status/lifecycle constraints unspecified.** Can a program be edited if it is Archived, Active with enrolled students, or Completed? Editing rules may differ per state.
13. **API/contract details unspecified.** PUT vs. PATCH; partial vs. full payload; this affects TC-003 expectations.
14. **Accessibility requirements not stated** (focus management, ARIA labels) — TC-214 is based on general best practice.
