import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, Calendar, Clock, User, Stethoscope, FileText, Loader2, Ban } from 'lucide-react';

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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${appointment.id}/cancel`, {
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-transparent px-8 py-6 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-dark tracking-tight">
              Appointment Details
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-danger transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-danger text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 shadow-sm">
              <X className="w-5 h-5"/> {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Patient</p>
                <p className="font-bold text-dark text-lg">{appointment.patient_name || 'Unknown Patient'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="font-semibold text-dark">{appointment.appointment_date}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
                  <p className="font-semibold text-dark">{appointment.start_time.substring(0, 5)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Doctor</p>
                <p className="font-semibold text-dark">Dr. {appointment.doctor_name || 'Unknown'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reason / Notes</p>
                <p className="font-medium text-dark text-sm mt-1">{appointment.visit_reason || 'No reason provided.'}</p>
                {appointment.notes && (
                  <p className="text-sm text-gray-500 mt-2 p-2 bg-white rounded border border-gray-100 italic">
                    "{appointment.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
               <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  isPending 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {isPending ? 'Pending Payment' : 'Scheduled'}
                </span>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
           <button
             onClick={handleCancel}
             disabled={loading}
             className="flex items-center gap-2 px-4 py-2 text-danger hover:bg-red-50 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
             Cancel Appointment
           </button>
           <button
             onClick={onClose}
             className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAppointmentModal;
