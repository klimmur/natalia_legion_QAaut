# Test Plan: Program Name Validation and Duplicate Prevention

**Feature:** Program name validation and duplicate prevention
**Module:** Programs Management — Create Program form
**Field under test:** Program **Name**

---

## 1. Positive Flows

### TC-001 — Program name with special characters and accented Unicode is accepted
- **Preconditions:**
  - User is logged in with permission to create programs.
  - User is on the Program creation form.
  - No program with the same name exists.
- **Steps:**
  1. Enter "Informatique & IA - Niveau 2" in the **Name** field.
  2. Fill all other required fields with valid values (e.g., Description = "Cours d'introduction à l'IA", Start Date = 2026-09-01, End Date = 2026-12-15).
  3. Click **Create**.
- **Expected result:**
  - The program is created successfully.
  - User is returned to the Programs list (or detail view).
  - The new program appears in the list with the exact name "Informatique & IA - Niveau 2" (the `&` is rendered as "&", not "&amp;").
- **Priority:** High

### TC-002 — Standard alphanumeric program name is accepted
- **Preconditions:** User is on the Program creation form. No program named "Web Development 2026" exists.
- **Steps:**
  1. Enter "Web Development 2026" in the **Name** field.
  2. Fill all other required fields with valid values.
  3. Click **Create**.
- **Expected result:** Program is created successfully and visible in the Programs list with the exact name.
- **Priority:** High

### TC-003 — Name with leading/trailing whitespace is trimmed and saved
- **Preconditions:** User is on the Program creation form. No program named "Web Development 2026" exists.
- **Steps:**
  1. Enter `"  Web Development 2026  "` (with leading and trailing spaces) in the **Name** field.
  2. Fill other required fields and click **Create**.
  3. Re-open the program for viewing/editing.
- **Expected result:** Program is created with the stored name "Web Development 2026" (trimmed). The list and detail view show no leading/trailing whitespace.
- **Priority:** High

### TC-004 — Name that differs from an existing one only by case is treated according to the documented rule
- **Preconditions:** A program "Web Development 2026" already exists.
- **Steps:**
  1. Enter "WEB DEVELOPMENT 2026" in the **Name** field.
  2. Fill other required fields and click **Create**.
- **Expected result:** Behavior matches the documented case-sensitivity rule:
  - If names are case-insensitive (recommended): a duplicate-name error is shown (covered also in TC-104).
  - If names are case-sensitive: program is created successfully.
  - In either case, the behavior must be consistent with the rule applied in TC-104.
- **Priority:** High

### TC-005 — Name with internal multiple spaces is preserved (or normalized) consistently
- **Preconditions:** User is on the Program creation form.
- **Steps:**
  1. Enter "Web   Development   2026" (multiple spaces between words).
  2. Fill other required fields and click **Create**.
  3. Inspect the saved name in the list and on the detail page.
- **Expected result:** The displayed name matches what is actually stored — no silent collapsing of internal spaces unless that rule is documented and applied consistently across create/edit/duplicate-check.
- **Priority:** Medium

---

## 2. Negative Flows

### TC-101 — Whitespace-only name is rejected
- **Preconditions:** User is on the Program creation form.
- **Steps:**
  1. Enter "   " (three spaces) in the **Name** field.
  2. Fill other required fields with valid values.
  3. Click **Create**.
- **Expected result:**
  - Form is not submitted.
  - Name is trimmed and treated as empty.
  - Inline validation error appears under Name (e.g., "Name is required").
  - No program is created (the Programs list is unchanged).
  - Other entered field values are preserved in the form.
- **Priority:** High

### TC-102 — Empty name is rejected
- **Preconditions:** User is on the Program creation form.
- **Steps:**
  1. Leave the **Name** field empty.
  2. Fill other required fields and click **Create**.
- **Expected result:** Same as TC-101 — required-field validation, no submission, no program created.
- **Priority:** High

