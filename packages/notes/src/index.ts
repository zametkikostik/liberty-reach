/**
 * Notes Feature for Liberty Reach
 * 
 * @module @liberty-reach/notes
 */

export { NotesManager, type NotesConfig } from './core/notes-manager.js';
export { NoteEditor } from './ui/note-editor.js';
export { NotesList } from './ui/notes-list.js';

export type {
  Note,
  NoteType,
  NoteFolder,
  NoteTag,
} from './types.js';
