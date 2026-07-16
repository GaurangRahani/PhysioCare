import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, Calendar, Clock, Stethoscope, Loader2, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const PatientBookingModal = ({ isOpen, onClose, onBooked }) => {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Slot, 2: Confirm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Doctor & Date & Slot Selection
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [amount] = useState(500); // Standard consultation fee

  // ─── INITIALIZATION ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      setStep(1);
      setError('');
      setSelectedSlot('');
      setVisitReason('');
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.doctors);
        if (data.doctors.length > 0) setSelectedDoctorId(data.doctors[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── FETCH SLOTS WHEN DOCTOR OR DATE CHANGES ───────────────────────────────
  useEffect(() => {
    if (isOpen && selectedDoctorId && selectedDate) {
      fetchSlots();
    }
  }, [selectedDoctorId, selectedDate, isOpen]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/slots?doctor_id=${selectedDoctorId}&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setAvailableSlots(data.slots || []);
        setSelectedSlot('');
      } else {
        setError('Error fetching slots');
        setAvailableSlots([]);
      }
    } catch (err) {
      setError('Network error');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ─── SUBMIT BOOKING ──────────────────────────────────────────────────────
  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      const token = await getToken();

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/self-book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          appointment_date: selectedDate,
          start_time: selectedSlot,
          visit_reason: visitReason || undefined,
          amount: amount,
          notes: "Booked via Patient Dashboard"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to book appointment');
      }

      // Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use Razorpay Key ID
        amount: data.razorpay_order.amount,
        currency: data.razorpay_order.currency,
        name: 'PhysioCare',
        description: 'Consultation Fee',
        order_id: data.razorpay_order.id,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                appointment_id: data.appointment.id
              })
            });

            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.success) {
              setStep(3); // Success Step
            } else {
              setError(verifyData.message || 'Payment verification failed.');
            }
          } catch (err) {
            setError('Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: "Patient", // Optional
        },
        theme: {
          color: '#565ACF'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError('Payment failed or cancelled.');
        setLoading(false);
      });
      rzp.open();
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const generateDateButtons = () => {
    const dates = [];
    let current = new Date();
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  if (!isOpen) return null;

  const selectedDoctorName = doctors.find(d => d.id === selectedDoctorId)?.user?.name || 'Doctor';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-8 py-6 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-extrabold text-dark tracking-tight">Book Appointment</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[11px] uppercase tracking-wider font-bold ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>Step 1: Slot</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className={`text-[11px] uppercase tracking-wider font-bold ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>Step 2: Details & Confirm</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-danger transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {error && <div className="mb-6 p-4 bg-red-50 text-danger text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2"><X className="w-5 h-5"/> {error}</div>}

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-heading mb-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" /> Select Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-dark font-medium shadow-sm"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.user?.name} ({d.specialization || 'Physiotherapist'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-heading mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Select Date
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {generateDateButtons().map((dateObj, i) => {
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all shadow-sm ${
                          isSelected 
                            ? 'bg-primary border-primary text-white' 
                            : 'bg-white border-gray-100 text-gray-500 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{dateObj.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                        <span className="text-2xl font-black">{dateObj.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-heading mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Available Slots
                </label>
                
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                    <p className="text-gray-500 font-medium">No slots available for this date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {availableSlots.map((slot, i) => {
                      const isSelected = selectedSlot === slot.time;
                      const isTaken = slot.status === 'taken';
                      const isBlocked = slot.status === 'blocked';
                      
                      const isToday = new Date(selectedDate).toDateString() === new Date().toDateString();
                      const [hours, minutes] = slot.time.split(':').map(Number);
                      const slotDate = new Date();
                      slotDate.setHours(hours, minutes, 0, 0);
                      const isPassed = isToday && slotDate < new Date();
                      
                      const isDisabled = isTaken || isBlocked || isPassed;

                      return (
                        <button
                          key={i}
                          disabled={isDisabled}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-3 rounded-xl font-bold text-sm transition-all border-2 shadow-sm ${
                            isTaken ? 'bg-red-50 text-red-400 border-red-50 cursor-not-allowed' :
                            isBlocked ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed' :
                            isPassed ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-50' :
                            isSelected ? 'bg-dark text-white border-dark transform scale-[1.02]' :
                            'bg-white text-dark border-gray-200 hover:border-primary/50 hover:text-primary'
                          }`}
                        >
                          {slot.time}
                          {isTaken && <span className="block text-[10px] uppercase mt-0.5">Taken</span>}
                          {isBlocked && <span className="block text-[10px] uppercase mt-0.5">Blocked</span>}
                          {isPassed && !isTaken && !isBlocked && <span className="block text-[10px] uppercase mt-0.5">Passed</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {selectedSlot && (
                <div className="mt-8 flex justify-end">
                  <button onClick={() => setStep(2)} className="px-8 py-4 bg-gradient-to-r from-primary to-[#7074e8] text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(86,90,207,0.25)] hover:shadow-[0_8px_25px_rgba(86,90,207,0.4)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    Continue to Details <ChevronRight className="w-5 h-5"/>
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gray-50 p-6 rounded-[16px] border border-gray-100">
                <h3 className="font-bold text-heading text-lg mb-4 border-b border-gray-200 pb-3">Booking Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-body flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Doctor:</span>
                    <span className="font-semibold text-heading">Dr. {selectedDoctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body flex items-center gap-2"><Calendar className="h-4 w-4" /> Date:</span>
                    <span className="font-semibold text-heading">{new Date(selectedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body flex items-center gap-2"><Clock className="h-4 w-4" /> Time:</span>
                    <span className="font-semibold text-heading">{selectedSlot}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-body font-medium">Consultation Fee:</span>
                    <span className="font-bold text-primary text-lg">₹{amount}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-heading mb-2">Reason for Visit (Optional)</label>
                <textarea
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="E.g., Back pain for 3 weeks..."
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium shadow-sm min-h-[120px]"
                ></textarea>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={loading}
                  className="px-8 py-3.5 bg-gradient-to-r from-primary to-[#7074e8] hover:opacity-90 transition-all text-white font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Book'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 flex flex-col items-center text-center animate-fade-in">
              <div className="bg-success/10 p-5 rounded-full mb-6">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
              <h2 className="text-3xl font-extrabold text-heading mb-3">Booking Confirmed!</h2>
              <p className="text-body text-lg mb-8 max-w-md">Your appointment with Dr. {selectedDoctorName} has been successfully booked for {new Date(selectedDate).toLocaleDateString()} at {selectedSlot}.</p>
              <button
                onClick={() => {
                  onBooked();
                  onClose();
                }}
                className="px-10 py-4 bg-dark text-white font-bold rounded-xl shadow-md hover:bg-gray-800 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientBookingModal;
