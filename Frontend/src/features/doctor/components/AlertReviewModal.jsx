import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AlertReviewModal = ({ isOpen = true, onClose, alert, onResolved, onSuccess }) => {
  const { getToken } = useAuth();
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !alert) return null;

  const handleResolve = async (actionType) => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${apiUrl}/api/alerts/${alert.id}/resolve`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          actionType,
          resolution_note: resolutionNote,
        })
      });

      if (!res.ok) {
        throw new Error("Failed to resolve alert");
      }

      if (actionType === 'urgent_booking') {
        toast.success('Urgent booking notification sent to patient.');
      } else {
        toast.success('Alert resolved and marked reviewed.');
      }

      if (onResolved) onResolved();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error(error.message || 'Failed to resolve alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/50 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
      <div className="bg-[#FFFFFF] rounded-[16px] border border-[#E5E5E5] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEA] flex justify-between items-center bg-[#FCE4E4]">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#B42318]" />
            <h2 className="text-[16px] font-semibold text-[#B42318] m-0">
              Critical Red-Flag Alert Review
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-[#616161] hover:text-[#202223] rounded-md hover:bg-[#F0F0F0] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[13px]">
          <div className="flex items-center gap-3.5 bg-[#F7F7F7] border border-[#EAEAEA] p-3.5 rounded-[10px]">
            <div className="w-10 h-10 rounded-full bg-[#111111] text-[#FFFFFF] flex items-center justify-center font-semibold text-sm shrink-0">
              {(alert.patient_name || 'P').substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-[#202223] text-sm m-0">{alert.patient_name}</h4>
              <p className="text-[12px] text-[#616161] font-medium m-0 mt-0.5">{alert.message}</p>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-[#202223] text-xs uppercase tracking-wider mb-1.5">
              Patient Feedback / Notes:
            </h5>
            <div className="bg-[#F7F7F7] p-3 rounded-lg text-sm text-[#444444] italic border-l-3 border-[#B42318]">
              "{alert.comments || 'No written feedback provided.'}"
            </div>
          </div>

          <div>
            <h5 className="font-medium text-[#202223] text-xs uppercase tracking-wider mb-1.5">
              Doctor Resolution Note (Optional):
            </h5>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Record clinical actions or modification notes..."
              className="w-full border border-[#DCDCDC] focus:border-[#303030] rounded-lg p-3 text-sm focus:outline-none min-h-[90px] resize-none text-[#202223]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F7F7F7] border-t border-[#EAEAEA] flex items-center justify-end gap-3">
          <button
            disabled={isSubmitting}
            onClick={onClose}
            className="btn-secondary-saas"
          >
            Cancel
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => handleResolve('urgent_booking')}
            className="btn-secondary-saas border-[#B42318] text-[#B42318] hover:bg-[#FCE4E4]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Request Urgent Appointment</span>
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => handleResolve('acknowledge')}
            className="btn-primary-saas"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Acknowledge & Clear</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AlertReviewModal;