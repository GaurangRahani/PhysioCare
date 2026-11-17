import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

const CancelConfirmationModal = ({ isOpen, onClose, onConfirm, appointment }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm(appointment.id);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-[#EAEAEA] z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#FECDCA] bg-[#FEF3F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEE4E2] text-[#D92D20] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#B42318]">Cancel Appointment</h2>
              <span className="text-xs text-[#D92D20]">This action will release the slot</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-md text-[#8A8A8A] hover:text-[#202223] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-[#202223]">
            Are you sure you want to cancel the scheduled visit for <strong className="text-[#0A0A0A]">{appointment?.patient_name || 'this patient'}</strong>?
          </p>

          <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#EAEAEA] text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#6D7175]">Date:</span>
              <span className="font-semibold text-[#202223]">
                {appointment?.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6D7175]">Time:</span>
              <span className="font-bold text-[#202223] font-mono">{appointment?.start_time?.slice(0, 5)}</span>
            </div>
            {appointment?.doctor_name && (
              <div className="flex justify-between items-center">
                <span className="text-[#6D7175]">Doctor:</span>
                <span className="font-medium text-[#202223]">Dr. {appointment.doctor_name}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#B42318] flex items-center gap-1.5 bg-[#FEF3F2] p-2.5 rounded-lg border border-[#FECDCA]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>The calendar slot will immediately become bookable again for other patients.</span>
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9FAFB] border-t border-[#EAEAEA] flex items-center justify-end gap-2.5">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary-saas text-xs py-2 px-4 disabled:opacity-50"
          >
            Keep Appointment
          </button>
          
          <button 
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#D92D20] hover:bg-[#B42318] transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>Yes, Cancel Visit</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CancelConfirmationModal;
