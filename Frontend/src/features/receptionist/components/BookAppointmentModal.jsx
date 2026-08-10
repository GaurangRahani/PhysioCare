import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, Calendar, Clock, User, Stethoscope, Loader2, IndianRupee, FileText, ChevronRight, ChevronLeft, UserPlus, Phone, MapPin, Mail, CheckCircle2 } from 'lucide-react';

const BookAppointmentModal = ({ isOpen, onClose, onBooked, onRequestRegister }) => {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Patient, 2: Slot, 3: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1 State: Find Patient
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Step 2 State: Pick a Slot
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [visitReason, setVisitReason] = useState('');

  // Step 3 State: Payment
  const [bookingType, setBookingType] = useState('at-desk');
  const [amount, setAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');

  // ─── INITIALIZATION ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      setStep(1);
      setError('');
      setError('');
      setSelectedPatient(null);
      setSearchQuery('');
      setSelectedSlot('');
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors);
        if (data.doctors.length > 0) setSelectedDoctorId(data.doctors[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── STEP 1 LOGIC ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delaySearch = setTimeout(() => searchPatients(searchQuery), 500);
      return () => clearTimeout(delaySearch);
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  const searchPatients = async (query) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/receptionists/patients/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPatients(data.patients);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── STEP 2 LOGIC ──────────────────────────────────────────────────────────
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/slots?date=${selectedDate}&doctor_id=${selectedDoctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAvailableSlots(data.slots);
      } else {
        setError(data.message || 'Failed to load slots');
      }
    } catch (err) {
      setError('Error fetching slots');
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

  // ─── STEP 3 LOGIC ──────────────────────────────────────────────────────────
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await getToken();
      const endpoint = bookingType === 'at-desk' ? '/api/appointments/book-at-desk' : '/api/appointments/book-by-phone';
      
      const payload = {
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctorId,
        appointment_date: selectedDate,
        start_time: selectedSlot,
        visit_reason: visitReason,
        amount: parseFloat(amount),
      };

      if (bookingType === 'at-desk') {
        payload.payment_method = paymentMethod;
        if (paymentMethod !== 'cash') payload.transaction_reference = transactionRef;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
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
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-8 py-6 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-extrabold text-dark tracking-tight">Book Appointment</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[11px] uppercase tracking-wider font-bold ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>Step 1: Patient</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className={`text-[11px] uppercase tracking-wider font-bold ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>Step 2: Slot</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className={`text-[11px] uppercase tracking-wider font-bold ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>Step 3: Payment</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-danger transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto">
          {error && <div className="mb-6 p-4 bg-red-50 text-danger text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2"><X className="w-5 h-5"/> {error}</div>}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 1: FIND OR REGISTER PATIENT
              ───────────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-heading mb-4">Find Patient</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium shadow-sm"
                />
              </div>

              {patients.length > 0 ? (
                <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  {patients.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-white border-b border-gray-50 last:border-0 hover:bg-primary/5 transition-colors">
                      <div>
                        <p className="font-bold text-dark">{p.name}</p>
                        <p className="text-sm text-gray-500 font-medium">{p.phone}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedPatient(p); setStep(2); }}
                        className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-lg transition-colors text-sm"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="mt-4 p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-500 font-medium mb-4">No patient found matching "{searchQuery}"</p>
                  <button onClick={onRequestRegister} className="px-5 py-2.5 bg-dark text-white font-bold rounded-xl shadow-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mx-auto">
                    <UserPlus className="w-4 h-4"/> Register New Patient
                  </button>
                </div>
              ) : null}

              <div className="mt-8 flex justify-center">
                <button onClick={onRequestRegister} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                  Patient not found? <span className="text-dark">Register New Patient</span>
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 2: PICK A SLOT
              ───────────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                     {selectedPatient?.name.charAt(0)}
                   </div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</p>
                     <p className="font-bold text-heading">{selectedPatient?.name}</p>
                   </div>
                 </div>
                 <button onClick={() => setStep(1)} className="text-sm font-bold text-primary hover:underline">Change</button>
              </div>

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
                    <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>
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
                  <button onClick={() => setStep(3)} className="px-8 py-4 bg-gradient-to-r from-primary to-[#7074e8] text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(86,90,207,0.25)] hover:shadow-[0_8px_25px_rgba(86,90,207,0.4)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    Continue to Payment <ChevronRight className="w-5 h-5"/>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 3: PAYMENT & CONFIRM
              ───────────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Appointment Summary</p>
                  <p className="text-xl font-bold text-heading">
                    {selectedPatient?.name}
                  </p>
                  <p className="text-primary font-bold flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4"/> {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {selectedSlot}
                  </p>
                </div>
                <button onClick={() => setStep(2)} className="text-sm font-bold text-dark hover:underline bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">Edit Slot</button>
              </div>

              <div>
                <label className="block text-sm font-bold text-heading mb-2">Visit Reason (Optional)</label>
                <input type="text" value={visitReason} onChange={(e) => setVisitReason(e.target.value)} placeholder="e.g. Lower back pain" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-dark font-medium" />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-heading mb-1">How is the patient paying?</label>
                
                <label className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${bookingType === 'at-desk' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <input type="radio" name="bookingType" value="at-desk" checked={bookingType === 'at-desk'} onChange={(e) => setBookingType(e.target.value)} className="w-5 h-5 text-primary focus:ring-primary" />
                  <div className="ml-4">
                    <p className={`font-bold ${bookingType === 'at-desk' ? 'text-primary' : 'text-dark'}`}>Paying now at desk</p>
                    <p className="text-sm text-gray-500 font-medium">Cash, Card Terminal, or UPI QR</p>
                  </div>
                </label>
                
                <label className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${bookingType === 'phone' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <input type="radio" name="bookingType" value="phone" checked={bookingType === 'phone'} onChange={(e) => setBookingType(e.target.value)} className="w-5 h-5 text-primary focus:ring-primary" />
                  <div className="ml-4">
                    <p className={`font-bold ${bookingType === 'phone' ? 'text-primary' : 'text-dark'}`}>Send payment link</p>
                    <p className="text-sm text-gray-500 font-medium">Patient pays online via Razorpay</p>
                  </div>
                </label>
              </div>

              {bookingType === 'at-desk' && (
                <div className="p-6 bg-green-50 rounded-2xl border border-green-200 animate-fade-in shadow-sm">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-green-700 uppercase mb-2">Amount Due (₹) *</label>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500/20 text-dark font-bold text-lg shadow-sm" />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-xs font-bold text-green-700 uppercase mb-2">Payment Method *</label>
                      <div className="flex gap-2">
                        {['cash', 'card', 'upi'].map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`flex-1 py-3.5 px-2 rounded-xl font-bold uppercase tracking-wide text-xs border-2 transition-all shadow-sm ${paymentMethod === method ? 'bg-green-600 border-green-600 text-white shadow-[0_8px_15px_rgba(22,163,74,0.25)] transform -translate-y-0.5' : 'bg-white border-green-200 text-green-700 hover:bg-green-100'}`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {paymentMethod !== 'cash' && (
                    <div className="mt-4 animate-fade-in">
                      <label className="block text-xs font-bold text-green-700 uppercase mb-2">Reference / Receipt No.</label>
                      <input type="text" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500/20 text-dark shadow-sm" />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100">
                <button onClick={() => setStep(2)} className="px-6 py-4 text-gray-500 font-bold hover:text-dark transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5"/> Back
                </button>
                <button onClick={handleFinalSubmit} disabled={loading} className="px-10 py-4 bg-gradient-to-r from-primary to-[#7074e8] text-white font-extrabold rounded-xl shadow-[0_8px_20px_rgba(86,90,207,0.25)] hover:shadow-[0_8px_25px_rgba(86,90,207,0.4)] hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin"/> : <><CheckCircle2 className="w-6 h-6"/> Confirm Booking</>}
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
