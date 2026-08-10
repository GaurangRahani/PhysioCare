import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const CancelConfirmationModal = ({ isOpen, onClose, onConfirm, appointment }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm(appointment.id);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-red-50 p-6 flex items-start justify-between border-b border-red-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-poppins">Cancel Appointment</h2>
              <p className="text-sm text-gray-600 mt-1 font-montserrat">This action cannot be undone.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 font-montserrat space-y-4 text-gray-700">
          <p>
            Are you sure you want to cancel the appointment for <strong className="text-gray-900">{appointment?.patient_name || 'this patient'}</strong>?
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Date:</span>
              <span className="font-semibold text-gray-900">{appointment?.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time:</span>
              <span className="font-semibold text-gray-900">{appointment?.start_time}</span>
            </div>
          </div>
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            The time slot will immediately become bookable again.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 font-poppins">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep Appointment
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                'Yes, Cancel It'
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default CancelConfirmationModal;
