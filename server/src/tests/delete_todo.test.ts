
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion'
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];
    const input: DeleteTodoInput = { id: createdTodo.id };

    // Delete the todo
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify todo was deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false for non-existent todo', async () => {
    const input: DeleteTodoInput = { id: 999 };

    const result = await deleteTodo(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const createResults = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo' },
        { title: 'Todo 2', description: 'Second todo' },
        { title: 'Todo 3', description: 'Third todo' }
      ])
      .returning()
      .execute();

    const todoToDelete = createResults[1]; // Delete the middle one
    const input: DeleteTodoInput = { id: todoToDelete.id };

    // Delete one todo
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.find(todo => todo.id === todoToDelete.id)).toBeUndefined();
    expect(remainingTodos.find(todo => todo.id === createResults[0].id)).toBeDefined();
    expect(remainingTodos.find(todo => todo.id === createResults[2].id)).toBeDefined();
  });
});
