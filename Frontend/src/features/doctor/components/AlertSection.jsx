import React, { useState } from 'react';

const AlertSection = ({ alerts, onReview, formatTime }) => {
    if (!alerts || alerts.length === 0) return null;

    const urgentAlerts = alerts.filter(a => a.alert_level === 'red');
    const reviewAlerts = alerts.filter(a => a.alert_level === 'yellow');

    const [urgentOpen, setUrgentOpen] = useState(true); // Open by default
    const [reviewOpen, setReviewOpen] = useState(false);

    return (
        <div className="alerts-container">
            {/* 1. Urgent Red Alert Accordion */}
            {urgentAlerts.length > 0 && (
                <div className="accordion-item acc-danger">
                    <div 
                        className="accordion-header" 
                        onClick={() => setUrgentOpen(!urgentOpen)}
                    >
                        <h3>
                            <span className="pulse-dot"></span> 
                            Urgent — {urgentAlerts.length} Alert{urgentAlerts.length !== 1 && 's'} Require Immediate Attention
                        </h3>
                        <span 
                            className="icon-chevron" 
                            style={{ transform: urgentOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </span>
                    </div>
                    
                    <div 
                        className="accordion-body" 
                        style={{ maxHeight: urgentOpen ? '1000px' : '0' }}
                    >
                        <div className="accordion-body-wrapper">
                            <div className="accordion-content">
                                {urgentAlerts.map(alert => (
                                    <div key={alert.id} className="alert-card">
                                        <div className="alert-details">
                                            <h4>{alert.patient_name}</h4>
                                            <p>{alert.message}</p>
                                            <span className="alert-meta">
                                                {alert.comments ? `"${alert.comments}"` : ''} 
                                                {alert.comments ? ' — ' : ''} 
                                                {formatTime(alert.log_date)}
                                            </span>
                                        </div>
                                        <button className="btn-review-alert" onClick={() => onReview(alert)}>Review Alert →</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Review Yellow Alert Accordion */}
            {reviewAlerts.length > 0 && (
                <div className="accordion-item acc-warning">
                    <div 
                        className="accordion-header" 
                        onClick={() => setReviewOpen(!reviewOpen)}
                    >
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            {reviewAlerts.length} Alert{reviewAlerts.length !== 1 && 's'} Need Review
                        </h3>
                        <span 
                            className="icon-chevron" 
                            style={{ transform: reviewOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </span>
                    </div>
                    
                    <div 
                        className="accordion-body" 
                        style={{ maxHeight: reviewOpen ? '1000px' : '0' }}
                    >
                        <div className="accordion-body-wrapper">
                            <div className="accordion-content">
                                {reviewAlerts.map(alert => (
                                    <div key={alert.id} className="alert-card">
                                        <div className="alert-details">
                                            <h4>{alert.patient_name}</h4>
                                            <p>{alert.message}</p>
                                        </div>
                                        <button className="btn-review-alert" onClick={() => onReview(alert)}>Review Alert →</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertSection;
