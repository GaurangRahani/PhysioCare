import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Dumbbell, Plus, Search, Loader2, Video, Image as ImageIcon,
  MoreVertical, Edit2, EyeOff, Eye, AlertTriangle, Layers, Activity, CheckCircle2
} from 'lucide-react';
import ExerciseFormModal from '../components/ExerciseFormModal';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import './ExerciseLibrary.css';

const BODY_PARTS = [
  'All', 'Neck', 'Shoulder', 'Upper Back', 'Lower Back', 'Core',
  'Hip', 'Knee', 'Ankle', 'Full Body', 'Other'
];

const ExerciseLibrary = () => {
  const { getToken } = useAuth();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState('All');
  const [showInactive, setShowInactive] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [formModal, setFormModal] = useState({ open: false, exercise: null });
  const [detailModal, setDetailModal] = useState({ open: false, exercise: null });

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const params = new URLSearchParams();
      if (showInactive) params.set('includeInactive', 'true');
      if (bodyPartFilter !== 'All') params.set('target_body_part', bodyPartFilter);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercises?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setExercises(data.data || []);
      } else {
        setError(data.message || 'Failed to load exercises.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getToken, showInactive, bodyPartFilter]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Client-side search filter
  const filtered = exercises.filter(ex => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ex.name?.toLowerCase().includes(q) ||
      ex.description?.toLowerCase().includes(q) ||
      ex.target_body_part?.toLowerCase().includes(q)
    );
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExercises = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const handleSaved = (savedExercise) => {
    setExercises(prev => {
      const existing = prev.find(e => e.id === savedExercise.id);
      if (existing) return prev.map(e => e.id === savedExercise.id ? savedExercise : e);
      return [savedExercise, ...prev];
    });
    showToast(formModal.exercise ? 'Exercise updated successfully.' : 'Exercise created successfully.');
    setFormModal({ open: false, exercise: null });
  };

  const handleDeactivate = async (exercise) => {
    if (!window.confirm(`Deactivate "${exercise.name}"? It will be hidden from new patient prescription plans.`)) return;
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercises/${exercise.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setExercises(prev => prev.map(e => e.id === exercise.id ? { ...e, is_active: false } : e));
        setDetailModal({ open: false, exercise: null });
        showToast(data.warning ? data.message : 'Exercise marked as inactive.', data.warning ? 'warning' : 'success');
      } else {
        showToast(data.message || 'Failed to deactivate.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  };

  const handleActivate = async (exercise) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercises/${exercise.id}/activate`,
        { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setExercises(prev => prev.map(e => e.id === exercise.id ? { ...e, is_active: true } : e));
        setDetailModal(prev => prev.open ? { ...prev, exercise: { ...prev.exercise, is_active: true } } : prev);
        showToast('Exercise reactivated successfully.');
      } else {
        showToast(data.message || 'Failed to reactivate.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  };

  const stats = {
    total: exercises.length,
    active: exercises.filter(e => e.is_active).length,
    inactive: exercises.filter(e => !e.is_active).length,
    byPartCount: new Set(exercises.map(e => e.target_body_part).filter(Boolean)).size
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-['Inter',system-ui,sans-serif] text-[#202223]">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-4 py-2.5 rounded-xl shadow-lg text-[13px] font-medium flex items-center gap-2 border animate-fade-in ${
          toast.type === 'success' ? 'bg-[#D9F7C3] text-[#245B19] border-[#A3F56C]' :
          toast.type === 'warning' ? 'bg-[#FFF2CC] text-[#805B00] border-[#F5C451]' :
          'bg-[#FCE4E4] text-[#B42318] border-[#E5484D]'
        }`}>
          {toast.type === 'warning' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <ExerciseFormModal
        isOpen={formModal.open}
        exercise={formModal.exercise}
        onClose={() => setFormModal({ open: false, exercise: null })}
        onSaved={handleSaved}
      />
      <ExerciseDetailModal
        isOpen={detailModal.open}
        exercise={detailModal.exercise}
        onClose={() => setDetailModal({ open: false, exercise: null })}
        onEdit={(ex) => setFormModal({ open: true, exercise: ex })}
        onDeactivate={handleDeactivate}
        onActivate={handleActivate}
      />

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold text-[#202223] tracking-tight m-0">
              Exercise Library
            </h1>
            <span className="badge-semantic-neutral">
              Clinical Catalog
            </span>
          </div>
          <p className="text-[13px] text-[#616161] mt-1 font-normal">
            Manage, customize, and prescribe physiotherapy exercises for patient recovery plans.
          </p>
        </div>

        <button 
          onClick={() => setFormModal({ open: true, exercise: null })}
          className="btn-primary-saas self-start sm:self-center shrink-0"
        >
          <Plus size={14} />
          <span>Add Exercise</span>
        </button>
      </div>

      {/* ── Stats Strip (Enterprise Minimalist) ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="saas-card p-4">
          <div className="flex items-center justify-between text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider">
            <span>Total Catalog</span>
            <Dumbbell size={15} />
          </div>
          <div className="text-[24px] font-semibold text-[#202223] font-mono mt-1">
            {stats.total < 10 ? `0${stats.total}` : stats.total}
          </div>
        </div>

        <div className="saas-card p-4">
          <div className="flex items-center justify-between text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider">
            <span>Active for Prescription</span>
            <Activity size={15} className="text-[#245B19]" />
          </div>
          <div className="text-[24px] font-semibold text-[#202223] font-mono mt-1">
            {stats.active < 10 ? `0${stats.active}` : stats.active}
          </div>
        </div>

        <div className="saas-card p-4">
          <div className="flex items-center justify-between text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider">
            <span>Inactive / Archived</span>
            <EyeOff size={15} />
          </div>
          <div className="text-[24px] font-semibold text-[#616161] font-mono mt-1">
            {stats.inactive < 10 ? `0${stats.inactive}` : stats.inactive}
          </div>
        </div>

        <div className="saas-card p-4">
          <div className="flex items-center justify-between text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider">
            <span>Target Body Areas</span>
            <Layers size={15} />
          </div>
          <div className="text-[24px] font-semibold text-[#202223] font-mono mt-1">
            {stats.byPartCount < 10 ? `0${stats.byPartCount}` : stats.byPartCount}
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search & Filters ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA] p-2.5 rounded-xl border border-[#E5E5E5]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input 
            type="text" 
            placeholder="Search exercises by name, body part, description..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg text-[#202223] placeholder-[#8A8A8A] outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all"
          />
        </div>

        {/* Filter Dropdown & Checkbox */}
        <div className="flex items-center gap-3">
          <select 
            value={bodyPartFilter}
            onChange={(e) => { setBodyPartFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg text-[#202223] outline-none focus:border-[#202223] cursor-pointer font-medium"
          >
            {BODY_PARTS.map(bp => (
              <option key={bp} value={bp}>{bp === 'All' ? 'Filter: All Body Parts' : bp}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-[12px] text-[#616161] font-medium cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={showInactive}
              onChange={() => setShowInactive(!showInactive)}
              className="rounded border-[#CCCCCC] text-[#111111] focus:ring-0 cursor-pointer"
            />
            <span>Show Inactive</span>
          </label>
        </div>
      </div>

      {/* ── Exercises Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#8A8A8A]">
          <Loader2 className="w-6 h-6 text-[#202223] animate-spin" />
          <span className="text-[13px]">Loading exercises...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-[#FCE4E4] text-[#B42318] rounded-xl border border-[#E5E5E5] text-[13px] text-center">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="saas-card py-20 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0F0F0] border border-[#E5E5E5] flex items-center justify-center mb-3 text-[#8A8A8A]">
            <Dumbbell size={22} />
          </div>
          <h3 className="text-[16px] font-semibold text-[#202223] m-0">No Exercises Found</h3>
          <p className="text-[13px] text-[#616161] mt-1 max-w-sm mb-4">
            {search ? `No matches found for "${search}". Try clearing search or changing filters.` : 'Get started by creating your first exercise in the library.'}
          </p>
          {!search && (
            <button
              onClick={() => setFormModal({ open: true, exercise: null })}
              className="btn-primary-saas"
            >
              <Plus size={14} /> Add First Exercise
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentExercises.map(ex => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onClick={() => setDetailModal({ open: true, exercise: ex })}
              onEdit={(e) => { e.stopPropagation(); setFormModal({ open: true, exercise: ex }); }}
              onDeactivate={(e) => { e.stopPropagation(); handleDeactivate(ex); }}
              onActivate={(e) => { e.stopPropagation(); handleActivate(ex); }}
            />
          ))}
        </div>
      )}

      {/* ── Enterprise Pagination Footer ───────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#EAEAEA] text-[12px] text-[#616161]">
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#E5E5E5] rounded-md text-[#202223] font-medium outline-none"
            >
              <option value="8">8 per page</option>
              <option value="12">12 per page</option>
              <option value="24">24 per page</option>
              <option value="48">48 per page</option>
            </select>
            <span className="text-[#8A8A8A] ml-2">
              Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filtered.length)} of {filtered.length} exercises
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            
            <span className="px-2 font-mono text-[#202223]">
              Page {currentPage} of {totalPages}
            </span>

            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Single Exercise Card Component ──────────────────────────────────────────
const ExerciseCard = ({ exercise, onClick, onEdit, onDeactivate, onActivate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const thumbnail = exercise.photo_urls?.[0] || null;
  const hasPhotos = (exercise.photo_urls?.length || 0) > 0;
  const hasVideo = !!exercise.video_url;

  return (
    <div
      onClick={onClick}
      className={`saas-card overflow-hidden flex flex-col group cursor-pointer transition-all duration-150 hover:border-[#CCCCCC] hover:shadow-xs relative ${
        !exercise.is_active ? 'opacity-70 bg-[#FCFCFC]' : 'bg-[#FFFFFF]'
      }`}
    >
      {/* Thumbnail Aspect Media Container */}
      <div className="relative aspect-[16/10] bg-[#F7F7F7] overflow-hidden border-b border-[#EAEAEA]">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={exercise.name} 
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200" 
          />
        ) : hasVideo ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#8A8A8A]">
            <Video size={24} />
            <span className="text-[11px] font-medium">Video Attached</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#CCCCCC]">
            <Dumbbell size={24} />
            <span className="text-[11px] font-medium text-[#8A8A8A]">No Media</span>
          </div>
        )}

        {/* Floating Media Badges (Top Left) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {hasVideo && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-medium backdrop-blur-xs">
              <Video size={11} /> Video
            </span>
          )}
          {hasPhotos && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-medium backdrop-blur-xs">
              <ImageIcon size={11} /> {exercise.photo_urls.length}
            </span>
          )}
        </div>

        {/* Inactive Overlay Badge */}
        {!exercise.is_active && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-[#111111] text-[#FFFFFF] text-[11px] font-semibold px-2.5 py-0.5 rounded-md">
              Inactive
            </span>
          </div>
        )}

        {/* 3-Dot Options Action (Top Right) */}
        <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Options"
            className="w-7 h-7 rounded-md bg-white/90 hover:bg-white text-[#202223] flex items-center justify-center shadow-xs border border-[#E5E5E5] transition-colors cursor-pointer"
          >
            <MoreVertical size={14} />
          </button>
          
          {menuOpen && (
            <div className="absolute top-8 right-0 bg-[#FFFFFF] rounded-xl shadow-lg border border-[#E5E5E5] py-1 w-36 z-30 text-left animate-fade-in text-[12px]">
              {exercise.is_active ? (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[#202223] hover:bg-[#F0F0F0] font-medium cursor-pointer"
                  >
                    <Edit2 size={13} className="text-[#616161]" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={onDeactivate}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[#E5484D] hover:bg-[#FCE4E4] font-medium cursor-pointer"
                  >
                    <EyeOff size={13} /> Deactivate
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onActivate}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[#245B19] hover:bg-[#D9F7C3] font-medium cursor-pointer"
                >
                  <Eye size={13} /> Reactivate
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {exercise.target_body_part && (
            <span className="badge-semantic-neutral inline-block mb-1.5 text-[11px] font-medium">
              {exercise.target_body_part}
            </span>
          )}
          <h4 className="text-[14px] font-semibold text-[#202223] tracking-tight leading-snug m-0 group-hover:text-[#000000]">
            {exercise.name}
          </h4>
          {exercise.description && (
            <p className="text-[12px] text-[#616161] line-clamp-2 mt-1 leading-normal m-0 font-normal">
              {exercise.description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#8A8A8A]">
          <span>{exercise.instructions ? 'Instructions attached' : 'Standard regimen'}</span>
          <span className="font-medium text-[#202223] group-hover:underline">View details →</span>
        </div>
      </div>
    </div>
  );
};

export default ExerciseLibrary;
