import { test, expect } from '@playwright/test';
import { TodoPage, TODO_URL } from './pages/todo-page';

test.describe('Edge cases', () => {
  let todo: TodoPage;

  test.beforeEach(async ({ page }) => {
    todo = new TodoPage(page);
    await todo.goto();
  });

  test('TC-201: leading/trailing whitespace is trimmed on creation', async () => {
    await todo.addTodo('   Buy milk   ');

    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.todoLabels).toHaveText(['Buy milk']);
  });

  test('TC-202: very long todo (255 chars) is accepted and not truncated', async () => {
    const text = 'A'.repeat(255);
    await todo.addTodo(text);

    await expect(todo.todoItems).toHaveCount(1);
    const label = todo.todoLabels.first();
    await expect(label).toHaveText(text);
    expect((await label.innerText()).length).toBe(255);
  });

  test('TC-203: extreme length (2000 chars) is still accepted', async () => {
    const text = 'B'.repeat(2000);
    await todo.addTodo(text);

    await expect(todo.todoItems).toHaveCount(1);
    const label = todo.todoLabels.first();
    expect((await label.innerText()).length).toBe(2000);
  });

  test('TC-204: special characters and emoji are preserved (no XSS)', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', async (d) => {
      alertFired = true;
      await d.dismiss();
    });

    const items = [
      '<script>alert(1)</script>',
      '"; DROP TABLE todos; --',
      'Café — déjà vu ☕️🎉',
    ];
    await todo.addTodos(items);

    await expect(todo.todoItems).toHaveCount(3);
    await expect(todo.todoLabels).toHaveText(items);
    expect(alertFired).toBe(false);

    const scriptCount = await page
      .locator('[data-testid="todo-item"] script')
      .count();
    expect(scriptCount).toBe(0);
  });

  test('TC-205: duplicate todos are allowed', async () => {
    await todo.addTodo('Buy milk');
    await todo.addTodo('Buy milk');

    await expect(todo.todoItems).toHaveCount(2);
    await expect(todo.todoLabels).toHaveText(['Buy milk', 'Buy milk']);
    await expect(todo.counter).toHaveText(/2\s+items left/i);

    const first = todo.todoItems.first();
    await first.getByRole('checkbox').click();
    await expect(first).toHaveClass(/completed/);
    await expect(todo.todoItems.nth(1)).not.toHaveClass(/completed/);
  });

  test('TC-206: single-character todo', async () => {
    await todo.addTodo('a');

    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.todoLabels).toHaveText(['a']);
    await expect(todo.counter).toHaveText(/1\s+item left/i);
  });

  test('TC-207: large list (100 items) performs adequately', async ({ page }) => {
    test.slow();
    const items = Array.from({ length: 100 }, (_, i) => `Task ${i + 1}`);

    const t0 = Date.now();
    await page.evaluate((todos) => {
      const stored = todos.map((title, idx) => ({
        id: String(idx + 1),
        title,
        completed: false,
      }));
      window.localStorage.setItem('react-todos', JSON.stringify(stored));
    }, items);
    await page.reload();

    await expect(todo.todoItems).toHaveCount(100);
    const addElapsed = Date.now() - t0;
    expect(addElapsed).toBeLessThan(15000);

    const tToggle = Date.now();
    await todo.toggleAll.click();
    await expect(todo.counter).toHaveText(/0\s+items left/i);
    expect(Date.now() - tToggle).toBeLessThan(5000);

    await todo.toggleAll.click();
    await expect(todo.counter).toHaveText(/100\s+items left/i);

    await todo.toggleAll.click();
    const tClear = Date.now();
    await todo.clearCompletedButton.click();
    await expect(todo.todoItems).toHaveCount(0);
    expect(Date.now() - tClear).toBeLessThan(5000);
  });

  test('TC-208: filter state survives page reload', async ({ page }) => {
    await todo.addTodos(['Buy milk', 'Walk the dog']);
    await todo.toggleByText('Buy milk');
    await todo.filterActive.click();
    expect(page.url()).toContain('#/active');

    await page.reload();

    expect(page.url()).toContain('#/active');
    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.todoLabels).toHaveText(['Walk the dog']);
  });

  test('TC-209: direct navigation to filter hash works', async ({ page }) => {
    await todo.addTodos(['Buy milk', 'Walk the dog']);
    await todo.toggleByText('Buy milk');

    await page.goto(TODO_URL.replace('#/', '#/completed'));

    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.todoLabels).toHaveText(['Buy milk']);
    await expect(todo.filterCompleted).toHaveClass(/selected/);
  });

  test('TC-210: navigating to an unknown hash falls back gracefully', async ({ page }) => {
    await todo.addTodos(['Buy milk', 'Walk the dog']);
    await todo.toggleByText('Buy milk');

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(TODO_URL.replace('#/', '#/foobar'));

    expect(errors).toEqual([]);
    expect(await todo.todoItems.count()).toBeGreaterThan(0);
  });

  test('TC-211: adding then immediately deleting the same item', async () => {
    await todo.addTodo('Temp');
    await expect(todo.todoItems).toHaveCount(1);

    await todo.deleteByText('Temp');

    await expect(todo.todoItems).toHaveCount(0);
    await expect(todo.counter).toBeHidden();
    await expect(todo.toggleAll).toBeHidden();
  });

  test('TC-212: toggle-all with mixed state completes all', async () => {
    await todo.addTodos(['A', 'B', 'C']);
    await todo.toggleByText('A');

    await todo.toggleAll.click();

    for (const t of ['A', 'B', 'C']) {
      await expect(todo.getItemByText(t).getByRole('checkbox')).toBeChecked();
      expect(await todo.isCompleted(t)).toBe(true);
    }
    await expect(todo.counter).toHaveText(/0\s+items left/i);
  });

  test('TC-213: editing preserves completed state', async () => {
    await todo.addTodo('Buy milk');
    await todo.toggleByText('Buy milk');
    expect(await todo.isCompleted('Buy milk')).toBe(true);

    await todo.editByText('Buy milk', 'Buy oat milk', 'enter');

    await expect(todo.todoLabels).toHaveText(['Buy oat milk']);
    expect(await todo.isCompleted('Buy oat milk')).toBe(true);
    await expect(todo.getItemByText('Buy oat milk').getByRole('checkbox')).toBeChecked();
  });

  test('TC-214: whitespace-only edit removes the item', async () => {
    await todo.addTodos(['Buy milk', 'Pay bills']);

    await todo.editByText('Buy milk', '   ', 'enter');

    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.todoLabels).toHaveText(['Pay bills']);
  });
});
