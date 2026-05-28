# DS-3 — Program name validation and duplicate prevention

**Jira:** [DS-3 — Program name validation and duplicate prevention](https://legionqaschool.atlassian.net/browse/DS-3)  
**Module:** Programs Management — New Program modal  
**Field under test:** Program Name (required); Description is optional but used when AC says “fill other required fields”

```gherkin
Feature: DS-3 Program name validation and duplicate prevention
  As an admin user
  I want the system to prevent invalid or duplicate program names
  So that data integrity is maintained

  Background:
    Given I am logged in with permission to create programs
    And I am on the Programs page

  # Happy paths

  Scenario: AC — Accept program name with special characters
    Given I open the New Program modal
    When I enter "Informatique & IA - Niveau 2" in the Program Name field
    And I enter "Cours d'introduction à l'IA" in the Description field
    And I click Create
    Then the New Program modal closes
    And I see a program row with the exact name "Informatique & IA - Niveau 2"
    And the name displays "&" and not "&amp;"

  Scenario: Standard alphanumeric program name is accepted
    Given no program named "Web Development 2026" exists in my session
    And I open the New Program modal
    When I enter "Web Development 2026" in the Program Name field
    And I click Create
    Then the New Program modal closes
    And I see a program row named "Web Development 2026"

  Scenario: Leading and trailing whitespace in Program Name is trimmed on save
    Given no program named "Web Development 2026" exists in my session
    And I open the New Program modal
    When I enter "  Web Development 2026  " in the Program Name field
    And I click Create
    Then the New Program modal closes
    And I see a program row named "Web Development 2026"
    And the row does not show leading or trailing spaces in the name

  Scenario: Internal multiple spaces in Program Name are preserved consistently
    Given I open the New Program modal
    When I enter "Web   Development   2026" in the Program Name field
    And I click Create
    Then the New Program modal closes
    And the program row shows the same spacing as stored (no undocumented collapse of internal spaces)

  # Negative

  Scenario: AC — Reject program name with only whitespace
    Given I open the New Program modal
    When I enter "   " in the Program Name field
    And I fill Description with "Valid description for other fields"
    And I click Create
    Then the form is not submitted
    And the Program Name is treated as empty after trim
    And I see a validation indication for Program Name (for example "Name is required" or Create stays disabled)
    And no new program row is added to the Programs list

  Scenario: Empty Program Name is rejected
    Given I open the New Program modal
    When I leave the Program Name field empty
    And I enter "Valid description" in the Description field
    And I attempt to click Create
    Then the form is not submitted
    And no new program row is added to the Programs list

  Scenario: AC — Reject duplicate program name
    Given a program named "Web Development 2026" already exists in the Programs list
    And I open the New Program modal
    When I enter "Web Development 2026" in the Program Name field
    And I enter "Second program attempt" in the Description field
    And I click Create
    Then I see an error indicating the name already exists
    And the form is not submitted
    And exactly one program named "Web Development 2026" remains in the list

  Scenario: Duplicate detection is case-insensitive
    Given a program named "Web Development 2026" already exists
    And I open the New Program modal
    When I enter "web development 2026" in the Program Name field
    And I click Create
    Then I see an error indicating the name already exists
    And no second program is created

  Scenario: Duplicate detection ignores leading and trailing whitespace
    Given a program named "Web Development 2026" already exists
    And I open the New Program modal
    When I enter "   Web Development 2026   " in the Program Name field
    And I click Create
    Then I see an error indicating the name already exists
    And no second program is created

  Scenario: Program Name exceeding maximum length is rejected
    Given the documented maximum Program Name length is 100 characters
    And I open the New Program modal
    When I enter a Program Name of 101 characters
    And I click Create
    Then I see a validation error that the name is too long
    And the form is not submitted
    And no program is created with a silently truncated name

  Scenario: Validation errors preserve other field values
    Given a program named "Web Development 2026" already exists
    And I open the New Program modal
    When I enter "Web Development 2026" in the Program Name field
    And I enter "Long description that should not be lost" in the Description field
    And I click Create
    Then I see an error indicating the name already exists
    And the Description field still contains "Long description that should not be lost"

  Scenario: Double-clicking Create does not create duplicate programs
    Given no program named "QA Unique Program 2026" exists
    And I open the New Program modal
    When I enter "QA Unique Program 2026" in the Program Name field
    And I double-click Create before the first request completes
    Then exactly one program named "QA Unique Program 2026" exists in the list

  # Edge cases

  Scenario: Program Name at exactly maximum length is accepted
    Given the documented maximum Program Name length is 100 characters
    And I open the New Program modal
    When I enter a Program Name of exactly 100 characters
    And I click Create
    Then the New Program modal closes
    And the full 100-character name is visible in the Programs list

  Scenario: Single-character Program Name is handled per documented rules
    Given I open the New Program modal
    When I enter "&" in the Program Name field
    And I click Create
    Then either the program is created with the literal name "&"
    Or a clear validation error explains disallowed characters

  Scenario: Unicode and emoji in Program Name are stored and displayed correctly
    Given I open the New Program modal
    When I enter "Программа 2026 — Веб 🚀" in the Program Name field
    And I click Create
    Then the New Program modal closes
    And I see a program row named "Программа 2026 — Веб 🚀" without mojibake

  Scenario: RTL script in Program Name is accepted and renders correctly
    Given I open the New Program modal
    When I enter "برنامج تطوير الويب 2026" in the Program Name field
    And I click Create
    Then the New Program modal closes
    And the program row displays the name with correct RTL directionality

  Scenario: Program Name containing only zero-width characters is rejected
    Given I open the New Program modal
    When I enter only zero-width characters (U+200B, U+FEFF) in the Program Name field
    And I click Create
    Then the form is not submitted
    And the name is treated as empty with a required-field validation indication

  Scenario: XSS payload in Program Name is stored as text and rendered safely
    Given I open the New Program modal
    When I enter "<script>alert('xss')</script>" in the Program Name field
    And I click Create
    Then the New Program modal closes
    And the Programs list shows the string as plain text
    And no script executes in the list or modal

  Scenario: SQL-injection-like payload in Program Name is stored literally
    Given I open the New Program modal
    When I enter "Robert'); DROP TABLE Programs;--" in the Program Name field
    And I click Create
    Then the New Program modal closes
    And I see a program row with that exact literal name
    And the Programs list still loads normally

  Scenario: Newline and tab characters in Program Name are normalized or rejected
    Given I open the New Program modal
    When I paste "Web\nDevelopment\t2026" into the Program Name field
    And I click Create
    Then either control characters are normalized to spaces
    Or the form shows a clear validation error
    And the stored name does not break the Programs list layout

  Scenario: Concurrent creation of the same new name yields only one program
    Given two admin sessions on the New Program modal
    And no program named "Concurrent Web 2026" exists
    When both users enter "Concurrent Web 2026" and click Create at nearly the same time
    Then exactly one program named "Concurrent Web 2026" exists
    And the second submission shows a duplicate-name error

  Scenario: Inline duplicate indicator matches submit-time duplicate check
    Given a program named "Web Development 2026" already exists
    And I open the New Program modal
    When I type "Web Development 2026" in the Program Name field and pause
    Then any inline "name already taken" indicator appears
    And when I click Create the same duplicate outcome occurs (blocked with error, or allowed consistently with inline state)
```

---

## Summary coverage matrix

| Jira acceptance criterion | Scenarios |
|---|---|
| Reject program name with only whitespace (trimmed, treated as empty, form not submitted) | AC — Reject program name with only whitespace; Empty Program Name is rejected; Program Name containing only zero-width characters is rejected |
| Accept program name with special characters (`Informatique & IA - Niveau 2`) | AC — Accept program name with special characters; Standard alphanumeric…; Unicode and emoji…; RTL script… |
| Reject duplicate program name (`Web Development 2026`) | AC — Reject duplicate program name; Duplicate detection is case-insensitive; Duplicate detection ignores leading and trailing whitespace; Concurrent creation…; Inline duplicate indicator… |

---

## Ambiguities and gaps in the acceptance criteria

1. **Case sensitivity** — Should `Web Development 2026` and `web development 2026` be duplicates? Duplicate detection is case-insensitive assumes industry default; product must confirm (see also scenario for name differing only by case).
2. **Trim rules** — AC specifies trim for whitespace-only names only. Are leading/trailing spaces always trimmed on save? Are internal multiple spaces collapsed?
3. **Length limits** — No min/max in Jira; edge scenarios assume max 100 from related defects — confirm actual limit and client/server enforcement.
4. **Allowed character set** — Emoji, RTL, `&`, control characters, and confusable Unicode (Latin vs Cyrillic “e”) are not specified.
5. **Server-side validation** — ACs are UI-focused; API should reject empty, whitespace-only, and duplicate names with 400/422.
6. **Archived / soft-deleted names** — Whether `Web Development 2026` can be reused after archive/delete is unspecified (no archive UI observed in prior exploration).
7. **Concurrency** — Two users creating the same new name simultaneously needs a documented outcome and DB uniqueness constraint.
8. **Inline duplicate check** — Not in AC; if implemented, must agree with submit-time validation.
9. **Error UX** — Exact message text, `aria-invalid`, focus management, and localization are not specified.
10. **Field preservation on error** — Whether Description and other values remain after duplicate/validation failure is not specified.
11. **Uniqueness scope** — Global vs tenant vs category is not specified.
12. **Known app gaps (from prior Playwright runs)** — Duplicate names may be silently accepted; Create may stay enabled for whitespace-only names; max length may not be enforced. Reconcile scenarios with live behavior when implementing automation.
