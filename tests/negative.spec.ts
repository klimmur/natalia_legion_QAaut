import { test, expect } from '@playwright/test';
import { TodoPage } from './pages/todo-page';

test.describe('Negative flows', () => {
  let todo: TodoPage;

  test.beforeEach(async ({ page }) => {
    todo = new TodoPage(page);
    await todo.goto();
  });

  test('TC-101: empty submission does NOT create a todo', async () => {
    await todo.newTodoInput.focus();
    await todo.newTodoInput.press('Enter');

    await expect(todo.todoItems).toHaveCount(0);
    await expect(todo.counter).toBeHidden();
    await expect(todo.toggleAll).toBeHidden();
  });

  test('TC-102: whitespace-only submission does NOT create a todo', async () => {
    await todo.addTodo('   ');

    await expect(todo.todoItems).toHaveCount(0);
    await expect(todo.counter).toBeHidden();
    await expect(todo.toggleAll).toBeHidden();
    await expect(todo.newTodoInput).toHaveValue('   ');
  });

  test('TC-103: editing a todo to empty string removes the item', async () => {
    await todo.addTodos(['Buy milk', 'Pay bills']);

    await todo.editByText('Buy milk', '', 'enter');

    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.todoLabels).toHaveText(['Pay bills']);
    await expect(todo.counter).toHaveText(/1\s+item left/i);
  });

  test('TC-104: Escape during edit cancels changes', async () => {
    await todo.addTodo('Buy milk');

    await todo.editByText('Buy milk', 'Buy milk extra', 'escape');

    await expect(todo.todoLabels).toHaveText(['Buy milk']);
  });

  test('TC-105: removing the last completed item hides Clear completed', async () => {
    await todo.addTodos(['Buy milk', 'Pay bills']);
    await todo.toggleByText('Buy milk');
    await expect(todo.clearCompletedButton).toBeVisible();

    await todo.deleteByText('Buy milk');

    await expect(todo.todoItems).toHaveCount(1);
    await expect(todo.clearCompletedButton).toBeHidden();
  });

  test('TC-106: removing the last item hides footer and toggle-all', async () => {
    await todo.addTodo('Buy milk');
    await expect(todo.toggleAll).toBeVisible();
    await expect(todo.counter).toBeVisible();

    await todo.deleteByText('Buy milk');

    await expect(todo.todoItems).toHaveCount(0);
    await expect(todo.counter).toBeHidden();
    await expect(todo.toggleAll).toBeHidden();
    await expect(todo.filterAll).toBeHidden();
    await expect(todo.filterActive).toBeHidden();
    await expect(todo.filterCompleted).toBeHidden();
  });

  test('TC-107: completed items are not shown on Active filter', async () => {
    await todo.addTodos(['Buy milk', 'Pay bills']);
    await todo.toggleAll.click();
    await todo.filterActive.click();

    await expect(todo.todoItems).toHaveCount(0);
    await expect(todo.counter).toHaveText(/0\s+items left/i);
    await expect(todo.filterCompleted).toBeVisible();
  });

  test('TC-108: active items are not shown on Completed filter', async () => {
    await todo.addTodos(['Buy milk', 'Pay bills']);

    await todo.filterCompleted.click();

    await expect(todo.todoItems).toHaveCount(0);
    await expect(todo.counter).toHaveText(/2\s+items left/i);
  });

  test('TC-109: clicking destroy on one item does not affect siblings', async () => {
    await todo.addTodos(['A', 'B', 'C']);

    await todo.deleteByText('B');

    await expect(todo.todoItems).toHaveCount(2);
    await expect(todo.todoLabels).toHaveText(['A', 'C']);
    await expect(todo.counter).toHaveText(/2\s+items left/i);
  });

  test('TC-110: counter pluralization (1 item left vs N items left)', async () => {
    await todo.addTodo('Task 1');
    await expect(todo.counter).toHaveText(/^\s*1\s+item left\s*$/i);

    await todo.addTodo('Task 2');
    await expect(todo.counter).toHaveText(/^\s*2\s+items left\s*$/i);

    await todo.toggleByText('Task 1');
    await expect(todo.counter).toHaveText(/^\s*1\s+item left\s*$/i);

    await todo.toggleByText('Task 2');
    await expect(todo.counter).toHaveText(/^\s*0\s+items left\s*$/i);
  });
});
