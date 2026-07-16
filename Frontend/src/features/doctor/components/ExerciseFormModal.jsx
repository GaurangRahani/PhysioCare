import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  X, Upload, Video, Image, Loader2, ChevronLeft, ChevronRight, Trash2, Plus
} from 'lucide-react';

const BODY_PARTS = [
  'Neck', 'Shoulder', 'Upper Back', 'Lower Back', 'Core',
  'Hip', 'Knee', 'Ankle', 'Full Body', 'Other'
];

const ExerciseFormModal = ({ isOpen, onClose, exercise, onSaved }) => {
  const { getToken } = useAuth();
  const isEditing = !!exercise;

  const [form, setForm] = useState({
    name: '',
    description: '',
    instructions: '',
    target_body_part: '',
    video_url: '',
  });
  const [videoFile, setVideoFile] = useState(null);   // new file upload
  const [photoFiles, setPhotoFiles] = useState([]);    // new file uploads
  const [existingPhotos, setExistingPhotos] = useState([]); // URLs from DB (when editing)
  const [photoPreview, setPhotoPreview] = useState([]); // local Object URLs for preview
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const videoInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && exercise) {
      setForm({
        name: exercise.name || '',
        description: exercise.description || '',
        instructions: exercise.instructions || '',
        target_body_part: exercise.target_body_part || '',
        video_url: exercise.video_url || '',
      });
      setExistingPhotos(exercise.photo_urls || []);
    } else {
      setForm({ name: '', description: '', instructions: '', target_body_part: '', video_url: '' });
      setVideoFile(null);
      setPhotoFiles([]);
      setExistingPhotos([]);
      setPhotoPreview([]);
    }
    setError('');
  }, [exercise, isOpen]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleVideoFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setForm(f => ({ ...f, video_url: '' })); // clear URL if file chosen
    }
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    const totalAllowed = 5 - existingPhotos.length - photoFiles.length;
    const toAdd = files.slice(0, totalAllowed);
    setPhotoFiles(prev => [...prev, ...toAdd]);
    const previews = toAdd.map(f => URL.createObjectURL(f));
    setPhotoPreview(prev => [...prev, ...previews]);
  };

  const removeNewPhoto = (index) => {
    URL.revokeObjectURL(photoPreview[index]);
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Exercise name is required.'); return; }
    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('instructions', form.instructions);
      formData.append('target_body_part', form.target_body_part);

      // Video: either file or URL
      if (videoFile) {
        formData.append('video', videoFile);
      } else {
        formData.append('video_url', form.video_url);
      }

      // Existing photos to keep (on edit)
      if (isEditing) {
        existingPhotos.forEach(url => formData.append('photo_urls', url));
      }

      // New photo files
      photoFiles.forEach(file => formData.append('photos', file));

      const url = isEditing
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercises/${exercise.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercises`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onSaved(data.exercise);
        onClose();
      } else {
        setError(data.message || 'Failed to save exercise.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalPhotos = existingPhotos.length + photoFiles.length;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-heading">
              {isEditing ? 'Edit Exercise' : 'Add New Exercise'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Fill in the details for your exercise library</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-danger transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 text-danger text-sm font-medium rounded-xl border border-red-100">
              <X className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Name + Body Part row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Exercise Name <span className="text-danger">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Knee Extension"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Body Part</label>
              <select
                name="target_body_part"
                value={form.target_body_part}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
              >
                <option value="">— Select body part —</option>
                {BODY_PARTS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief overview of what this exercise targets..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition resize-none"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Step-by-step Instructions</label>
            <textarea
              name="instructions"
              value={form.instructions}
              onChange={handleChange}
              rows={5}
              placeholder="1. Start in a seated position...&#10;2. Slowly extend the knee...&#10;3. Hold for 3 seconds..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition resize-none"
            />
          </div>

          {/* Video Upload or URL */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Video</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Upload file */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Video className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-dark text-sm">{videoFile ? videoFile.name : 'Upload Video'}</p>
                  <p className="text-xs text-gray-400">MP4, MOV — max 100MB</p>
                </div>
              </button>
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />

              {/* Or URL */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  name="video_url"
                  value={videoFile ? '' : form.video_url}
                  onChange={handleChange}
                  disabled={!!videoFile}
                  placeholder="Or paste YouTube/Vimeo URL"
                  className="flex-1 bg-transparent text-sm text-dark placeholder-gray-400 focus:outline-none disabled:opacity-40"
                />
              </div>
            </div>
            {videoFile && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-success font-medium">✓ Video file selected</span>
                <button type="button" onClick={() => setVideoFile(null)} className="text-xs text-danger hover:underline">Remove</button>
              </div>
            )}
          </div>

          {/* Photo Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Photos ({totalPhotos}/5)</label>
              {totalPhotos < 5 && (
                <button type="button" onClick={() => photoInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-dark transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Photos
                </button>
              )}
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />

            {totalPhotos === 0 ? (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <Image className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-400">Click to upload photos</p>
                <p className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP — up to 5 images</p>
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {/* Existing photos */}
                {existingPhotos.map((url, i) => (
                  <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-danger rounded-full flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* New photos preview */}
                {photoPreview.map((url, i) => (
                  <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-danger rounded-full flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="absolute top-1.5 right-1.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</div>
                  </div>
                ))}
                {/* Add more button */}
                {totalPhotos < 5 && (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <Plus className="w-5 h-5 text-gray-300" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-dark transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-dark transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Exercise')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseFormModal;
