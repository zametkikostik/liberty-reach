/**
 * Notes UI Components
 */

import React, { useState } from 'react';
import type { Note, NoteType } from '../types.js';

/**
 * NoteEditor props
 */
export interface NoteEditorProps {
  note?: Note | null;
  onSave?: (note: Partial<Note>) => void;
  onCancel?: () => void;
}

/**
 * NoteEditor - Create and edit notes
 */
export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [type, setType] = useState<NoteType>(note?.type || 'text');

  const handleSave = () => {
    onSave?.({
      ...note,
      title,
      content,
      type,
    });
  };

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          className="note-title-input"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="note-type-select"
          value={type}
          onChange={(e) => setType(e.target.value as NoteType)}
        >
          <option value="text">Text</option>
          <option value="checklist">Checklist</option>
          <option value="link">Link</option>
          <option value="media">Media</option>
          <option value="file">File</option>
          <option value="voice">Voice</option>
        </select>
      </div>

      <textarea
        className="note-content-input"
        placeholder="Note content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
      />

      <div className="note-editor-actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

/**
 * NotesList props
 */
export interface NotesListProps {
  notes: Note[];
  onNoteClick?: (note: Note) => void;
  onNoteDelete?: (noteId: string) => void;
}

/**
 * NotesList - Display list of notes
 */
export const NotesList: React.FC<NotesListProps> = ({
  notes,
  onNoteClick,
  onNoteDelete,
}) => {
  return (
    <div className="notes-list">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`note-item ${note.isPinned ? 'pinned' : ''} ${note.isFavorite ? 'favorite' : ''}`}
          onClick={() => onNoteClick?.(note)}
        >
          <div className="note-item-header">
            <span className="note-item-title">{note.title || 'Untitled'}</span>
            <span className="note-item-type">{note.type}</span>
          </div>
          <div className="note-item-preview">
            {note.content.substring(0, 100)}
            {note.content.length > 100 ? '...' : ''}
          </div>
          <div className="note-item-footer">
            <span className="note-item-date">
              {new Date(note.updatedAt).toLocaleDateString()}
            </span>
            {note.isPinned && <span className="note-item-pin">📌</span>}
            {note.isFavorite && <span className="note-item-favorite">⭐</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
