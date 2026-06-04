import { expect, type Locator, type Page } from '@playwright/test';
import { SLOW_LIST_TIMEOUT, submitNewProgram } from '../../didaxis-helpers';
import { AppLayoutPage } from './app-layout.page';
import { ProgramDialogPage } from './program-dialog.page';

export type DeleteDialogAction = 'accept' | 'dismiss';

/**
 * Programs list — /programs
 * Verified via Playwright MCP (Jun 2026).
 *
 * Row actions use accessible names "Edit {name}" / "Delete {name}" (icon-only buttons).
 */
export class ProgramsPage {
  readonly page: Page;
  readonly layout: AppLayoutPage;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly newProgramButton: Locator;
  readonly table: Locator;
  readonly programColumnHeader: Locator;
  readonly selectProgramHint: Locator;

  constructor(page: Page) {
    this.page = page;
    this.layout = new AppLayoutPage(page);
    this.heading = page.getByRole('heading', { name: 'Programs', level: 2 });
    this.subtitle = page.getByText('Manage academic programs and semesters');
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.table = page.getByRole('table');
    this.programColumnHeader = page.getByRole('columnheader', { name: 'Program' });
    this.selectProgramHint = page.getByText('Select a program to manage semesters');
  }

  async goto(): Promise<void> {
    await this.layout.goToPrograms();
    await expect(this.heading).toBeVisible();
  }

  /** Row whose name cell matches exactly (avoids partial matches like "Foo" vs "Foo - Updated"). */
  rowByName(name: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  editButton(name: string): Locator {
    return this.rowByName(name).getByRole('button', { name: new RegExp(`^Edit `) });
  }

  deleteButton(name: string): Locator {
    return this.rowByName(name).getByRole('button', { name: new RegExp(`^Delete `) });
  }

  async expectRowVisible(name: string): Promise<void> {
    await expect(this.rowByName(name)).toBeVisible({ timeout: SLOW_LIST_TIMEOUT });
  }

  async openNewProgramDialog(): Promise<ProgramDialogPage> {
    await this.newProgramButton.click();
    const dialog = new ProgramDialogPage(this.page, 'new');
    await dialog.expectVisible();
    return dialog;
  }

  /** Create a program via the New Program modal and track its id for cleanup. */
  async createProgram(name: string, description: string): Promise<string> {
    const dialog = await this.openNewProgramDialog();
    await dialog.fillForm(name, description);
    return submitNewProgram(this.page, dialog.dialog, name);
  }

  async openEditDialog(programName: string): Promise<ProgramDialogPage> {
    await this.expectRowVisible(programName);
    await this.editButton(programName).click();
    const dialog = new ProgramDialogPage(this.page, 'edit');
    await dialog.expectVisible();
    return dialog;
  }

  /**
   * Native confirm() for delete — not a Mantine modal.
   * Returns the dialog message once handled.
   */
  expectDeleteConfirm(action: DeleteDialogAction): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Native confirm dialog did not appear within 10s')),
        10_000,
      );
      this.page.once('dialog', async (dialog) => {
        clearTimeout(timer);
        const message = dialog.message();
        try {
          if (action === 'accept') {
            await dialog.accept();
          } else {
            await dialog.dismiss();
          }
          resolve(message);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async deleteProgram(name: string, action: DeleteDialogAction = 'accept'): Promise<string> {
    const confirmPromise = this.expectDeleteConfirm(action);
    await this.deleteButton(name).click();
    return confirmPromise;
  }
}
