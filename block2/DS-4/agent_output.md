# Test Plan: Delete Program with Confirmation

**Feature:** Delete program with confirmation
**Module:** Programs Management
**Reference Programs:** "Test Program", "Web Development 2026"

---

## 1. Positive Flows

### TC-001 — Delete icon opens a confirmation dialog
- **Preconditions:**
  - User is logged in with permission to delete programs.
  - Program "Test Program" exists in the Programs list.
  - User is on the Programs page.
- **Steps:**
  1. Locate the row for "Test Program".
  2. Click the delete (trash) icon on that row.
- **Expected result:**
  - A confirmation dialog appears in the foreground (modal, blocking).
  - The dialog clearly identifies the target program by name (e.g., "Delete Test Program?").
  - The dialog has two clearly labeled actions: a destructive **Delete / Confirm** button and a non-destructive **Cancel** button.
  - The program "Test Program" still exists in the list at this point (no deletion has occurred yet).
- **Priority:** High

### TC-002 — Confirming deletion removes the program from the list
- **Preconditions:** Confirmation dialog for "Test Program" is open (from TC-001).
- **Steps:**
  1. Click **Delete / Confirm** in the dialog.
- **Expected result:**
  - The dialog closes.
  - A success indication is shown (toast/notification, if applicable).
  - "Test Program" is removed from the Programs list immediately, without requiring a manual refresh.
  - The total program count decreases by exactly 1.
- **Priority:** High

### TC-003 — Cancelling deletion preserves the program
- **Preconditions:** Confirmation dialog for "Test Program" is open.
- **Steps:**
  1. Click **Cancel** in the dialog.
- **Expected result:**
  - The dialog closes.
  - "Test Program" still appears in the Programs list, in the same position, with all its data intact.
  - The total program count is unchanged.
  - No success/error notification is shown.
- **Priority:** High

### TC-004 — Closing the dialog via the X icon preserves the program
- **Preconditions:** Confirmation dialog for "Test Program" is open.
- **Steps:** Click the close (X) icon in the dialog header.
- **Expected result:** Same as TC-003 — dialog closes, program remains in the list, no deletion occurs.
- **Priority:** Medium

### TC-005 — Closing the dialog via Esc key preserves the program
- **Preconditions:** Confirmation dialog for "Test Program" is open.
- **Steps:** Press the **Esc** key.
- **Expected result:** Same as TC-003 — dialog closes, program remains in the list, no deletion occurs.
- **Priority:** Medium

### TC-006 — Clicking outside the dialog (backdrop) preserves the program
- **Preconditions:** Confirmation dialog for "Test Program" is open.
- **Steps:** Click on the dialog backdrop (outside the dialog box).
- **Expected result:** Either (a) backdrop is non-dismissive (recommended for destructive actions) and the dialog stays open, OR (b) the dialog closes without performing any deletion. In either case, "Test Program" still exists.
- **Priority:** Medium

### TC-007 — Deletion persists after page refresh
- **Preconditions:** "Test Program" was just deleted via TC-002.
- **Steps:** Refresh the Programs page (F5 / browser reload).
- **Expected result:** "Test Program" is not in the list. Deletion is persisted server-side.
- **Priority:** High

### TC-008 — Deletion is visible to a second user/session
- **Preconditions:** "Test Program" was just deleted in session A; session B is logged in as another user with view access.
- **Steps:** In session B, navigate to (or refresh) the Programs page.
- **Expected result:** Session B no longer shows "Test Program".
- **Priority:** Medium

### TC-009 — Deleting the only program in the list yields a clean empty state
- **Preconditions:** Only one program ("Test Program") exists in the system.
- **Steps:**
  1. Click the delete icon for "Test Program" and confirm.
- **Expected result:** Program is deleted. The Programs list shows the documented empty state (e.g., "No programs yet — create one to get started"). No layout/JS errors.
- **Priority:** Medium

### TC-010 — Multiple consecutive deletions each require their own confirmation
- **Preconditions:** Programs "Test Program A", "Test Program B", "Test Program C" exist.
- **Steps:**
  1. Delete "Test Program A" via the icon, confirm.
  2. Delete "Test Program B" via the icon, confirm.
  3. Delete "Test Program C" via the icon, confirm.
- **Expected result:** Each deletion shows its own confirmation dialog (no "don't ask again" suppression unless explicitly documented). After all three, the list reflects exactly three removals.
- **Priority:** Medium

---

