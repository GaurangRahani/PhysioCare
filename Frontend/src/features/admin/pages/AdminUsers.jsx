import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import EditUserDrawer from '../components/EditUserDrawer';
import InviteStaffModal from '../components/InviteStaffModal';
import { 
  Search, 
  UserPlus, 
  Users, 
  Stethoscope, 
  Headphones, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  UserX,
  Mail,
  Calendar,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  X,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ROLE_FILTERS = [
  { value: 'all', label: 'All Accounts' },
  { value: 'doctor', label: 'Doctors' },
  { value: 'receptionist', label: 'Receptionists' },
  { value: 'patient', label: 'Patients' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active Only' },
  { value: 'inactive', label: 'Inactive / Blocked' },
  { value: 'discharged', label: 'Discharged Patients' },
];

const DATE_JOINED_FILTERS = [
  { value: 'all', label: 'All Joined Dates' },
  { value: 'this_month', label: 'Joined This Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
];

const initials = (name) =>
  (name || '').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const StatusCell = ({ user }) => {
  if (user.role === 'patient') {
    const s = user.patient_status || 'active';
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E3F1DF] text-[#008060] border border-[#C3E6CD]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />
          Active
        </span>
      );
    }
    if (s === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF9E6] text-[#856404] border border-[#FFE8A3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#856404]" />
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F4F4] text-[#616161] border border-[#EAEAEA]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8A8A8A]" />
        Discharged
      </span>
    );
  }

  const ok = user.is_active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
      ok 
        ? 'bg-[#E3F1DF] text-[#008060] border-[#C3E6CD]' 
        : 'bg-[#FCE4E4] text-[#B81818] border-[#F5C2C2]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-[#008060]' : 'bg-[#B81818]'}`} />
      {ok ? 'Active' : 'Blocked'}
    </span>
  );
};

const SkeletonRow = () => (
  <tr className="border-b border-[#F0F0F0]">
    <td className="py-3 px-4">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-[#F0F0F0]" />
        <div className="space-y-1">
          <div className="h-3.5 w-28 bg-[#F0F0F0] rounded" />
          <div className="h-3 w-40 bg-[#F5F5F5] rounded" />
        </div>
      </div>
    </td>
    <td className="py-3 px-4"><div className="h-4 w-16 bg-[#F0F0F0] rounded animate-pulse" /></td>
    <td className="py-3 px-4"><div className="h-4 w-16 bg-[#F0F0F0] rounded animate-pulse" /></td>
    <td className="py-3 px-4"><div className="h-4 w-20 bg-[#F0F0F0] rounded animate-pulse" /></td>
    <td className="py-3 px-4"><div className="h-6 w-12 bg-[#F0F0F0] rounded animate-pulse" /></td>
  </tr>
);

const AdminUsers = () => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modals & Drawers
  const [editingUser, setEditingUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  // ── FILTERS ────────────────────────────────────────────────────────
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateJoinedFilter, setDateJoinedFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Sorting
  const [sortColumn, setSortColumn] = useState('created_at'); // 'created_at' | 'name' | 'role' | 'status'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const debounceRef = useRef(null);

  // Fetch users from API (requesting up to 100 to allow rich client filtering & sorting)
  const fetchUsers = useCallback(async (rf, q) => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ role: rf, search: q, page: 1, limit: 100 });
      const res = await fetch(`${API}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || (data.users || []).length);
      }
    } catch (e) {
      console.error('Error fetching admin users:', e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUsers(roleFilter, search);
  }, [roleFilter, fetchUsers]);

  const handleSearch = (val) => {
    setSearch(val);
    setCurrentPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(roleFilter, val), 300);
  };

  const handleRoleFilter = (rf) => {
    setRoleFilter(rf);
    setCurrentPage(1);
    fetchUsers(rf, search);
  };

  const handleUserUpdated = (updated) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
  };

  // ── CLIENT FILTERING PIPELINE ──────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // 1. Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter(u => {
          if (u.role === 'patient') return u.patient_status === 'active' || !u.patient_status;
          return u.is_active !== false;
        });
      } else if (statusFilter === 'inactive') {
        result = result.filter(u => {
          if (u.role === 'patient') return u.patient_status === 'inactive';
          return u.is_active === false;
        });
      } else if (statusFilter === 'discharged') {
        result = result.filter(u => u.role === 'patient' && u.patient_status === 'discharged');
      }
    }

    // 2. Date Joined Filter
    if (dateJoinedFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      if (dateJoinedFilter === 'this_month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        result = result.filter(u => new Date(u.created_at).getTime() >= monthStart);
      } else if (dateJoinedFilter === 'last_30_days') {
        const past30Days = todayStart - 30 * 24 * 60 * 60 * 1000;
        result = result.filter(u => new Date(u.created_at).getTime() >= past30Days);
      } else if (dateJoinedFilter === 'last_90_days') {
        const past90Days = todayStart - 90 * 24 * 60 * 60 * 1000;
        result = result.filter(u => new Date(u.created_at).getTime() >= past90Days);
      }
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA, valB;
      if (sortColumn === 'created_at') {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      } else if (sortColumn === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortColumn === 'role') {
        valA = (a.role || '').toLowerCase();
        valB = (b.role || '').toLowerCase();
      } else {
        valA = a[sortColumn] || '';
        valB = b[sortColumn] || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, statusFilter, dateJoinedFilter, sortColumn, sortDirection]);

  // Handle column header sort click
  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDateJoinedFilter('all');
    setCurrentPage(1);
    fetchUsers('all', '');
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined Date'];
    const rows = filteredUsers.map(u => [
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      u.role || '',
      u.role === 'patient' ? (u.patient_status || 'active') : (u.is_active ? 'active' : 'blocked'),
      `"${new Date(u.created_at).toLocaleDateString('en-IN')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AlignCare_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination calculation
  const totalEntries = filteredUsers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isFiltered = search || roleFilter !== 'all' || statusFilter !== 'all' || dateJoinedFilter !== 'all';

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* ── 1. PAGE HEADER ROW ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-[20px] font-bold text-[#202223] tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-[12px] text-[#616161] mt-0.5">
            Manage clinic clinicians, front desk receptionists, patient accounts, and permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredUsers.length === 0}
            className="h-[36px] px-3 rounded-[8px] bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#202223] hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed text-[#202223] text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            title="Export filtered users to CSV"
          >
            <Download size={13} />
            <span>Export Roster</span>
          </button>

          <button
            onClick={() => setShowInvite(true)}
            className="h-[36px] px-3.5 rounded-[8px] bg-[#000000] hover:bg-[#202020] text-[#FFFFFF] text-[12px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus size={14} />
            <span>Invite Staff</span>
          </button>
        </div>
      </div>

      {/* ── 2. FILTERS & SEARCH TOOLBAR ───────────────────────────────── */}
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-3 shadow-xs space-y-3">
        
        {/* Row 1: Search & Dropdown Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="text"
              placeholder="Search name, email, or phone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-[12px] bg-[#FFFFFF] border border-[#EAEAEA] focus:border-[#202223] rounded-[8px] text-[#202223] placeholder:text-[#8A8A8A] outline-none shadow-2xs transition-colors"
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#202223] p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Secondary Dropdown Filters: Status + Joined Date */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Status Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#616161]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#FBFBFB] border border-[#EAEAEA] rounded-[8px] px-2.5 py-1 text-[12px] text-[#202223] outline-none cursor-pointer hover:border-[#202223] focus:border-[#202223] transition-colors"
              >
                {STATUS_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Joined Date Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#616161]">Joined:</span>
              <select
                value={dateJoinedFilter}
                onChange={(e) => {
                  setDateJoinedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#FBFBFB] border border-[#EAEAEA] rounded-[8px] px-2.5 py-1 text-[12px] text-[#202223] outline-none cursor-pointer hover:border-[#202223] focus:border-[#202223] transition-colors"
              >
                {DATE_JOINED_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Row 2: Role Filter Pills + Clear Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#F0F0F0]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {ROLE_FILTERS.map((f) => {
              const active = roleFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => handleRoleFilter(f.value)}
                  className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#202223] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'bg-[#FBFBFB] border border-[#EAEAEA] text-[#616161] hover:text-[#202223] hover:border-[#202223]'
                  }`}
                >
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {isFiltered && (
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-[#B81818] hover:underline cursor-pointer inline-flex items-center gap-1 font-medium"
            >
              <X size={12} />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

      </div>

      {/* ── 3. USER DIRECTORY TABLE ───────────────────────────────────── */}
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAEAEA] text-[#616161] text-[11px] font-semibold uppercase tracking-wider select-none">
                
                {/* Name Header */}
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[#202223] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>User Details</span>
                    {sortColumn === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={11} className="text-[#A3A3A3]" />
                    )}
                  </div>
                </th>

                {/* Role Header */}
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[#202223] transition-colors"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    <span>Role</span>
                    {sortColumn === 'role' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={11} className="text-[#A3A3A3]" />
                    )}
                  </div>
                </th>

                {/* Status Header */}
                <th className="py-3 px-4">
                  Status
                </th>

                {/* Joined Date Header */}
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[#202223] transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    <span>Joined Date</span>
                    {sortColumn === 'created_at' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : (
                      <ArrowUpDown size={11} className="text-[#A3A3A3]" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0] text-[13px] text-[#202223]">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((k) => <SkeletonRow key={k} />)
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <UserX size={32} className="mx-auto text-[#CCCCCC] mb-2" />
                    <div className="text-[13px] font-medium text-[#202223]">No users matching current filters</div>
                    <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                      Try resetting your role, status, or date filters.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-[#FAFAFA] transition-colors">
                      {/* Name + email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#202020] text-[#FFFFFF] flex items-center justify-center font-bold text-[12px] shrink-0">
                            {initials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#202223] truncate">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-[#8A8A8A] truncate flex items-center gap-1">
                              <Mail size={11} className="shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-medium border ${
                          u.role === 'doctor'
                            ? 'bg-[#F4F4F4] text-[#202223] border-[#E0E0E0]'
                            : u.role === 'receptionist'
                            ? 'bg-[#F4F4F4] text-[#202223] border-[#E0E0E0]'
                            : 'bg-[#F8F9FA] text-[#616161] border-[#EAEAEA]'
                        }`}>
                          {u.role === 'doctor' && <Stethoscope size={11} />}
                          {u.role === 'receptionist' && <Headphones size={11} />}
                          {u.role === 'patient' && <Users size={11} />}
                          <span className="capitalize">{u.role}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusCell user={u} />
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-[12px] text-[#616161] font-mono">
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#202223] bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#202223] hover:bg-[#F4F4F4] rounded-[6px] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#616161]">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] px-2 py-1 text-[12px] text-[#202223] outline-none cursor-pointer focus:border-[#202223]"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-[#8A8A8A]">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} accounts
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-[6px] border border-[#EAEAEA] bg-[#FFFFFF] hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-[#202223]"
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 py-0.5 font-medium text-[#202223]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-[6px] border border-[#EAEAEA] bg-[#FFFFFF] hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-[#202223]"
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. EDIT USER DRAWER ───────────────────────────────────────── */}
      <EditUserDrawer
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onUserUpdated={handleUserUpdated}
      />

      {/* ── 5. INVITE STAFF MODAL ─────────────────────────────────────── */}
      <InviteStaffModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        onInvited={() => fetchUsers(roleFilter, search)}
      />

    </div>
  );
};

export default AdminUsers;
