/**
 * Story Editor Component
 */

import React, { useState, useRef } from 'react';
import type { StoryPrivacy } from '../types.js';

/**
 * Editor configuration
 */
export interface EditorConfig {
  maxCaptionLength: number;
  maxVideoDuration: number;
  enableFilters: boolean;
  enableText: boolean;
  enableDraw: boolean;
}

/**
 * StoryEditor props
 */
export interface StoryEditorProps {
  config?: Partial<EditorConfig>;
  onPublish?: (story: {
    type: 'photo' | 'video';
    media: File;
    caption?: string;
    privacy: StoryPrivacy;
  }) => void;
  onCancel?: () => void;
}

/**
 * StoryEditor - Create and edit stories
 */
export const StoryEditor: React.FC<StoryEditorProps> = ({
  config = {},
  onPublish,
  onCancel,
}) => {
  const defaultConfig: EditorConfig = {
    maxCaptionLength: 1000,
    maxVideoDuration: 60,
    enableFilters: true,
    enableText: true,
    enableDraw: true,
    ...config,
  };

  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState<StoryPrivacy>('everybody');
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const previewUrl = URL.createObjectURL(file);

    setMedia(file);
    setMediaType(isVideo ? 'video' : 'photo');
    setMediaPreview(previewUrl);
  };

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      videoRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], 'story-video.webm', { type: 'video/webm' });
        
        setMedia(file);
        setMediaType('video');
        setMediaPreview(URL.createObjectURL(file));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (videoRecorderRef.current && isRecording) {
      videoRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePublish = () => {
    if (!media) return;

    onPublish?.({
      type: mediaType as 'photo' | 'video',
      media,
      caption: caption || undefined,
      privacy,
    });
  };

  const filters = [
    { id: 'normal', name: 'Normal' },
    { id: 'vintage', name: 'Vintage' },
    { id: 'bw', name: 'B&W' },
    { id: 'vivid', name: 'Vivid' },
    { id: 'warm', name: 'Warm' },
    { id: 'cool', name: 'Cool' },
  ];

  return (
    <div className="story-editor">
      {/* Media preview */}
      <div className="story-editor-preview">
        {mediaPreview ? (
          <>
            {mediaType === 'photo' ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className={`story-preview filter-${selectedFilter}`}
              />
            ) : (
              <video
                src={mediaPreview}
                className={`story-preview filter-${selectedFilter}`}
                controls
              />
            )}

            {/* Caption overlay */}
            {defaultConfig.enableText && caption && (
              <div className="caption-overlay">{caption}</div>
            )}
          </>
        ) : (
          <div className="story-editor-placeholder">
            <p>Select or capture media</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="story-editor-controls">
        {/* Capture/Select buttons */}
        {!media && (
          <div className="capture-controls">
            <button
              className="btn-capture"
              onClick={handleCapture}
              disabled={isRecording}
            >
              {isRecording ? 'Recording...' : 'Record Video'}
            </button>
            {isRecording && (
              <button className="btn-stop" onClick={stopRecording}>
                Stop
              </button>
            )}
            
            <button
              className="btn-select"
              onClick={() => fileInputRef.current?.click()}
            >
              Select from Gallery
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Edit tools */}
        {media && (
          <>
            {/* Filters */}
            {defaultConfig.enableFilters && (
              <div className="filter-selector">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    className={`filter-btn ${selectedFilter === filter.id ? 'active' : ''}`}
                    onClick={() => setSelectedFilter(filter.id)}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            )}

            {/* Caption input */}
            {defaultConfig.enableText && (
              <textarea
                className="caption-input"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={defaultConfig.maxCaptionLength}
                rows={3}
              />
            )}

            {/* Privacy selector */}
            <select
              className="privacy-selector"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as StoryPrivacy)}
            >
              <option value="everybody">Everybody</option>
              <option value="contacts">Contacts Only</option>
              <option value="close_friends">Close Friends</option>
              <option value="selected_contacts">Selected Contacts</option>
            </select>

            {/* Action buttons */}
            <div className="action-buttons">
              <button className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="btn-publish"
                onClick={handlePublish}
                disabled={!media}
              >
                Share Story
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