### TC-103 — Exact duplicate program name is rejected
- **Preconditions:** A program "Web Development 2026" already exists.
- **Steps:**
  1. Enter "Web Development 2026" in the **Name** field.
  2. Fill other required fields with valid values.
  3. Click **Create**.
- **Expected result:**
  - User-visible error indicating the name already exists (e.g., "A program with this name already exists").
  - Form is not submitted.
  - The original "Web Development 2026" remains the only program with that name (no duplicate created).
- **Priority:** High

### TC-104 — Duplicate detection is case-insensitive
- **Preconditions:** A program "Web Development 2026" already exists.
- **Steps:**
  1. Enter "web development 2026" in the **Name** field.
  2. Fill other required fields and click **Create**.
- **Expected result:** Duplicate-name error is shown; program is not created. (If product policy is case-sensitive, this test should be inverted and reconciled with TC-004 — see Ambiguities.)
- **Priority:** High

### TC-105 — Duplicate detection ignores leading/trailing whitespace
- **Preconditions:** A program "Web Development 2026" already exists.
- **Steps:**
  1. Enter "   Web Development 2026   " in the **Name** field.
  2. Click **Create**.
- **Expected result:** After trimming, the name matches the existing program; duplicate-name error is shown; no program is created.
- **Priority:** High

### TC-106 — Name exceeding maximum length is rejected
- **Preconditions:** Documented max length = N (e.g., 100). User is on the Program creation form.
- **Steps:**
  1. Enter a string of N+1 characters in the **Name** field.
  2. Fill other required fields and click **Create**.
- **Expected result:** Validation error indicates the name is too long; either input is hard-capped at N at typing time, or submission is blocked. No silent truncation is saved.
- **Priority:** Medium

### TC-107 — Server-side validation also rejects whitespace-only / empty / duplicate names
- **Preconditions:** Tester can submit a request directly to the create endpoint (e.g., via API client or DevTools) bypassing the UI.
- **Steps:**
  1. Send a POST request with `name = "   "`.
  2. Send a POST request with `name = ""`.
  3. Send a POST request with `name = "Web Development 2026"` (existing).
- **Expected result:** Server returns 400/422 with a meaningful error code/message in all three cases. No record is inserted.
- **Priority:** High

### TC-108 — Submit button does not allow double submission resulting in duplicates
- **Preconditions:** User is on the Program creation form with valid data; no duplicate exists yet.
- **Steps:**
  1. Click **Create** and immediately click it again (double-click) before the response returns.
- **Expected result:** Exactly one program is created. The button is disabled while the request is in flight, and/or the second request is rejected by the duplicate-name check. No two rows with the same name appear in the list.
- **Priority:** High

### TC-109 — Validation errors do not lose user input
- **Preconditions:** User has filled out a long form including Description, Dates, Category.
- **Steps:**
  1. Enter a duplicate name "Web Development 2026".
  2. Click **Create**.
- **Expected result:** Duplicate-name error is shown. Description, Dates, Category, and other entered values remain populated so the user can correct only the Name.
- **Priority:** Medium

### TC-110 — Network failure during submission does not silently create a duplicate
- **Preconditions:** Throttle network to Offline (DevTools) right before submitting; valid, unique name in the field.
- **Steps:**
  1. Click **Create**.
  2. After the error appears, restore network and click **Create** again.
- **Expected result:** Either no program is created during the offline attempt and exactly one is created on the retry, or — if an offline queue exists — exactly one program is created in the end. No duplicates regardless of retries.
- **Priority:** Medium

### TC-111 — Duplicate of an archived/soft-deleted program name behaves per documented rule
- **Preconditions:** "Web Development 2026" exists and has been archived/soft-deleted.
- **Steps:**
  1. Try to create a new program named "Web Development 2026".
- **Expected result:** Behavior matches the documented rule (e.g., archived names are still considered duplicates and are blocked, **or** archived names are released for reuse). The system does not silently create an active program with a name colliding against an archived one without surfacing it.
- **Priority:** Medium

---

## 3. Edge Cases

