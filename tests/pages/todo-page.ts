import { expect, type Locator, type Page } from '@playwright/test';

export const TODO_URL = 'https://demo.playwright.dev/todomvc/#/';

export class TodoPage {
  readonly page: Page;
  readonly newTodoInput: Locator;
  readonly todoItems: Locator;
  readonly todoLabels: Locator;
  readonly toggleAll: Locator;
  readonly counter: Locator;
  readonly clearCompletedButton: Locator;
  readonly main: Locator;
  readonly footer: Locator;
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterCompleted: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTodoInput = page.getByPlaceholder('What needs to be done?');
    this.todoItems = page.getByTestId('todo-item');
    this.todoLabels = this.todoItems.locator('label');
    this.toggleAll = page.getByLabel('Mark all as complete');
    this.counter = page.getByTestId('todo-count');
    this.clearCompletedButton = page.getByRole('button', { name: 'Clear completed' });
    this.main = page.locator('.main, [data-testid="main"]').first();
    this.footer = page.locator('.footer, [data-testid="footer"]').first();
    this.filterAll = page.getByRole('link', { name: 'All' });
    this.filterActive = page.getByRole('link', { name: 'Active' });
    this.filterCompleted = page.getByRole('link', { name: 'Completed' });
    this.heading = page.getByRole('heading', { name: 'todos' });
  }

  async goto() {
    await this.page.goto(TODO_URL);
    await this.clearStorage();
    await this.page.goto(TODO_URL);
    await expect(this.newTodoInput).toBeVisible();
  }

  async clearStorage() {
    await this.page.evaluate(() => window.localStorage.clear());
  }

  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }

  async addTodos(texts: string[]) {
    for (const t of texts) await this.addTodo(t);
  }

  getItemByText(text: string): Locator {
    return this.todoItems.filter({ hasText: text }).first();
  }

  async toggleByText(text: string) {
    await this.getItemByText(text).getByRole('checkbox').click();
  }

  async deleteByText(text: string) {
    const item = this.getItemByText(text);
    await item.hover();
    await item.getByRole('button', { name: 'Delete' }).click();
  }

  async editByText(oldText: string, newText: string, commit: 'enter' | 'blur' | 'escape' = 'enter') {
    const item = this.getItemByText(oldText);
    await item.dblclick();
    const editor = item.getByRole('textbox', { name: 'Edit' });
    await editor.fill(newText);
    if (commit === 'enter') await editor.press('Enter');
    else if (commit === 'escape') await editor.press('Escape');
    else await this.page.locator('body').click({ position: { x: 0, y: 0 } });
  }

  async itemTexts(): Promise<string[]> {
    return await this.todoLabels.allInnerTexts();
  }

  async isCompleted(text: string): Promise<boolean> {
    const item = this.getItemByText(text);
    const className = (await item.getAttribute('class')) ?? '';
    return className.includes('completed');
  }
}
