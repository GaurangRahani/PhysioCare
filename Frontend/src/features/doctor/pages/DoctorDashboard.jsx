import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Calendar, Users, Loader2, Dumbbell, CalendarRange, Clock, ChevronRight, Stethoscope } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ViewAppointmentModal from '../../receptionist/components/ViewAppointmentModal';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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
        const activeAppts = data.appointments.filter(a => 
          !['cancelled', 'no_show', 'pending_payment', 'completed'].includes(a.status) &&
          a.payment_status !== 'pending'
        );
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

  const handleCancelled = () => {
    fetchAppointments();
  };

  // Metrics
  const todayAppointments = appointments.length;
  
  // A simplistic way to count "Upcoming" for today is appointments whose start_time is in the future.
  // We'll just display a total for now as a static "Today's load".
  const uniquePatients = new Set(appointments.map(a => a.patient_id)).size;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAppointments = appointments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="doctor-theme animate-fade-in">
      
      {/* FULL PAGE BANNER */}
      <div className="page-banner" style={{ backgroundImage: 'url(/images/banner/img1.jpg)' }}>
        <div className="container">
          <div className="page-banner-entry text-center">
            <h1>Welcome back, Dr. {user?.firstName || 'Doctor'}! 👋</h1>
            
            <nav aria-label="breadcrumb" className="breadcrumb-row">
              <ul className="breadcrumb">
                <li className="breadcrumb-item active" aria-current="page">
                  <i className="fa-regular fa-calendar" style={{ marginRight: '0.5rem' }}></i>
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </li>
              </ul>
            </nav>
            <p style={{ color: 'var(--text-body)', marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: '500' }}>
              Here's an overview of your schedule today.
            </p>
          </div>
        </div>
        <img className="pt-img1" style={{ animation: 'left-right 8s infinite ease-in-out' }} src="/images/shap/wave-blue.png" alt=""/>
        <img className="pt-img2" style={{ animation: 'up-down 6s infinite ease-in-out' }} src="/images/shap/circle-dots.png" alt=""/>
        <img className="pt-img3" style={{ animation: 'rotation 20s infinite linear' }} src="/images/shap/plus-blue.png" alt=""/>
      </div>

      <main className="main-container">

        {/* Stats Overview */}
        <div className="summary-cards-wrapper">
            <div className="summary-card">
                <div className="icon-box purple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                        <path d="M4.5 7.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3 0a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/>
                    </svg>
                </div>
                <div className="summary-info">
                    <p>Today's Appointments</p>
                    <h3>{todayAppointments}</h3>
                </div>
            </div>
            
            <div className="summary-card">
                <div className="icon-box teal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM6.936 9.28a6.002 6.002 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                    </svg>
                </div>
                <div className="summary-info">
                    <p>Patients Today</p>
                    <h3>{uniquePatients}</h3>
                </div>
            </div>
        </div>

        {/* Quick Actions */}
        <section className="action-buttons">
          <Link to="/doctor-dashboard/availability" className="btn btn-outline-primary">
            <i className="fa-regular fa-calendar-check"></i> My Availability
          </Link>
          <Link to="/doctor-dashboard/exercise-library" className="btn btn-outline-secondary">
            <i className="fa-solid fa-person-walking"></i> Exercise Library
          </Link>
        </section>

        {/* Patients List */}
        <section className="bg-slate-50 p-6 rounded-2xl mt-8 border border-slate-100 shadow-sm">
          <div className="section-header">
            <h2>Today's Patients</h2>
          </div>
          
          <div className="patient-list">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="p-6 text-center text-danger bg-red-50 rounded-xl">{error}</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-regular fa-calendar text-gray-300 text-2xl"></i>
                </div>
                <h3 className="text-gray-900 font-medium text-lg mb-1">No Appointments Today</h3>
                <p className="text-gray-500">Enjoy your free time or manage your library.</p>
              </div>
            ) : (
              currentAppointments.map((appt) => {
                const isBlocked = appt.status === 'blocked';
                const isCompleted = appt.status === 'completed';
                const isFirstVisit = appt.past_consultations_count === 0;
                
                // If it's a next action (not completed, not blocked)
                const isNextAction = !isBlocked && !isCompleted;

                return (
                  <div key={appt.id} className={`appointment-horizontal-card card-theme-warning ${isBlocked ? 'blocked-card' : ''}`} style={isBlocked ? { opacity: 0.6 } : {}}>
                      <div className="card-time-block">
                          <span className="appointment-time">{formatTime(appt.start_time)}</span>
                          <span className="appointment-date">{formatDate(appt.appointment_date)}</span>
                      </div>
                      
                      <div className="card-status-block">
                          {!isBlocked && (
                              <span className={`status-badge ${isFirstVisit ? 'in-progress' : 'scheduled'}`}>
                                  {isFirstVisit ? 'First Visit' : 'Follow-Up'}
                              </span>
                          )}
                      </div>

                      <div className="card-details-block">
                          <h4 className="patient-heading" style={isBlocked ? { textDecoration: 'line-through', color: 'var(--gray-400)' } : {}}>
                              {isBlocked ? '--- BLOCKED ---' : (appt.patient_name || 'Unknown Patient')}
                          </h4>
                          {!isBlocked && appt.diagnosis && (
                              <div className="practitioner-info">
                                  <span>Condition: {appt.diagnosis}</span>
                              </div>
                          )}
                      </div>
                      
                      <div className="card-actions-block">
                        {isBlocked ? (
                          <span className="status-badge blocked">Blocked</span>
                        ) : isCompleted ? (
                          <span className="status-badge scheduled">Completed</span>
                        ) : (
                          <button 
                            className="btn-action"
                            onClick={() => navigate(`/doctor-dashboard/consultation/${appt.id}`, { state: { appointment: appt } })}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 1a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3v1a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-1H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V3a2 2 0 0 1 2-2z"/>
                            </svg>
                            <span>Start</span>
                          </button>
                        )}
                      </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination Bar */}
          {appointments.length > 0 && (
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
                              className="page-num-btn" 
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              aria-label="Previous page"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                              </svg>
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                              <button
                                  key={pageNum}
                                  className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                                  onClick={() => setCurrentPage(pageNum)}
                                  aria-label={`Go to page ${pageNum}`}
                                  aria-current={currentPage === pageNum ? 'page' : undefined}
                              >
                                  {pageNum}
                              </button>
                          ))}
                          
                          <button 
                              className="page-num-btn" 
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              aria-label="Next page"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                              </svg>
                          </button>
                      </nav>
                  </div>
                  
                  <div className="pagination-right-panel">
                      <span>Showing {appointments.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, appointments.length)} of {appointments.length} entries</span>
                  </div>
              </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;
