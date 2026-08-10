import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

const ExerciseMediaCarousel = ({ videoUrl, imageUrls }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  const mediaItems = [
    ...(videoUrl ? [{ type: 'video', url: videoUrl }] : []),
    ...(imageUrls || []).map(url => ({ type: 'image', url }))
  ];

  const videoIndex = mediaItems.findIndex(item => item.type === 'video');

  useEffect(() => {
    if (videoRef.current && currentIndex !== videoIndex) {
      videoRef.current.pause();
    }
  }, [currentIndex, videoIndex]);

  if (mediaItems.length === 0) {
    return (
      <div className="bg-slate-100 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-400">
        <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-2">
          <Play className="w-8 h-8 ml-1 opacity-50" />
        </div>
        <p className="text-sm font-medium">No demonstration added yet</p>
      </div>
    );
  }

  const goNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const goPrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const currentItem = mediaItems[currentIndex];

  return (
    <div className="relative w-full h-full overflow-hidden bg-transparent">
      <div className="flex items-center justify-center w-full h-full">
        {currentItem.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentItem.url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentItem.url}
            alt={`Exercise demonstration ${currentIndex}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      {mediaItems.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 hover:bg-black/50 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 hover:bg-black/50 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {mediaItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? 'w-2 h-2 bg-purple-600'
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExerciseMediaCarousel;
