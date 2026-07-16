import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, DollarSign, UserPlus, CalendarPlus, FileText, Banknote, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookAppointmentModal from '../components/BookAppointmentModal';
import RegisterPatientModal from '../components/RegisterPatientModal';
import CollectPaymentModal from '../components/CollectPaymentModal';
import ViewAppointmentModal from '../components/ViewAppointmentModal';

const ReceptionistDashboard = () => {
  const { getToken } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState(null); // the appt to pay
  const [viewAppointment, setViewAppointment] = useState(null); // the appt to view

  useEffect(() => {
    fetchAppointments();
  }, [getToken]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/appointments?date=today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Filter out cancelled/no_show appointments so they don't bloat the today view
        const activeAppts = data.appointments.filter(a => !['cancelled', 'no_show'].includes(a.status));
        setAppointments(activeAppts);
      } else {
        setError(data.message || 'Failed to fetch appointments.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingComplete = (newAppointment) => {
    fetchAppointments();
  };

  const handlePatientRegistered = (newPatient) => {
    setIsRegisterModalOpen(false);
    setIsBookModalOpen(true);
  };

  const handlePaymentComplete = () => {
    fetchAppointments(); // Refresh the list
  };

  const handleCancelled = () => {
    fetchAppointments(); // Refresh the list after cancellation
  };

  // Compute Summary Metrics
  const appointmentsToday = appointments.length;
  const pendingPayment = appointments.filter(a => a.payment_status === 'pending' || a.status === 'pending_payment').length;
  const todayDateString = new Date().toISOString().split('T')[0];
  const newToday = appointments.filter(a => a.created_at && a.created_at.startsWith(todayDateString)).length;

  // Formatting helpers
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <BookAppointmentModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onBooked={handleBookingComplete} 
        onRequestRegister={() => {
          setIsBookModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      
      <RegisterPatientModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onRegistered={handlePatientRegistered} 
      />

      <CollectPaymentModal
        isOpen={!!paymentAppointment}
        onClose={() => setPaymentAppointment(null)}
        appointment={paymentAppointment}
        onPaymentComplete={handlePaymentComplete}
      />

      <ViewAppointmentModal
        isOpen={!!viewAppointment}
        onClose={() => setViewAppointment(null)}
        appointment={viewAppointment}
        onCancelled={handleCancelled}
      />

      {/* Header & Date */}
      <div>
        <h1 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-1">
          TODAY -- {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </h1>
        <h2 className="text-3xl font-bold text-heading">Overview</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Appointments Today</p>
            <p className="text-2xl font-extrabold text-dark">{appointmentsToday}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Pending Payment</p>
            <p className="text-2xl font-extrabold text-dark">{pendingPayment}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">New Bookings</p>
            <p className="text-2xl font-extrabold text-dark">{newToday}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-dark transition-colors shadow-sm"
        >
          <CalendarPlus className="w-4 h-4" />
          Book New Appointment
        </button>
        <button 
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center gap-2 bg-white text-primary border border-primary/20 font-semibold py-2 px-4 rounded-lg hover:bg-primary/5 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-heading uppercase tracking-wide text-sm">Today's Appointments</h3>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-danger bg-red-50">{error}</div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No appointments scheduled for today.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {appointments.map((appt) => {
                const isBlocked = appt.status === 'blocked';
                const isPending = appt.payment_status === 'pending' || appt.status === 'pending_payment';
                
                return (
                  <div key={appt.id} className={`flex items-center justify-between p-4 md:px-6 hover:bg-gray-50 transition-colors ${isBlocked ? 'opacity-60 bg-gray-50' : ''}`}>
                    
                    {/* Time & Patient Name */}
                    <div className="flex items-center gap-6 w-1/2">
                      <span className="font-bold text-dark w-20">{formatTime(appt.start_time)}</span>
                      <div>
                        <span className={`block font-semibold ${isBlocked ? 'text-gray-400 line-through' : 'text-heading'}`}>
                          {isBlocked ? '--- BLOCKED ---' : (appt.patient_name || 'Unknown Patient')}
                        </span>
                        {!isBlocked && appt.doctor_name && (
                           <span className="text-xs text-gray-400 font-medium">Dr. {appt.doctor_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-1 flex justify-center">
                      {!isBlocked && (
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          isPending 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isPending ? 'Pending Payment' : 'Scheduled'}
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="w-32 flex justify-end">
                      {!isBlocked && (
                        isPending ? (
                          <button 
                            onClick={() => setPaymentAppointment(appt)}
                            className="flex items-center gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                          >
                            <Banknote className="w-4 h-4" />
                            Pay
                          </button>
                        ) : (
                          <button 
                            onClick={() => setViewAppointment(appt)}
                            className="flex items-center gap-2 bg-gray-100 text-body hover:bg-gray-200 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            View
                          </button>
                        )
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