## 2. Negative Flows

### TC-101 — Clicking the delete icon never deletes without confirmation
- **Preconditions:** "Test Program" exists.
- **Steps:** Click the delete icon for "Test Program". Do not interact with the dialog.
- **Expected result:** Confirmation dialog appears. "Test Program" is still in the list. No DELETE request has been issued by the client (verifiable via network logs).
- **Priority:** High

### TC-102 — User without delete permission cannot delete
- **Preconditions:** User logged in with read-only or non-admin role; "Test Program" exists.
- **Steps:** Open the Programs page.
- **Expected result:** Delete icon is hidden or disabled. If the delete endpoint is called directly (API/DevTools), the server responds 403 and the program remains.
- **Priority:** High

### TC-103 — Server error during deletion preserves the program and notifies the user
- **Preconditions:** Confirmation dialog for "Test Program" is open; backend forced to return 500 on DELETE.
- **Steps:** Click **Delete / Confirm**.
- **Expected result:**
  - User-visible error (e.g., "Could not delete program. Please try again.").
  - "Test Program" remains in the list.
  - The list does not show an optimistic-removal that is left dangling.
- **Priority:** High

### TC-104 — Network loss during deletion is handled gracefully
- **Preconditions:** Confirmation dialog open; DevTools network set to Offline.
- **Steps:** Click **Delete / Confirm**.
- **Expected result:** Friendly error/retry message. "Test Program" remains in the list. No partial state where the row is hidden but still on the server.
- **Priority:** Medium

### TC-105 — Deleting a program that was already deleted in another session
- **Preconditions:** User A has the confirmation dialog open for "Test Program"; User B already deleted "Test Program".
- **Steps:** User A clicks **Delete / Confirm**.
- **Expected result:** Clear message such as "Program no longer exists." The Programs list refreshes to reflect the deletion. No misleading success toast.
- **Priority:** Medium

### TC-106 — Deleting a program that has dependent data follows the documented rule
- **Preconditions:** "Web Development 2026" has dependent data (e.g., enrolled students, scheduled sessions, linked assessments).
- **Steps:** Click delete on "Web Development 2026" and confirm.
- **Expected result:** Behavior matches the documented rule:
  - Block: an error explains why deletion is not allowed and lists/links the blocking dependencies.
  - Cascade: the confirmation dialog clearly warns about cascading effects ("This will also remove N enrollments…") before deletion proceeds.
  - Soft-delete: the program is hidden but recoverable; dependent data behavior is documented.
- **Priority:** High

### TC-107 — Confirmation button does not allow double submission
- **Preconditions:** Confirmation dialog open.
- **Steps:** Double-click **Delete / Confirm** quickly.
- **Expected result:** Exactly one DELETE request is sent. The button is disabled while in flight. No double error toast, no console errors, no second 404 from a redundant request.
- **Priority:** Medium

### TC-108 — Esc/Cancel/X never trigger deletion
- **Steps:** For each of: Esc, **Cancel** click, X icon, backdrop click — confirm no DELETE request is sent.
- **Expected result:** Verified via network log that no DELETE call is made. Program remains in the list. (Companion to TC-003–TC-006.)
- **Priority:** High

### TC-109 — Deletion does not affect unrelated programs
- **Preconditions:** Programs "Test Program", "Web Development 2026", "Data Science 2026" all exist.
- **Steps:** Delete "Test Program" and confirm.
- **Expected result:** Only "Test Program" is removed. "Web Development 2026" and "Data Science 2026" remain unchanged (name, ordering, data).
- **Priority:** High

### TC-110 — Deleted program no longer appears in search/filter results
- **Preconditions:** "Test Program" has just been deleted.
- **Steps:** Search the Programs list for "Test".
- **Expected result:** "Test Program" is not in the results. Search returns only currently existing programs.
- **Priority:** Medium

