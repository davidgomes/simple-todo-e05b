
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Form state for creating new todos
  const [createFormData, setCreateFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing todos
  const [editFormData, setEditFormData] = useState<Partial<UpdateTodoInput>>({
    title: '',
    description: null
  });

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTodo.mutate(createFormData);
      setTodos((prev: Todo[]) => [...prev, response]);
      setCreateFormData({
        title: '',
        description: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateTodoInput = {
        id: editingTodo.id,
        ...editFormData
      };
      const response = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => todo.id === response.id ? response : todo)
      );
      setEditingTodo(null);
      setEditFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updateData: UpdateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };
      const response = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === response.id ? response : t)
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditFormData({
      title: todo.title,
      description: todo.description
    });
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditFormData({
      title: '',
      description: null
    });
  };

  const completedTodos = todos.filter((todo: Todo) => todo.completed);
  const pendingTodos = todos.filter((todo: Todo) => !todo.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ My Todo List</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{todos.length}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingTodos.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedTodos.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Todo Button */}
        <div className="mb-8">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Todo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>✨ Create New Todo</DialogTitle>
                <DialogDescription>
                  Add a new task to your todo list. What would you like to accomplish?
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Enter task title..."
                    value={createFormData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                  <Textarea
                    placeholder="Add a description (optional)..."
                    value={createFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateTodoInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-500 to-indigo-600">
                    {isLoading ? 'Creating...' : '🚀 Create Todo'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Todo Lists */}
        <div className="space-y-8">
          {/* Pending Todos */}
          {pendingTodos.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Circle className="w-6 h-6 mr-2 text-orange-500" />
                Pending Tasks ({pendingTodos.length})
              </h2>
              <div className="space-y-3">
                {pendingTodos.map((todo: Todo) => (
                  <Card key={todo.id} className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => handleToggleComplete(todo)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 break-words">{todo.title}</h3>
                          {todo.description && (
                            <p className="text-gray-600 mt-1 break-words">{todo.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Created: {todo.created_at.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(todo)}
                            className="hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-200">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>🗑️ Delete Todo</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(todo.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <CheckCircle2 className="w-6 h-6 mr-2 text-green-500" />
                Completed Tasks ({completedTodos.length})
              </h2>
              <div className="space-y-3">
                {completedTodos.map((todo: Todo) => (
                  <Card key={todo.id} className="bg-green-50/80 backdrop-blur-sm border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => handleToggleComplete(todo)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-600 line-through break-words">{todo.title}</h3>
                          {todo.description && (
                            <p className="text-gray-500 mt-1 line-through break-words">{todo.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Completed: {todo.updated_at.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-200">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>🗑️ Delete Todo</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(todo.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {todos.length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No todos yet!</h3>
                  <p className="text-gray-500 mb-4">Create your first todo to get started on your productivity journey.</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Todo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingTodo} onOpenChange={(open: boolean) => !open && cancelEdit()}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>✏️ Edit Todo</DialogTitle>
              <DialogDescription>
                Make changes to your todo item below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Enter task title..."
                  value={editFormData.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateTodoInput>) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
                <Textarea
                  placeholder="Add a description (optional)..."
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: Partial<UpdateTodoInput>) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-500 to-indigo-600">
                  {isLoading ? 'Saving...' : '💾 Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
