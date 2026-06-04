import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Persistent app chrome: side nav, user menu, sign out.
 * Verified via Playwright MCP (Jun 2026).
 */
export class AppLayoutPage {
  readonly page: Page;
  readonly brandLogo: Locator;
  readonly dashboardNav: Locator;
  readonly programsNav: Locator;
  readonly calendarNav: Locator;
  readonly validationNav: Locator;
  readonly schedulerNav: Locator;
  readonly exportNav: Locator;
  readonly settingsNav: Locator;
  readonly userDisplayName: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.brandLogo = page.getByRole('img', { name: 'Didaxis Studio' });
    this.dashboardNav = page.getByRole('button', { name: '📊 Dashboard' });
    this.programsNav = page.getByRole('button', { name: '🎓 Programs' });
    this.calendarNav = page.getByRole('button', { name: '📅 Calendar' });
    this.validationNav = page.getByRole('button', { name: '✅ Validation' });
    this.schedulerNav = page.getByRole('button', { name: '⚡ Scheduler' });
    this.exportNav = page.getByRole('button', { name: '📤 Export' });
    this.settingsNav = page.getByRole('button', { name: '⚙️ Settings' });
    this.userDisplayName = page.getByText('Admin', { exact: true });
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
  }

  async goToDashboard(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible();
  }

  async goToPrograms(): Promise<void> {
    await this.goToDashboard();
    await this.programsNav.click();
    await expect(this.page).toHaveURL(/\/programs$/);
    await expect(this.page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
