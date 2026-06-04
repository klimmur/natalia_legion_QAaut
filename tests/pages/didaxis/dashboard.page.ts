import { expect, type Locator, type Page } from '@playwright/test';
import { AppLayoutPage } from './app-layout.page';

/**
 * Dashboard — /
 * Verified via Playwright MCP (Jun 2026).
 */
export class DashboardPage {
  readonly page: Page;
  readonly layout: AppLayoutPage;
  readonly heading: Locator;
  readonly welcomeText: Locator;
  readonly connectedBadge: Locator;
  readonly programsCard: Locator;
  readonly calendarCard: Locator;
  readonly validationCard: Locator;
  readonly aiAssistCard: Locator;
  readonly quickStartSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.layout = new AppLayoutPage(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard', level: 2 });
    this.welcomeText = page.getByText('Welcome to Didaxis Studio');
    this.connectedBadge = page.getByText('Connected', { exact: true });
    this.programsCard = page.getByText('Manage academic programs');
    this.calendarCard = page.getByText('Schedule & drag-drop');
    this.validationCard = page.getByText('Check for conflicts');
    this.aiAssistCard = page.getByText('AI-powered editing');
    this.quickStartSection = page.getByText('Quick Start', { exact: true });
  }

  async goto(): Promise<void> {
    await this.layout.goToDashboard();
    await expect(this.heading).toBeVisible();
  }
}
