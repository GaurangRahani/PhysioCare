import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatINR = (n) =>
  Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const SkeletonCard = () => (
  <div className="stat-card" style={{ height: 160 }}>
    <div className="skeleton" style={{ height: 42, width: 42, borderRadius: 8, marginBottom: '1.25rem' }} />
    <div className="skeleton" style={{ height: 32, width: '50%', marginBottom: 8 }} />
    <div className="skeleton" style={{ height: 14, width: '70%' }} />
  </div>
);

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/api/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getToken]);

  const stats = data?.stats || {};
  const today = data?.today || {};
  const activity = data?.recent_activity || [];

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <div className="page-date">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="stats-grid">
        {loading ? (
          [1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon icon-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/><path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/></svg>
              </div>
              <div className="stat-value">{stats.appointments_this_month ?? 0}</div>
              <div className="stat-label">Appointments</div>
              <div className="stat-sub">this month</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-green">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.855 7.001 8 7.558 6.788 7.558H4v1.317L8.437 14h2.11L6.095 8.884h.855c2.316-.018 3.465-1.476 3.688-3.049H12V4.784h-1.345c-.08-.778-.357-1.335-.793-1.732H12V2H4v1.06Z"/></svg>
              </div>
              <div className="stat-value">₹{formatINR(stats.revenue_this_month ?? 0)}</div>
              <div className="stat-label">Revenue</div>
              <div className="stat-sub">this month [paid]</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></svg>
              </div>
              <div className="stat-value">{stats.active_patients ?? 0}</div>
              <div className="stat-label">Active Patients</div>
              <div className="stat-sub">currently</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16"><path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0Zm-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M8.256 14a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256Z"/></svg>
              </div>
              <div className="stat-value">{stats.new_patients_this_month ?? 0}</div>
              <div className="stat-label">New Patients</div>
              <div className="stat-sub">joined this month</div>
            </div>
          </>
        )}
      </div>

      {/* Today at a Glance */}
      <div className="section-label">TODAY AT A GLANCE</div>
      <div className="pills-container">
        <div className="pill">
          <svg className="pill-icon purple" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg>
          {loading ? '—' : today.scheduled ?? 0} scheduled today
        </div>
        <div className="pill">
          <svg className={`pill-icon ${loading ? 'gray' : (today.pending_payment ?? 0) > 0 ? 'amber' : 'gray'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
          {loading ? '—' : today.pending_payment ?? 0} awaiting payment
        </div>
        <div className="pill">
          <svg className="pill-icon green" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>
          {loading ? '—' : today.completed ?? 0} completed today
        </div>
      </div>

      {/* Recent Activity */}
      <div className="section-label">RECENT ACTIVITY</div>
      <div className="activity-list">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1rem' }}>
            {[1, 2, 3, 4, 5].map((k) => (
              <div key={k} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 14, width: '35%' }} />
                </div>
                <div className="skeleton" style={{ height: 14, width: 60 }} />
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
            No recent activity.
          </div>
        ) : (
          activity.map((ev, i) => {
            const isPayment = ev.event_type === 'payment_received';
            const isAppt = ev.event_type === 'appointment_booked';
            const isNewPt = ev.event_type === 'new_patient';

            // HTML maps payment=green dot, appointment=purple dot, new_patient=blue dot
            const dotColor = isPayment ? 'green' : isAppt ? 'purple' : 'blue';

            return (
              <div className="activity-item" key={i}>
                {/* Column 1: Dot and Patient */}
                <div className="activity-col user-col">
                  <div className={`dot ${dotColor}`}></div>
                  <div className="activity-user-info">
                    <span className="user-name">{ev.patient_name || 'System'}</span>
                    <span className="activity-type">
                      {isPayment ? 'Payment' : isAppt ? 'Appointment' : 'New Patient'}
                    </span>
                  </div>
                </div>

                {/* Column 2: Action details */}
                <div className="activity-col action-col">
                  {isAppt && <span className="action-text">Booked with <b>{ev.doctor_name}</b> for {ev.detail}</span>}
                  {isPayment && <span className="action-text">Paid Invoice <b>{ev.detail}</b></span>}
                  {isNewPt && <span className="action-text">Joined clinic {ev.detail}</span>}
                </div>

                {/* Column 3: Amount or Status */}
                <div className="activity-col amount-col">
                  {isPayment ? (
                    <span className="amount-badge">₹{formatINR(ev.amount)}</span>
                  ) : isAppt ? (
                    <span className="status-badge purple">Confirmed</span>
                  ) : (
                    <span className="status-badge blue">Registered</span>
                  )}
                </div>

                {/* Column 4: Time */}
                <div className="activity-col time-col">
                  <div className="activity-time">{timeAgo(ev.event_time)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && activity.length > 0 && (
        <div className="pagination-footer" style={{ borderTop: 'none', padding: '1.5rem 0 0 0', background: 'transparent' }}>
          <div className="pagination-left">
            Rows per page: 
            <select className="rows-select">
              <option>10</option>
            </select>
          </div>
          
          <div className="pagination-center">
            <ul className="pagination">
              <li className="page-item disabled">
                <button className="page-link" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                </button>
              </li>
              <li className="page-item active"><button className="page-link">1</button></li>
              <li className="page-item disabled">
                <button className="page-link" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                </button>
              </li>
            </ul>
          </div>

          <div className="pagination-right">
            Showing 1-{activity.length} of {activity.length} entries
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
