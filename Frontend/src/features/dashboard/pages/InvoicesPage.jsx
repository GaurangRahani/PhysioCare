import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Download, 
  Loader2, 
  ChevronDown, 
  X, 
  Receipt,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InvoiceStatusBadge = ({ status }) => {
  const map = {
    paid:      { label: 'Paid',      cls: 'bg-[#D9F7C3] text-[#245B19] border-[#b2e89b]' },
    cancelled: { label: 'Cancelled', cls: 'bg-[#F4F4F4] text-[#616161] border-[#EAEAEA]' },
    refunded:  { label: 'Refunded',  cls: 'bg-[#FCE4E4] text-[#B81818] border-[#F5C2C2]' },
  };
  const s = map[status] || { label: status, cls: 'bg-[#F4F4F4] text-[#616161] border-[#EAEAEA]' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium font-mono border ${s.cls}`}>
      {s.label}
    </span>
  );
};

const InvoicesPage = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date Range Filter ('all' | 'today' | '7days' | '30days' | 'custom')
  const [dateRangeType, setDateRangeType] = useState('all');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Status Filter ('all' | 'paid' | 'refunded' | 'cancelled')
  const [activeStatus, setActiveStatus] = useState('all');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // PDF Generation State
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Close date dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const res = await fetch(`${API}/api/payments/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch invoices');
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading billing history');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortArrow = (column) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={12} className="text-[#8A8A8A] opacity-60" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="text-[#111111] font-bold" />
      : <ArrowDown size={12} className="text-[#111111] font-bold" />;
  };

  // Filtered & Sorted Invoices
  const processedInvoices = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return invoices
      .filter((inv) => {
        // Status filter
        if (activeStatus !== 'all' && inv.status !== activeStatus) return false;

        // Date Range Filter
        const invDate = new Date(inv.created_at).toISOString().split('T')[0];
        if (dateRangeType === 'today') {
          if (invDate !== todayStr) return false;
        } else if (dateRangeType === '7days') {
          const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          if (invDate < pastDate) return false;
        } else if (dateRangeType === '30days') {
          const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          if (invDate < pastDate) return false;
        } else if (dateRangeType === 'custom') {
          if (appliedStartDate && invDate < appliedStartDate) return false;
          if (appliedEndDate && invDate > appliedEndDate) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const num = (inv.invoice_number || inv.id || '').toString().toLowerCase();
          const desc = (inv.description || '').toLowerCase();
          const amount = (inv.amount || '').toString();
          return num.includes(q) || desc.includes(q) || amount.includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortColumn] ?? '';
        let valB = b[sortColumn] ?? '';

        if (sortColumn === 'amount') {
          valA = Number(valA);
          valB = Number(valB);
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        if (sortColumn === 'created_at') {
          const timeA = new Date(valA).getTime();
          const timeB = new Date(valB).getTime();
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }

        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [invoices, activeStatus, dateRangeType, appliedStartDate, appliedEndDate, searchQuery, sortColumn, sortDirection]);

  // Metrics
  const metrics = useMemo(() => {
    const total = invoices.length;
    const paidList = invoices.filter(i => i.status === 'paid');
    const paidCount = paidList.length;
    const totalAmount = paidList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    return {
      total,
      paidCount,
      totalAmount
    };
  }, [invoices]);

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    return {
      all: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      refunded: invoices.filter(i => i.status === 'refunded').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length,
    };
  }, [invoices]);

  // Pagination Logic (Matching DoctorAppointments.jsx)
  const totalPages = Math.max(1, Math.ceil(processedInvoices.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = processedInvoices.slice(indexOfFirstItem, indexOfLastItem);

  // PDF Receipt Generator
  const handleDownloadInvoice = async (invoice) => {
    try {
      setDownloadingId(invoice.id);
      
      const doc = new jsPDF();
      const primaryColor = [0, 128, 96]; // #008060
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text("AlignCare", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text("Clinical Physical Therapy & Rehabilitation", 14, 29);
      doc.text("contact@aligncare.com | +91 9999999999", 14, 34);
      
      // Receipt Title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text("PAYMENT RECEIPT", 130, 24);
      
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(14, 40, 196, 40);
      
      // Patient Info
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Billed To:", 14, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(`Patient: ${user?.fullName || 'Valued Patient'}`, 14, 56);
      doc.text(`Email: ${user?.primaryEmailAddress?.emailAddress || 'N/A'}`, 14, 62);
      
      // Receipt Details
      doc.setFont('helvetica', 'bold');
      doc.text("Receipt Details:", 120, 50);
      doc.setFont('helvetica', 'normal');
      const invoiceNum = invoice.invoice_number || `INV-${invoice.id.toString().slice(0, 8).toUpperCase()}`;
      doc.text(`Receipt No: ${invoiceNum}`, 120, 56);
      doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 120, 62);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 120, 68);
      
      // Table
      autoTable(doc, {
        startY: 78,
        head: [['Description', 'Date', 'Amount']],
        body: [
          [
            invoice.description || 'Clinical Consultation Payment', 
            new Date(invoice.created_at).toLocaleDateString(), 
            `Rs. ${invoice.amount}`
          ]
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          2: { halign: 'right' }
        }
      });
      
      const finalY = doc.lastAutoTable.finalY || 105;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Total Paid:", 135, finalY + 12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Rs. ${invoice.amount}`, 170, finalY + 12);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Thank you for choosing AlignCare Clinical Suite.", 105, 280, { align: "center" });
      
      doc.save(`AlignCare_Receipt_${invoiceNum}.pdf`);
      showToast("Receipt downloaded successfully!");
    } catch (err) {
      console.error("PDF Generation Error: ", err);
      showToast("Could not generate PDF receipt.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const getDateRangeLabel = () => {
    switch (dateRangeType) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 days';
      case '30days': return 'Last 30 days';
      case 'custom':
        if (appliedStartDate && appliedEndDate) return `${appliedStartDate} to ${appliedEndDate}`;
        return 'Custom range';
      case 'all':
      default: return 'All Time';
    }
  };

  return (
    <div className="w-full max-w-full space-y-4 animate-fade-in font-['Inter',system-ui,sans-serif] pb-10">
      
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEAEA]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202223]">
            Billing & Invoices
          </h1>
          <p className="text-[12px] sm:text-[13px] text-[#616161] mt-0.5">
            View consultation payment history and download official tax receipts.
          </p>
        </div>

        <button 
          onClick={fetchInvoices}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#202223] bg-[#FFFFFF] border border-[#EAEAEA] hover:bg-[#F4F4F4] rounded-[8px] transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── 2. METRICS & DATE FILTER BAR (Matching Doctor Dashboard) ──────── */}
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[10px] p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        
        {/* Date Filter Dropdown */}
        <div className="relative shrink-0" ref={dateDropdownRef}>
          <button
            type="button"
            onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            className="w-full md:w-auto flex items-center justify-between gap-2.5 px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] hover:border-[#CCCCCC] rounded-[8px] text-[12px] font-medium text-[#202223] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon size={14} className="text-[#8A8A8A]" />
              <span>{getDateRangeLabel()}</span>
            </div>
            <ChevronDown size={14} className={`text-[#8A8A8A] transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDateDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-[260px] bg-[#FFFFFF] border border-[#EAEAEA] rounded-[10px] shadow-xl p-2 z-40 animate-fade-in text-[12px]">
              <div className="flex flex-col gap-0.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: 'Last 7 days' },
                  { id: '30days', label: 'Last 30 days' },
                  { id: 'custom', label: 'Custom Range...' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDateRangeType(item.id);
                      if (item.id !== 'custom') {
                        setIsDateDropdownOpen(false);
                        setCurrentPage(1);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                      dateRangeType === item.id 
                        ? 'bg-[#F4F4F4] font-semibold text-[#202223]' 
                        : 'text-[#616161] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {dateRangeType === 'custom' && (
                <div className="mt-2 pt-2 border-t border-[#F0F0F0] space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-[#8A8A8A] uppercase">Start Date</span>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={e => setTempStartDate(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-[#202223] text-[11px] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-[#8A8A8A] uppercase">End Date</span>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={e => setTempEndDate(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-[#202223] text-[11px] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (tempStartDate && tempEndDate) {
                        setAppliedStartDate(tempStartDate);
                        setAppliedEndDate(tempEndDate);
                        setIsDateDropdownOpen(false);
                        setCurrentPage(1);
                      }
                    }}
                    disabled={!tempStartDate || !tempEndDate}
                    className="w-full py-1.5 bg-[#000000] text-[#FFFFFF] rounded-[6px] text-[11px] font-medium hover:bg-[#202020] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Apply Range
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metrics Grid across the Bar (Matching Doctor side) */}
        <div className="flex-1 grid grid-cols-3 divide-x divide-[#EAEAEA] text-[12px]">
          <div className="flex flex-col pl-2 sm:pl-4">
            <span className="text-[#8A8A8A] text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">Total Invoices</span>
            <span className="text-[16px] sm:text-[18px] font-bold text-[#202223] font-mono mt-0.5">
              {metrics.total}
            </span>
            <div className="w-12 sm:w-16 h-0.5 bg-[#4088F8] mt-1.5 rounded-full" />
          </div>

          <div className="flex flex-col pl-2 sm:pl-4">
            <span className="text-[#8A8A8A] text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">Paid Receipts</span>
            <span className="text-[16px] sm:text-[18px] font-bold text-[#008060] font-mono mt-0.5">
              {metrics.paidCount}
            </span>
            <div className="w-12 sm:w-16 h-0.5 bg-[#A3F56C] mt-1.5 rounded-full" />
          </div>

          <div className="flex flex-col pl-2 sm:pl-4">
            <span className="text-[#8A8A8A] text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">Total Paid</span>
            <span className="text-[16px] sm:text-[18px] font-bold text-[#202223] font-mono mt-0.5">
              ₹{metrics.totalAmount}
            </span>
            <div className="w-12 sm:w-16 h-0.5 bg-[#F5C451] mt-1.5 rounded-full" />
          </div>
        </div>

      </div>

      {/* ── 3. SINGLE-LINE TABLE TOOLBAR (Matching Doctor Side) ─────────────── */}
      <div className="px-3 sm:px-4 py-2 border border-[#EAEAEA] rounded-[10px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#FFFFFF] shadow-xs">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-[12px]">
          {[
            { id: 'all', label: 'All', count: statusCounts.all },
            { id: 'paid', label: 'Paid', count: statusCounts.paid },
            { id: 'refunded', label: 'Refunded', count: statusCounts.refunded },
            { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveStatus(tab.id); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeStatus === tab.id
                  ? 'bg-[#202223] text-[#FFFFFF]'
                  : 'bg-[#F4F4F4] text-[#616161] hover:bg-[#EAEAEA]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeStatus === tab.id ? 'bg-[#3A3A3A] text-[#FFFFFF]' : 'bg-[#EAEAEA] text-[#616161]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-[260px] shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search invoices or receipts..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] text-[#202223] placeholder-[#8A8A8A] outline-none focus:border-[#202223] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#202223] p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

      </div>

      {/* ── 4. INVOICES TABLE (Desktop) & CARDS (Mobile) ─────────────────────── */}
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[10px] overflow-hidden shadow-xs">
        
        {loading ? (
          <div className="p-16 text-center text-[#8A8A8A]">
            <Loader2 size={24} className="animate-spin text-[#202223] mx-auto mb-2" />
            <span className="text-[13px]">Loading billing records...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-[#B42318] bg-[#FCE4E4]">
            {error}
          </div>
        ) : currentInvoices.length === 0 ? (
          <div className="p-16 text-center text-[#8A8A8A]">
            <Receipt size={28} className="mx-auto mb-2 text-[#CCCCCC]" />
            <span className="text-[14px] font-medium text-[#202223] block">No billing records found</span>
            <span className="text-[12px] text-[#616161] mt-0.5 block">
              {searchQuery ? `No invoices matching "${searchQuery}"` : 'No transactions recorded for the selected filter.'}
            </span>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (>= md: 768px) */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse bg-[#FFFFFF]">
                <thead>
                  <tr className="border-b border-[#EAEAEA] bg-[#FBFBFB] text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider select-none">
                    <th 
                      className="py-3 px-4 w-[20%] cursor-pointer hover:text-[#202223] transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        {renderSortArrow('created_at')}
                      </div>
                    </th>

                    <th 
                      className="py-3 px-4 w-[22%] cursor-pointer hover:text-[#202223] transition-colors"
                      onClick={() => handleSort('invoice_number')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Receipt / Invoice #</span>
                        {renderSortArrow('invoice_number')}
                      </div>
                    </th>

                    <th 
                      className="py-3 px-4 w-[28%] cursor-pointer hover:text-[#202223] transition-colors"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Description</span>
                        {renderSortArrow('description')}
                      </div>
                    </th>

                    <th 
                      className="py-3 px-4 w-[12%] cursor-pointer hover:text-[#202223] transition-colors"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Amount</span>
                        {renderSortArrow('amount')}
                      </div>
                    </th>

                    <th 
                      className="py-3 px-4 w-[10%] cursor-pointer hover:text-[#202223] transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {renderSortArrow('status')}
                      </div>
                    </th>

                    <th className="py-3 px-4 w-[8%] text-right">
                      Receipt
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0F0F0] bg-[#FFFFFF]">
                  {currentInvoices.map((inv) => {
                    const invoiceNum = inv.invoice_number || `INV-${inv.id.toString().slice(0, 8).toUpperCase()}`;
                    const invDate = new Date(inv.created_at);

                    return (
                      <tr key={inv.id} className="hover:bg-[#F9F9F9] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="text-[#202223] font-medium">
                              {invDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[11px] font-mono text-[#8A8A8A]">
                              {invDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-[#202223]">
                          {invoiceNum}
                        </td>

                        <td className="py-3.5 px-4 text-[#616161] max-w-[220px] truncate">
                          {inv.description || 'Clinical Consultation Payment'}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-[#202223]">
                          ₹{inv.amount}
                        </td>

                        <td className="py-3.5 px-4">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(inv)}
                            disabled={downloadingId === inv.id || inv.status !== 'paid'}
                            title="Download PDF Receipt"
                            className="p-1.5 rounded-[6px] border border-[#EAEAEA] bg-[#FFFFFF] hover:bg-[#F4F4F4] text-[#202223] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 size={13} className="animate-spin text-[#202223]" />
                            ) : (
                              <Download size={13} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards (< md: 768px) */}
            <div className="block md:hidden divide-y divide-[#EAEAEA]">
              {currentInvoices.map((inv) => {
                const invoiceNum = inv.invoice_number || `INV-${inv.id.toString().slice(0, 8).toUpperCase()}`;
                const invDate = new Date(inv.created_at);

                return (
                  <div key={inv.id} className="p-3.5 space-y-2 hover:bg-[#FBFBFB] transition-colors">
                    {/* Top Row: Date & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-[#202223]">
                        {invDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>

                    {/* Middle: Invoice Num & Description */}
                    <div>
                      <div className="font-mono text-[12px] font-medium text-[#202223]">
                        {invoiceNum}
                      </div>
                      <div className="text-[12px] text-[#616161] mt-0.5 truncate">
                        {inv.description || 'Clinical Consultation Payment'}
                      </div>
                    </div>

                    {/* Bottom Row: Amount & PDF Download */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#F5F5F5]">
                      <span className="text-[13px] font-bold text-[#202223] font-mono">
                        ₹{inv.amount}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(inv)}
                        disabled={downloadingId === inv.id || inv.status !== 'paid'}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#202223] bg-[#FFFFFF] border border-[#EAEAEA] hover:bg-[#F4F4F4] rounded-[6px] transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {downloadingId === inv.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Download size={12} />
                        )}
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── 5. PROPER PAGINATION (Matching DoctorAppointments.jsx) ──────── */}
            <div className="px-4 sm:px-6 py-3 bg-[#FFFFFF] border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#616161]">
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <div className="flex items-center gap-2">
                  <span>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2 py-1 bg-[#FFFFFF] border border-[#E5E5E5] rounded-md text-[#202223] font-medium outline-none cursor-pointer hover:border-[#D0D0D0]"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                  </select>
                </div>
                <span className="text-[#8A8A8A] ml-2">
                  Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, processedInvoices.length)} of {processedInvoices.length} invoices
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                  className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] text-[13px] font-medium shadow-xl border animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-[#FFFFFF] border-[#D9F7C3] text-[#245B19]' 
            : 'bg-[#FFFFFF] border-[#FCE4E4] text-[#B81818]'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <Receipt size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
};

export default InvoicesPage;

