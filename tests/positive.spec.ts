import { test, expect } from '@playwright/test';
import { TodoPage, TODO_URL } from './pages/todo-page';

const FOUR_TODOS = ['Buy milk', 'Walk the dog', 'Pay bills', 'Read book'];

test.describe('Positive flows', () => {
  let todo: TodoPage;

  test.beforeEach(async ({ page }) => {
    todo = new TodoPage(page);
    await todo.goto();
  });

  test('TC-001: empty list is rendered on first visit', async ({ page }) => {
    await expect(page).toHaveTitle(/TodoMVC/i);
    await expect(todo.heading).toBeVisible();
    await expect(todo.newTodoInput).toBeVisible();
    await expect(todo.newTodoInput).toBeFocused();
    await expect(todo.newTodoInput).toHaveValue('');
    await expect(todo.todoItems).toHaveCount(0);
    await expect(todo.counter).toBeHidden();
    await expect(todo.clearCompletedButton).toBeHidden();
    await expect(todo.toggleAll).toBeHidden();
  });

  test('TC-002: a single todo is created', async () => {
    await todo.addTodo('Buy milk');

    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.todoLabels).toHaveText(['Buy milk']);
    await expect(todo.getItemByText('Buy milk').getByRole('checkbox')).not.toBeChecked();
    await expect(todo.newTodoInput).toHaveValue('');
    await expect(todo.newTodoInput).toBeFocused();
    await expect(todo.counter).toHaveText(/1\s+item left/i);
    await expect(todo.toggleAll).toBeVisible();
  });

  test('TC-003: four todos are added sequentially (AC #1 + AC #2)', async () => {
    await todo.addTodos(FOUR_TODOS);

    await expect(todo.todoItems).toHaveCount(4);
    await expect(todo.todoLabels).toHaveText(FOUR_TODOS);
    await expect(todo.counter).toHaveText(/4\s+items left/i);
    for (const t of FOUR_TODOS) {
      await expect(todo.getItemByText(t).getByRole('checkbox')).not.toBeChecked();
    }
  });

  test('TC-004: a todo is marked as completed (AC #3)', async () => {
    await todo.addTodos(FOUR_TODOS);

    await todo.toggleByText('Walk the dog');

    await expect(todo.getItemByText('Walk the dog').getByRole('checkbox')).toBeChecked();
    expect(await todo.isCompleted('Walk the dog')).toBe(true);
    await expect(todo.counter).toHaveText(/3\s+items left/i);
    await expect(todo.clearCompletedButton).toBeVisible();

    for (const t of ['Buy milk', 'Pay bills', 'Read book']) {
      await expect(todo.getItemByText(t).getByRole('checkbox')).not.toBeChecked();
      expect(await todo.isCompleted(t)).toBe(false);
    }
  });

  test('TC-005: a completed todo can be re-opened', async () => {
    await todo.addTodos(FOUR_TODOS);
    await todo.toggleByText('Walk the dog');
    await expect(todo.counter).toHaveText(/3\s+items left/i);

    await todo.toggleByText('Walk the dog');

    await expect(todo.getItemByText('Walk the dog').getByRole('checkbox')).not.toBeChecked();
    expect(await todo.isCompleted('Walk the dog')).toBe(false);
    await expect(todo.counter).toHaveText(/4\s+items left/i);
    await expect(todo.clearCompletedButton).toBeHidden();
  });

  test('TC-006: a todo is removed via the destroy (×) button (AC #4)', async () => {
    await todo.addTodos(FOUR_TODOS);

    await todo.deleteByText('Pay bills');

    await expect(todo.todoItems).toHaveCount(3);
    await expect(todo.todoLabels).toHaveText(['Buy milk', 'Walk the dog', 'Read book']);
    await expect(todo.counter).toHaveText(/3\s+items left/i);
  });

  test('TC-007: Clear completed removes only completed items', async () => {
    await todo.addTodos(FOUR_TODOS);
    await todo.toggleByText('Buy milk');
    await todo.toggleByText('Pay bills');

    await todo.clearCompletedButton.click();

    await expect(todo.todoItems).toHaveCount(2);
    await expect(todo.todoLabels).toHaveText(['Walk the dog', 'Read book']);
    await expect(todo.counter).toHaveText(/2\s+items left/i);
    await expect(todo.clearCompletedButton).toBeHidden();
  });

  test('TC-008: toggle-all marks every item complete, then active', async () => {
    await todo.addTodos(FOUR_TODOS);

    await todo.toggleAll.click();
    for (const t of FOUR_TODOS) {
      await expect(todo.getItemByText(t).getByRole('checkbox')).toBeChecked();
    }
    await expect(todo.counter).toHaveText(/0\s+items left/i);
    await expect(todo.clearCompletedButton).toBeVisible();

    await todo.toggleAll.click();
    for (const t of FOUR_TODOS) {
      await expect(todo.getItemByText(t).getByRole('checkbox')).not.toBeChecked();
    }
    await expect(todo.counter).toHaveText(/4\s+items left/i);
    await expect(todo.clearCompletedButton).toBeHidden();
  });

  test('TC-009: filter Active shows only uncompleted items', async ({ page }) => {
    await todo.addTodos(FOUR_TODOS);
    await todo.toggleByText('Walk the dog');
    await todo.toggleByText('Read book');

    await todo.filterActive.click();

    await expect(todo.todoItems).toHaveCount(2);
    await expect(todo.todoLabels).toHaveText(['Buy milk', 'Pay bills']);
    expect(page.url()).toContain('#/active');
    await expect(todo.filterActive).toHaveClass(/selected/);
    await expect(todo.counter).toHaveText(/2\s+items left/i);
  });

  test('TC-010: filter Completed shows only completed items', async ({ page }) => {
    await todo.addTodos(FOUR_TODOS);
    await todo.toggleByText('Walk the dog');
    await todo.toggleByText('Read book');

    await todo.filterCompleted.click();

    await expect(todo.todoItems).toHaveCount(2);
    await expect(todo.todoLabels).toHaveText(['Walk the dog', 'Read book']);
    expect(page.url()).toContain('#/completed');
    await expect(todo.filterCompleted).toHaveClass(/selected/);
  });

  test('TC-011: filter All restores full list', async ({ page }) => {
    await todo.addTodos(FOUR_TODOS);
    await todo.toggleByText('Walk the dog');
    await todo.filterActive.click();
    await expect(todo.todoItems).toHaveCount(3);

    await todo.filterAll.click();

    await expect(todo.todoItems).toHaveCount(4);
    await expect(todo.todoLabels).toHaveText(FOUR_TODOS);
    expect(page.url()).toMatch(/#\/?$/);
  });

  test('TC-012: a todo can be edited via double-click', async () => {
    await todo.addTodo('Buy milk');

    await todo.editByText('Buy milk', 'Buy almond milk', 'enter');

    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.todoLabels).toHaveText(['Buy almond milk']);
    await expect(todo.counter).toHaveText(/1\s+item left/i);
  });

  test('TC-013: edited todo is saved when input loses focus (blur)', async () => {
    await todo.addTodo('Buy milk');

    await todo.editByText('Buy milk', 'Buy milk (2L)', 'blur');

    await expect(todo.todoLabels).toHaveText(['Buy milk (2L)']);
  });

  test('TC-014: todos persist after page reload (local storage)', async ({ page }) => {
    await todo.addTodos(FOUR_TODOS);
    await todo.toggleByText('Buy milk');

    await page.reload();

    await expect(todo.todoItems).toHaveCount(4);
    await expect(todo.todoLabels).toHaveText(FOUR_TODOS);
    expect(await todo.isCompleted('Buy milk')).toBe(true);
    expect(await todo.isCompleted('Walk the dog')).toBe(false);
    await expect(todo.counter).toHaveText(/3\s+items left/i);
  });
});