### TC-201 — Name at exactly the maximum allowed length is accepted
- **Steps:**
  1. Enter a string of exactly N characters (the documented max) in the **Name** field.
  2. Fill other required fields and click **Create**.
- **Expected result:** Program is created successfully; the full name is stored and visible (truncated only at display level if needed).
- **Priority:** Medium

### TC-202 — Name at minimum allowed length is accepted
- **Steps:**
  1. Enter the documented minimum (e.g., 1 character: "X").
  2. Fill other required fields and click **Create**.
- **Expected result:** Program is created successfully (assuming min length = 1). If min length is higher, a 1-character name should produce a clear validation error.
- **Priority:** Low

### TC-203 — Single-character special-character name behavior matches documentation
- **Steps:**
  1. Enter "&" in the **Name** field.
  2. Click **Create**.
- **Expected result:** If the policy allows any non-empty trimmed string, the program is created with the literal name "&". If the policy requires alphanumerics, a clear validation error is shown. Behavior must be documented and consistent.
- **Priority:** Low

### TC-204 — Unicode and emoji in name are accepted and rendered correctly
- **Steps:**
  1. Enter "Программа 2026 — Веб 🚀" in the **Name** field.
  2. Click **Create**.
  3. Verify the name in list, detail view, search, and any export.
- **Expected result:** Saved exactly as entered (after trim). No mojibake. Sorting and search treat the name as a single Unicode string.
- **Priority:** Medium

### TC-205 — Right-to-left (RTL) script in name is accepted
- **Steps:**
  1. Enter "برنامج تطوير الويب 2026" in the **Name** field.
  2. Click **Create**.
- **Expected result:** Program is created. The name renders with proper RTL directionality in list, detail view, and form.
- **Priority:** Low

### TC-206 — Name containing only zero-width / invisible characters is rejected
- **Steps:**
  1. Enter only zero-width characters (e.g., U+200B, U+FEFF) in the **Name** field.
  2. Click **Create**.
- **Expected result:** Treated equivalently to whitespace-only — required-field validation error; no program created.
- **Priority:** Medium

### TC-207 — XSS payload in name is stored as text and rendered safely
- **Steps:**
  1. Enter `<script>alert('xss')</script>` in the **Name** field.
  2. Fill other required fields and click **Create**.
  3. Verify rendering in list, detail page, and any place the name is shown.
- **Expected result:** No script executes anywhere. The string is HTML-escaped and shown as plain text.
- **Priority:** High

### TC-208 — SQL-injection-like payload in name is stored as plain text
- **Steps:**
  1. Enter `Robert'); DROP TABLE Programs;--` in the **Name** field.
  2. Click **Create**.
- **Expected result:** Stored verbatim as a literal name. Programs table and other data remain intact.
- **Priority:** High

### TC-209 — Name containing newline / tab characters is normalized or rejected
- **Steps:**
  1. Paste "Web\nDevelopment\t2026" into the **Name** field.
  2. Click **Create**.
- **Expected result:** Either control characters are stripped/normalized to single spaces, or the form rejects the input with a clear message. The stored name does not contain raw newlines that break the list layout.
- **Priority:** Medium

### TC-210 — Visually identical names with confusable Unicode characters do not silently collide
- **Steps:**
  1. Create "Web Development 2026" (Latin "e").
  2. Try to create "Wеb Dеvеlopmеnt 2026" using Cyrillic "е" (U+0435) for some letters.
- **Expected result:** Two technically different strings; if the system intentionally normalizes confusables, both attempts produce a duplicate-name error consistent with that policy. If not, both can coexist — but this should be a known, documented decision (security/UX risk).
- **Priority:** Low

### TC-211 — Concurrent creations of the same new name produce only one program
- **Preconditions:** Two users (A and B) on the Program creation form. Neither program currently exists.
- **Steps:**
  1. Both users enter "Web Development 2026" simultaneously.
  2. Both click **Create** at nearly the same time.
