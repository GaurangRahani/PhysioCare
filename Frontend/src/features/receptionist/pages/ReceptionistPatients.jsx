import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  Loader2, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CalendarDays, 
  UserPlus, 
  CalendarPlus,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import RegisterPatientModal from '../components/RegisterPatientModal';
import BookAppointmentModal from '../components/BookAppointmentModal';

const ReceptionistPatients = () => {
  const { getToken } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchPatients();
  }, [getToken]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/receptionists/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setPatients(data.patients || []);
      } else {
        setError(data.message || 'Failed to fetch patients.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.email && p.email.toLowerCase().includes(query)) ||
      (p.phone && p.phone.toLowerCase().includes(query)) ||
      (p.address && p.address.toLowerCase().includes(query))
    );
  });

  // Pagination logic
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* Modals */}
      <RegisterPatientModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onRegistered={() => {
          fetchPatients();
          setIsRegisterModalOpen(false);
        }} 
      />

      <BookAppointmentModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onBooked={() => setIsBookModalOpen(false)} 
      />

      {/* ── 1. HEADER SECTION ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6D7175] bg-[#F4F4F4] px-2.5 py-0.5 rounded-full">
              <User className="w-3 h-3 text-[#8A8A8A]" />
              Patient Records ({patients.length})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202223]">
            Patient Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6D7175] mt-0.5">
            Search, review clinical contact records, and register new walk-in patients.
          </p>
        </div>

        {/* Action Button (Using near-black primary saas button) */}
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn-primary-saas flex items-center gap-1.5 text-[12px] sm:text-[13px] py-2 px-3.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* ── 2. SEARCH & FILTER TOOLBAR ───────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#EAEAEA] p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="w-3.5 h-3.5 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all text-[#202223] placeholder-[#8A8A8A]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-[#6D7175]">
            Showing <strong className="text-[#202223]">{filteredPatients.length}</strong> matching patients
          </span>
          <button
            type="button"
            onClick={fetchPatients}
            disabled={loading}
            className="p-2 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-[#6D7175] hover:text-[#202223] hover:bg-[#F9FAFB] transition-colors cursor-pointer shrink-0"
            title="Refresh directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#202223]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 3. PATIENTS TABLE & CARDS ─────────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#EAEAEA] shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-[#202223] animate-spin" />
            <span className="text-xs text-[#8A8A8A]">Loading patient roster...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-[#B42318] bg-[#FEF3F2]">
            {error}
          </div>
        ) : currentPatients.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F4F4F4] flex items-center justify-center text-[#8A8A8A] mx-auto mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#202223] mb-1">
              No patients found
            </h3>
            <p className="text-xs text-[#6D7175] max-w-sm mx-auto">
              {searchQuery ? 'Try a different search term.' : 'Click "+ Register New Patient" to add your first patient.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#EAEAEA] text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
                    <th className="py-3 px-4">Patient Profile</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Demographics</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] text-xs text-[#202223]">
                  {currentPatients.map((patient) => {
                    const avatarInitials = (patient.name || 'PT')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={patient.id} className="hover:bg-[#F9FAFB] transition-colors">
                        {/* Profile with dark avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {avatarInitials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#202223] text-sm leading-tight">
                                {patient.name}
                              </span>
                              {patient.address ? (
                                <span className="text-[11px] text-[#6D7175] flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                                  <MapPin className="w-3 h-3 text-[#8A8A8A] shrink-0" />
                                  {patient.address}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#8A8A8A] mt-0.5 italic">No address on file</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-xs text-[#202223]">
                              <Mail className="w-3.5 h-3.5 text-[#4088F8] shrink-0" />
                              {patient.email || 'No email'}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] text-[#6D7175]">
                              <Phone className="w-3.5 h-3.5 text-[#8A8A8A] shrink-0" />
                              {patient.phone || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Demographics */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="capitalize font-medium text-[#202223]">
                              {patient.gender || 'Not specified'}
                            </span>
                            <span className="text-[11px] text-[#6D7175] flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-[#8A8A8A]" />
                              DOB: {formatDate(patient.date_of_birth)}
                            </span>
                          </div>
                        </td>

                        {/* Registered */}
                        <td className="py-3 px-4 text-[#6D7175]">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full mb-1">
                            Active
                          </span>
                          <div className="text-[11px]">
                            Joined {formatDate(patient.created_at)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setIsBookModalOpen(true)}
                            className="btn-secondary-saas text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-[#202223]" />
                            <span>Book Visit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="block lg:hidden divide-y divide-[#EAEAEA]">
              {currentPatients.map((patient) => {
                const avatarInitials = (patient.name || 'PT')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div key={patient.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {avatarInitials}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-[#202223] leading-tight">{patient.name}</h4>
                          <span className="text-[11px] text-[#6D7175] capitalize">{patient.gender || 'Patient'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#6D7175] bg-[#F9FAFB] p-2.5 rounded-lg border border-[#EAEAEA]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8A8A8A] block">Email</span>
                        <span className="truncate block text-[#202223]">{patient.email || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8A8A8A] block">Phone</span>
                        <span className="text-[#202223]">{patient.phone || '—'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#8A8A8A]">
                        Joined {formatDate(patient.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBookModalOpen(true)}
                        className="btn-secondary-saas text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-[#202223]" />
                        <span>Book Visit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 4. ENTERPRISE PAGINATION BAR ────────────────────────────── */}
        {!loading && !error && filteredPatients.length > 0 && (
          <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6D7175]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-[#EAEAEA] rounded-md px-2 py-1 text-xs text-[#202223] focus:outline-none focus:border-[#202223] cursor-pointer"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>

              <span>
                Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length}
              </span>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary-saas text-[11px] py-1 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-2 py-1 text-xs font-medium text-[#202223]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary-saas text-[11px] py-1 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default ReceptionistPatients;