### TC-111 — Deleted program is removed from related views (dashboards, dropdowns)
- **Preconditions:** "Test Program" has just been deleted.
- **Steps:** Visit pages that reference programs (e.g., enrollment form's program dropdown, dashboard widgets).
- **Expected result:** "Test Program" no longer appears in any active reference list (or only appears as historical, per documented rule).
- **Priority:** Medium

### TC-112 — Direct API call still requires authentication and authorization
- **Preconditions:** Tester captures the DELETE endpoint URL.
- **Steps:**
  1. Send DELETE without authentication.
  2. Send DELETE with a non-admin token.
- **Expected result:** 401 (unauthenticated) and 403 (unauthorized) respectively. Program is not deleted.
- **Priority:** High

### TC-113 — Direct API call to delete a non-existent program returns a clean error
- **Preconditions:** No program with id `nonexistent-id`.
- **Steps:** Send `DELETE /programs/nonexistent-id` as an authorized user.
- **Expected result:** 404 with a clear message; no 500; no side effects.
- **Priority:** Medium

---

## 3. Edge Cases

### TC-201 — Confirmation dialog displays special-character program names safely
- **Preconditions:** Program named `Informatique & IA <Niveau 2>` exists.
- **Steps:** Click delete on this program.
- **Expected result:** Dialog title/body shows the name verbatim (`&` and angle brackets rendered as text). No script execution; no HTML injection.
- **Priority:** High

### TC-202 — Confirmation dialog displays Unicode/emoji program names correctly
- **Preconditions:** Program named "Программа 2026 — Веб 🚀" exists.
- **Steps:** Click delete on this program.
- **Expected result:** Name is rendered correctly (Cyrillic + emoji). No mojibake. Confirmation succeeds and removes the correct program.
- **Priority:** Medium

### TC-203 — Confirmation dialog truncates very long names without breaking layout
- **Preconditions:** Program with a name at the documented maximum length exists.
- **Steps:** Click delete on this program.
- **Expected result:** Dialog handles the long name (wrap or ellipsis with tooltip). The Confirm/Cancel buttons remain visible and usable. Confirmation deletes the correct program.
- **Priority:** Low

### TC-204 — Two programs that share a display name are deleted independently
- **Preconditions:** Two programs both display as "Test Program" (e.g., across two tenants/contexts, if allowed by the data model). Each has a unique internal id.
- **Steps:** Delete the first "Test Program" and confirm.
- **Expected result:** Only the targeted record (by id) is deleted. The second "Test Program" remains. UI must use the id, not the display name, for the delete request.
- **Priority:** High

### TC-205 — Deleting from a paginated list updates pagination correctly
- **Preconditions:** The list spans multiple pages; user is on page 2; "Test Program" is on page 2.
- **Steps:** Delete "Test Program" and confirm.
- **Expected result:** "Test Program" is removed. Page 2 either shifts in the next item from page 3 or, if page 2 becomes empty after deletion, the user is moved to a valid page (page 1 or last available). Total count reflects the deletion.
- **Priority:** Medium

### TC-206 — Deleting under an active filter/search keeps the filter applied
- **Preconditions:** User has filtered the list by category "QA"; "Test Program" matches the filter.
- **Steps:** Delete "Test Program" and confirm.
- **Expected result:** Filter remains applied; "Test Program" is removed; other programs in the filtered view are unaffected.
- **Priority:** Medium

### TC-207 — Deleting a program does not remove unrelated audit/log history
- **Preconditions:** "Test Program" has audit history; an admin has access to a logs/audit view (if applicable).
- **Steps:** Delete "Test Program" and confirm.
- **Expected result:** Audit log of the deletion event is recorded (who, when, what). Past audit entries about the program are not corrupted by the deletion.
- **Priority:** Medium

### TC-208 — Re-creating a program with the deleted program's name is allowed (or blocked) per documented rule
- **Preconditions:** "Test Program" was just deleted.
- **Steps:** Create a new program named "Test Program".
- **Expected result:** Behavior matches the documented rule (allowed for hard-delete; blocked if soft-delete reserves the name). The result is consistent with the program-name-uniqueness rules.
- **Priority:** Medium

### TC-209 — Concurrent deletion attempts on the same program produce a single deletion
- **Preconditions:** Users A and B both have "Test Program" loaded; both click delete.
- **Steps:** Both confirm at nearly the same instant.
- **Expected result:** One request succeeds (program deleted). The other receives a not-found / already-deleted error and the UI handles it gracefully (TC-105).
- **Priority:** Medium

### TC-210 — Keyboard-only operation works end to end
- **Preconditions:** "Test Program" exists.
- **Steps:**
  1. Tab to the row's delete icon and press Enter.
  2. When the dialog opens, verify focus moves into the dialog (recommended initial focus on **Cancel** for safety).
  3. Tab to **Delete / Confirm** and press Enter.
- **Expected result:** Entire flow is operable by keyboard. Focus is trapped inside the dialog while open and returns to a sensible element (the row or the page header) after close. Initial focus is on the safer (Cancel) action.
- **Priority:** Medium

### TC-211 — Screen reader announces the destructive action
- **Steps:**
  1. With a screen reader on, open the confirmation dialog.
- **Expected result:** Dialog has `role="dialog"` (or `alertdialog` for destructive actions), an accessible name including the program name, and the buttons are announced with their labels. Destructive button conveys danger semantically (not just by color).
- **Priority:** Medium

### TC-212 — Auto-deletion via Enter key in the dialog uses the safe default
- **Preconditions:** Confirmation dialog is open.
- **Steps:** Press Enter without changing focus.
- **Expected result:** The default action is **Cancel** (or no action) — Enter does not trigger destructive deletion when the user has not deliberately chosen the Delete button. (If the product intentionally defaults Enter to Confirm, this must be documented and warned about clearly.)
- **Priority:** Medium

### TC-213 — Deletion behaves correctly when the program is open in another tab
- **Preconditions:** Same user has "Test Program" detail page open in tab 2 and the Programs list in tab 1.
- **Steps:** Delete "Test Program" from tab 1 and confirm.
- **Expected result:** Tab 2 either auto-refreshes to a "program not found" state or shows a not-found error on the next interaction. No silent stale state that allows the user to "edit" a deleted program.
- **Priority:** Low

### TC-214 — Undo (if implemented) restores the deleted program
- **Preconditions:** Product spec includes an undo/snackbar after deletion.
- **Steps:**
  1. Delete "Test Program" and confirm.
  2. Click **Undo** in the success snackbar before it dismisses.
- **Expected result:** "Test Program" reappears in the list with all original fields and the same id (or per documented rule). No duplicate created. (If undo is not in scope, this test is N/A — see Ambiguities.)
- **Priority:** Low

---

## Summary Coverage Matrix

| Acceptance Criterion | Covered by |
|---|---|
| Delete icon shows a confirmation dialog | TC-001, TC-101, TC-201–TC-203 |
| Confirming deletion removes the program from the list | TC-002, TC-007, TC-008, TC-009, TC-204, TC-205 |
| Cancelling deletion keeps the program | TC-003, TC-004, TC-005, TC-006, TC-108 |
| Implicit: permissions, errors, dependencies, a11y, concurrency | TC-101–TC-113, TC-206–TC-214 |

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Hard-delete vs. soft-delete is not specified.** Is the program permanently removed, or archived/soft-deleted with the option to restore? This affects TC-007, TC-208, TC-214, and audit/recovery tests.
2. **Behavior with dependent data is not specified.** What happens when the program has enrollments, sessions, assignments, etc.? Block, cascade, or detach (TC-106)?
3. **Permissions are not specified.** Which roles can delete programs (TC-102, TC-112)? Are there per-program ownership rules?
4. **Confirmation dialog behavior details are not specified:**
   - Is the dialog modal? Does the Esc key close it (TC-005)?
   - Does clicking the backdrop dismiss it (TC-006)?
   - What does the X icon do?
   - Initial focus and default Enter action (TC-210, TC-212)?
   - Should the dialog require typing the program name to confirm (a stronger guard for destructive actions)? Not implied by the AC.
5. **Success/error feedback is not specified.** Should a toast/snackbar confirm deletion? Should there be an Undo affordance (TC-214)?
6. **Audit logging is not specified.** Is the delete event logged with actor and timestamp (TC-207)?
7. **Concurrency behavior is not specified.** What if another user deleted the program first (TC-105) or both confirm at the same time (TC-209)?
8. **Scope of "removed from the program list" is not specified.** Is removal restricted to the current view, or also from dropdowns/dashboards/exports/historical reports (TC-110, TC-111)?
9. **API-level enforcement is not specified.** The AC describes UI behavior. Authentication/authorization and 404 behavior at the API need to be required (TC-112, TC-113).
10. **Empty state after deletion is not specified.** No copy/UX defined for the "no programs yet" state (TC-009).
11. **Pagination/filter behavior after deletion is not specified** (TC-205, TC-206).
12. **Accessibility requirements are not specified** (focus management, ARIA roles, color-independent danger cues, screen reader announcements — TC-210, TC-211).
13. **Re-using a deleted program's name is not specified** (TC-208) — needs to be reconciled with the program-name-uniqueness policy.
14. **Bulk delete is not in scope here**, but if the product supports it elsewhere, the single-delete confirmation flow should still be tested independently and behave consistently.
