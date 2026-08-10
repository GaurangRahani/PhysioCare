import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, IndianRupee, Loader2, CheckCircle2 } from 'lucide-react';

const CollectPaymentModal = ({ isOpen, onClose, appointment, onPaymentComplete }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
    const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [amount, setAmount] = useState(500); // Default to 500

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${appointment.id}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          transaction_reference: transactionRef,
          amount: amount
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        onPaymentComplete();
        onClose();
      } else {
        setError(data.message || 'Failed to process payment');
      }
    } catch (err) {
      console.error("Payment error", err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    setError('');
    setLoading(true);
    
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${appointment.id}/resend-payment-link`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert("Payment link has been successfully resent to the patient!");
        // We trigger onPaymentComplete just to force a refresh on the dashboard so the timer updates!
        onPaymentComplete(); 
        onClose();
      } else {
        setError(data.message || 'Failed to resend payment link');
      }
    } catch (err) {
      console.error("Resend error", err);
      setError('A network error occurred while resending.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-transparent px-8 py-6 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-dark tracking-tight">
              Collect Payment
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

          <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full opacity-50 blur-2xl"></div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Appointment Details</p>
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="font-extrabold text-dark text-xl">{appointment.patient_name || 'Patient'}</p>
                <p className="text-sm text-gray-500 font-medium mt-1">{appointment.appointment_date} at {appointment.start_time.substring(0, 5)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Pending</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-orange-600 transition-colors">Amount to Collect (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-600 transition-colors">
                    <span className="font-bold">₹</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-dark font-extrabold text-lg transition-all shadow-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Method *</label>
              <div className="grid grid-cols-3 gap-3">
                {['cash', 'card', 'upi'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3.5 px-2 rounded-xl font-bold uppercase tracking-wide text-xs border-2 transition-all shadow-sm ${paymentMethod === method ? 'bg-orange-600 border-orange-600 text-white shadow-[0_8px_15px_rgba(234,88,12,0.25)] transform -translate-y-0.5' : 'bg-white border-gray-200 text-gray-500 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod !== 'cash' && (
              <div className="animate-fade-in group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-orange-600 transition-colors">Reference / Receipt No.</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI Ref Number or Last 4 of Card"
                  className="w-full px-5 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-dark font-medium transition-all shadow-sm"
                />
              </div>
            )}

            <div className="pt-6 mt-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-4 rounded-xl font-bold text-gray-500 hover:text-dark hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleResendLink}
                disabled={loading}
                className="flex-1 py-4 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 font-bold rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                  </svg>
                )}
                Resend Link
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(234,88,12,0.25)] hover:shadow-[0_8px_25px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Mark as Paid
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default CollectPaymentModal;
