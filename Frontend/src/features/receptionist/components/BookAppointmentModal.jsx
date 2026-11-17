import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Loader2, 
  IndianRupee, 
  ChevronRight, 
  ChevronLeft, 
  UserPlus, 
  CheckCircle2
} from 'lucide-react';

const BookAppointmentModal = ({ isOpen, onClose, onBooked, onRequestRegister }) => {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Patient
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Step 2: Slot
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [visitReason, setVisitReason] = useState('');

  // Step 3: Payment
  const [bookingType, setBookingType] = useState('at-desk');
  const [amount, setAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      setStep(1);
      setError('');
      setSelectedPatient(null);
      setSearchQuery('');
      setSelectedSlot('');
      setVisitReason('');
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors || []);
        if (data.doctors && data.doctors.length > 0) {
          setSelectedDoctorId(data.doctors[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const delaySearch = setTimeout(() => searchPatients(searchQuery.trim()), 400);
      return () => clearTimeout(delaySearch);
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  const searchPatients = async (query) => {
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/receptionists/patients/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (step === 2 && selectedDoctorId && selectedDate) {
      fetchSlots();
    }
  }, [step, selectedDoctorId, selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/appointments/slots?date=${selectedDate}&doctor_id=${selectedDoctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAvailableSlots(data.slots || []);
      } else {
        setError(data.message || 'Failed to load time slots');
      }
    } catch (err) {
      setError('Error fetching available slots');
    } finally {
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

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = bookingType === 'at-desk' ? '/api/appointments/book-at-desk' : '/api/appointments/book-by-phone';
      
      const payload = {
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctorId,
        appointment_date: selectedDate,
        start_time: selectedSlot,
        visit_reason: visitReason,
        amount: parseFloat(amount) || 500,
      };

      if (bookingType === 'at-desk') {
        payload.payment_method = paymentMethod;
        if (paymentMethod !== 'cash') {
          payload.transaction_reference = transactionRef;
        }
      }

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onBooked(data.appointment);
        onClose();
      } else {
        setError(data.message || 'Booking failed');
      }
    } catch (err) {
      setError('A network error occurred while booking.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#EAEAEA] z-10">
        
        {/* Header with Step Tracker */}
        <div className="px-5 py-4 border-b border-[#EAEAEA] bg-[#F9FAFB] flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#202223]">Book Appointment</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[11px] font-semibold ${step >= 1 ? 'text-[#0A0A0A] font-bold' : 'text-[#8A8A8A]'}`}>
                1. Patient
              </span>
              <ChevronRight className="w-3 h-3 text-[#D1D1D1]" />
              <span className={`text-[11px] font-semibold ${step >= 2 ? 'text-[#0A0A0A] font-bold' : 'text-[#8A8A8A]'}`}>
                2. Doctor & Slot
              </span>
              <ChevronRight className="w-3 h-3 text-[#D1D1D1]" />
              <span className={`text-[11px] font-semibold ${step >= 3 ? 'text-[#0A0A0A] font-bold' : 'text-[#8A8A8A]'}`}>
                3. Payment
              </span>
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] text-xs text-[#B42318] rounded-lg flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 1: FIND OR REGISTER PATIENT
              ───────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1.5">
                  Search Patient
                </label>
                <input
                  type="text"
                  placeholder="Type patient name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] text-[#202223] placeholder-[#8A8A8A]"
                  autoFocus
                />
              </div>

              {patients.length > 0 ? (
                <div className="border border-[#EAEAEA] rounded-xl overflow-hidden divide-y divide-[#EAEAEA] max-h-60 overflow-y-auto">
                  {patients.map((p) => (
                    <div 
                      key={p.id} 
                      className="p-3 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white font-bold text-xs flex items-center justify-center">
                          {(p.name || 'PT').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-[#202223]">{p.name}</p>
                          <p className="text-[11px] text-[#6D7175]">{p.phone || p.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setStep(2);
                        }}
                        className="btn-primary-saas text-xs py-1.5 px-3"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="p-6 text-center border-2 border-dashed border-[#EAEAEA] rounded-xl bg-[#F9FAFB]">
                  <p className="text-xs text-[#6D7175] mb-3">No registered patient found for "{searchQuery}"</p>
                  <button 
                    type="button"
                    onClick={onRequestRegister}
                    className="btn-primary-saas inline-flex items-center gap-1.5 text-xs py-1.5 px-3"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register New Patient</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#EAEAEA] text-center">
                  <p className="text-xs text-[#6D7175]">
                    Enter at least 2 characters to search the patient registry.
                  </p>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onRequestRegister}
                  className="text-xs text-[#202223] hover:underline font-semibold"
                >
                  + Register Walk-in Patient Directly
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: PICK DOCTOR, DATE & TIME SLOT
              ───────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              
              {/* Selected Patient Banner */}
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white font-bold text-xs flex items-center justify-center">
                    {(selectedPatient?.name || 'PT').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#8A8A8A] block">Selected Patient</span>
                    <span className="text-xs sm:text-sm font-bold text-[#202223]">{selectedPatient?.name}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setStep(1)} 
                  className="text-xs text-[#4088F8] hover:underline font-medium"
                >
                  Change
                </button>
              </div>

              {/* Doctor Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1.5 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#4088F8]" />
                  <span>Attending Doctor</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization || 'Physiotherapy'})</option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#202223]" />
                  <span>Consultation Date</span>
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {generateDateButtons().map((dateObj, i) => {
                    const dateStr = dateObj.toLocaleDateString('en-CA');
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        className={`shrink-0 flex flex-col items-center justify-center w-16 py-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white shadow-sm font-semibold'
                            : 'bg-white border-[#EAEAEA] text-[#6D7175] hover:border-[#D1D1D1] hover:text-[#202223]'
                        }`}
                      >
                        <span className="text-[10px] uppercase">{dateObj.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                        <span className="text-base font-bold leading-tight mt-0.5">{dateObj.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots Grid */}
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#B25E09]" />
                  <span>Available Time Slot</span>
                </label>

                {loading ? (
                  <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 text-[#202223] animate-spin" /></div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] text-center">
                    <p className="text-xs text-[#6D7175]">No open slots available for this doctor on {selectedDate}.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map((slot, i) => {
                      const isSelected = selectedSlot === slot.time;
                      const isTaken = slot.status === 'taken';
                      const isBlocked = slot.status === 'blocked';
                      const isDisabled = isTaken || isBlocked;

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2 px-2 rounded-lg text-xs font-mono font-medium transition-all border ${
                            isTaken
                              ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] cursor-not-allowed opacity-50'
                              : isBlocked
                              ? 'bg-[#F4F4F4] text-[#8A8A8A] border-[#EAEAEA] cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-sm font-bold'
                              : 'bg-white text-[#202223] border-[#EAEAEA] hover:border-[#202223]'
                          }`}
                        >
                          <span>{slot.time?.slice(0, 5)}</span>
                          {isTaken && <span className="block text-[8px] uppercase">Taken</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary-saas text-xs py-1.5 px-3"
                >
                  Back
                </button>

                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="btn-primary-saas inline-flex items-center gap-1.5 text-xs py-1.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Continue to Payment</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: PAYMENT & CONFIRMATION
              ───────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              
              {/* Summary Card */}
              <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#EAEAEA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#8A8A8A]">Booking Summary</span>
                  <button type="button" onClick={() => setStep(2)} className="text-xs text-[#4088F8] hover:underline font-medium">Edit Slot</button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#202223]">{selectedPatient?.name}</h4>
                    <p className="text-xs text-[#6D7175]">
                      {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {selectedSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#202223]">₹{amount}</span>
                  </div>
                </div>
              </div>

              {/* Visit Reason */}
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">
                  Visit Reason (Optional)
                </label>
                <input
                  type="text"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="e.g. Cervical pain, post-op consultation"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                />
              </div>

              {/* Payment Type */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#202223]">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <label 
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                      bookingType === 'at-desk' 
                        ? 'border-[#0A0A0A] bg-[#F4F4F4]' 
                        : 'border-[#EAEAEA] bg-white hover:border-[#D1D1D1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#202223]">Pay at Desk</span>
                      <input 
                        type="radio" 
                        name="bookingType" 
                        value="at-desk" 
                        checked={bookingType === 'at-desk'} 
                        onChange={(e) => setBookingType(e.target.value)} 
                        className="text-[#0A0A0A] focus:ring-[#0A0A0A]"
                      />
                    </div>
                    <span className="text-[11px] text-[#6D7175]">Cash, POS Card, or Clinic QR</span>
                  </label>

                  <label 
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                      bookingType === 'phone' 
                        ? 'border-[#0A0A0A] bg-[#F4F4F4]' 
                        : 'border-[#EAEAEA] bg-white hover:border-[#D1D1D1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#202223]">Send Payment Link</span>
                      <input 
                        type="radio" 
                        name="bookingType" 
                        value="phone" 
                        checked={bookingType === 'phone'} 
                        onChange={(e) => setBookingType(e.target.value)} 
                        className="text-[#0A0A0A] focus:ring-[#0A0A0A]"
                      />
                    </div>
                    <span className="text-[11px] text-[#6D7175]">15-minute hold with Razorpay</span>
                  </label>
                </div>
              </div>

              {/* At-Desk Payment Details */}
              {bookingType === 'at-desk' && (
                <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#EAEAEA] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg font-bold text-[#202223]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">
                        Channel *
                      </label>
                      <div className="flex gap-1.5">
                        {['cash', 'card', 'upi'].map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                              paymentMethod === method
                                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                                : 'bg-white text-[#6D7175] border-[#EAEAEA] hover:border-[#D1D1D1]'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {paymentMethod !== 'cash' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">
                        Transaction / Reference ID
                      </label>
                      <input
                        type="text"
                        placeholder="UPI ref or Card slip ref..."
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg text-[#202223]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary-saas text-xs py-1.5 px-3"
                >
                  Back
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalSubmit}
                  className="btn-primary-saas inline-flex items-center gap-1.5 text-xs py-2 px-5 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
