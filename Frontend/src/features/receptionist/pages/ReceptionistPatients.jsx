import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Search, User, Mail, Phone, MapPin, CalendarDays } from 'lucide-react';

const ReceptionistPatients = () => {
  const { getToken } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      (p.phone && p.phone.toLowerCase().includes(query))
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="container" style={{ marginTop: '2rem' }}>
          
        {/* Header Section */}
        <div className="overview-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--slate-800)', margin: 0 }}>Patient Directory</h1>
                <p style={{ color: 'var(--slate-500)', marginTop: '0.25rem' }}>View and manage registered patients.</p>
            </div>
            
            <div className="search-wrapper" style={{ position: 'relative', width: '300px' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search by name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
            </div>
        </div>

        {/* List Container */}
        <div className="list-container">
            
            {loading ? (
                <div className="flex justify-center items-center" style={{ height: '300px' }}>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : error ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                    {error}
                </div>
            ) : (
                <div className="cards-stack">
                    {currentPatients.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)', backgroundColor: 'var(--slate-50)', borderRadius: '12px' }}>
                            <i className="fa-regular fa-folder-open" style={{fontSize: '3rem', color: 'var(--gray-300)', margin: '0 auto 1rem auto'}}></i>
                            <p>No patients found matching your search.</p>
                        </div>
                    ) : (
                        currentPatients.map(patient => {
                            const avatarInitials = (patient.name || 'UN').substring(0, 2).toUpperCase();
                            
                            return (
                                <div key={patient.id} className="appointment-horizontal-card card-theme-primary">
                                    
                                    {/* Column 1: Patient Profile */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1.5', minWidth: '250px' }}>
                                        <div style={{ minWidth: '48px', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 10px rgba(86, 90, 207, 0.2)' }}>
                                            {avatarInitials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--slate-800)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{patient.name}</div>
                                            {patient.address ? (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={13} /> <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.address}</span>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>No address provided</div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Column 2: Contact Info */}
                                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '220px' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Mail size={12} className="text-primary" />
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{patient.email}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Phone size={12} className="text-primary" />
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{patient.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Column 3: Demographics */}
                                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <User size={14} className="text-slate-400" /> 
                                            <span style={{ textTransform: 'capitalize' }}>{patient.gender || 'Unknown Gender'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CalendarDays size={14} className="text-slate-400" /> 
                                            DOB: {formatDate(patient.date_of_birth)}
                                        </div>
                                    </div>
                                    
                                    {/* Column 4: Status/Date */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '130px' }}>
                                        <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '20px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', fontWeight: '600' }}>Active Patient</span>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                                            Joined {formatDate(patient.created_at)}
                                        </div>
                                    </div>
                                    
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Pagination Bar */}
            {!loading && !error && filteredPatients.length > 0 && (
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
                        <span>Showing {filteredPatients.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} entries</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistPatients;
