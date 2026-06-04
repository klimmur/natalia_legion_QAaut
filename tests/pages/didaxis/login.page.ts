import { expect, type Locator, type Page } from '@playwright/test';

const EMAIL = process.env.DIDAXIS_EMAIL!;
const PASSWORD = process.env.DIDAXIS_PASSWORD!;

/**
 * Login page — /login
 * Verified via Playwright MCP (Jun 2026).
 */
export class LoginPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly subtitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.getByRole('img', { name: 'Didaxis Studio' });
    this.subtitle = page.getByText('Sign in to your account');
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.signInButton).toBeVisible();
  }

  async signIn(
    email: string = EMAIL,
    password: string = PASSWORD,
  ): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await expect(this.page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible();
  }
}
