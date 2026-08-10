import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Search, X } from 'lucide-react';
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
    const [itemsPerPage, setItemsPerPage] = useState(10);

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

    const navigateToCompliance = (patientId, logId = null) => {
        const url = `/doctor-dashboard/patients/${patientId}?tab=compliance${logId ? `&highlightLog=${logId}` : ''}`;
        navigate(url);
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    }; return (
        <div className="patients-tab-wrapper">
            {/* BACKGROUND ELEMENTS */}
            <div className="bg-elements">
                <div className="bg-dotted-layer"></div>
                <div className="floating-shape shape-square"></div>
                <div className="floating-shape shape-zigzag"></div>
                <div className="floating-shape shape-cross"></div>
            </div>

            <div className="patients-container">
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

                {/* MY PATIENTS TOOLBAR */}
                <div className="patients-section-header">
                    <h2>My Patients</h2>
                    <div className="toolbar-actions">
                        <select className="form-select" aria-label="Filter Patients" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Patients</option>
                            <option value="active">Active</option>
                            <option value="discharged">Discharged</option>
                        </select>
                        <div className="search-wrapper">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                    </div>
                </div>

                {/* PATIENT CARD GRID */}
                <div className="patient-grid">
                    {currentPatients.map(patient => {
                        // Badge Logic
                        let badgeNode;
                        if (patient.hasUrgentAlert) {
                            badgeNode = <span className="badge badge-danger">🔴 {patient.maxPainLevel}/10</span>;
                        } else if (patient.compliancePercent !== null && patient.compliancePercent !== undefined) {
                            const comp = patient.compliancePercent;
                            const badgeClass = comp >= 80 ? 'badge-success' : comp >= 50 ? 'badge-warning' : 'badge-danger';
                            badgeNode = <span className={`badge ${badgeClass}`}>{comp}% COMPLIANCE</span>;
                        } else {
                            badgeNode = <span className="badge badge-gray">NO DATA</span>;
                        }

                        // Avatar initialization (first 2 letters of name)
                        const avatarInitials = (patient.name || 'UN').substring(0, 2).toUpperCase();

                        return (
                            <div key={patient.patient_id} className="pt-card" onClick={() => navigateToClinicalProfile(patient.patient_id)}>
                                <div className="pt-header">
                                    <div className="pt-avatar">{avatarInitials}</div>
                                    <div className="pt-user-info">
                                        <div className="pt-name-row">
                                            <span className="pt-name">{patient.name}</span>

                                        </div>
                                        <div className="pt-sub-info">{patient.age ? `${patient.age} • ` : ''}{patient.gender || 'Unknown'}</div>
                                    </div>
                                </div>

                                <div className="pt-divider"></div>

                                <div className="pt-details-container">
                                    <div className="pt-detail-row">
                                        <span className="pt-label">Condition</span>
                                        <span className="pt-value">{patient.condition || 'Not specified'}</span>
                                    </div>
                                    <div className="pt-detail-row">
                                        <span className="pt-label">Active Plan</span>
                                        <span className="pt-value">{patient.plan_title || 'None'}</span>
                                    </div>
                                    <div className="pt-detail-row">
                                        <span className="pt-label">Last Visit</span>
                                        <span className="pt-value">{formatDateShort(patient.last_visit)}</span>
                                    </div>
                                </div>

                                <button className="pt-action-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToClinicalProfile(patient.patient_id);
                                }}>
                                    View Clinical Profile
                                </button>
                            </div>
                        );
                    })}

                    {filteredPatients.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: 'var(--gray-muted)' }}>
                            No patients found matching your criteria.
                        </div>
                    )}
                </div>

                {/* PAGINATION */}
                {filteredPatients.length > 0 && (
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
                            <nav className="pagination-numbers-nav" aria-label="Patients page navigation">
                                <button
                                    className="page-num-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    aria-label="Previous page"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                                    </svg>
                                </button>

                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={page}
                                                className={`page-num-btn ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} style={{ color: 'var(--gray-muted)', padding: '0 4px' }}>...</span>;
                                    }
                                    return null;
                                })}

                                <button
                                    className="page-num-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    aria-label="Next page"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                                    </svg>
                                </button>
                            </nav>
                        </div>

                        <div className="pagination-right-panel">
                            <span>Showing {filteredPatients.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} entries</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientsTab;
