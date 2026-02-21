/**
 * Folder Editor UI Component
 */

import React, { useState } from 'react';
import type { FolderInclude, FolderExclude, FilterType } from '../types.js';

/**
 * FolderEditor props
 */
export interface FolderEditorProps {
  folderName?: string;
  folderIcon?: string;
  folderColor?: string;
  includes?: FolderInclude[];
  excludes?: FolderExclude[];
  onSave?: (data: {
    name: string;
    icon?: string;
    color?: string;
    includes: FolderInclude[];
    excludes: FolderExclude[];
  }) => void;
  onCancel?: () => void;
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'non_contacts', label: 'Non-Contacts' },
  { value: 'groups', label: 'Groups' },
  { value: 'channels', label: 'Channels' },
  { value: 'bots', label: 'Bots' },
  { value: 'unread', label: 'Unread' },
  { value: 'muted', label: 'Muted' },
];

/**
 * FolderEditor - Create and edit chat folders
 */
export const FolderEditor: React.FC<FolderEditorProps> = ({
  folderName = '',
  folderIcon,
  folderColor,
  includes = [],
  excludes = [],
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(folderName);
  const [icon, setIcon] = useState(folderIcon || '');
  const [color, setColor] = useState(folderColor || '');
  const [selectedIncludes, setSelectedIncludes] = useState<FolderInclude[]>(includes);
  const [selectedExcludes, setSelectedExcludes] = useState<FolderExclude[]>(excludes);

  const handleAddInclude = (type: FilterType) => {
    if (!selectedIncludes.find(i => i.type === type)) {
      setSelectedIncludes([...selectedIncludes, { type }]);
    }
  };

  const handleRemoveInclude = (type: FilterType) => {
    setSelectedIncludes(selectedIncludes.filter(i => i.type !== type));
  };

  const handleAddExclude = (type: FilterType) => {
    if (!selectedExcludes.find(e => e.type === type)) {
      setSelectedExcludes([...selectedExcludes, { type }]);
    }
  };

  const handleRemoveExclude = (type: FilterType) => {
    setSelectedExcludes(selectedExcludes.filter(e => e.type !== type));
  };

  const handleSave = () => {
    onSave?.({
      name,
      icon: icon || undefined,
      color: color || undefined,
      includes: selectedIncludes,
      excludes: selectedExcludes,
    });
  };

  return (
    <div className="folder-editor">
      <div className="folder-editor-header">
        <h2>Create Folder</h2>
      </div>

      <div className="folder-editor-form">
        <div className="form-group">
          <label>Folder Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter folder name"
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label>Icon (emoji)</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📁"
            maxLength={5}
          />
        </div>

        <div className="form-group">
          <label>Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Include</label>
          <div className="filter-selector">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`filter-btn ${selectedIncludes.find(i => i.type === option.value) ? 'selected' : ''}`}
                onClick={() => handleAddInclude(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="selected-filters">
            {selectedIncludes.map(include => (
              <span key={include.type} className="filter-tag">
                {FILTER_OPTIONS.find(f => f.value === include.type)?.label}
                <button onClick={() => handleRemoveInclude(include.type)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Exclude</label>
          <div className="filter-selector">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`filter-btn ${selectedExcludes.find(e => e.type === option.value) ? 'selected' : ''}`}
                onClick={() => handleAddExclude(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="selected-filters">
            {selectedExcludes.map(exclude => (
              <span key={exclude.type} className="filter-tag exclude">
                {FILTER_OPTIONS.find(f => f.value === exclude.type)?.label}
                <button onClick={() => handleRemoveExclude(exclude.type)}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="folder-editor-actions">
        <button className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-save" onClick={handleSave}>
          Create Folder
        </button>
      </div>
    </div>
  );
};