- **Expected result:** Exactly one program is created. The second submission receives the duplicate-name error. No two rows with the same name end up in the database (server-side uniqueness constraint enforced).
- **Priority:** High

### TC-212 — Validation runs on the actual submitted (trimmed) value, not the raw input
- **Steps:**
  1. Enter "Web Development 2026 " (one trailing space) when "Web Development 2026" already exists.
  2. Click **Create**.
- **Expected result:** After trim, names match → duplicate-name error. (Reinforces TC-105.)
- **Priority:** High

### TC-213 — Inline duplicate check (if implemented) is consistent with submit-time check
- **Preconditions:** A program "Web Development 2026" exists. The form has an async/inline "name already taken" indicator.
- **Steps:**
  1. Type "Web Development 2026" in the **Name** field and pause.
  2. Observe the inline indicator.
  3. Click **Create**.
- **Expected result:** Inline indicator and submit-time error agree. The user is never allowed to submit a name the inline check flagged as taken (or vice versa: not blocked by inline if submit allows it).
- **Priority:** Medium

---

## Summary Coverage Matrix

| Acceptance Criterion | Covered by |
|---|---|
| Reject whitespace-only name (treated as empty) | TC-101, TC-102, TC-107, TC-206, TC-212 |
| Accept name with special characters (`Informatique & IA - Niveau 2`) | TC-001, TC-002, TC-003, TC-005, TC-204, TC-205 |
| Reject duplicate program name | TC-103, TC-104, TC-105, TC-107, TC-108, TC-111, TC-211, TC-212, TC-213 |
| Implicit: length, security, internationalization | TC-106, TC-201–TC-210 |

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Case sensitivity is not specified.** Should "Web Development 2026" and "web development 2026" be treated as duplicates? TC-004 and TC-104 assume case-insensitive duplicate detection (industry default), but this needs an explicit product decision.
2. **Trim/normalization rules are not specified.** The first AC says "trimmed," but only for the whitespace-only case. Are leading/trailing spaces always trimmed on save? Are internal multiple spaces preserved or collapsed (TC-005)? Are zero-width / invisible characters stripped (TC-206)? Are tabs/newlines stripped (TC-209)?
3. **Length constraints are not specified.** No minimum or maximum length is given (TC-106, TC-201, TC-202). The DB column likely has a limit; it should be documented and enforced both client- and server-side.
4. **Allowed character set is not specified.** Are emoji, RTL scripts, control characters, and confusable Unicode allowed (TC-204, TC-205, TC-210)?
5. **Server-side enforcement is not specified.** The ACs describe UI behavior; server-side rejection of empty/whitespace/duplicate names (TC-107) and a uniqueness constraint at the DB level (TC-211) should be required, not assumed.
6. **Soft-delete / archived program collisions are not specified.** Does an archived program "Web Development 2026" still block reuse of that name (TC-111)?
7. **Concurrency behavior is not specified.** What happens when two users submit the same brand-new name at the same time (TC-211)? Last-writer-wins vs. one error vs. both errors.
8. **Inline duplicate-check behavior is not specified.** Is there an as-you-type "name already taken" indicator? If so, must it be consistent with submit-time validation (TC-213)?
9. **Error message wording / a11y is not specified.** No requirement for `aria-invalid`, `aria-describedby`, focus moving to the failing field, or screen-reader announcement of validation errors.
10. **Error-state field preservation is not specified.** When a duplicate or validation error occurs, must other entered fields (Description, Dates, etc.) be preserved (TC-109)?
11. **Display vs. storage rules are not specified.** Is the stored name exactly the displayed name, or is there normalization between them? This affects exports, search, and uniqueness checks.
12. **Scope of uniqueness is not specified.** Is uniqueness global, per-tenant/organization, per-academic-year, or per-category? Affects whether two unrelated tenants can share a program name.
13. **Permissions are not specified.** Which roles can create programs? Validation should still apply identically across roles.
14. **Localization of error messages is not specified.** Errors should be localized for all supported languages, including the special-character/RTL cases (TC-205).
