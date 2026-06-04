import { expect, type Locator, type Page } from '@playwright/test';
import { SLOW_LIST_TIMEOUT } from '../../didaxis-helpers';
import type { ProgramsPage } from './programs.page';

export type ProgramDialogMode = 'new' | 'edit';

const DIALOG_TITLES: Record<ProgramDialogMode, string> = {
  new: 'New Program',
  edit: 'Edit Program',
};

/**
 * New Program / Edit Program Mantine modal.
 * Verified via Playwright MCP (Jun 2026).
 */
export class ProgramDialogPage {
  readonly page: Page;
  readonly mode: ProgramDialogMode;
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly showAiConfigToggle: Locator;
  readonly cancelButton: Locator;
  readonly primaryButton: Locator;

  constructor(page: Page, mode: ProgramDialogMode) {
    this.page = page;
    this.mode = mode;
    const title = DIALOG_TITLES[mode];
    this.dialog = page.getByRole('dialog', { name: title });
    this.heading = this.dialog.getByRole('heading', { name: title, level: 2 });
    this.programNameInput = this.dialog.getByRole('textbox', { name: 'Program Name' });
    this.descriptionInput = this.dialog.getByRole('textbox', { name: 'Description' });
    this.showAiConfigToggle = this.dialog.getByRole('button', {
      name: /Show AI Generation Config/i,
    });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.primaryButton = this.dialog.getByRole('button', {
      name: mode === 'new' ? 'Create' : 'Save',
      exact: mode === 'new',
    });
  }

  async expectVisible(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async fillProgramName(name: string): Promise<void> {
    await this.programNameInput.fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput.fill(description);
  }

  async fillForm(name: string, description: string): Promise<void> {
    await this.fillProgramName(name);
    await this.fillDescription(description);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.dialog).toBeHidden();
  }

  async clickPrimary(): Promise<void> {
    await expect(this.primaryButton).toBeEnabled();
    await this.primaryButton.click();
  }

  /** Save/Create, wait for the list row, and assert the modal closes. */
  async saveAndClose(programs: ProgramsPage, listRowName: string): Promise<void> {
    await this.clickPrimary();
    await programs.expectRowVisible(listRowName);
    await expect(this.dialog).toBeHidden({ timeout: SLOW_LIST_TIMEOUT });
  }
}
