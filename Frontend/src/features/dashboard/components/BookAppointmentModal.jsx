import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Stethoscope, Loader2, ArrowRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore } from 'date-fns';

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
        setDoctors(data.doctors);
        if (data.doctors.length > 0) setSelectedDoctorId(data.doctors[0].id);
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
      setStep(3); // Go to payment step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Helper: load Razorpay script on demand ────────────────────────────────
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true); // already loaded
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
      setError('Payment gateway failed to load. Please check your internet connection and try again.');
      return;
    }

    const options = {
      key: bookingData.razorpay_key_id,
      amount: bookingData.razorpay_order.amount,
      currency: bookingData.razorpay_order.currency,
      order_id: bookingData.razorpay_order.id,
      name: 'PhysioCare',
      description: 'Consultation Booking',
      theme: { color: '#9333ea' }, // purple-600
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
  const firstDayOffset = startOfMonth(currentMonth).getDay(); // 0 = Sunday
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="admin-theme">
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="modal-panel" style={{ background: '#fff', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
          
          {/* Header */}
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(248, 250, 252, 0.5)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--heading-text-color)' }}>Book an Appointment</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* STEP 1: DATE SELECTION */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Doctor Selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="section-label" style={{ marginBottom: '0.5rem' }}>Select Doctor</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--gray-400)' }}>
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="modal-input"
                    style={{ paddingLeft: '3rem', cursor: 'pointer', appearance: 'auto' }}
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calendar Grid */}
              <div style={{ border: '1px solid var(--gray-200)', borderRadius: '1rem', padding: '1.5rem', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--gray-600)' }}>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span style={{ fontWeight: 700, color: 'var(--heading-text-color)', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--gray-600)' }}>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 2.25rem)', gap: '0.25rem', justifyContent: 'center', textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                </div>

                {loading && !selectedDate ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary-color)' }} /></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 2.25rem)', gap: '0.25rem', justifyContent: 'center' }}>
                    {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
                    {daysInMonth.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isPast = isBefore(date, today);
                      const isAvailable = availableDates.includes(dateStr);
                      const isSelected = selectedDate && isSameDay(date, selectedDate);

                      let btnStyle = {
                        aspectRatio: '1', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.15s', cursor: 'pointer', border: '2px solid transparent'
                      };

                      if (isPast) {
                        btnStyle = { ...btnStyle, color: 'var(--gray-300)', cursor: 'not-allowed' };
                      } else if (!isAvailable) {
                        btnStyle = { ...btnStyle, background: 'var(--gray-100)', color: 'var(--gray-400)', cursor: 'not-allowed' };
                      } else if (isSelected) {
                        btnStyle = { ...btnStyle, background: 'var(--primary-color)', color: '#fff', borderColor: 'var(--primary-color)', boxShadow: '0 4px 10px rgba(86,90,207,0.3)', transform: 'scale(1.05)' };
                      } else {
                        btnStyle = { ...btnStyle, background: '#fff', color: 'var(--heading-text-color)', border: '2px solid var(--gray-200)' };
                      }

                      return (
                        <button
                          key={dateStr}
                          disabled={isPast || !isAvailable}
                          onClick={() => { setSelectedDate(date); fetchSlots(); }}
                          style={btnStyle}
                          onMouseOver={(e) => { if (!isPast && !isAvailable) return; if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                          onMouseOut={(e) => { if (!isPast && !isAvailable) return; if (!isSelected) e.currentTarget.style.borderColor = 'var(--gray-200)'; }}
                        >
                          {format(date, 'd')}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* NEXT BUTTON FOR STEP 1 */}
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
                <button
                  disabled={!selectedDate}
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  Select Time <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TIME & REASON */}
          {step === 2 && (
            <div style={{ animation: 'fade-in 0.2s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(86,90,207,0.05)', padding: '1rem', borderRadius: '1rem', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
                <CalendarIcon className="w-5 h-5" />
                <span style={{ fontWeight: 700 }}>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</span>
                <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline', color: 'var(--primary-color)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Change</button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="section-label" style={{ marginBottom: '0.75rem' }}>Available Times</label>
                {(() => {
                  if (loading) {
                    return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary-color)' }} /></div>;
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
                      <div style={{ padding: '1.5rem', background: 'var(--gray-50)', color: 'var(--gray-500)', borderRadius: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 500, border: '1px solid var(--gray-200)' }}>
                        No available slots remaining for this date.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {availableSlots.map(slot => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            style={{
                              padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '2px solid', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.15s', cursor: 'pointer',
                              background: isSelected ? 'var(--primary-color)' : '#fff',
                              color: isSelected ? '#fff' : 'var(--heading-text-color)',
                              borderColor: isSelected ? 'var(--primary-color)' : 'var(--gray-200)',
                              boxShadow: isSelected ? '0 4px 10px rgba(86,90,207,0.2)' : 'none'
                            }}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label className="section-label" style={{ marginBottom: '0.5rem' }}>Visit Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Follow-up check, Knee pain"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  className="modal-input"
                />
              </div>

              <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '1rem', flexWrap: 'wrap-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setStep(1)} style={{ color: 'var(--gray-500)', fontSize: '0.95rem', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem 0' }}>
                  &larr; Back
                </button>
                <button
                  disabled={!selectedTime || loading}
                  onClick={handleBookSlot}
                  className="btn-primary"
                  style={{ minWidth: '140px', justifyContent: 'center' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && bookingData && (
            <div style={{ animation: 'zoom-in 0.3s ease-out' }}>
              <div style={{ background: '#fff', border: '2px solid rgba(86,90,207,0.1)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(86,90,207,0.05)', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(86,90,207,0.1)' }}>
                  <h3 style={{ fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Clock className="w-5 h-5" /> Booking Summary
                  </h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: '0.25rem' }}>Date & Time</span>
                      <strong style={{ color: 'var(--heading-text-color)', display: 'block' }}>{format(selectedDate, 'MMM do, yyyy')}</strong>
                      <strong style={{ color: 'var(--heading-text-color)' }}>{selectedTime}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: '0.25rem' }}>Doctor</span>
                      <strong style={{ color: 'var(--heading-text-color)', display: 'block' }}>Dr. {doctors.find(d => d.id === selectedDoctorId)?.name}</strong>
                    </div>
                  </div>
                  <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--heading-text-color)' }}>Consultation Fee</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--heading-text-color)' }}>₹{amount}</span>
                  </div>
                </div>
              </div>

              {countdown === '00:00' ? (
                <div style={{ padding: '1rem', background: 'var(--danger)', color: '#fff', borderRadius: '1rem', textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Your hold expired.</p>
                  <button onClick={() => setStep(1)} style={{ background: '#fff', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Select New Slot
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ padding: '1rem', background: 'rgba(241,119,50,0.1)', border: '1px solid rgba(241,119,50,0.2)', borderRadius: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--secondary-color)' }}>Slot Reserved</span>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--secondary-color)' }}>{countdown}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>Complete payment to confirm appointment</span>
                  </div>

                  <button
                    onClick={handlePayment}
                    className="btn-primary"
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'center' }}
                  >
                    Pay ₹{amount} with Razorpay
                  </button>
                </>
              )}
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
