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
    <div className="modal-overlay" id="editExerciseModal" onClick={(e) => {
      if (e.target.id === 'editExerciseModal') onClose();
    }}>
      <div className="modal-content">
        <div className="modal-header-text">
          <h3>{isEditing ? 'Edit Exercise' : 'Add New Exercise'}</h3>
          <button className="modal-close-text" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-scrollable-body">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 text-danger text-sm font-medium rounded-xl border border-red-100 mb-4">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Exercise Name <span className="text-danger">*</span></label>
              <input 
                type="text" 
                name="name"
                className="form-control" 
                placeholder="e.g. Hip Extension"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Body Part</label>
              <select 
                className="form-control"
                name="target_body_part"
                value={form.target_body_part}
                onChange={handleChange}
              >
                <option value="">— Select —</option>
                {BODY_PARTS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-control" 
              name="description"
              placeholder="Brief overview..."
              value={form.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Step-by-step Instructions</label>
            <textarea 
              className="form-control" 
              style={{ minHeight: '120px' }} 
              name="instructions"
              placeholder="1. Start in a seated position...&#10;2. Slowly extend..."
              value={form.instructions}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Video</label>
            <div className="video-options">
              <div 
                className="upload-box"
                onClick={() => videoInputRef.current?.click()}
              >
                <div className="upload-icon"><Video className="w-5 h-5" /></div>
                <div className="upload-text">
                  <h5>{videoFile ? videoFile.name : 'Upload File'}</h5>
                  <p>MP4, MOV (max 100MB)</p>
                </div>
              </div>
              <div className="url-input-wrapper">
                <Video className="icon w-4 h-4" />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Or paste video URL" 
                  name="video_url"
                  value={videoFile ? '' : form.video_url}
                  onChange={handleChange}
                  disabled={!!videoFile}
                />
              </div>
            </div>
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
            {videoFile && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-success font-medium">✓ Video file selected</span>
                <button type="button" onClick={() => setVideoFile(null)} className="text-xs text-danger hover:underline bg-transparent border-0 cursor-pointer">Remove</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="photos-header">
              <label className="form-label mb-0">Photos ({totalPhotos}/5)</label>
              {totalPhotos < 5 && (
                <button type="button" className="btn-link" onClick={() => photoInputRef.current?.click()}>
                  <Plus className="w-3.5 h-3.5" /> Add Photos
                </button>
              )}
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />

            {totalPhotos === 0 ? (
              <div className="photo-upload-area" onClick={() => photoInputRef.current?.click()}>
                <Image className="w-8 h-8 text-gray-400 mb-2" />
                <span>Click to browse images</span>
                <p className="text-xs text-gray-400 m-0">PNG, JPG, WEBP — up to 5 images</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {existingPhotos.map((url, i) => (
                  <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-danger rounded-full flex items-center justify-center border-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
                {photoPreview.map((url, i) => (
                  <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-danger rounded-full flex items-center justify-center border-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="absolute top-1.5 right-1.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-text" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Exercise')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseFormModal;
