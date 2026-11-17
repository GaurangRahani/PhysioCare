import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  X, 
  AlertTriangle, 
  MessageSquare, 
  Activity, 
  HeartPulse, 
  Dumbbell, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

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
    { id: 'increased_pain', label: 'Increased Pain', icon: HeartPulse },
    { id: 'exercise_difficulty', label: 'Exercise Difficulty', icon: Dumbbell },
    { id: 'new_symptom', label: 'New Symptom', icon: AlertTriangle },
    { id: 'general_concern', label: 'General Concern', icon: MessageSquare }
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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isFormValid = selectedIssueType && comments.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif] animate-fade-in select-none">
      
      {/* Modal Dialog Card */}
      <div 
        className="relative bg-[#FFFFFF] rounded-[16px] border border-[#EAEAEA] shadow-2xl w-full max-w-[460px] max-h-[92vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ── 1. MODAL HEADER ────────────────────────────────────────────── */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[#EAEAEA] flex items-center justify-between shrink-0 bg-[#FFFFFF]">
          <div className="min-w-0 pr-2">
            <h2 className="text-[15px] font-semibold text-[#202223] truncate">
              Report a Concern
            </h2>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#8A8A8A] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer shrink-0"
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── 2. MODAL BODY (SCROLLABLE) ─────────────────────────────────── */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-[#202223]">
          
          {error && (
            <div className="p-3 bg-[#FCE4E4] border border-[#F5C2C2] text-[#B81818] rounded-[10px] text-[12px] flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Issue Type Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
              What type of concern?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {issueTypes.map(type => {
                const Icon = type.icon;
                const isSelected = selectedIssueType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedIssueType(type.id)}
                    className={`p-2.5 rounded-[10px] border text-left transition-colors cursor-pointer flex items-center gap-2 ${
                      isSelected 
                        ? 'border-[#202223] bg-[#202223] text-[#FFFFFF] shadow-xs' 
                        : 'border-[#EAEAEA] bg-[#FFFFFF] text-[#202223] hover:border-[#202223] hover:bg-[#FBFBFB]'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#333333] text-[#FFFFFF]' : 'bg-[#F4F4F4] text-[#616161]'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-[12px] font-medium leading-tight">
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pain Level Slider (Conditional) */}
          {selectedIssueType && selectedIssueType !== 'general_concern' && (
            <div className="p-3.5 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-medium text-[#202223]">
                  Reported Discomfort / Pain Level
                </label>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  painLevel <= 3 
                    ? 'bg-[#D9F7C3] text-[#245B19]' 
                    : painLevel <= 6 
                    ? 'bg-[#FFF2CC] text-[#8A6116]' 
                    : 'bg-[#FCE4E4] text-[#B81818]'
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
                className="w-full h-1.5 bg-[#EAEAEA] rounded-lg appearance-none cursor-pointer accent-[#202223]"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#8A8A8A]">
                <span>0 - Minimal</span>
                <span>5 - Moderate</span>
                <span>10 - Severe</span>
              </div>
            </div>
          )}

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
                Describe Concern
              </label>
              <span className={`text-[10px] font-mono ${comments.trim().length >= 10 ? 'text-[#008060]' : 'text-[#8A8A8A]'}`}>
                {comments.trim().length}/10 min chars
              </span>
            </div>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Please provide details (minimum 10 characters)..."
              rows={3}
              className="w-full border border-[#EAEAEA] rounded-[10px] p-2.5 text-[13px] text-[#202223] placeholder-[#8A8A8A] bg-[#FFFFFF] focus:border-[#202223] outline-none transition-colors resize-none"
            />
          </div>

        </div>

        {/* ── 3. MODAL FOOTER ────────────────────────────────────────────── */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#EAEAEA] bg-[#FBFBFB] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-[12px] font-medium text-[#616161] hover:text-[#202223] hover:bg-[#EAEAEA] rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 text-[12px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] disabled:bg-[#F4F4F4] disabled:text-[#A3A3A3] disabled:cursor-not-allowed rounded-[8px] shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Concern</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReportConcernModal;
