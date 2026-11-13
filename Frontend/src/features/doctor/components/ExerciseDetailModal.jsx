import React, { useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, AlertTriangle, Edit2, EyeOff, Eye, FileText
} from 'lucide-react';

// Embed helper — converts YouTube/Vimeo to embeddable URL
const getEmbedUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const isEmbeddable = (url) => {
  return url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com'));
};

const ExerciseDetailModal = ({ isOpen, onClose, exercise, onEdit, onDeactivate, onActivate }) => {
  const [mediaIndex, setMediaIndex] = useState(0);

  if (!isOpen || !exercise) return null;

  const photos = exercise.photo_urls || [];
  const hasVideo = !!exercise.video_url;
  const mediaList = [
    ...(hasVideo ? [{ type: 'video', url: exercise.video_url }] : []),
    ...photos.map(url => ({ type: 'photo', url })),
  ];
  const currentMedia = mediaList[mediaIndex];

  const prev = () => setMediaIndex(i => Math.max(0, i - 1));
  const next = () => setMediaIndex(i => Math.min(mediaList.length - 1, i + 1));

  const instructions = exercise.instructions
    ? exercise.instructions.split('\n').filter(l => l.trim())
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
      <div 
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Media Showcase / Carousel */}
        <div className="relative aspect-video w-full bg-[#111111] flex items-center justify-center overflow-hidden">
          {/* Close button on top-right */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>

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
                <img src={currentMedia?.url} alt={exercise.name} className="w-full h-full object-contain" />
              )}

              {/* Prev / Next controls */}
              {mediaList.length > 1 && (
                <>
                  <button 
                    type="button"
                    onClick={prev} 
                    disabled={mediaIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={next} 
                    disabled={mediaIndex === mediaList.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-medium backdrop-blur-xs">
                    {mediaIndex + 1} / {mediaList.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-[#8A8A8A] gap-2">
              <AlertTriangle size={28} className="opacity-40" />
              <span className="text-[12px]">No media attached for this exercise</span>
            </div>
          )}
        </div>

        {/* Scrollable Details Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-[#202223]">
          {/* Header row */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {exercise.target_body_part && (
                <span className="badge-semantic-neutral text-[11px] font-medium">
                  {exercise.target_body_part}
                </span>
              )}
              {exercise.is_active ? (
                <span className="badge-semantic-success text-[11px] font-medium">Active</span>
              ) : (
                <span className="badge-semantic-error text-[11px] font-medium">Inactive</span>
              )}
            </div>
            <h2 className="text-[20px] font-semibold text-[#202223] tracking-tight m-0">
              {exercise.name}
            </h2>
          </div>

          {/* Description */}
          {exercise.description && (
            <div className="p-3.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl text-[13px] text-[#616161] leading-relaxed">
              {exercise.description}
            </div>
          )}

          {/* Step-by-step Instructions */}
          {instructions.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3 flex items-center gap-1.5">
                <FileText size={14} /> Step-by-Step Instructions
              </h4>
              <ol className="space-y-2.5 m-0 p-0 list-none">
                {instructions.map((step, i) => {
                  const text = step.replace(/^\d+[.)]\s*/, '');
                  return (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] hover:bg-[#F9F9F9] transition-colors">
                      <span className="w-5 h-5 rounded-full bg-[#111111] text-[#FFFFFF] text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-[#202223] leading-relaxed">{text}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA]">
          {exercise.is_active ? (
            <button 
              type="button"
              onClick={() => onDeactivate(exercise)} 
              className="text-[#E5484D] hover:bg-[#FCE4E4] px-3 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <EyeOff size={14} /> Deactivate
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => onActivate(exercise)} 
              className="text-[#245B19] bg-[#D9F7C3] hover:bg-[#c6f3a7] px-3 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye size={14} /> Reactivate
            </button>
          )}

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => { onClose(); onEdit(exercise); }} 
              className="btn-secondary-saas flex items-center gap-1.5"
            >
              <Edit2 size={13} /> Edit
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="btn-primary-saas"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;
