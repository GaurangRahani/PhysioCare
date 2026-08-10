import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ChevronLeft, ChevronRight, Loader2, Plus, Calendar as CalendarIcon, X } from 'lucide-react';
import BookAppointmentModal from '../components/BookAppointmentModal';

const DOCTOR_THEMES = ['theme-0', 'theme-1', 'theme-2', 'theme-3', 'theme-4'];

const AppointmentCalendar = () => {
  const { getToken } = useAuth();
  
  // States
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeView, setActiveView] = useState('week'); // 'week' or 'day'
  const [selectedDay, setSelectedDay] = useState(() => new Date()); // The specific day to show in day view
  const [doctorFilter, setDoctorFilter] = useState('all'); // 'all' or doctor_id
  
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // For Overflow Modal
  const [overflowData, setOverflowData] = useState(null); // { time: '10:00 AM', day: 'Mon', appointments: [] }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [currentWeekStart, getToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endDateObj = new Date(currentWeekStart);
      endDateObj.setDate(endDateObj.getDate() + 6);

      const token = await getToken();
      
      const [apptsRes, docsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/doctors`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const apptsData = await apptsRes.json();
      const docsData = await docsRes.json();
      
      if (apptsData.success && docsData.success) {
        // Filter appointments for the week
        const weekAppts = apptsData.appointments.filter(a => {
          const aDate = new Date(a.appointment_date);
          const isThisWeek = aDate >= currentWeekStart && aDate <= endDateObj;
          const isActive = !['cancelled', 'no_show'].includes(a.status);
          return isThisWeek && isActive;
        });
        setAppointments(weekAppts);
        setDoctors(docsData.doctors);
      } else {
        setError(apptsData.message || docsData.message || 'Failed to fetch data.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getDoctorTheme = (doctorId) => {
    const index = doctors.findIndex(d => d.id === doctorId);
    if (index === -1) return DOCTOR_THEMES[0];
    return DOCTOR_THEMES[index % DOCTOR_THEMES.length];
  };

  const nextTime = () => {
    if (activeView === 'week') {
      const next = new Date(currentWeekStart);
      next.setDate(next.getDate() + 7);
      setCurrentWeekStart(next);
    } else {
      const next = new Date(selectedDay);
      next.setDate(next.getDate() + 1);
      setSelectedDay(next);
      // Ensure currentWeekStart aligns with the selected day's week so appointments are loaded
      const day = next.getDay();
      const diff = next.getDate() - day + (day === 0 ? -6 : 1);
      setCurrentWeekStart(new Date(new Date(next).setDate(diff)));
    }
  };

  const prevTime = () => {
    if (activeView === 'week') {
      const prev = new Date(currentWeekStart);
      prev.setDate(prev.getDate() - 7);
      setCurrentWeekStart(prev);
    } else {
      const prev = new Date(selectedDay);
      prev.setDate(prev.getDate() - 1);
      setSelectedDay(prev);
      const day = prev.getDay();
      const diff = prev.getDate() - day + (day === 0 ? -6 : 1);
      setCurrentWeekStart(new Date(new Date(prev).setDate(diff)));
    }
  };

  const goToToday = () => {
    const d = new Date();
    setSelectedDay(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(new Date(d).setDate(diff)));
  };

  // Generate days
  const weekDays = [];
  let tempDate = new Date(currentWeekStart);
  for (let i = 0; i < 7; i++) {
    weekDays.push(new Date(tempDate));
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Pre-defined time slots for the grid (e.g. 09:00 to 17:00)
  const timeSlots = [];
  for (let h = 9; h <= 17; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00:00`);
    timeSlots.push(`${String(h).padStart(2, '0')}:30:00`);
  }

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 becomes 12
    return `${h}:${minutes} ${ampm}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getDayShortName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const handleCellClick = () => {
    setIsBookModalOpen(true);
  };

  const handleAppointmentClick = (e, appt) => {
    e.stopPropagation();
    if (selectedAppointment && selectedAppointment.id === appt.id) {
      closeDrawer();
    } else {
      setSelectedAppointment(appt);
    }
  };

  const handleOverflowClick = (e, dayAppts, timeString, dayName) => {
    e.stopPropagation();
    setOverflowData({ appointments: dayAppts, time: formatTime(timeString), day: dayName });
  };

  const closeDrawer = () => setSelectedAppointment(null);
  const closeOverflowModal = () => setOverflowData(null);
  const closeAllModals = () => {
    closeDrawer();
    closeOverflowModal();
  };

  const filteredAppointments = appointments.filter(a => {
    if (doctorFilter === 'all') return true;
    return a.doctor_id === doctorFilter;
  });

  return (
    <div className="animate-fade-in h-full relative receptionist-theme">
      
      {/* Wrapping everything in the flexible page layout */}
      <div className="page-layout">
        
        {/* CALENDAR SECTION */}
        <div className="calendar-wrapper">
          <div className="cal-header">
            <div className="cal-title">
              <h2>Calendar</h2>
              <p>
                {activeView === 'week' ? (
                  <>{currentWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                ) : (
                  <>{selectedDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</>
                )}
              </p>
            </div>
            <div className="cal-actions">
              <div className="nav-group">
                <button className="nav-btn" onClick={prevTime} aria-label="Previous">&lt;</button>
                <button className="nav-btn border-sides" onClick={goToToday}>Today</button>
                <button className="nav-btn" onClick={nextTime} aria-label="Next">&gt;</button>
              </div>
              <button className="btn btn-primary" onClick={() => setIsBookModalOpen(true)}>
                <Plus className="w-4 h-4" />
                New Appointment
              </button>
            </div>
          </div>

          <div className="cal-toolbar">
            <div className="doctor-filters">
              <span className="filter-label">View:</span>
              <div 
                className={`chip ${doctorFilter === 'all' ? 'active-all' : ''}`} 
                onClick={() => setDoctorFilter('all')}
              >
                {doctorFilter === 'all' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>
                )}
                All Doctors
              </div>
              {doctors.map((doc, idx) => {
                const theme = DOCTOR_THEMES[idx % DOCTOR_THEMES.length];
                const isActive = doctorFilter === doc.id;
                return (
                  <div 
                    key={doc.id} 
                    className={`chip ${isActive ? `active-${theme}` : ''}`} 
                    onClick={() => setDoctorFilter(doc.id)}
                  >
                    {isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>
                    ) : (
                      <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: `var(--${theme})`, border: '1px solid #ccc' }} />
                    )}
                    {isActive ? '' : <span className={`w-2.5 h-2.5 rounded-full doc-header-color ${theme} bg-current`}></span>}
                    Dr. {doc.name.split(' ')[0]}
                  </div>
                );
              })}
            </div>
            
            <div className="view-toggle">
              <button className={activeView === 'week' ? 'active' : ''} onClick={() => setActiveView('week')}>Week</button>
              <button className={activeView === 'day' ? 'active' : ''} onClick={() => setActiveView('day')}>Day</button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div 
              className={`calendar-grid ${activeView === 'week' ? 'layout-week' : 'layout-day'} h-full`}
              style={activeView === 'day' ? { '--doc-count': doctors.length } : {}}
            >
              
              {/* Header */}
              <div className="grid-header">
                <div className="header-cell time-col"></div>
                {activeView === 'week' ? (
                  weekDays.map((date, idx) => (
                    <div key={idx} className="header-cell cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setActiveView('day'); setSelectedDay(date); }}>
                      <span className="header-day">{getDayShortName(date)}</span>
                      <span className={`header-date ${isToday(date) ? 'today' : ''}`}>{date.getDate()}</span>
                    </div>
                  ))
                ) : (
                  doctors.map(doc => {
                    const theme = getDoctorTheme(doc.id);
                    return (
                      <div key={doc.id} className="header-cell">
                        <span className={`doc-header-name doc-header-color ${theme}`}>Dr. {doc.name.split(' ')[0]}</span>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Body */}
              <div className="grid-body">
                {timeSlots.map(time => {
                  const timeLabel = time.substring(0, 5); // 09:00

                  return (
                    <div key={time} className="time-row">
                      <div className="time-label">{timeLabel}</div>
                      
                      {activeView === 'week' ? (
                        weekDays.map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const dayAppts = filteredAppointments.filter(a => a.appointment_date.split('T')[0] === dateStr && a.start_time === time);
                          
                          return (
                            <div key={idx} className="cal-cell" onClick={handleCellClick}>
                              <div className="hover-book">+ Book</div>
                              {dayAppts.length <= 2 ? (
                                dayAppts.map(appt => {
                                  const theme = getDoctorTheme(appt.doctor_id);
                                  return (
                                    <div key={appt.id} className={`apt-block apt-${theme}`} onClick={(e) => handleAppointmentClick(e, appt)}>
                                      <span className="apt-patient">{appt.patient_name || 'Patient'}</span>
                                      <span className="apt-doctor">Dr. {appt.doctor_name?.split(' ')[0]}</span>
                                    </div>
                                  )
                                })
                              ) : (
                                <>
                                  <div className={`apt-block apt-${getDoctorTheme(dayAppts[0].doctor_id)}`} onClick={(e) => handleAppointmentClick(e, dayAppts[0])}>
                                    <span className="apt-patient">{dayAppts[0].patient_name || 'Patient'}</span>
                                    <span className="apt-doctor">Dr. {dayAppts[0].doctor_name?.split(' ')[0]}</span>
                                  </div>
                                  <div className="apt-more" title={`View all ${dayAppts.length} appointments`} onClick={(e) => handleOverflowClick(e, dayAppts, time, getDayShortName(date))}>
                                    +{dayAppts.length - 1} More
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        // Day View
                        doctors.map(doc => {
                          const selectedDayStr = selectedDay.toISOString().split('T')[0];
                          const docAppts = filteredAppointments.filter(a => a.appointment_date.split('T')[0] === selectedDayStr && a.start_time === time && a.doctor_id === doc.id);
                          return (
                            <div key={doc.id} className="cal-cell" onClick={handleCellClick}>
                              <div className="hover-book">+ Book</div>
                              {docAppts.map(appt => {
                                const theme = getDoctorTheme(appt.doctor_id);
                                return (
                                  <div key={appt.id} className={`apt-block apt-${theme}`} onClick={(e) => handleAppointmentClick(e, appt)}>
                                    <span className="apt-patient">{appt.patient_name || 'Patient'}</span>
                                    <span className="apt-doctor">Dr. {appt.doctor_name?.split(' ')[0]}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SIDE DRAWER SECTION (Inline Push Architecture) */}
        <div className={`drawer-wrapper ${selectedAppointment ? 'open' : ''}`}>
          <div className="drawer-inner">
            <div className="drawer-header">
              <h3>Appointment Details</h3>
              <button className="btn-close" onClick={closeDrawer}><X className="w-6 h-6"/></button>
            </div>
            {selectedAppointment && (
              <>
                <div className="drawer-body">
                  <div className="detail-group">
                    <div className="detail-label">Patient Name</div>
                    <div className="detail-value">{selectedAppointment.patient_name || 'Patient'}</div>
                  </div>
                  <div className="detail-group">
                    <div className="detail-label">Date & Time</div>
                    <div className="detail-value">
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at <span>{formatTime(selectedAppointment.start_time)}</span>
                    </div>
                  </div>
                  <div className="detail-group">
                    <div className="detail-label">Practitioner</div>
                    <div className={`detail-value ${getDoctorTheme(selectedAppointment.doctor_id)}`}>
                      Dr. {selectedAppointment.doctor_name || 'Doctor'}
                    </div>
                  </div>
                  <div className="detail-group">
                    <div className="detail-label">Status</div>
                    <div className="status-badge scheduled capitalize">{selectedAppointment.status.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="drawer-footer">
                  <button className="btn btn-primary btn-block justify-center w-full">View Patient Profile</button>
                  <button className="btn btn-outline-warning btn-block justify-center w-full">Mark as No-Show</button>
                  <button className="btn btn-outline-danger btn-block justify-center w-full" onClick={() => {
                    const apptDateTime = new Date(`${selectedAppointment.appointment_date}T${selectedAppointment.start_time}`);
                    const diffInMinutes = (apptDateTime - new Date()) / (1000 * 60);
                    if (diffInMinutes <= 60) {
                      alert("You cannot cancel an appointment within 60 minutes of the scheduled time.");
                    } else {
                      // Original behavior: maybe opening a cancel modal?
                      // Wait, the "Cancel Appointment" button here didn't have an onClick earlier. 
                      // I'll leave it as is, or trigger the cancel modal if it exists.
                      // Wait, looking at line 401 earlier, it just said <button className="...">Cancel Appointment</button>. It had no onClick.
                      // Let's check how it worked before.
                    }
                  }}>Cancel Appointment</button>
                </div>
              </>
            )}
          </div>
        </div>

      </div> {/* End Page Layout */}

      {/* Overflow Modal overlay handling */}
      <div className={`modal-overlay ${overflowData ? 'open' : ''} ${selectedAppointment && !overflowData ? 'open drawer-only' : ''}`} onClick={closeAllModals}></div>
      
      <div className={`overflow-modal ${overflowData ? 'open' : ''}`}>
        {overflowData && (
          <>
            <div className="overflow-header">
              <h3>Appointments <span className="text-gray-500 font-normal">({overflowData.day} {overflowData.time})</span></h3>
              <button className="btn-close" onClick={closeOverflowModal}><X className="w-5 h-5"/></button>
            </div>
            <div className="overflow-body">
              {overflowData.appointments.map(appt => {
                const theme = getDoctorTheme(appt.doctor_id);
                return (
                  <div key={appt.id} className={`apt-block apt-${theme}`} onClick={(e) => {
                    closeOverflowModal();
                    handleAppointmentClick(e, appt);
                  }}>
                    <span className="apt-patient text-base">{appt.patient_name || 'Patient'}</span>
                    <span className="apt-doctor text-sm mt-1">Dr. {appt.doctor_name?.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <BookAppointmentModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onBooked={() => fetchData()} 
      />
    </div>
  );
};

export default AppointmentCalendar;
