import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, IndianRupee, Loader2, CheckCircle2, Send, CreditCard } from 'lucide-react';

const CollectPaymentModal = ({ isOpen, onClose, appointment, onPaymentComplete }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [amount, setAmount] = useState(500);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/appointments/${appointment.id}/pay`, {
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/appointments/${appointment.id}/resend-payment-link`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert("Payment link has been successfully resent to the patient!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] border border-[#EAEAEA] z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#F9FAFB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F4F4] text-[#202223] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202223]">Collect Payment</h2>
              <span className="text-xs text-[#6D7175]">Settle desk payment or resend link</span>
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

          {/* Appointment Snapshot */}
          <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#8A8A8A]">Patient</span>
              <span className="text-[11px] font-semibold text-[#B25E09] bg-[#FEF3D6] px-2 py-0.5 rounded-full">
                Pending Hold
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#202223]">{appointment.patient_name || 'Patient'}</h4>
            <p className="text-xs text-[#6D7175]">
              {appointment.appointment_date} at {appointment.start_time?.slice(0, 5)} · Dr. {appointment.doctor_name || 'Doctor'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-[#202223] mb-1">
                Amount to Collect (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#EAEAEA] rounded-lg font-bold text-[#202223] focus:outline-none focus:border-[#202223]"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-[#202223] mb-1.5">
                Channel *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'card', 'upi'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                      paymentMethod === method
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm'
                        : 'bg-white text-[#6D7175] border-[#EAEAEA] hover:border-[#D1D1D1]'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference ID if not cash */}
            {paymentMethod !== 'cash' && (
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">
                  Reference / Receipt No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref Number or Last 4 digits"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                />
              </div>
            )}

            {/* Action Buttons (Using saas primary and secondary buttons) */}
            <div className="pt-3 border-t border-[#EAEAEA] flex items-center gap-2">
              <button
                type="button"
                onClick={handleResendLink}
                disabled={loading}
                className="btn-secondary-saas flex-1 py-2 px-3 text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#4088F8]" />
                <span>Resend Link</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary-saas flex-1 py-2 px-3 text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Paid</span>
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
