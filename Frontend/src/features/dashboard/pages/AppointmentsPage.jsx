import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { format } from 'date-fns';
import { Calendar, Clock, CreditCard, XCircle, CheckCircle2, User, HelpCircle } from 'lucide-react';
import BookAppointmentModal from '../components/BookAppointmentModal';
import './AppointmentsPage.css';

const AppointmentsPage = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch appointments');
      
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel appointment');
      
      // Update local state
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
      setCancelConfirmId(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ── Helper: load Razorpay script on demand ─────────────────────────────────
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

  const handlePayNow = async (appointment) => {
    try {
      const token = await getToken();

      // 1. Resume (or create new) Razorpay order for this appointment
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${appointment.id}/resume-payment`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (!res.ok) {
        // 410 = expired → refresh the list so the card shows as cancelled
        if (res.status === 410) {
          alert(data.message || 'Payment window expired. Please book a new slot.');
          fetchAppointments();
        } else {
          alert(data.message || 'Could not resume payment. Please try again.');
        }
        return;
      }

      // 2. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Payment gateway failed to load. Please check your internet connection.');
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: data.razorpay_key_id,
        amount: data.razorpay_order.amount,
        currency: data.razorpay_order.currency,
        order_id: data.razorpay_order.id,
        name: 'PhysioCare',
        description: 'Consultation Booking',
        theme: { color: '#9333ea' },
        handler: async function (response) {
          try {
            const t = await getToken();
            await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${appointment.id}/verify-payment`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                body: JSON.stringify(response)
              }
            );
            fetchAppointments(); // Refresh so the card shows "Confirmed"
          } catch (err) {
            console.error('Verification failed:', err);
            alert('Payment received but verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            // No action needed — slot is still held until expiry
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    }
  };

  // Process and split appointments
  const today = new Date().toLocaleDateString('en-CA');
  const upcomingAppointments = appointments
    .filter(a => a.appointment_date >= today && !['cancelled', 'no_show', 'completed'].includes(a.status))
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  
  const pastAppointments = appointments
    .filter(a => a.appointment_date < today || ['cancelled', 'no_show', 'completed'].includes(a.status))
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

  // Pagination logic for past appointments
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.max(1, Math.ceil(pastAppointments.length / itemsPerPage));
  const currentPastAppointments = pastAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="appointments-page-wrapper">
      {/* Page Header */}
      <section className="page-header">
          {/* Floating Elements */}
          <div className="shape shape-circle"></div>
          <div className="shape shape-plus"></div>

          <div className="page-header-content">
              <h1>Appointments</h1>
              <p>Manage your upcoming visits and view your history.</p>
          </div>

          {/* Wave Bottom Curve */}
          <div className="wave-bottom">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,144C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
          </div>
      </section>

      {/* Main Content Container */}
      <main className="main-container">
          
          <button className="btn-primary" onClick={() => setShowBookingModal(true)}>
              <i className="fa-solid fa-plus"></i> Book New Appointment
          </button>

          {/* Upcoming Appointments Section */}
          <h2 className="section-subtitle">Upcoming Appointments</h2>
          
          {loading ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
          ) : upcomingAppointments.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>No upcoming appointments.</div>
          ) : (
             upcomingAppointments.map((appt) => {
               const apptDate = new Date(appt.appointment_date);
               const isPendingPayment = appt.status === 'pending_payment';
               let remaining = 0;
               if (isPendingPayment && appt.payment_expires_at) {
                 remaining = Math.max(0, Math.floor((new Date(appt.payment_expires_at) - new Date()) / 1000));
               }

               return (
                 <div key={appt.id} className="appt-card upcoming-card">
                     <div className="appt-avatar">
                         {format(apptDate, 'dd')}
                     </div>
                     <div className="appt-info">
                         <h3>{format(apptDate, 'EEEE, MMM yyyy')}</h3>
                         <div className="appt-details">
                             <span><i className="fa-regular fa-clock"></i> {appt.start_time.substring(0,5)}</span>
                             <span><i className="fa-regular fa-user-doctor"></i> Dr. {appt.doctor_name || 'Assigned'}</span>
                         </div>
                         {appt.visit_reason && <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.2rem', fontStyle: 'italic', marginBottom: 0 }}>"{appt.visit_reason}"</p>}
                     </div>
                     <div className="appt-actions-row">
                         {appt.status === 'scheduled' ? (
                           <span className="badge badge-success">
                               <i className="fa-regular fa-circle-check"></i> Confirmed
                           </span>
                         ) : isPendingPayment ? (
                           <span className="badge badge-warning">
                               Payment Pending
                           </span>
                         ) : (
                           <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                               {appt.status.replace('_', ' ')}
                           </span>
                         )}

                          {isPendingPayment && remaining > 0 ? (
                            <button onClick={() => handlePayNow(appt)} className="btn-pay-now">Pay Now</button>
                          ) : isPendingPayment && remaining === 0 ? (
                           <span style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>Expired</span>
                         ) : appt.status === 'scheduled' ? (
                           <button onClick={() => {
                             const apptDateTime = new Date(`${appt.appointment_date}T${appt.start_time}`);
                             const diffInMinutes = (apptDateTime - new Date()) / (1000 * 60);
                             if (diffInMinutes <= 60) {
                               alert("You cannot cancel an appointment within 60 minutes of the scheduled time.");
                             } else {
                               setCancelConfirmId(appt.id);
                             }
                           }} className="btn-outline-danger">Cancel</button>
                         ) : null}
                     </div>
                 </div>
               );
             })
          )}

          {/* Past Appointments Section */}
          <h2 className="section-subtitle" style={{ marginTop: '1.5rem' }}>Past Appointments</h2>
          
          {pastAppointments.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>No past appointments found.</div>
          ) : (
             currentPastAppointments.map(appt => {
                 const isCancelled = appt.status === 'cancelled' || appt.status === 'no_show';
                 const apptDate = new Date(appt.appointment_date);
                 return (
                   <div key={appt.id} className="appt-card past-card">
                       <div className="appt-avatar">
                           {format(apptDate, 'dd')}
                       </div>
                       <div className="appt-info">
                           <h3>{format(apptDate, 'MMM do, yyyy')}</h3>
                           <div className="appt-details">
                               <span><i className="fa-regular fa-clock"></i> {appt.start_time.substring(0,5)}</span>
                               <span><i className="fa-regular fa-user-doctor"></i> Dr. {appt.doctor_name || 'Assigned'}</span>
                           </div>
                       </div>
                       <div className="appt-actions-row">
                           {appt.status === 'completed' && (
                               <span className="badge badge-gray completed">
                                   <i className="fa-solid fa-check"></i> Completed
                               </span>
                           )}
                           {appt.status === 'no_show' && (
                               <span className="badge badge-danger">No Show</span>
                           )}
                           {appt.status === 'cancelled' && (
                               <span className="badge badge-danger">Cancelled</span>
                           )}
                       </div>
                   </div>
                 );
             })
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '1rem 0', borderTop: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
              <span>Rows per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ border: '1px solid var(--gray-300)', borderRadius: '4px', padding: '0.2rem 0.5rem', outline: 'none', color: 'var(--body-text-color)' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <ul className="pagination" style={{ margin: 0 }}>
                <li className={`page-item nav-icon ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => handlePageChange(currentPage - 1)}>
                    <i className="fa-solid fa-chevron-left"></i>
                </li>
                
                {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => handlePageChange(i + 1)}>
                        {i + 1}
                    </li>
                ))}
                
                <li className={`page-item nav-icon ${currentPage === totalPages ? 'disabled' : ''}`} onClick={() => handlePageChange(currentPage + 1)}>
                    <i className="fa-solid fa-chevron-right"></i>
                </li>
            </ul>

            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
              Showing {pastAppointments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, pastAppointments.length)} of {pastAppointments.length} entries
            </div>
          </div>

      </main>

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelConfirmId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(33, 37, 41, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', textAlign: 'center', maxWidth: '350px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <i className="fa-solid fa-circle-xmark" style={{ fontSize: '3rem', color: 'var(--danger-color)', marginBottom: '1rem' }}></i>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--heading-text-color)', fontWeight: '600' }}>Cancel this appointment?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>The slot will be released immediately and this action cannot be undone.</p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setCancelConfirmId(null)} style={{ flex: 1, padding: '0.75rem', background: 'var(--gray-200)', color: 'var(--gray-800)', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
                Keep it
              </button>
              <button onClick={() => cancelAppointment(cancelConfirmId)} style={{ flex: 1, padding: '0.75rem', background: 'var(--danger-color)', color: 'white', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      <BookAppointmentModal 
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => {
          fetchAppointments();
          setShowBookingModal(false);
        }}
      />
    </div>
  );
}

export default AppointmentsPage;
