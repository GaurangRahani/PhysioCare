#!/bin/bash
START=$(grep -n "return (" src/features/dashboard/pages/ProfilePage.jsx | head -n 1 | cut -d: -f1)
END=$(wc -l < src/features/dashboard/pages/ProfilePage.jsx)

head -n $((START - 1)) src/features/dashboard/pages/ProfilePage.jsx > temp.jsx
cat >> temp.jsx << 'INNER_EOF'
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

        {/* 1. PERSONAL INFORMATION CARD */}
        <section className="profile-card">
            <div className="card-header-row">
                <span className="section-label">Personal Information</span>
                {!isEditing ? (
                  <button className="action-link" onClick={() => setIsEditing(true)}>
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

            {!isEditing ? (
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

        {/* 2. MEDICAL HISTORY CARD */}
        <section className="profile-card">
            <div className="card-header-row" style={{ marginBottom: (!isEditing && !profile?.medical_history) ? '0' : '1.5rem' }}>
                <span className="section-label">Medical History</span>
            </div>
            
            {isEditing ? (
              <div className="info-content" style={{ width: '100%' }}>
                <textarea className="edit-input" value={editForm.medical_history} onChange={(e) => setEditForm(f => ({ ...f, medical_history: e.target.value }))} placeholder="Any relevant medical history..." rows={4}></textarea>
              </div>
            ) : (
              !profile?.medical_history ? (
                <div className="empty-state">
                    <p>No medical history provided.</p>
                    <button className="action-link" style={{ justifyContent: 'center', width: '100%' }} onClick={() => setIsEditing(true)}>
                        <i className="fa-solid fa-plus"></i> Add Medical History
                    </button>
                </div>
              ) : (
                <p style={{ fontSize: '0.95rem', color: 'var(--body-text-color)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{profile.medical_history}</p>
              )
            )}
        </section>

        {/* 3. MY BILLS CARD */}
        <section className="profile-card">
            <div className="card-header-row">
                <span className="section-label">My Bills</span>
            </div>

            {invoices.length === 0 ? (
              <div className="empty-state">
                  <p>No invoices yet.</p>
              </div>
            ) : (
              <>
                {paginatedInvoices.map(inv => (
                  <div key={inv.id} className="bill-row">
                      <div className="bill-info">
                          <span className="bill-id">{inv.invoice_number}</span>
                          <span className="bill-date">{formatDate(inv.created_at)}</span>
                          {inv.description && <span className="bill-desc">{inv.description}</span>}
                      </div>
                      <div className="bill-meta">
                          <div className="bill-price-row">
                              <span className="bill-price">₹{parseFloat(inv.amount).toLocaleString('en-IN')}</span>
                              <a href={`${API}/api/payments/invoices/${inv.id}`} target="_blank" rel="noopener noreferrer" className="action-link"><i className="fa-solid fa-download"></i> PDF</a>
                          </div>
                          <div className="bill-price-row">
                              {inv.status === 'paid' && <span className="badge-paid">Paid</span>}
                              {inv.status !== 'paid' && <span className="badge-paid" style={{ background: 'var(--gray-200)', color: 'var(--gray-600)' }}>{inv.status}</span>}
                              
                              <button 
                                className="action-link" 
                                style={{ color: 'var(--gray-500)' }}
                                onClick={() => handleEmailInvoice(inv)}
                                disabled={emailingId === inv.id}
                              >
                                {emailingId === inv.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-paper-plane"></i>} Email
                              </button>
                          </div>
                      </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {totalInvoicePages > 1 && (
                  <div className="pagination-row">
                      <button className="btn-page" disabled={invoicePage === 1} onClick={() => setInvoicePage(p => Math.max(1, p - 1))}>Previous</button>
                      <span className="page-indicator">Page {invoicePage} of {totalInvoicePages}</span>
                      <button className="btn-page" disabled={invoicePage === totalInvoicePages} onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}>Next</button>
                  </div>
                )}
              </>
            )}

        </section>

      </main>
      
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
};

export default ProfilePage;
INNER_EOF
mv temp.jsx src/features/dashboard/pages/ProfilePage.jsx
chmod +x replace_profile.sh
./replace_profile.sh
