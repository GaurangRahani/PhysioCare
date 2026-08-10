import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import EditUserDrawer from '../components/EditUserDrawer';
import InviteStaffModal from '../components/InviteStaffModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ROLE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'doctor', label: 'Doctors' },
  { value: 'receptionist', label: 'Receptionists' },
  { value: 'patient', label: 'Patients' },
];

const avatarStyle = (role) => {
  if (role === 'doctor') return { background: '#EDE9FE', color: '#6D28D9' };
  if (role === 'receptionist') return { background: '#CCFBF1', color: '#0F766E' };
  return { background: '#DBEAFE', color: '#1D4ED8' };
};

const initials = (name) =>
  (name || '').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const StatusCell = ({ user }) => {
  if (user.role === 'patient') {
    const s = user.patient_status || 'active';
    const map = {
      active: { cls: 'dot-green', label: 'Active' },
      inactive: { cls: 'dot-amber', label: 'Inactive' },
      discharged: { cls: 'dot-gray', label: 'Discharged' },
    };
    const m = map[s] || map.active;
    return <span className="status-indicator"><span className={`status-dot ${m.cls}`} />{m.label}</span>;
  }
  const ok = user.is_active;
  return (
    <span className="status-indicator">
      <span className={`status-dot ${ok ? 'dot-green' : 'dot-red'}`} />
      {ok ? 'Active' : 'Inactive'}
    </span>
  );
};

const SkeletonRow = () => (
  <tr>
    {[120, 80, 70, 80, 60].map((w, i) => (
      <td key={i} style={{ padding: '1rem 1.5rem' }}>
        <div className="skeleton" style={{ height: 14, width: w }} />
      </td>
    ))}
  </tr>
);

const LIMIT = 20;

const AdminUsers = () => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const debounceRef = useRef(null);

  const fetchUsers = useCallback(async (rf, q, pg) => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ role: rf, search: q, page: pg, limit: LIMIT });
      const res = await fetch(`${API}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch on filter/page change
  useEffect(() => {
    fetchUsers(roleFilter, search, page);
  }, [roleFilter, page, fetchUsers]); // eslint-disable-line

  // Debounce search
  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(roleFilter, val, 1), 300);
  };

  const handleRoleFilter = (rf) => {
    setRoleFilter(rf);
    setPage(1);
    setSearch('');
    fetchUsers(rf, '', 1);
  };

  const handleUserUpdated = (updated) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
  };

  const start = (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, total);

  return (
    <>
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-pill ${roleFilter === f.value ? 'active' : ''}`}
              onClick={() => handleRoleFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Invite button */}
        <button className="btn-primary" onClick={() => setShowInvite(true)}>
          <i className="fa-solid fa-plus" />
          Invite Staff
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
        <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
        <input
          className="admin-search"
          style={{ paddingLeft: '2.5rem' }}
          placeholder="Search name, email, or phone…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* ── User Table ───────────────────────────────────────────────── */}
      <div className="user-table-wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((k) => <SkeletonRow key={k} />)
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                  <i className="fa-solid fa-users-slash" style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }} />
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const av = avatarStyle(u.role);
                return (
                  <tr key={u.id}>
                    {/* Name + email */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="user-avatar" style={av}>{initials(u.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>

                    {/* Status */}
                    <td><StatusCell user={u} /></td>

                    {/* Joined */}
                    <td style={{ fontSize: '0.875rem', color: '#475569' }}>
                      {new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>

                    {/* Action */}
                    <td>
                      <button className="btn-ghost-edit" onClick={() => setEditingUser(u)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="pagination-bar">
            <span style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
              Showing {start}–{end} of {total}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span style={{ fontSize: '0.875rem', color: '#94A3B8', padding: '0 0.5rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Drawer ─────────────────────────────────────────────── */}
      <div className="admin-theme">
        <EditUserDrawer
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={handleUserUpdated}
        />
      </div>

      {/* ── Invite Modal ─────────────────────────────────────────────── */}
      <div className="admin-theme">
        <InviteStaffModal
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          onInvited={() => fetchUsers(roleFilter, search, page)}
        />
      </div>
    </>
  );
};

export default AdminUsers;
