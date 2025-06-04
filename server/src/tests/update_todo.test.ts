
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (input: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description || null
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    // Create a test todo first
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testTodo.updated_at.getTime());
  });

  it('should update todo description', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Title'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should update todo completion status', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Title',
      description: 'Test description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Title'); // Should remain unchanged
    expect(result.description).toEqual('Test description'); // Should remain unchanged
    expect(result.completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Title'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should save updated todo to database', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify the changes were persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Original description');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo not found', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/Todo with id 999999 not found/i);
  });
});
