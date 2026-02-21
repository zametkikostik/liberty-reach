/**
 * Chat Folders for Liberty Reach
 * 
 * @module @liberty-reach/folders
 */

export { FoldersManager, type FoldersConfig } from './core/folders-manager.js';
export { FolderEditor } from './ui/folder-editor.js';

export type {
  ChatFolder,
  FolderFilter,
  FolderInclude,
  FolderExclude,
} from './types.js';
