import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Stethoscope, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isBefore 
} from 'date-fns';

const BookAppointmentModal = ({ isOpen, onClose, onBooked, onSuccess }) => {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Step 1: Date
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Step 2: Time
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [visitReason, setVisitReason] = useState('');
  
  // Step 3: Payment
  const [amount] = useState(800); // Standard consultation fee
  const [paymentExpiry, setPaymentExpiry] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [bookingData, setBookingData] = useState(null);

  // Initialize and fetch doctors
  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      setStep(1);
      setError('');
      setSelectedDate(null);
      setSelectedTime('');
      setVisitReason('');
      setCurrentMonth(new Date());
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
        setDoctors(data.doctors || []);
        if (data.doctors && data.doctors.length > 0) {
          setSelectedDoctorId(data.doctors[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch available dates for the month
  useEffect(() => {
    if (isOpen && selectedDoctorId) {
      fetchAvailableDates(currentMonth);
    }
  }, [isOpen, selectedDoctorId, currentMonth]);

  const fetchAvailableDates = async (date) => {
    try {
      setLoading(true);
      const token = await getToken();
      const monthStr = format(date, 'yyyy-MM');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/available-dates?doctor_id=${selectedDoctorId}&month=${monthStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableDates(data.available_dates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots for selected date
  useEffect(() => {
    if (isOpen && selectedDate && selectedDoctorId) {
      fetchSlots();
      setSelectedTime('');
    }
  }, [selectedDate, selectedDoctorId]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/slots?doctor_id=${selectedDoctorId}&date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Countdown Timer
  useEffect(() => {
    let interval;
    if (step === 3 && paymentExpiry) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(paymentExpiry) - new Date()) / 1000));
        if (remaining <= 0) {
          setCountdown('00:00');
          clearInterval(interval);
        } else {
          const m = String(Math.floor(remaining / 60)).padStart(2, '0');
          const s = String(remaining % 60).padStart(2, '0');
          setCountdown(`${m}:${s}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, paymentExpiry]);

  // Handle Book & Proceed to Payment
  const handleBookSlot = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/self-book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          appointment_date: dateStr,
          start_time: selectedTime,
          visit_reason: visitReason,
          amount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to hold slot');

      setBookingData(data);
      setPaymentExpiry(data.expires_at);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper: load Razorpay script on demand
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Open Razorpay Checkout
  const handlePayment = async () => {
    if (!bookingData) return;

    setError('');
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError('Payment gateway failed to load. Please check your internet connection.');
      return;
    }

    const options = {
      key: bookingData.razorpay_key_id,
      amount: bookingData.razorpay_order.amount,
      currency: bookingData.razorpay_order.currency,
      order_id: bookingData.razorpay_order.id,
      name: 'AlignCare',
      description: 'Consultation Booking',
      theme: { color: '#008060' }, // Shopify green
      handler: async function (response) {
        try {
          const token = await getToken();
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${bookingData.appointment.id}/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(response)
          });
          if (onBooked) onBooked();
          if (onSuccess) onSuccess();
          onClose();
        } catch (err) {
          console.error('Payment verification failed:', err);
          setError('Payment processing encountered an issue. Your slot is held — please contact support.');
        }
      },
      modal: {
        ondismiss: () => {
          setError('Payment was cancelled. Your slot is still reserved for the remaining time.');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (!isOpen) return null;

  // Calendar rendering logic
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  const firstDayOffset = startOfMonth(currentMonth).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif] animate-fade-in select-none">
      
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-[480px] bg-[#FFFFFF] rounded-[16px] border border-[#EAEAEA] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. MODAL HEADER & STEP TRACKER ─────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-[#EAEAEA] bg-[#FFFFFF] flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h2 className="text-[15px] font-semibold text-[#202223]">
              Book an Appointment
            </h2>
            {/* Step Indicator */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#8A8A8A]">
              <span className={`font-medium ${step === 1 ? 'text-[#202223] font-semibold' : ''}`}>1. Date</span>
              <span>·</span>
              <span className={`font-medium ${step === 2 ? 'text-[#202223] font-semibold' : ''}`}>2. Time</span>
              <span>·</span>
              <span className={`font-medium ${step === 3 ? 'text-[#202223] font-semibold' : ''}`}>3. Confirmation</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#8A8A8A] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── 2. MODAL BODY ─────────────────────────────────────────────────── */}
        <div className="p-5 overflow-y-auto flex-1 text-[#202223] space-y-4">
          
          {error && (
            <div className="p-3 bg-[#FCE4E4] border border-[#F5C2C2] text-[#B81818] rounded-[10px] text-[12px] flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: DATE SELECTION                                              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Doctor Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
                  Select Clinical Specialist
                </label>
                <div className="relative">
                  <Stethoscope size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-[13px] font-medium bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] text-[#202223] outline-none focus:border-[#202223] focus:bg-[#FFFFFF] transition-colors cursor-pointer"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Month Navigator & Calendar Grid */}
              <div className="border border-[#EAEAEA] rounded-[12px] p-3.5 bg-[#FFFFFF] shadow-xs space-y-3">
                {/* Month Navigator */}
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1 rounded-[6px] text-[#616161] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[13px] font-semibold text-[#202223] font-mono">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1 rounded-[6px] text-[#616161] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#8A8A8A] uppercase">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>

                {/* Day Grid */}
                {loading && !selectedDate ? (
                  <div className="py-10 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={20} className="text-[#202223] animate-spin" />
                    <span className="text-[11px] text-[#8A8A8A]">Checking available dates...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOffset }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {daysInMonth.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isPast = isBefore(date, today);
                      const isAvailable = availableDates.includes(dateStr);
                      const isSelected = selectedDate && isSameDay(date, selectedDate);

                      return (
                        <button
                          key={dateStr}
                          disabled={isPast || !isAvailable}
                          onClick={() => { setSelectedDate(date); fetchSlots(); }}
                          className={`aspect-square rounded-[8px] flex items-center justify-center text-[12px] font-medium transition-colors ${
                            isSelected
                              ? 'bg-[#202223] text-[#FFFFFF] font-bold shadow-xs'
                              : isPast || !isAvailable
                              ? 'text-[#CCCCCC] bg-[#FDFDFD] cursor-not-allowed'
                              : 'text-[#202223] border border-[#EAEAEA] bg-[#FFFFFF] hover:border-[#202223] hover:bg-[#F4F4F4] cursor-pointer'
                          }`}
                        >
                          {format(date, 'd')}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-[11px] text-[#8A8A8A]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs border border-[#202223]" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-[#202223]" /> Selected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-[#F4F4F4]" /> Unavailable
                  </span>
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end">
                <button
                  disabled={!selectedDate}
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-[12px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] disabled:bg-[#F4F4F4] disabled:text-[#A3A3A3] disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Select Time</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: TIME & CLINICAL REASON                                     */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              {/* Selected Date Banner */}
              <div className="p-3 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={15} className="text-[#008060]" />
                  <span className="text-[13px] font-medium text-[#202223]">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[12px] font-medium text-[#008060] hover:underline cursor-pointer"
                >
                  Change Date
                </button>
              </div>

              {/* Available Slots */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
                  Available Consultation Slots
                </label>

                {(() => {
                  if (loading) {
                    return (
                      <div className="py-8 flex flex-col items-center justify-center gap-2">
                        <Loader2 size={20} className="text-[#202223] animate-spin" />
                        <span className="text-[11px] text-[#8A8A8A]">Fetching available slots...</span>
                      </div>
                    );
                  }

                  const availableSlots = slots.filter(slot => {
                    if (slot.status !== 'available') return false;
                    if (selectedDate && isSameDay(selectedDate, new Date())) {
                      const [hours, minutes] = slot.time.split(':').map(Number);
                      const now = new Date();
                      const slotTime = new Date();
                      slotTime.setHours(hours, minutes, 0, 0);
                      if (slotTime < now) return false;
                    }
                    return true;
                  });

                  if (availableSlots.length === 0) {
                    return (
                      <div className="p-6 text-center text-[#8A8A8A] text-[12px] bg-[#FBFBFB] rounded-[10px] border border-dashed border-[#EAEAEA]">
                        No available slots remaining for this date. Please choose another day.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {availableSlots.map(slot => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-2 px-1 text-center rounded-[8px] text-[12px] font-medium font-mono transition-colors ${
                              isSelected
                                ? 'bg-[#202223] text-[#FFFFFF] font-bold shadow-xs'
                                : 'bg-[#FFFFFF] border border-[#EAEAEA] text-[#202223] hover:border-[#202223] hover:bg-[#F4F4F4] cursor-pointer'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Visit Reason Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
                  Clinical Reason / Chief Complaint (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cervical pain, post-op evaluation, stiffness"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-[13px] bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] text-[#202223] placeholder-[#8A8A8A] outline-none focus:border-[#202223] transition-colors"
                />
              </div>

              {/* Step 2 Actions */}
              <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[12px] font-medium text-[#616161] hover:text-[#202223] transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!selectedTime || loading}
                  onClick={handleBookSlot}
                  className="px-4 py-2 text-[12px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] disabled:bg-[#F4F4F4] disabled:text-[#A3A3A3] disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <span>Continue to Payment</span>}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: PAYMENT & CONFIRMATION                                      */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 3 && bookingData && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Booking Summary Box */}
              <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-[#FBFBFB] border-b border-[#EAEAEA] flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} /> Summary
                  </span>
                  <span className="text-[#008060] font-mono">Slot Reserved</span>
                </div>

                <div className="p-4 space-y-3 text-[13px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-[#8A8A8A] block">Date & Time</span>
                      <strong className="text-[#202223] block mt-0.5">
                        {format(selectedDate, 'MMM d, yyyy')}
                      </strong>
                      <span className="text-[#616161] font-mono text-[12px]">{selectedTime}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#8A8A8A] block">Physiotherapist</span>
                      <strong className="text-[#202223] block mt-0.5">
                        Dr. {selectedDoctor?.name || 'Assigned'}
                      </strong>
                      <span className="text-[#616161] text-[12px]">Orthopedic Care</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#F0F0F0] flex items-center justify-between">
                    <span className="text-[#616161]">Consultation Fee</span>
                    <span className="text-base font-bold font-mono text-[#202223]">₹{amount}</span>
                  </div>
                </div>
              </div>

              {/* Countdown / Hold Timer */}
              {countdown === '00:00' ? (
                <div className="p-4 bg-[#FCE4E4] border border-[#F5C2C2] text-[#B81818] rounded-[10px] text-center space-y-2">
                  <p className="text-[12px] font-semibold">Your reservation hold has expired.</p>
                  <button
                    onClick={() => setStep(1)}
                    className="px-3 py-1.5 bg-[#FFFFFF] border border-[#B81818] text-[#B81818] rounded-[6px] text-[11px] font-medium hover:bg-[#FCE4E4] cursor-pointer"
                  >
                    Select New Slot
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-[#FFF9E6] border border-[#FDE8A5] rounded-[10px] text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6116]">
                    Slot Reserved
                  </span>
                  <div className="text-2xl font-bold font-mono text-[#8A6116] tracking-tight">
                    {countdown}
                  </div>
                  <p className="text-[11px] text-[#8A6116]">
                    Complete payment to confirm appointment before the timer expires.
                  </p>
                </div>
              )}

              {/* Pay with Razorpay Button */}
              {countdown !== '00:00' && (
                <button
                  type="button"
                  onClick={handlePayment}
                  className="w-full py-3 px-4 rounded-[8px] text-[13px] font-semibold text-[#FFFFFF] bg-[#008060] hover:bg-[#006e52] shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Lock size={14} />
                  <span>Pay ₹{amount} with Razorpay</span>
                </button>
              )}

              <p className="text-center text-[10px] text-[#8A8A8A] flex items-center justify-center gap-1">
                <ShieldCheck size={12} className="text-[#008060]" />
                100% Encrypted & Secure Payment Gateway
              </p>

            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default BookAppointmentModal;
