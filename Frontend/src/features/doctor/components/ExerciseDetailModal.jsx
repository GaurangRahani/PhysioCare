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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-heading">{exercise.name}</h2>
              {exercise.target_body_part && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${bodyPartColor}`}>
                  {exercise.target_body_part}
                </span>
              )}
              {!exercise.is_active && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400">Inactive</span>
              )}
            </div>
            {exercise.description && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{exercise.description}</p>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-danger transition-all flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {/* Media Viewer */}
          {mediaList.length > 0 ? (
            <div className="relative bg-dark">
              {/* Media display */}
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                {currentMedia?.type === 'video' ? (
                  isEmbeddable(currentMedia.url) ? (
                    <iframe
                      src={getEmbedUrl(currentMedia.url)}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title="Exercise Video"
                    />
                  ) : (
                    <video
                      src={currentMedia.url}
                      controls
                      className="absolute inset-0 w-full h-full object-contain bg-dark"
                    />
                  )
                ) : (
                  <img
                    src={currentMedia?.url}
                    alt={exercise.name}
                    className="absolute inset-0 w-full h-full object-contain bg-dark"
                  />
                )}
              </div>

              {/* Navigation arrows */}
              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    disabled={mediaIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center disabled:opacity-30 transition-all backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={next}
                    disabled={mediaIndex === mediaList.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center disabled:opacity-30 transition-all backdrop-blur-sm"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {mediaList.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setMediaIndex(i)}
                        className={`transition-all rounded-full ${i === mediaIndex ? 'bg-white w-5 h-1.5' : 'bg-white/50 w-1.5 h-1.5'}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Video badge */}
              {currentMedia?.type === 'video' && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-full">
                  <Play className="w-3 h-3 fill-white" /> Video
                </div>
              )}

              {/* Photo index */}
              {mediaList.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-full">
                  {mediaIndex + 1} / {mediaList.length}
                </div>
              )}
            </div>
          ) : (
            <div className="h-32 bg-gray-50 flex items-center justify-center">
              <p className="text-sm text-gray-400">No media attached</p>
            </div>
          )}

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Instructions */}
            {instructions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-heading text-sm uppercase tracking-wider">Step-by-step Instructions</h3>
                </div>
                <ol className="space-y-3">
                  {instructions.map((step, i) => {
                    // Strip leading numbering if present (e.g. "1. ", "1) ")
                    const text = step.replace(/^\d+[\.\)]\s*/, '');
                    return (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-sm text-body leading-relaxed pt-0.5">{text}</p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Target body part */}
            {exercise.target_body_part && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Target className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Targets</p>
                  <p className="font-semibold text-dark text-sm mt-0.5">{exercise.target_body_part}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}

        {/* Footer — always visible, content changes based on is_active */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {exercise.is_active ? (
            <>
              <button
                onClick={() => onDeactivate(exercise)}
                className="flex items-center gap-2 text-sm font-semibold text-danger hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Deactivate
              </button>
              <button
                onClick={() => { onClose(); onEdit(exercise); }}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-dark transition-colors shadow-sm"
              >
                Edit Exercise
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 font-medium">This exercise is currently inactive.</p>
              <button
                onClick={() => onActivate(exercise)}
                className="flex items-center gap-2 px-6 py-2 bg-success text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-all shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" /> Reactivate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;
