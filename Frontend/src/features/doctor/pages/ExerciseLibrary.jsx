import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Dumbbell, Plus, Search, Filter, Loader2, ChevronDown,
  Video, Image, MoreHorizontal, Edit2, EyeOff, Eye, AlertTriangle
} from 'lucide-react';
import ExerciseFormModal from '../components/ExerciseFormModal';
import ExerciseDetailModal from '../components/ExerciseDetailModal';

const BODY_PARTS = [
  'All', 'Neck', 'Shoulder', 'Upper Back', 'Lower Back', 'Core',
  'Hip', 'Knee', 'Ankle', 'Full Body', 'Other'
];

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

const ExerciseLibrary = () => {
  const { getToken } = useAuth();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState('All');
  const [showInactive, setShowInactive] = useState(false);

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

  // Client-side search filter (backend doesn't support search yet so we do it here)
  const filtered = exercises.filter(ex => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ex.name?.toLowerCase().includes(q) ||
      ex.description?.toLowerCase().includes(q) ||
      ex.target_body_part?.toLowerCase().includes(q)
    );
  });

  const handleSaved = (savedExercise) => {
    setExercises(prev => {
      const existing = prev.find(e => e.id === savedExercise.id);
      if (existing) return prev.map(e => e.id === savedExercise.id ? savedExercise : e);
      return [savedExercise, ...prev];
    });
    showToast(formModal.exercise ? 'Exercise updated!' : 'Exercise created!');
    setFormModal({ open: false, exercise: null });
  };

  const handleDeactivate = async (exercise) => {
    if (!window.confirm(`Deactivate "${exercise.name}"? It will be hidden from new assignments.`)) return;
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
        showToast(data.warning ? data.message : 'Exercise deactivated.', data.warning ? 'warning' : 'success');
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
        showToast('Exercise reactivated!');
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
    byPart: BODY_PARTS.slice(1).reduce((acc, bp) => {
      acc[bp] = exercises.filter(e => e.target_body_part === bp && e.is_active).length;
      return acc;
    }, {})
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 transition-all ${
          toast.type === 'success' ? 'bg-success text-white' :
          toast.type === 'warning' ? 'bg-warning text-white' :
          'bg-danger text-white'
        }`}>
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
          {toast.message}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Exercise Library</h1>
          <p className="text-sm text-gray-400 mt-1">
            {stats.active} active exercise{stats.active !== 1 ? 's' : ''} in the clinic library
          </p>
        </div>
        <button
          onClick={() => setFormModal({ open: true, exercise: null })}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-dark transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Exercise
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</p>
          <p className="text-3xl font-black text-dark mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</p>
          <p className="text-3xl font-black text-success mt-1">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inactive</p>
          <p className="text-3xl font-black text-gray-400 mt-1">{stats.total - stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Body Parts</p>
          <p className="text-3xl font-black text-primary mt-1">
            {Object.values(stats.byPart).filter(v => v > 0).length}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises by name..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Body part dropdown */}
            <select
              value={bodyPartFilter}
              onChange={(e) => setBodyPartFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer min-w-[160px]"
            >
              {BODY_PARTS.map(bp => (
                <option key={bp} value={bp}>{bp}</option>
              ))}
            </select>

            {/* Inactive toggle */}
            <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
                className="w-4 h-4 text-primary bg-gray-50 border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-600 select-none">Show Inactive</span>
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-danger bg-red-50 rounded-xl border border-red-100">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Dumbbell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-bold text-heading mb-1">No exercises found</h3>
          <p className="text-sm text-gray-400 mb-6">
            {search ? `No results for "${search}"` : 'Start building your library by adding an exercise.'}
          </p>
          {!search && (
            <button
              onClick={() => setFormModal({ open: true, exercise: null })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-dark transition-colors"
            >
              <Plus className="w-4 h-4" /> Add First Exercise
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(ex => (
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
    </div>
  );
};

// ─── Exercise Card ────────────────────────────────────────────────────────────
const ExerciseCard = ({ exercise, onClick, onEdit, onDeactivate, onActivate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMedia = (exercise.photo_urls?.length > 0) || exercise.video_url;
  const thumbnail = exercise.photo_urls?.[0] || null;
  const bodyPartColor = BODY_PART_COLORS[exercise.target_body_part] || 'bg-gray-100 text-gray-600';

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        exercise.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'
      }`}
    >
      {/* Thumbnail / Placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={exercise.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : exercise.video_url ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Video attached</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 font-medium">No media</p>
          </div>
        )}

        {/* Inactive badge */}
        {!exercise.is_active && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-gray-700 text-white text-[11px] font-bold px-3 py-1 rounded-full">Inactive</span>
          </div>
        )}

        {/* Media count badge */}
        {hasMedia && exercise.is_active && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            {exercise.video_url && (
              <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Video className="w-2.5 h-2.5" /> Video
              </span>
            )}
            {(exercise.photo_urls?.length || 0) > 0 && (
              <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Image className="w-2.5 h-2.5" /> {exercise.photo_urls.length}
              </span>
            )}
          </div>
        )}

        {/* 3-dot menu — always visible on hover, options change by is_active */}
        <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>
          {menuOpen && (
            <div className="absolute top-8 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40 z-10">
              {exercise.is_active ? (
                <>
                  <button
                    onClick={onEdit}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit
                  </button>
                  <button
                    onClick={onDeactivate}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-danger hover:bg-red-50 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Deactivate
                  </button>
                </>
              ) : (
                <button
                  onClick={onActivate}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-success hover:bg-green-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Reactivate
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-heading text-sm leading-tight line-clamp-2 flex-1">{exercise.name}</h3>
        </div>
        {exercise.target_body_part && (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${bodyPartColor} mb-2`}>
            {exercise.target_body_part}
          </span>
        )}
        {exercise.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{exercise.description}</p>
        )}
      </div>
    </div>
  );
};

export default ExerciseLibrary;
