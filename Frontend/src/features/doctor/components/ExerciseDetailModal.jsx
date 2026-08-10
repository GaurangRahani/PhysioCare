import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Target, FileText, User, AlertTriangle } from 'lucide-react';

// Embed helper — converts YouTube/Vimeo to embeddable URL
const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Cloudinary or direct mp4 — treat as video src
  return url;
};

const isEmbeddable = (url) => {
  return url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com'));
};

const BODY_PART_COLORS = {
  'Neck': 'bg-blue-100 text-blue-700',
  'Shoulder': 'bg-violet-100 text-violet-700',
  'Upper Back': 'bg-indigo-100 text-indigo-700',
  'Lower Back': 'bg-purple-100 text-purple-700',
  'Core': 'bg-orange-100 text-orange-700',
  'Hip': 'bg-pink-100 text-pink-700',
  'Knee': 'bg-green-100 text-green-700',
  'Ankle': 'bg-teal-100 text-teal-700',
  'Full Body': 'bg-primary/10 text-primary',
  'Other': 'bg-gray-100 text-gray-600',
};

const ExerciseDetailModal = ({ isOpen, onClose, exercise, onEdit, onDeactivate, onActivate }) => {
  const [mediaIndex, setMediaIndex] = useState(0); // 0 = video, 1+ = photos

  if (!isOpen || !exercise) return null;

  const photos = exercise.photo_urls || [];
  const hasVideo = !!exercise.video_url;
  // Build the ordered media list: video first, then photos
  const mediaList = [
    ...(hasVideo ? [{ type: 'video', url: exercise.video_url }] : []),
    ...photos.map(url => ({ type: 'photo', url })),
  ];
  const currentMedia = mediaList[mediaIndex];
  const bodyPartColor = BODY_PART_COLORS[exercise.target_body_part] || 'bg-gray-100 text-gray-600';

  const prev = () => setMediaIndex(i => Math.max(0, i - 1));
  const next = () => setMediaIndex(i => Math.min(mediaList.length - 1, i + 1));

  const instructions = exercise.instructions
    ? exercise.instructions.split('\n').filter(l => l.trim())
    : [];

  return (
    <div className="modal-overlay" id="viewExerciseModal" onClick={(e) => {
      if (e.target.id === 'viewExerciseModal') onClose();
    }}>
      <div className="modal-content">
        
        {/* Carousel Header */}
        <div className="modal-carousel">
          <button className="modal-close-icon" onClick={onClose}>&times;</button>
          
          {mediaList.length > 0 ? (
            <>
              {currentMedia?.type === 'video' ? (
                isEmbeddable(currentMedia.url) ? (
                  <iframe
                    src={getEmbedUrl(currentMedia.url)}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title="Exercise Video"
                    style={{ border: 'none' }}
                  />
                ) : (
                  <video src={currentMedia.url} controls className="w-full h-full object-contain" />
                )
              ) : (
                <img src={currentMedia?.url} alt={exercise.name} />
              )}
              
              {mediaList.length > 1 && (
                <>
                  <button className="carousel-btn prev" onClick={prev} disabled={mediaIndex === 0}>&lt;</button>
                  <button className="carousel-btn next" onClick={next} disabled={mediaIndex === mediaList.length - 1}>&gt;</button>
                  <div className="carousel-counter">{mediaIndex + 1} / {mediaList.length}</div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
              <p>No media attached</p>
            </div>
          )}
        </div>
        
        <div className="modal-scrollable-body">
          <h2>
            {exercise.name}
            {!exercise.is_active && <span className="ml-3 text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400 align-middle">Inactive</span>}
          </h2>
          {exercise.description && (
            <p className="text-gray-muted mb-4">{exercise.description}</p>
          )}
          
          {exercise.target_body_part && (
            <div className="targets-box mb-4">
              <div className="targets-icon"><Target className="w-5 h-5 text-primary" /></div>
              <div>
                <h5 className="mb-1 text-sm font-bold">Targeted Areas</h5>
                <span className={`badge badge-${exercise.target_body_part.toLowerCase().replace(' ', '-')}`}>
                  {exercise.target_body_part}
                </span>
              </div>
            </div>
          )}
          
          {instructions.length > 0 && (
            <>
              <h4 className="mb-3">Instructions</h4>
              <ul className="step-list">
                {instructions.map((step, i) => {
                  const text = step.replace(/^\d+[\.\)]\s*/, '');
                  return (
                    <li className="step-item" key={i}>
                      <div className="step-number">{i + 1}</div>
                      <span>{text}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Footer (Custom for React logic to allow Edit/Deactivate) */}
        <div className="modal-footer">
          {exercise.is_active ? (
            <>
              <button onClick={() => onDeactivate(exercise)} className="btn-danger-text bg-transparent border-0 cursor-pointer flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Deactivate
              </button>
              <button onClick={() => { onClose(); onEdit(exercise); }} className="btn btn-primary">
                Edit Exercise
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 font-medium m-0">This exercise is currently inactive.</p>
              <button onClick={() => onActivate(exercise)} className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }}>
                Reactivate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;
