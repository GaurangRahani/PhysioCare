import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, DollarSign, UserPlus, CalendarPlus, FileText, Banknote, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookAppointmentModal from '../components/BookAppointmentModal';
import RegisterPatientModal from '../components/RegisterPatientModal';
import CollectPaymentModal from '../components/CollectPaymentModal';
import ViewAppointmentModal from '../components/ViewAppointmentModal';
import CancelConfirmationModal from '../components/CancelConfirmationModal';

const ReceptionistDashboard = () => {
  const { getToken } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState('appointmentsView'); // 'appointmentsView' | 'pendingView'

  // Timer State for active holds
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState(null); // the appt to pay
  const [viewAppointment, setViewAppointment] = useState(null); // the appt to view
  const [cancelAppointmentObj, setCancelAppointmentObj] = useState(null); // the appt to cancel

  useEffect(() => {
    fetchAppointments();
  }, [getToken]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Filter out cancelled/no_show/completed appointments so they don't bloat the today view
        const activeAppts = data.appointments.filter(a => !['cancelled', 'no_show', 'completed'].includes(a.status));
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

  const handleCancelDirectly = (appt) => {
    setCancelAppointmentObj(appt); // Open the confirmation modal
  };

  const confirmCancel = async (apptId) => {
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/appointments/${apptId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCancelAppointmentObj(null);
        fetchAppointments(); // Refresh the list
      } else {
        alert(data.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error cancelling:', err);
      alert('A network error occurred while cancelling.');
    }
  };

  // Categorize Appointments
  const heldBookings = appointments.filter(a => {
    if (a.payment_status !== 'pending' && a.status !== 'pending_payment') return false;
    if (!a.payment_expires_at) return false;
    return new Date(a.payment_expires_at).getTime() > nowTime;
  });

  const todayDateString = new Date().toLocaleDateString('en-CA');
  const mainListAppointments = appointments.filter(a => 
    !heldBookings.includes(a) && a.appointment_date === todayDateString
  );

  // Compute Summary Metrics
  const appointmentsToday = mainListAppointments.length;
  const pendingPayment = heldBookings.length;

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

  const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCountdown = (expiresAtStr) => {
    const diff = new Date(expiresAtStr).getTime() - nowTime;
    if (diff <= 0) return 'Expired';
    const totalSeconds = Math.floor(diff / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const currentList = activeTab === 'appointmentsView' ? mainListAppointments : heldBookings;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = currentList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentList.length / itemsPerPage) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
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

      <CancelConfirmationModal
        isOpen={!!cancelAppointmentObj}
        onClose={() => setCancelAppointmentObj(null)}
        onConfirm={confirmCancel}
        appointment={cancelAppointmentObj}
      />

      <div className="container">
          
        {/* Header Section */}
        <div className="overview-header">
            <div>
                <div className="date-badge">
                  <i className="fa-regular fa-calendar-check"></i> 
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                <h1>Overview</h1>
            </div>
            <div className="header-actions">
                <button className="btn btn-primary" onClick={() => setIsBookModalOpen(true)}>
                  <i className="fa-solid fa-calendar-plus"></i> Book New Appointment
                </button>
                <button className="btn btn-outline" onClick={() => setIsRegisterModalOpen(true)}>
                  <i className="fa-solid fa-user-plus"></i> Register Patient
                </button>
            </div>
        </div>

        {/* 1. Top Summary Cards (Act as Tabs) */}
        <div className="summary-cards-wrapper">
            
            {/* Appointments Tab */}
            <div 
              className={`summary-card ${activeTab === 'appointmentsView' ? 'active-tab' : ''}`} 
              data-target="appointmentsView" 
              tabIndex="0"
              onClick={() => setActiveTab('appointmentsView')}
            >
                <div className="icon-box purple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                        <path d="M4.5 7.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/>
                    </svg>
                </div>
                <div className="summary-info">
                    <p>Appointments Today</p>
                    <h3>{appointmentsToday}</h3>
                </div>
            </div>

            {/* Pending Payment Tab */}
            <div 
              className={`summary-card ${activeTab === 'pendingView' ? 'active-tab' : ''}`} 
              data-target="pendingView" 
              tabIndex="0"
              onClick={() => setActiveTab('pendingView')}
            >
                <div className="icon-box orange">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                        <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z"/>
                    </svg>
                </div>
                <div className="summary-info">
                    <p>Pending Payment</p>
                    <h3>{pendingPayment}</h3>
                </div>
            </div>

            {/* New Bookings (Static for now) */}
            <div className="summary-card">
                <div className="icon-box teal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                        <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                    </svg>
                </div>
                <div className="summary-info">
                    <p>New Bookings</p>
                    <h3>{newToday}</h3>
                </div>
            </div>
        </div>

        {/* 2. Main List Container */}
        <div className="list-container">
            
            {/* SECTION A: Appointments Today */}
            {activeTab === 'appointmentsView' && (
                <div id="appointmentsView" className="view-section active">
                    <div className="section-title">Today's Appointments</div>
                    
                    <div className="cards-stack">
                        {loading ? (
                          <div className="flex justify-center items-center" style={{ height: '200px' }}>
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          </div>
                        ) : error ? (
                          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--danger)', backgroundColor: 'var(--gray-100)', borderRadius: '8px' }}>{error}</div>
                        ) : currentList.length === 0 ? (
                          <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <i className="fa-regular fa-calendar" style={{fontSize: '3rem', color: 'var(--gray-300)', margin: '0 auto 1rem auto'}}></i>
                            <p style={{color: 'var(--gray-500)', fontWeight: '500'}}>No appointments scheduled for today.</p>
                          </div>
                        ) : (
                          currentAppointments.map((appt) => {
                            const isBlocked = appt.status === 'blocked';
                            const isPending = appt.payment_status === 'pending' || appt.status === 'pending_payment';
                            const isInProgress = appt.status === 'in_progress';
                            
                            return (
                                <div key={appt.id} className="appointment-horizontal-card card-theme-primary" style={isBlocked ? { opacity: 0.6 } : {}}>
                                    <div className="card-time-block">
                                        <span className="appointment-time">{formatTime(appt.start_time)}</span>
                                        <span className="appointment-date">{formatDate(appt.appointment_date)}</span>
                                    </div>
                                    
                                    <div className="card-status-block">
                                        {!isBlocked && (
                                            <span className={`status-badge ${isPending ? 'pending' : isInProgress ? 'in-progress' : 'scheduled'}`}>
                                                {isPending ? 'Pending Payment' : isInProgress ? 'In Progress' : 'Scheduled'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="card-details-block">
                                        <h4 className="patient-heading" style={isBlocked ? { textDecoration: 'line-through', color: 'var(--gray-400)' } : {}}>
                                            {isBlocked ? '--- BLOCKED ---' : (appt.patient_name || 'Unknown Patient')}
                                        </h4>
                                        {!isBlocked && appt.doctor_name && (
                                            <div className="practitioner-info">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M8 1a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3v1a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-1H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V3a2 2 0 0 1 2-2z"/>
                                                </svg>
                                                <span>Dr. {appt.doctor_name}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="card-actions-block">
                                        {!isBlocked && (
                                            isPending ? (
                                                <button className="btn-action btn-resend" onClick={() => setPaymentAppointment(appt)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/></svg>
                                                    <span>Pay</span>
                                                </button>
                                            ) : (
                                                appt.status === 'completed' ? (
                                                    <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                                        <i className="fa-solid fa-check"></i> Completed
                                                    </span>
                                                ) : (
                                                    <button className="btn-action btn-cancel" onClick={() => {
                                                        const apptDateTime = new Date(`${appt.appointment_date}T${appt.start_time}`);
                                                        const diffInMinutes = (apptDateTime - new Date()) / (1000 * 60);
                                                        if (diffInMinutes <= 60) {
                                                            alert("You cannot cancel an appointment within 60 minutes of the scheduled time.");
                                                        } else {
                                                            handleCancelDirectly(appt);
                                                        }
                                                    }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                                        </svg>
                                                        <span>Cancel</span>
                                                    </button>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                          })
                        )}
                    </div>
                </div>
            )}

            {/* SECTION B: Pending Payments */}
            {activeTab === 'pendingView' && (
                <div id="pendingView" className="view-section active">
                    <div className="section-title">Held Bookings — Awaiting Payment ({heldBookings.length})</div>
                    
                    <div className="cards-stack">
                        {currentList.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <i className="fa-regular fa-calendar-check" style={{fontSize: '3rem', color: 'var(--gray-300)', margin: '0 auto 1rem auto'}}></i>
                                <p style={{color: 'var(--gray-500)', fontWeight: '500'}}>No pending payments.</p>
                            </div>
                        ) : (
                            currentAppointments.map((appt) => (
                                <div key={appt.id} className="appointment-horizontal-card card-theme-warning">
                                    <div className="card-time-block">
                                        <span className="appointment-time">{formatTime(appt.start_time)}</span>
                                        <span className="appointment-date">{formatDate(appt.appointment_date)}</span>
                                    </div>
                                    
                                    <div className="card-details-block" style={{ paddingLeft: 0 }}>
                                        <h4 className="patient-heading">{appt.patient_name || 'Unknown Patient'}</h4>
                                        {appt.doctor_name && (
                                            <div className="practitioner-info">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M8 1a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3v1a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-1H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V3a2 2 0 0 1 2-2z"/>
                                                </svg>
                                                <span>Dr. {appt.doctor_name}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="card-actions-block">
                                        <div className="timer-block">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                                            </svg>
                                            <span>Expires in {formatCountdown(appt.payment_expires_at)}</span>
                                        </div>
                                        <button className="btn-action btn-resend" aria-label="Resend payment link" onClick={() => setPaymentAppointment(appt)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                                            </svg>
                                            <span>Resend Link</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Pagination Bar (Shared) */}
            {currentList.length > 0 && (
                <div className="pagination-bar">
                    <div className="pagination-left-panel">
                        <label htmlFor="perPageSelect">Rows per page:</label>
                        <select 
                            id="perPageSelect" 
                            className="rows-dropdown"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                    
                    <div className="pagination-center-panel">
                        <nav className="pagination-numbers-nav" aria-label="Appointments page navigation">
                            <button 
                                className="page-item-btn" 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                &lt;
                            </button>

                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                    return (
                                        <button 
                                            key={page}
                                            className={`page-item-btn ${currentPage === page ? 'active' : ''}`}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                    return <span key={page} className="page-item-spacer">...</span>;
                                }
                                return null;
                            })}

                            <button 
                                className="page-item-btn" 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                &gt;
                            </button>
                        </nav>
                    </div>
                    
                    <div className="pagination-right-panel">
                        <span>Showing {currentList.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, currentList.length)} of {currentList.length} entries</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
