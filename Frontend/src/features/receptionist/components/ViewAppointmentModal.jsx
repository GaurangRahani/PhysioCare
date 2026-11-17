import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, Calendar, Clock, User, Stethoscope, FileText, Loader2, Ban, CheckCircle2 } from 'lucide-react';

const ViewAppointmentModal = ({ isOpen, onClose, appointment, onCancelled }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !appointment) return null;

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this appointment? This action cannot be undone.")) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/appointments/${appointment.id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        onCancelled();
        onClose();
      } else {
        setError(data.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isPending = appointment.payment_status === 'pending' || appointment.status === 'pending_payment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border border-[#EAEAEA] z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#F9FAFB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F4F4] text-[#202223] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202223]">Appointment Details</h2>
              <span className="text-xs text-[#6D7175]">Ref ID: #{appointment.id?.slice(0, 8)}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-md text-[#8A8A8A] hover:text-[#202223] hover:bg-[#EAEAEA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] text-xs text-[#B42318] rounded-lg flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Card */}
          <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white font-bold text-sm flex items-center justify-center shrink-0">
              {(appointment.patient_name || 'PT').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A8A] block">Patient Name</span>
              <h3 className="text-sm sm:text-base font-bold text-[#202223]">
                {appointment.patient_name || 'Unknown Patient'}
              </h3>
            </div>
          </div>

          {/* Grid: Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#4088F8] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A8A] block">Date</span>
                <span className="text-xs font-semibold text-[#202223]">{appointment.appointment_date}</span>
              </div>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#B25E09] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A8A] block">Time</span>
                <span className="text-xs font-bold text-[#202223] font-mono">{appointment.start_time?.slice(0, 5)}</span>
              </div>
            </div>
          </div>

          {/* Attending Doctor */}
          <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] flex items-center gap-2.5">
            <Stethoscope className="w-4 h-4 text-[#202223] shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A8A] block">Doctor</span>
              <span className="text-xs font-semibold text-[#202223]">Dr. {appointment.doctor_name || 'Unknown'}</span>
            </div>
          </div>

          {/* Reason / Notes */}
          <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8A8A8A] block">Reason / Clinical Notes</span>
            <p className="text-xs text-[#202223]">{appointment.visit_reason || 'General Follow-up Consultation'}</p>
            {appointment.notes && (
              <p className="text-xs text-[#6D7175] italic pt-1 border-t border-[#EAEAEA]">
                "{appointment.notes}"
              </p>
            )}
          </div>

          {/* Status */}
          <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#8A8A8A]">Status</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPending
                ? 'bg-[#FEF3D6] text-[#B25E09]'
                : appointment.status === 'completed'
                ? 'bg-[#D9F7C3] text-[#245B19]'
                : 'bg-[#EBF3FF] text-[#2F68D6]'
            }`}>
              {isPending ? 'Pending Payment' : appointment.status === 'completed' ? 'Completed' : 'Confirmed Visit'}
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EAEAEA] bg-[#F9FAFB] flex items-center justify-between">
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' ? (
            <button
              type="button"
              onClick={() => {
                const apptDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
                const diffInMinutes = (apptDateTime - new Date()) / (1000 * 60);
                if (diffInMinutes <= 60) {
                  alert("You cannot cancel an appointment within 60 minutes of the scheduled time.");
                } else {
                  handleCancel();
                }
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E5484D] hover:bg-[#FEF3F2] rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              <span>Cancel Appointment</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn-primary-saas px-5 py-1.5 text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ViewAppointmentModal;
