import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, AlertTriangle, AlertCircle, Calendar, PauseCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AlertReviewModal = ({ isOpen, onClose, alert, onResolved }) => {
  const { getToken } = useAuth();
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !alert) return null;

  const isRed = alert.alert_level === 'red';

  const handleResolve = async (actionType) => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';



      await fetch(`${apiUrl}/api/alerts/${alert.id}/resolve`, {
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

      if (actionType === 'urgent_booking') {
          toast.success('Urgent booking request sent to patient.');
      } else {
          toast.success('Alert resolved successfully.');
      }
      onResolved();
      onClose();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error(error.response?.data?.message || 'Failed to resolve alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isRed ? 'bg-red-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-3">
            {isRed ? (
              <AlertCircle className="w-6 h-6 text-red-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            )}
            <h2 className={`text-xl font-bold ${isRed ? 'text-red-900' : 'text-yellow-900'}`}>
              {isRed ? 'Critical Alert Review' : 'Warning Alert Review'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto overflow-x-hidden space-y-6">
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-lg">
             {alert.patient_avatar ? (
                <img src={alert.patient_avatar} alt="Patient" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
             ) : (
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-primary text-white flex items-center justify-center font-bold text-lg">
                   {(alert.patient_name || 'U').substring(0, 1).toUpperCase()}
                </div>
             )}
             <div>
                <h4 className="font-semibold text-gray-900">{alert.patient_name}</h4>
                <p className="text-sm font-medium text-gray-700">{alert.message}</p>
             </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-900 mb-2">Patient Comments:</h5>
            <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-700 italic border-l-4 border-gray-300">
              "{alert.comments || 'No comments provided by patient.'}"
            </div>
          </div>

          <div style={{ width: '100%', overflow: 'hidden' }}>
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              Resolution Note (Optional)
            </h5>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Optional notes for this alert..."
              className="w-full box-border border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px] resize-none"
              style={{ boxSizing: 'border-box', maxWidth: '100%' }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row items-stretch gap-3 w-full">
          {isRed ? (
            <>
              <button
                disabled={isSubmitting}
                onClick={() => handleResolve('acknowledge')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition shadow-sm text-sm"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" /> <span className="whitespace-normal text-center leading-tight">Acknowledge & Clear</span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleResolve('urgent_booking')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-red-200 bg-white text-red-600 rounded-lg hover:bg-red-50 font-medium transition shadow-sm text-sm"
              >
                <Calendar className="w-4 h-4 shrink-0" /> <span className="whitespace-normal text-center leading-tight">Request Urgent Booking</span>
              </button>
            </>
          ) : (
            <>
              <button
                disabled={isSubmitting}
                onClick={() => handleResolve('acknowledge')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium transition shadow-sm text-sm"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" /> <span className="whitespace-normal text-center leading-tight">Acknowledge & Clear</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertReviewModal;
