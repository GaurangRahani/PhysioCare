import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  X, Video, Image as ImageIcon, Loader2, Trash2, Plus, AlertTriangle
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
  const [videoFile, setVideoFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
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
  }, [exercise, isOpen, isEditing]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleVideoFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setForm(f => ({ ...f, video_url: '' }));
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

      if (videoFile) {
        formData.append('video', videoFile);
      } else if (form.video_url) {
        formData.append('video_url', form.video_url);
      }

      photoFiles.forEach(file => {
        formData.append('photos', file);
      });

      if (isEditing) {
        formData.append('existing_photos', JSON.stringify(existingPhotos));
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = isEditing
        ? `${apiUrl}/api/exercises/${exercise.id}`
        : `${apiUrl}/api/exercises`;

      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onSaved(data.data);
      } else {
        setError(data.message || 'Failed to save exercise.');
      }
    } catch {
      setError('A network error occurred. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalPhotos = existingPhotos.length + photoFiles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
      <div 
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-[#FAFAFA]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Exercise Database
            </span>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              {isEditing ? 'Edit Exercise' : 'Add New Exercise'}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[#616161] hover:text-[#202223] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FCE4E4] text-[#B42318] text-[13px] rounded-lg border border-[#E5E5E5]">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Target Body Part */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-[#202223] block mb-1.5">
                Exercise Name <span className="text-[#E5484D]">*</span>
              </label>
              <input 
                type="text" 
                name="name"
                required
                className="w-full px-3 py-2 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all"
                placeholder="e.g. Quadriceps Extension"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#202223] block mb-1.5">
                Target Body Part
              </label>
              <select 
                name="target_body_part"
                className="w-full px-3 py-2 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all"
                value={form.target_body_part}
                onChange={handleChange}
              >
                <option value="">— Select Target Area —</option>
                {BODY_PARTS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-medium text-[#202223] block mb-1.5">
              Short Description / Overview
            </label>
            <textarea 
              name="description"
              rows={2}
              className="w-full px-3 py-2 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all resize-none"
              placeholder="Brief summary of therapeutic purpose and targeted muscle groups..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="text-[12px] font-medium text-[#202223] block mb-1.5">
              Step-by-step Instructions
            </label>
            <textarea 
              name="instructions"
              rows={4}
              className="w-full px-3 py-2 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all"
              placeholder="1. Begin in an upright seated position...&#10;2. Slowly straighten the affected knee...&#10;3. Hold for 5 seconds and return gently..."
              value={form.instructions}
              onChange={handleChange}
            />
          </div>

          {/* Video Attachment */}
          <div>
            <label className="text-[12px] font-medium text-[#202223] block mb-1.5">
              Instructional Video (File or URL)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-3 p-3 border border-dashed border-[#CCCCCC] hover:border-[#202223] rounded-lg bg-[#F7F7F7] hover:bg-[#F0F0F0] cursor-pointer transition-colors"
              >
                <div className="p-2 bg-[#FFFFFF] rounded-md border border-[#E5E5E5] text-[#202223]">
                  <Video size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[12px] font-medium text-[#202223] block truncate">
                    {videoFile ? videoFile.name : 'Upload Video File'}
                  </span>
                  <span className="text-[11px] text-[#8A8A8A] block">
                    MP4, MOV (max 100MB)
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  name="video_url"
                  placeholder="Or paste YouTube / Vimeo URL" 
                  value={videoFile ? '' : form.video_url}
                  onChange={handleChange}
                  disabled={!!videoFile}
                  className="w-full px-3 py-2 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] disabled:bg-[#F7F7F7] disabled:text-[#8A8A8A] transition-all"
                />
              </div>
            </div>
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
            {videoFile && (
              <div className="mt-2 flex items-center justify-between text-[12px] text-[#245B19] bg-[#D9F7C3] px-3 py-1.5 rounded-lg border border-[#A3F56C]">
                <span>Selected: {videoFile.name} ({(videoFile.size / (1024*1024)).toFixed(1)} MB)</span>
                <button type="button" onClick={() => setVideoFile(null)} className="text-[#B42318] hover:underline font-medium cursor-pointer">
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Reference Photos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-medium text-[#202223]">
                Reference Photos ({totalPhotos}/5)
              </label>
              {totalPhotos < 5 && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="text-[12px] text-[#2C5E91] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Plus size={13} /> Add Photos
                </button>
              )}
            </div>

            <input 
              ref={photoInputRef} 
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              onChange={handlePhotos} 
            />

            {/* Photos Preview Grid */}
            <div className="grid grid-cols-5 gap-2.5">
              {existingPhotos.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative aspect-square rounded-lg border border-[#E5E5E5] overflow-hidden group bg-[#F7F7F7]">
                  <img src={url} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-[#E5484D] text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {photoPreview.map((url, idx) => (
                <div key={`preview-${idx}`} className="relative aspect-square rounded-lg border border-[#E5E5E5] overflow-hidden group bg-[#F7F7F7]">
                  <img src={url} alt={`New upload ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-[#E5484D] text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {totalPhotos < 5 && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="aspect-square rounded-lg border border-dashed border-[#CCCCCC] hover:border-[#202223] flex flex-col items-center justify-center gap-1 text-[#8A8A8A] hover:text-[#202223] transition-colors cursor-pointer bg-[#F7F7F7]"
                >
                  <ImageIcon size={18} />
                  <span className="text-[10px] font-medium">+ Photo</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA]">
          <button 
            type="button"
            onClick={onClose} 
            className="btn-secondary-saas"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit} 
            className="btn-primary-saas flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>{isEditing ? 'Save Changes' : 'Create Exercise'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseFormModal;
