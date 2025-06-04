
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos ordered by created_at desc', async () => {
    // Create test todos with slight delay to ensure different timestamps
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'First description',
        completed: false
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    
    // Should be ordered by created_at desc (newest first)
    expect(result[0].title).toEqual('Second Todo');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('First Todo');
    expect(result[1].description).toEqual('First description');
    expect(result[1].completed).toBe(false);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);

    // Verify ordering - second todo should have later timestamp
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return todos with all required fields', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'Test description',
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    const todo = result[0];

    // Verify all schema fields are present
    expect(typeof todo.id).toBe('number');
    expect(typeof todo.title).toBe('string');
    expect(todo.description === null || typeof todo.description === 'string').toBe(true);
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
  });
});
