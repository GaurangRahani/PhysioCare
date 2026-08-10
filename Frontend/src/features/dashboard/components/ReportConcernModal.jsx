import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, AlertTriangle, MessageSquareWarning, ActivitySquare, HeartPulse } from 'lucide-react';

const ReportConcernModal = ({ isOpen, onClose, prefilledIssueType = null, patientId }) => {
  const { getToken } = useAuth();
  const [selectedIssueType, setSelectedIssueType] = useState(prefilledIssueType);
  const [painLevel, setPainLevel] = useState(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIssueType(prefilledIssueType);
      setPainLevel(0);
      setComments('');
      setError(null);
    }
  }, [isOpen, prefilledIssueType]);

  const issueTypes = [
    { id: 'increased_pain', label: 'Increased Pain', icon: HeartPulse, color: 'red' },
    { id: 'exercise_difficulty', label: 'Exercise Difficulty', icon: ActivitySquare, color: 'amber' },
    { id: 'new_symptom', label: 'New Symptom', icon: AlertTriangle, color: 'orange' },
    { id: 'general_concern', label: 'General Concern', icon: MessageSquareWarning, color: 'slate' }
  ];

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const token = await getToken();

      const today = new Date().toLocaleDateString('en-CA');

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercise-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          treatment_plan_exercise_id: null,
          patient_id: patientId,
          log_date: today,
          session_number: null,
          sets_completed: null,
          pain_level: selectedIssueType === 'general_concern' ? null : painLevel,
          comments,
          issue_type: selectedIssueType,
          attachment_urls: []
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to submit concern');
      }

      onClose();
      // Optional: Add a toast notification here
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isFormValid = selectedIssueType && comments.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center !p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between !p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Report a Concern</h2>
            <p className="text-sm text-slate-500 !mt-1">Let your doctor know about anything unusual between visits.</p>
          </div>
          <button onClick={onClose} className="!p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="!p-6 !space-y-6">
          {error && (
            <div className="!p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Issue Type Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 !mb-3">What type of concern?</label>
            <div className="grid grid-cols-2 !gap-3">
              {issueTypes.map(type => {
                const Icon = type.icon;
                const isSelected = selectedIssueType === type.id;
                
                const colorClasses = {
                  red: {
                    border: 'border-red-500', bg: 'bg-red-50', iconBg: 'bg-red-100', text: 'text-red-700', iconText: 'text-red-600'
                  },
                  amber: {
                    border: 'border-amber-500', bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-700', iconText: 'text-amber-600'
                  },
                  orange: {
                    border: 'border-orange-500', bg: 'bg-orange-50', iconBg: 'bg-orange-100', text: 'text-orange-700', iconText: 'text-orange-600'
                  },
                  slate: {
                    border: 'border-slate-500', bg: 'bg-slate-50', iconBg: 'bg-slate-100', text: 'text-slate-700', iconText: 'text-slate-600'
                  }
                }[type.color];

                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedIssueType(type.id)}
                    className={`flex items-center !gap-3 !p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected 
                        ? `${colorClasses.border} ${colorClasses.bg}` 
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`!p-2 rounded-lg shrink-0 ${isSelected ? `${colorClasses.iconBg} ${colorClasses.iconText}` : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-bold leading-tight ${isSelected ? colorClasses.text : 'text-slate-600'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pain Level Slider (Conditional) */}
          {selectedIssueType && selectedIssueType !== 'general_concern' && (
            <div>
              <div className="flex justify-between items-center !mb-2">
                <label className="block text-sm font-bold text-slate-700">Pain Level</label>
                <span className={`text-sm font-black !px-2.5 !py-0.5 rounded-md ${
                  painLevel <= 3 ? 'bg-green-100 text-green-700' :
                  painLevel <= 6 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {painLevel}/10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs font-medium text-slate-400 !mt-2">
                <span>0 - No pain</span>
                <span>10 - Unbearable</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 !mb-2">Describe what you're experiencing</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Please provide details (minimum 10 characters)..."
              rows={4}
              className="w-full border-2 border-slate-200 rounded-xl !p-3 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        {/* Footer */}
        <div className="!p-6 border-t border-slate-100 bg-slate-50 flex !gap-3 justify-end">
          <button
            onClick={onClose}
            className="!px-5 !py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`!px-5 !py-2.5 text-sm font-bold text-white rounded-xl transition-colors flex items-center !gap-2 ${(!isFormValid || isSubmitting) ? '!bg-slate-400 !cursor-not-allowed !opacity-60' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Submitting...</>
            ) : 'Submit Concern'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReportConcernModal;
