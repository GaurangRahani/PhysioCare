import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Dumbbell, Plus, Search, Filter, Loader2, ChevronDown,
  Video, Image, MoreHorizontal, Edit2, EyeOff, Eye, AlertTriangle
} from 'lucide-react';
import ExerciseFormModal from '../components/ExerciseFormModal';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import './ExerciseLibrary.css';

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExercises = filtered.slice(indexOfFirstItem, indexOfLastItem);

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
    <div className="library-theme animate-fade-in">
      {/* APPOINTMENT STYLE THEME BACKGROUND */}
      <div className="theme-bg" style={{ backgroundImage: "url('/images/background/line-bg2.png')", backgroundColor: "#f9fbfe" }}>
        <img className="pt-img1" src="/images/shap/trangle-orange.png" alt="" />
        <img className="pt-img2" src="/images/shap/wave-blue.png" alt="" />
        <img className="pt-img3" src="/images/shap/circle-dots.png" alt="" />
        <img className="pt-img4" src="/images/shap/plus-blue.png" alt="" />
        <img className="pt-img5" src="/images/shap/wave-blue.png" alt="" />
        <img className="pt-img6" src="/images/shap/circle-dots.png" alt="" />
      </div>

      <div className="container">
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

        {/* Page Header */}
        <div className="page-header">
          <div className="page-title">
            <span>Clinic Resources</span>
            <h1>Exercise Library</h1>
            <p>Manage and prescribe exercises for your patients' recovery journey.</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setFormModal({ open: true, exercise: null })}
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card c-total">
            <h5>Total Exercises</h5>
            <h2>{stats.total < 10 ? `0${stats.total}` : stats.total}</h2>
          </div>
          <div className="stat-card c-active">
            <h5>Active</h5>
            <h2>{stats.active < 10 ? `0${stats.active}` : stats.active}</h2>
          </div>
          <div className="stat-card c-inactive">
            <h5>Inactive</h5>
            <h2>{(stats.total - stats.active) < 10 ? `0${stats.total - stats.active}` : (stats.total - stats.active)}</h2>
          </div>
          <div className="stat-card c-bodyparts">
            <h5>Body Parts</h5>
            <h2>{Object.values(stats.byPart).filter(v => v > 0).length < 10 ? `0${Object.values(stats.byPart).filter(v => v > 0).length}` : Object.values(stats.byPart).filter(v => v > 0).length}</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrapper">
            <Search className="icon w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search exercises by name, description..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-wrapper">
            <select 
              value={bodyPartFilter}
              onChange={(e) => setBodyPartFilter(e.target.value)}
            >
              {BODY_PARTS.map(bp => (
                <option key={bp} value={bp}>{bp === 'All' ? 'Filter by Body Part' : bp}</option>
              ))}
            </select>
            <label className="toggle-inactive">
              <input 
                type="checkbox" 
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
              />
              Show Inactive
            </label>
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
          <div className="stat-card text-center py-20" style={{ alignItems: 'center' }}>
            <Dumbbell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-heading mb-1">No exercises found</h3>
            <p className="text-sm text-gray-400 mb-6">
              {search ? `No results for "${search}"` : 'Start building your library by adding an exercise.'}
            </p>
            {!search && (
              <button
                onClick={() => setFormModal({ open: true, exercise: null })}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" /> Add First Exercise
              </button>
            )}
          </div>
        ) : (
          <div className="exercise-grid">
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

        {/* Global Pagination Bar */}
        {!loading && filtered.length > 0 && (
          <div className="pagination-bar">
            <div className="pagination-left-panel">
                <label htmlFor="perPageSelect">Rows per page:</label>
                <select 
                    id="perPageSelect" 
                    className="rows-dropdown"
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
            </div>
            
            <div className="pagination-center-panel">
                <nav className="pagination-numbers-nav" aria-label="Exercises page navigation">
                    <button 
                        className="page-item-btn" 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                            return (
                                <button 
                                    key={page}
                                    className={`page-item-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="page-item-spacer">...</span>;
                        }
                        return null;
                    })}

                    <button 
                        className="page-item-btn" 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        &gt;
                    </button>
                </nav>
            </div>
            
            <div className="pagination-right-panel">
                <span>Showing {filtered.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filtered.length)} of {filtered.length} entries</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Exercise Card ────────────────────────────────────────────────────────────
const ExerciseCard = ({ exercise, onClick, onEdit, onDeactivate, onActivate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMedia = (exercise.photo_urls?.length > 0) || exercise.video_url;
  const thumbnail = exercise.photo_urls?.[0] || null;
  const bpKey = exercise.target_body_part ? exercise.target_body_part.toLowerCase().replace(' ', '-') : 'other';

  return (
    <div
      onClick={onClick}
      className={`exercise-card group ${exercise.is_active ? '' : 'inactive'}`}
    >
      {/* Thumbnail / Placeholder */}
      <div className="card-media">
        {thumbnail ? (
          <img src={thumbnail} alt={exercise.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : exercise.video_url ? (
          <div className="media-placeholder w-full h-full flex flex-col items-center justify-center gap-2">
            <Video className="w-8 h-8" />
            <p className="text-xs font-medium m-0">Video attached</p>
          </div>
        ) : (
          <div className="media-placeholder w-full h-full flex flex-col items-center justify-center gap-2">
            <Dumbbell className="w-8 h-8" />
            <p className="text-xs font-medium m-0">No media</p>
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
          <div className="media-badges">
            {exercise.video_url && (
              <span className="media-badge">
                <Video className="w-3 h-3 mr-1" />
              </span>
            )}
            {(exercise.photo_urls?.length || 0) > 0 && (
              <span className="media-badge">
                <Image className="w-3 h-3 mr-1" /> {exercise.photo_urls.length}
              </span>
            )}
          </div>
        )}

        {/* 3-dot menu — always visible on hover, options change by is_active */}
        <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white border-0 cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>
          {menuOpen && (
            <div className="absolute top-8 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40 z-10 text-left">
              {exercise.is_active ? (
                <>
                  <button
                    onClick={onEdit}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-50 transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit
                  </button>
                  <button
                    onClick={onDeactivate}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-danger hover:bg-red-50 transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Deactivate
                  </button>
                </>
              ) : (
                <button
                  onClick={onActivate}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-success hover:bg-green-50 transition-colors border-0 bg-transparent cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Reactivate
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="card-body">
        {exercise.target_body_part && (
          <span className={`badge badge-${bpKey} mb-2 block w-fit`}>
            {exercise.target_body_part}
          </span>
        )}
        <h4>{exercise.name}</h4>
        {exercise.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 m-0">{exercise.description}</p>
        )}
      </div>
    </div>
  );
};

export default ExerciseLibrary;
