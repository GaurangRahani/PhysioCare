import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin, Shield, FileText,
  Edit3, Save, X, LogOut, Lock, CheckCircle2, AlertCircle,
  ChevronRight, Download, Send, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ProfilePage.css';

// ── Helpers ────────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const map = {
    active:     { label: 'Active',      cls: 'bg-green-100 text-green-700' },
    discharged: { label: 'Discharged',  cls: 'bg-slate-100 text-slate-600' },
    inactive:   { label: 'Inactive',    cls: 'bg-amber-100 text-amber-700' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
};

const InvoiceStatusBadge = ({ status }) => {
  const map = {
    paid:            { label: 'Paid',       cls: 'bg-green-100 text-green-700' },
    cancelled:       { label: 'Cancelled',  cls: 'bg-slate-100 text-slate-500' },
    refunded:        { label: 'Refunded',   cls: 'bg-red-100 text-red-600' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300 ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {message}
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { getToken } = useAuth();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [internalUserId, setInternalUserId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', address: '', medical_history: '' });
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(5);
  const [emailingId, setEmailingId] = useState(null);
  const [toast, setToast] = useState(null);

  const emergencyRef = useRef(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Fetch data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Profile
      const pRes = await fetch(`${API}/api/patients/profile`, { headers });
      const pData = await pRes.json();
      if (!pRes.ok) throw new Error(pData.message);

      const userId = pData.user.id;
      setInternalUserId(userId);

      const merged = {
        name: pData.user.name,
        email: pData.user.email,
        phone: pData.user.phone || '',
        date_of_birth: pData.profile?.date_of_birth || null,
        gender: pData.profile?.gender || null,
        address: pData.profile?.address || '',
        medical_history: pData.profile?.medical_history || '',
        status: pData.profile?.status || 'active',
        created_at: pData.profile?.created_at || null,
      };
      setProfile(merged);
      setEditForm({
        phone: merged.phone,
        address: merged.address,
        medical_history: merged.medical_history,
      });

      // 2. Invoices
      const iRes = await fetch(`${API}/api/payments/invoices`, { headers });
      const iData = await iRes.json();
      if (iRes.ok) setInvoices(iData.invoices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Save profile ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = await getToken();
      const res = await fetch(`${API}/api/patients/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');

      setProfile(prev => ({ ...prev, ...editForm }));
      setIsEditingPersonal(false);
      setIsEditingMedical(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      phone: profile.phone,
      address: profile.address,
      medical_history: profile.medical_history,
    });
    setIsEditingPersonal(false);
    setIsEditingMedical(false);
  };



  // ── Download PDF Receipt ──────────────────────────────────────────────────────
  const handleDownloadInvoice = async (invoice) => {
    try {
      setEmailingId(invoice.id);
      
      const doc = new jsPDF();
      
      // Brand Colors
      const primaryColor = [86, 90, 207]; // #565acf
      const textColor = [68, 68, 68]; // #444444
      
      // 1. Header
      doc.setFontSize(24);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text("PhysioCare", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text("123 Healing Way, Medical District", 14, 30);
      doc.text("contact@physiocare.com | +91 9999999999", 14, 35);
      
      // 2. Title
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("PAYMENT RECEIPT", 130, 25);
      
      // Divider
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(14, 42, 196, 42);
      
      // 3. Patient Info
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Billed To:", 14, 52);
      doc.setFont('helvetica', 'normal');
      doc.text(`Patient: ${profile?.name || 'Valued Patient'}`, 14, 58);
      doc.text(`Email: ${profile?.email || 'N/A'}`, 14, 64);
      if (profile?.phone) doc.text(`Phone: ${profile.phone}`, 14, 70);
      
      // 4. Receipt Info
      doc.setFont('helvetica', 'bold');
      doc.text("Receipt Details:", 120, 52);
      doc.setFont('helvetica', 'normal');
      const invoiceNum = invoice.id.toString().slice(0, 8).toUpperCase();
      doc.text(`Receipt No: INV-${invoiceNum}`, 120, 58);
      doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 120, 64);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 120, 70);
      
      // 5. Table
      autoTable(doc, {
        startY: 85,
        head: [['Description', 'Date', 'Amount']],
        body: [
          [
            invoice.description || 'Consultation Session Payment', 
            new Date(invoice.created_at).toLocaleDateString(), 
            `Rs. ${invoice.amount}`
          ]
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 11, cellPadding: 6 },
        columnStyles: {
          2: { halign: 'right' }
        }
      });
      
      // 6. Total
      const finalY = doc.lastAutoTable.finalY || 110;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Total Paid:", 135, finalY + 15);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Rs. ${invoice.amount}`, 170, finalY + 15);
      
      // 7. Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Thank you for choosing PhysioCare.", 105, 280, { align: "center" });
      
      // 8. Save
      doc.save(`PhysioCare_Receipt_INV-${invoiceNum}.pdf`);
      
      showToast("Receipt downloaded successfully!");
    } catch (err) {
      console.error("PDF Generation Error: ", err);
      showToast("Could not generate PDF receipt.", "error");
    } finally {
      setEmailingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── Pagination Logic ────────────────────────────────────────────────────────
  const totalInvoicePages = Math.ceil(invoices.length / invoicesPerPage);
  const paginatedInvoices = invoices.slice((invoicePage - 1) * invoicesPerPage, invoicePage * invoicesPerPage);

  return (
    <div className="profile-page-wrapper">
      {/* Animated Background Shapes */}
      <div className="shape shape-circle"></div>
      <div className="shape shape-plus"></div>

      <main className="main-container">
        
        {/* Page Header & Sign Out Button */}
        <div className="page-header">
            <div className="header-title">
                <h1>My Profile</h1>
                <p>Manage your personal details, billing, and account settings.</p>
            </div>
            <button className="btn-signout" onClick={() => signOut(() => navigate('/'))}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
            </button>
        </div>

        <div className="profile-content-stack" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* 1. PERSONAL INFORMATION CARD */}
        <section className="profile-card">
            <div className="card-header-row">
                <span className="section-label">Personal Information</span>
                {!isEditingPersonal ? (
                  <button className="action-link" onClick={() => setIsEditingPersonal(true)}>
                    <i className="fa-solid fa-pen"></i> Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="action-link" onClick={handleCancel} style={{ color: 'var(--gray-500)' }}>
                      Cancel
                    </button>
                    <button className="action-link" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : <><i className="fa-solid fa-save"></i> Save</>}
                    </button>
                  </div>
                )}
            </div>

            {!isEditingPersonal ? (
              <div className="info-grid">
                  <div className="info-row">
                      <div className="info-icon"><i className="fa-regular fa-user"></i></div>
                      <div className="info-content">
                          <span className="info-label">Name</span>
                          <span className="info-value">{profile?.name}</span>
                      </div>
                  </div>
                  <div className="info-row">
                      <div className="info-icon"><i className="fa-regular fa-envelope"></i></div>
                      <div className="info-content">
                          <span className="info-label">Email</span>
                          <span className="info-value">{profile?.email}</span>
                          <span className="info-sub">(Change via account settings)</span>
                      </div>
                  </div>
                  <div className="info-row">
                      <div className="info-icon"><i className="fa-solid fa-phone"></i></div>
                      <div className="info-content">
                          <span className="info-label">Phone</span>
                          <span className="info-value">{profile?.phone || '—'}</span>
                      </div>
                  </div>
                  <div className="info-row">
                      <div className="info-icon"><i className="fa-regular fa-calendar"></i></div>
                      <div className="info-content">
                          <span className="info-label">Date of Birth</span>
                          <span className="info-value">
                            {profile?.date_of_birth
                              ? `${formatDate(profile.date_of_birth)} • ${calculateAge(profile.date_of_birth)} years`
                              : '—'}
                          </span>
                      </div>
                  </div>
                  <div className="info-row">
                      <div className="info-icon"><i className="fa-solid fa-shield-halved"></i></div>
                      <div className="info-content">
                          <span className="info-label">Gender</span>
                          <span className="info-value">{profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '—'}</span>
                      </div>
                  </div>
                  <div className="info-row">
                      <div className="info-icon"><i className="fa-solid fa-location-dot"></i></div>
                      <div className="info-content">
                          <span className="info-label">Address</span>
                          <span className="info-value">{profile?.address || 'Not provided'}</span>
                      </div>
                  </div>
              </div>
            ) : (
              <div className="edit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="info-row">
                  <div className="info-icon"><i className="fa-solid fa-phone"></i></div>
                  <div className="info-content" style={{ width: '100%' }}>
                    <span className="info-label">Phone</span>
                    <input type="tel" className="edit-input" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Your phone number" />
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon"><i className="fa-solid fa-location-dot"></i></div>
                  <div className="info-content" style={{ width: '100%' }}>
                    <span className="info-label">Address</span>
                    <textarea className="edit-input" value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="Your current address" rows={3}></textarea>
                  </div>
                </div>
              </div>
            )}
        </section>

        {/* 2. BILLING & PAYMENT HISTORY CARD */}
        <section className="profile-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header-row" style={{ marginBottom: '1.5rem' }}>
                <span className="section-label">Billing & Payment History</span>
            </div>
            
            {invoices.length === 0 ? (
                <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p>No payment history found.</p>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {paginatedInvoices.map(invoice => (
                        <div key={invoice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '8px', transition: 'all 0.2s', backgroundColor: 'var(--body-bg)' }}>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: 'var(--heading-text-color)', fontFamily: 'Poppins, sans-serif' }}>{invoice.description || 'Consultation Payment'}</h4>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', gap: '1rem' }}>
                                    <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                                    <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>₹{invoice.amount}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <InvoiceStatusBadge status={invoice.status} />
                                <button 
                                  className="action-link" 
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  disabled={emailingId === invoice.id || invoice.status !== 'paid'}
                                  title="Download Receipt PDF"
                                  style={{ padding: '0.5rem', border: '1px solid var(--gray-200)', borderRadius: '6px', background: 'transparent' }}
                                >
                                    {emailingId === invoice.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Pagination Controls */}
            {invoices.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                      <span>Rows per page:</span>
                      <select 
                        value={invoicesPerPage} 
                        onChange={(e) => {
                          setInvoicesPerPage(Number(e.target.value));
                          setInvoicePage(1);
                        }}
                        style={{ border: '1px solid var(--gray-300)', borderRadius: '4px', padding: '0.2rem 0.5rem', outline: 'none', color: 'var(--body-text-color)' }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>

                    <ul className="pagination" style={{ margin: 0 }}>
                        <li className={`page-item nav-icon ${invoicePage === 1 ? 'disabled' : ''}`} onClick={() => invoicePage > 1 && setInvoicePage(invoicePage - 1)}>
                            <i className="fa-solid fa-chevron-left"></i>
                        </li>
                        
                        {[...Array(totalInvoicePages)].map((_, i) => (
                            <li key={i} className={`page-item ${invoicePage === i + 1 ? 'active' : ''}`} onClick={() => setInvoicePage(i + 1)}>
                                {i + 1}
                            </li>
                        ))}
                        
                        <li className={`page-item nav-icon ${invoicePage === totalInvoicePages ? 'disabled' : ''}`} onClick={() => invoicePage < totalInvoicePages && setInvoicePage(invoicePage + 1)}>
                            <i className="fa-solid fa-chevron-right"></i>
                        </li>
                    </ul>

                    <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                      Showing {(invoicePage - 1) * invoicesPerPage + 1}-{Math.min(invoicePage * invoicesPerPage, invoices.length)} of {invoices.length} entries
                    </div>
                </div>
            )}
        </section>
        </div>

      </main>
      
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
};

export default ProfilePage;
