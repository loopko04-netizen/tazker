import { create } from 'zustand';
import { getDatabase } from '../db/database';

export const useNotesStore = create((set, get) => ({
  notes: [],
  loadNotes: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM notes WHERE is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC');
    set({ notes: rows });
  },
  createNote: async (title, content) => {
    const db = await getDatabase();
    const now = Date.now();
    const result = await db.runAsync(
      'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
      title, content, now, now
    );
    const created = { id: result.lastInsertRowId, title, content, is_pinned: 0, is_deleted: 0, created_at: now, updated_at: now };
    set((state) => ({ notes: [created, ...state.notes] }));
    return created;
  },
  updateNote: async (id, title, content) => {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?', title, content, now, id);
    set((state) => ({ notes: state.notes.map((n) => n.id === id ? { ...n, title, content, updated_at: now } : n) }));
  },
  togglePin: async (id) => {
    const db = await getDatabase();
    const current = get().notes.find((n) => n.id === id);
    if (!current) return;
    const pinned = current.is_pinned ? 0 : 1;
    const now = Date.now();
    await db.runAsync('UPDATE notes SET is_pinned = ?, updated_at = ? WHERE id = ?', pinned, now, id);
    set((state) => ({ notes: state.notes.map((n) => n.id === id ? { ...n, is_pinned: pinned, updated_at: now } : n) }));
  },
  deleteNote: async (id) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE notes SET is_deleted = 1 WHERE id = ?', id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },
  restoreNote: async (id) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE notes SET is_deleted = 0 WHERE id = ?', id);
    await get().loadNotes();
  }
}));
