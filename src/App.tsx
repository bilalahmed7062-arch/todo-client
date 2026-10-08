import { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';

export type Priority = 'Low' | 'Medium' | 'High';

export interface Todo {
  id: string;
  text: string;
  priority: Priority;
  completed: boolean;
  due_date?: string | null;
  created_at?: string;
}

const API_BASE = 'http://localhost:5000/api/todos';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  // In-place editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      const data: Todo[] = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          priority,
          due_date: dueDate || null,
        }),
      });
      const newTodo: Todo = await res.json();
      setTodos((prev) => [newTodo, ...prev]);
      setInputText('');
      setDueDate('');
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      const updated: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const saveEdit = async (id: string): Promise<void> => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editingText.trim() }),
      });
      const updated: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      saveEdit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingText('');
    }
  };

  const deleteTodo = async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleClearCompleted = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/completed`, { method: 'DELETE' });
      setTodos((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      console.error('Failed to clear completed tasks:', err);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = todos.length - completedCount;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'completed') return todo.completed;
    if (filter === 'pending') return !todo.completed;
    return true;
  });

  const getPriorityStyle = (p: Priority) => {
    switch (p) {
      case 'High':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetFormatted = new Date(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate()
    );

    const diffTime = targetFormatted.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    }
    if (diffDays === 0) {
      return { text: 'Today', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    }
    return {
      text: targetFormatted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: 'text-neutral-500 bg-neutral-100 border-neutral-200',
    };
  };

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        
        {/* Header */}
        <header className="px-6 pt-7 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Task Overview</h1>
              <p className="text-xs text-neutral-400 mt-0.5">Manage priorities and workflow</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100/80 rounded-full text-xs font-medium text-neutral-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {completedCount} / {todos.length} done
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="p-3.5 bg-neutral-50/70 border border-neutral-100 rounded-xl">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Pending</span>
              <p className="text-2xl font-semibold text-neutral-800 mt-0.5">{pendingCount}</p>
            </div>
            <div className="p-3.5 bg-neutral-50/70 border border-neutral-100 rounded-xl">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Completed</span>
              <p className="text-2xl font-semibold text-emerald-600 mt-0.5">{completedCount}</p>
            </div>
          </div>

          {/* Tier 1: Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center text-[11px] font-medium text-neutral-400 mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* Form Inputs (Input, Due Date & Priority) */}
        <div className="px-6 pb-2">
          <form onSubmit={handleAddTodo} className="space-y-2.5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full pl-3.5 pr-20 py-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl text-neutral-800 placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-medium rounded-lg transition"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              {/* Priority Picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-400 font-medium">Priority:</span>
                {(['Low', 'Medium', 'High'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition ${
                      priority === p
                        ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                        : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Tier 1: Due Date Picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-400 font-medium">Due:</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-[11px] px-2 py-0.5 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700 focus:outline-none focus:border-neutral-400 transition"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Tab Filters & Clear Completed Action */}
        <div className="flex items-center justify-between px-6 border-b border-neutral-100 mt-4">
          <div className="flex gap-6 text-xs font-medium text-neutral-400">
            {(['all', 'pending', 'completed'] as const).map((tab) => {
              const count =
                tab === 'all'
                  ? todos.length
                  : tab === 'pending'
                  ? pendingCount
                  : completedCount;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`pb-2.5 capitalize transition flex items-center gap-1.5 border-b-2 -mb-[1px] ${
                    filter === tab
                      ? 'border-neutral-900 text-neutral-900 font-semibold'
                      : 'border-transparent hover:text-neutral-600'
                  }`}
                >
                  {tab}
                  <span className="text-[10px] px-1.5 py-0.2 bg-neutral-100 rounded-full font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tier 1: Clear Completed Button */}
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-[11px] font-medium text-neutral-400 hover:text-rose-600 transition pb-2.5"
            >
              Clear completed
            </button>
          )}
        </div>

        {/* List Section */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 bg-neutral-100 rounded-xl"></div>
              <div className="h-10 bg-neutral-100 rounded-xl"></div>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-2 text-xs">
                ✓
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                {filter === 'all' ? 'All caught up!' : `No ${filter} tasks.`}
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {filteredTodos.map((todo) => {
                const priorityBadge = getPriorityStyle(todo.priority);
                const dueBadge = formatDueDate(todo.due_date);
                const isEditing = editingId === todo.id;

                return (
                  <li
                    key={todo.id}
                    className="group flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-200/80 bg-white hover:bg-neutral-50/50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden mr-2">
                      {/* Custom Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                          todo.completed
                            ? 'bg-neutral-900 border-neutral-900 text-white'
                            : 'border-neutral-300 group-hover:border-neutral-400'
                        }`}
                      >
                        {todo.completed && (
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 12 12">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                          </svg>
                        )}
                      </button>

                      {/* Tier 1: In-Place Editing or Display Text */}
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, todo.id)}
                          onBlur={() => saveEdit(todo.id)}
                          autoFocus
                          className="flex-1 text-xs px-2 py-1 border border-neutral-300 rounded bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        />
                      ) : (
                        <span
                          onDoubleClick={() => {
                            setEditingId(todo.id);
                            setEditingText(todo.text);
                          }}
                          className={`text-xs truncate transition cursor-pointer select-none ${
                            todo.completed
                              ? 'line-through text-neutral-400'
                              : 'text-neutral-700'
                          }`}
                          title="Double click to edit"
                        >
                          {todo.text}
                        </span>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {dueBadge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${dueBadge.color}`}
                        >
                          {dueBadge.text}
                        </span>
                      )}

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${priorityBadge}`}
                      >
                        {todo.priority}
                      </span>

                      {/* Edit Pencil Icon Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(todo.id);
                          setEditingText(todo.text);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 text-xs px-1 transition"
                        title="Edit task"
                      >
                        ✎
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 text-xs px-1 transition"
                        title="Delete task"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </main>
  );
}