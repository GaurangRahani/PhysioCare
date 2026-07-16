import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ChevronLeft, Play, AlertCircle, CheckCircle2, Loader2, MessageSquare, SkipForward, XCircle } from 'lucide-react';

const ExerciseSession = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // The session data passed from PatientDashboard is now an array of exercises
  const exercises = state?.exercises || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentExercise = exercises[currentIndex];

  const [setsCompleted, setSetsCompleted] = useState(0);
  const [painLevel, setPainLevel] = useState(0);
  const [comments, setComments] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Skip Modal state
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  // Reset form when moving to a new exercise
  useEffect(() => {
    if (currentExercise) {
      setSetsCompleted(currentExercise.sets || 1);
      setPainLevel(0);
      setComments('');
      setSkipReason('');
      setIsSkipModalOpen(false);
      setError('');
    }
  }, [currentIndex, currentExercise]);

  if (!exercises || exercises.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleNextOrComplete = async (isSkipped = false) => {
    setError('');
    setIsSubmitting(true);

    try {
      const token = await getToken();
      
      const payload = {
        treatment_plan_exercise_id: currentExercise.treatment_plan_exercise_id,
        log_date: currentExercise.scheduled_date, 
        session_number: currentExercise.session_number,
        sets_completed: isSkipped ? 0 : parseInt(setsCompleted, 10),
        pain_level: isSkipped ? null : painLevel,
        comments: isSkipped ? skipReason : (comments.trim() || undefined),
        is_skipped: isSkipped,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercise-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        if (currentIndex < exercises.length - 1) {
            // Move to next exercise
            setCurrentIndex(prev => prev + 1);
            setIsSubmitting(false);
        } else {
            // Reached the end of the carousel
            navigate('/dashboard', { replace: true });
        }
      } else {
        setError(data.message || 'Failed to log session. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again later.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleNextOrComplete(false);
  };

  const handleSkipSubmit = (e) => {
    e.preventDefault();
    if (!skipReason) {
        setError('Please select a reason for skipping.');
        return;
    }
    handleNextOrComplete(true);
  };

  // Helper to convert standard youtube links to embed links
  const getEmbedUrl = (url) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch(e) {
      return url;
    }
  };

  const isLastExercise = currentIndex === exercises.length - 1;

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-fade-in relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
            <h1 className="text-2xl font-bold text-heading">Workout {currentExercise.session_number}</h1>
            <p className="text-sm text-gray-500">Exercise {currentIndex + 1} of {exercises.length}</p>
            </div>
        </div>
        {/* Progress Bar */}
        <div className="flex gap-1">
            {exercises.map((_, idx) => (
                <div key={idx} className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-primary' : idx < currentIndex ? 'w-4 bg-primary/50' : 'w-4 bg-gray-200'}`} />
            ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative">
        
        {/* Skip Modal Overlay */}
        {isSkipModalOpen && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-heading">Skip Exercise?</h3>
                    <button onClick={() => setIsSkipModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                        <XCircle className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                <p className="text-body mb-8 text-lg">Why are you skipping <strong>{currentExercise.exercise_name}</strong>?</p>
                
                <form onSubmit={handleSkipSubmit} className="flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                        {['Too Painful', 'Too Tired', 'No Equipment', 'Other'].map(reason => (
                            <label key={reason} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${skipReason === reason ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input 
                                    type="radio" 
                                    name="skipReason" 
                                    value={reason} 
                                    checked={skipReason === reason} 
                                    onChange={(e) => setSkipReason(e.target.value)}
                                    className="w-5 h-5 text-primary focus:ring-primary"
                                />
                                <span className="ml-3 font-medium text-heading">{reason}</span>
                            </label>
                        ))}
                    </div>
                    {error && <p className="text-danger text-sm font-medium mt-4">{error}</p>}
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-6 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <SkipForward className="w-5 h-5" />}
                        Confirm Skip
                    </button>
                </form>
            </div>
        )}

        {/* Media Player */}
        <div className="aspect-video bg-gray-900 relative flex items-center justify-center overflow-hidden">
          {currentExercise.video_url ? (
            <iframe 
              src={getEmbedUrl(currentExercise.video_url)} 
              title={currentExercise.exercise_name}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Play className="w-8 h-8 ml-1 text-white opacity-80" />
              </div>
              <p className="text-sm font-medium">No video attached</p>
            </div>
          )}
        </div>

        {/* Exercise Info */}
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-black text-heading mb-1">{currentExercise.exercise_name}</h2>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full uppercase tracking-wider">
                {currentExercise.target_body_part}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Prescribed</div>
              <div className="text-2xl font-black text-dark">
                {currentExercise.sets} <span className="text-base font-medium text-gray-400">sets</span> × {currentExercise.reps} <span className="text-base font-medium text-gray-400">reps</span>
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-gray-600 mb-8">
            <h4 className="text-heading font-bold mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Instructions
            </h4>
            <p className="whitespace-pre-line leading-relaxed">
              {currentExercise.instructions || 'No special instructions provided by your doctor.'}
            </p>
            {currentExercise.notes && (
              <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-100 flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
                <div>
                  <span className="block font-bold mb-1 text-yellow-900">Doctor's Note:</span>
                  {currentExercise.notes}
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-100 my-8" />

          {/* Logging Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-heading">Log Your Progress</h3>
                  <button type="button" onClick={() => setIsSkipModalOpen(true)} className="text-sm font-bold text-gray-500 hover:text-gray-900 underline flex items-center gap-1">
                      <SkipForward className="w-4 h-4" /> Skip Exercise
                  </button>
              </div>

              {error && !isSkipModalOpen && (
                <div className="mb-6 p-4 bg-red-50 text-danger rounded-xl flex gap-3 text-sm font-medium border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sets Completed */}
                <div>
                  <label className="block text-sm font-bold text-heading mb-3">Sets Completed</label>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setSetsCompleted(Math.max(0, setsCompleted - 1))}
                      className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xl transition-colors"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      min="0"
                      value={setsCompleted}
                      onChange={(e) => setSetsCompleted(parseInt(e.target.value) || 0)}
                      className="w-20 h-12 text-center text-xl font-black bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => setSetsCompleted(setsCompleted + 1)}
                      className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xl transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Your doctor prescribed {currentExercise.sets} sets.</p>
                </div>

                {/* Pain Level */}
                <div>
                  <label className="block text-sm font-bold text-heading mb-3 flex items-center justify-between">
                    <span>Pain Level</span>
                    <span className={`text-xs px-2 py-1 rounded-md font-bold ${
                      painLevel >= 7 ? 'bg-red-100 text-danger' : 
                      painLevel >= 4 ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-success'
                    }`}>
                      {painLevel}/10
                    </span>
                  </label>
                  <input 
                    type="range" 
                    min="0" max="10" step="1"
                    value={painLevel}
                    onChange={(e) => setPainLevel(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
                    <span>0 - None</span>
                    <span>10 - Severe</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-bold text-heading mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                Comments / Feedback (Optional)
              </label>
              <textarea 
                rows="3"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="How did the exercise feel? Did you experience any difficulties?"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              ></textarea>
            </div>

            {/* Submit */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-4 bg-primary text-white font-bold rounded-xl hover:bg-dark transition-all disabled:opacity-70 shadow-lg shadow-primary/30"
            >
              {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLastExercise ? (
                  <CheckCircle2 className="w-5 h-5" />
              ) : (
                  <Play className="w-5 h-5 fill-current" />
              )}
              {isSubmitting ? 'Logging...' : isLastExercise ? 'Complete Workout' : 'Next Exercise'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSession;
