import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Search, ArrowRight, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertSection from '../components/AlertSection';
import AlertReviewModal from '../components/AlertReviewModal';
import './PatientsTab.css';

const PatientsTab = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    fetchPatientsData();
  }, []);

  const fetchPatientsData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const [patientsRes, alertsRes] = await Promise.all([
        fetch(`${apiUrl}/api/patients/doctor/my-patients`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const patientsData = await patientsRes.json();
      const alertsData = await alertsRes.json();

      if (patientsData.success) {
        setPatients(patientsData.patients || []);
      }
      if (alertsData.success) {
        setAlerts(alertsData.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAlert = (alert) => {
    setSelectedAlert(alert);
  };

  const navigateToClinicalProfile = (patientId) => {
    navigate(`/doctor-dashboard/patients/${patientId}`);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.condition || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const today = new Date().toDateString() === d.toDateString();
    return `${today ? 'Today' : d.toLocaleDateString()}, ${h}:${m} ${ampm}`;
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#202223]" />
        <span className="text-xs text-[#8A8A8A]">Loading patient records...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full font-['Inter',system-ui,sans-serif] text-[#202223]">
      
      {/* ALERTS SECTION */}
      <AlertSection
        alerts={alerts}
        onReview={handleReviewAlert}
        formatTime={formatTime}
      />

      <AlertReviewModal
        isOpen={!!selectedAlert}
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onResolved={fetchPatientsData}
      />

      {/* ── Page Header & Filter Toolbar ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold text-[#202223] tracking-tight m-0">
              My Patients
            </h1>
            <span className="badge-semantic-neutral">
              {filteredPatients.length} active roster
            </span>
          </div>
          <p className="text-[13px] text-[#616161] mt-1 font-normal">
            Manage your patient consultations, rehabilitation plans, and daily recovery progress.
          </p>
        </div>

        {/* Toolbar: Select & Search */}
        <div className="flex items-center gap-3">
          <select 
            aria-label="Filter Patients" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg text-[#202223] outline-none focus:border-[#202223] font-medium cursor-pointer"
          >
            <option value="all">All Patients</option>
            <option value="active">Active Plan</option>
            <option value="discharged">Discharged</option>
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="text"
              placeholder="Search by name or condition..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg text-[#202223] placeholder-[#8A8A8A] outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] w-56 sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Patient Cards Grid ────────────────────────────────────────── */}
      {currentPatients.length === 0 ? (
        <div className="saas-card py-20 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0F0F0] border border-[#E5E5E5] flex items-center justify-center mb-3 text-[#8A8A8A]">
            <User size={22} />
          </div>
          <h3 className="text-[16px] font-semibold text-[#202223] m-0">No Patients Found</h3>
          <p className="text-[13px] text-[#616161] mt-1 max-w-sm">
            {searchQuery ? `No patient matches "${searchQuery}". Try clearing search.` : 'You currently do not have any assigned patients.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPatients.map(patient => {
            const avatarInitials = (patient.name || 'UN').substring(0, 2).toUpperCase();
            const comp = patient.compliancePercent;

            return (
              <div 
                key={patient.patient_id} 
                className="saas-card p-5 flex flex-col justify-between group hover:border-[#CCCCCC] hover:shadow-xs transition-all cursor-pointer bg-[#FFFFFF]"
                onClick={() => navigateToClinicalProfile(patient.patient_id)}
              >
                <div>
                  {/* Card Header: Avatar & Name */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EAEAEA]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#FFFFFF] text-[13px] font-semibold flex items-center justify-center shrink-0 tracking-wider">
                        {avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[15px] font-semibold text-[#202223] m-0 truncate group-hover:text-[#000000]">
                          {patient.name}
                        </h4>
                        <span className="text-[12px] text-[#616161] mt-0.5 block">
                          {patient.age ? `${patient.age} yrs • ` : ''}{patient.gender || 'Patient'}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {patient.hasUrgentAlert ? (
                      <span className="badge-semantic-error flex items-center gap-1 shrink-0 text-[11px]">
                        <AlertCircle size={11} /> {patient.maxPainLevel}/10 Pain
                      </span>
                    ) : comp !== null && comp !== undefined ? (
                      <span className={`text-[11px] shrink-0 ${
                        comp >= 80 ? 'badge-semantic-success' : comp >= 50 ? 'badge-semantic-warning' : 'badge-semantic-error'
                      }`}>
                        {comp}% Compliance
                      </span>
                    ) : (
                      <span className="badge-semantic-neutral shrink-0 text-[11px]">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Card Details Body */}
                  <div className="py-3 flex flex-col gap-2 text-[12px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8A8A8A]">Primary Condition:</span>
                      <span className="font-medium text-[#202223] truncate max-w-[170px]">
                        {patient.condition || 'General Rehabilitation'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8A8A8A]">Active Plan:</span>
                      <span className="font-medium text-[#202223] truncate max-w-[170px]">
                        {patient.plan_title || 'No plan assigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8A8A8A]">Last Visit:</span>
                      <span className="font-mono text-[#616161]">
                        {formatDateShort(patient.last_visit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-3 border-t border-[#EAEAEA]">
                  <button 
                    type="button"
                    className="w-full btn-secondary-saas flex items-center justify-center gap-2 group-hover:bg-[#F0F0F0] text-[12px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToClinicalProfile(patient.patient_id);
                    }}
                  >
                    <span>View Clinical Profile</span>
                    <ArrowRight size={13} className="text-[#616161]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination Footer ────────────────────────────────────────── */}
      {filteredPatients.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#EAEAEA] text-[12px] text-[#616161]">
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#E5E5E5] rounded-md text-[#202223] font-medium outline-none"
            >
              <option value="6">6 per page</option>
              <option value="9">9 per page</option>
              <option value="18">18 per page</option>
            </select>
            <span className="text-[#8A8A8A] ml-2">
              Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} patients
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            
            <span className="px-2 font-mono text-[#202223]">
              Page {currentPage} of {totalPages}
            </span>

            <button 
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientsTab;
