import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  IndianRupee, 
  Phone,
  PiggyBank
} from 'lucide-react';
import { formatCurrency, formatMonthYear, buildWhatsAppBillingMessage } from '../utils/formatters.js';

export default function BillingLedger({
  config,
  onFetchMonthEndSummary,
  onOpenBill,
  currency = '₹'
}) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await onFetchMonthEndSummary(selectedYear, selectedMonth);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load month-end billing summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [selectedYear, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div className="action-bar" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--neutral-900)' }}>
            Month-End Pro-Rated Billing Ledger
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} style={{ color: 'var(--neutral-500)' }} />
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              id="billing-month-select"
            >
              <option value={8}>August 2026</option>
              <option value={9}>September 2026</option>
              <option value={10}>October 2026</option>
            </select>
          </div>
        </div>

        <button
          className="btn-secondary"
          onClick={handlePrint}
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          id="btn-print-ledger"
        >
          <Printer size={16} />
          <span>Print Billing Ledger</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
          Calculating month-end pro-rated accounts...
        </div>
      ) : !summaryData ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
          Could not load billing ledger.
        </div>
      ) : (
        <div>
          {/* Revenue KPI Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>
                TOTAL PRO-RATED BILLED
              </span>
              <h2 style={{ fontSize: '1.75rem', color: '#1E40AF', marginTop: '2px' }}>
                {formatCurrency(summaryData.totalActualProRatedBilled, currency)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#1D4ED8' }}>
                For {summaryData.totalDeliveredDays} delivered meals
              </span>
            </div>

            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FFEDD5',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>
                TOTAL CUSTOMER SAVINGS
              </span>
              <h2 style={{ fontSize: '1.75rem', color: '#9A3412', marginTop: '2px' }}>
                {formatCurrency(summaryData.totalCustomerSavings, currency)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#C2410C' }}>
                {summaryData.totalPausedDays} paused days deducted fairly
              </span>
            </div>

            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                PAYMENTS COLLECTED
              </span>
              <h2 style={{ fontSize: '1.75rem', color: '#065F46', marginTop: '2px' }}>
                {formatCurrency(summaryData.totalCollected, currency)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                Pending: {formatCurrency(summaryData.pendingCollection, currency)}
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subscriber</th>
                    <th>Phone Lookup</th>
                    <th>Plan Rate</th>
                    <th>Month Days</th>
                    <th>Delivered Days</th>
                    <th>Paused Days</th>
                    <th>Pro-Rated Bill</th>
                    <th>Saved</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.customerBills.map((b) => {
                    const isPaid = b.payment?.status === 'paid';
                    const waUrl = buildWhatsAppBillingMessage({
                      businessName: config?.businessName || 'Annapurna Tiffins',
                      customerName: b.customerName,
                      customerPhone: b.customerPhone,
                      monthName: b.monthName,
                      planName: b.planName,
                      monthlyPlanPrice: b.monthlyPlanPrice,
                      totalMonthWeekdays: b.totalMonthWeekdays,
                      deliveredDays: b.deliveredWeekdaysCount,
                      pausedDays: b.pausedWeekdaysCount,
                      pausedList: b.pausedDaysList,
                      billedAmount: b.billedAmount,
                      customerSavings: b.customerSavings,
                      currency,
                      upiId: config?.upiId
                    });

                    return (
                      <tr key={b.customerId} id={`ledger-row-${b.customerId}`}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
                            {b.customerName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                            {b.planName}
                          </div>
                        </td>

                        <td>
                          <a
                            href={`tel:${b.customerPhone}`}
                            style={{ textDecoration: 'none', color: 'var(--neutral-800)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Phone size={12} style={{ color: 'var(--primary)' }} />
                            <span>{b.customerPhone}</span>
                          </a>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--neutral-700)' }}>
                            {formatCurrency(b.monthlyPlanPrice, currency)}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.85rem' }}>{b.totalMonthWeekdays} days</span>
                        </td>

                        <td>
                          <span style={{ fontWeight: 700, color: '#047857', fontSize: '0.85rem' }}>
                            {b.deliveredWeekdaysCount} days
                          </span>
                        </td>

                        <td>
                          <span style={{ color: b.pausedWeekdaysCount > 0 ? 'var(--paused-dark)' : 'var(--neutral-400)', fontWeight: b.pausedWeekdaysCount > 0 ? 700 : 400, fontSize: '0.85rem' }}>
                            {b.pausedWeekdaysCount} days
                          </span>
                        </td>

                        <td>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>
                            {formatCurrency(b.billedAmount, currency)}
                          </strong>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: 600 }}>
                            {formatCurrency(b.customerSavings, currency)}
                          </span>
                        </td>

                        <td>
                          {isPaid ? (
                            <span className="status-badge active" style={{ fontSize: '0.7rem' }}>
                              PAID
                            </span>
                          ) : (
                            <span className="status-badge paused" style={{ fontSize: '0.7rem' }}>
                              PENDING
                            </span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon"
                              style={{ width: '30px', height: '30px', color: '#047857' }}
                              title="Send WhatsApp Bill"
                            >
                              <Share2 size={13} />
                            </a>

                            <button
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              onClick={() => onOpenBill({ id: b.customerId, name: b.customerName, phone: b.customerPhone, planName: b.planName })}
                              title="Open Detailed Invoice"
                            >
                              Invoice
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
