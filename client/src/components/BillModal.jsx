import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  CreditCard,
  Lock,
  QrCode
} from 'lucide-react';
import { formatCurrency, formatDateDisplay, buildWhatsAppBillingMessage } from '../utils/formatters.js';

export default function BillModal({
  customer,
  config,
  onClose,
  onRecordPayment,
  onFetchBill,
  onOpenPaymentGateway,
  currency = '₹'
}) {
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(9);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  useEffect(() => {
    async function loadBill() {
      setLoading(true);
      try {
        const data = await onFetchBill(customer.id, selectedYear, selectedMonth);
        setBillData(data);
      } catch (err) {
        console.error('Failed to load bill:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBill();
  }, [customer.id, selectedYear, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  const handleTogglePayment = async () => {
    const isPaid = billData?.payment?.status === 'paid';
    const newStatus = isPaid ? 'pending' : 'paid';
    try {
      const updated = await onRecordPayment(customer.id, selectedYear, selectedMonth, {
        status: newStatus,
        method: isPaid ? null : paymentMethod
      });
      setBillData(updated);
    } catch (err) {
      alert('Failed to update payment status');
    }
  };

  const waUrl = billData ? buildWhatsAppBillingMessage({
    businessName: config?.businessName || 'Annapurna Tiffins',
    customerName: customer.name,
    customerPhone: customer.phone,
    monthName: billData.monthName,
    planName: billData.planName,
    monthlyPlanPrice: billData.monthlyPlanPrice,
    totalMonthWeekdays: billData.totalMonthWeekdays,
    deliveredDays: billData.deliveredWeekdaysCount,
    pausedDays: billData.pausedWeekdaysCount,
    pausedList: billData.pausedDaysList,
    billedAmount: billData.billedAmount,
    customerSavings: billData.customerSavings,
    currency,
    upiId: config?.upiId
  }) : '#';

  const isPaid = billData?.payment?.status === 'paid';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>Month-End Pro-Rated Bill</h3>
            <p>Accurate billing for days actually served</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isPaid && billData && (
              <button
                className="btn-primary"
                onClick={() => onOpenPaymentGateway(customer, billData)}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#10B981' }}
                id="btn-open-payment-modal"
              >
                <CreditCard size={15} />
                <span>Pay Online / Collect</span>
              </button>
            )}

            <button
              className="btn-secondary"
              onClick={handlePrint}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              title="Print or Save PDF"
              id="btn-print-bill"
            >
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ 
                padding: '0.4rem 0.75rem', 
                fontSize: '0.8rem', 
                color: '#10B981', 
                borderColor: 'rgba(16, 185, 129, 0.4)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                textDecoration: 'none'
              }}
              title="Send bill breakdown directly to customer via WhatsApp"
              id="btn-whatsapp-bill"
            >
              <Share2 size={15} />
              <span>Send WhatsApp</span>
            </a>

            <button className="btn-icon" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body / Invoice Sheet */}
        <div className="modal-body">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Calculating pro-rated bill...
            </div>
          ) : !billData ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Could not generate bill.
            </div>
          ) : (
            <div className="invoice-sheet" id="printable-invoice">
              {/* Invoice Header */}
              <div className="invoice-header">
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>
                    {config?.businessName || 'Annapurna Homestyle Tiffins'}
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    {config?.address || 'Fresh & Nutritious Lunch Delivered Every Weekday'}
                  </p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Owner: {config?.ownerName} • Contact: {config?.ownerPhone}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px' 
                  }}>
                    INVOICE CYCLE
                  </span>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                    {billData.monthName}
                  </h3>
                  <div style={{ marginTop: '0.35rem' }}>
                    {isPaid ? (
                      <span className="status-badge active">
                        <CheckCircle2 size={12} />
                        PAID ({billData.payment?.method || 'UPI'})
                      </span>
                    ) : (
                      <span className="status-badge paused">
                        <Clock size={12} />
                        PAYMENT PENDING
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified Transaction Banner if paid */}
              {isPaid && billData.payment?.transactionId && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.825rem'
                }}>
                  <div>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>✓ VERIFIED SETTLEMENT: </span>
                    <span style={{ color: 'var(--text-main)' }}>Receipt <strong>{billData.payment?.receiptNumber}</strong> • Txn ID: <code style={{ color: 'var(--primary)' }}>{billData.payment?.transactionId}</code></span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {billData.payment?.paidAt ? new Date(billData.payment.paidAt).toLocaleDateString() : ''}
                  </span>
                </div>
              )}

              {/* Customer Info Card */}
              <div className="invoice-bill-to">
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    BILLED TO
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {customer.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Phone size={13} style={{ color: 'var(--primary)' }} />
                    <strong>{customer.phone}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: 3 }} />
                    {customer.address}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    SUBSCRIPTION PLAN DETAILS
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {billData.planName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Standard Monthly Rate: <strong>{formatCurrency(billData.monthlyPlanPrice, currency)}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Delivery: Weekdays (Mon-Fri) • {customer.dietary || 'Veg'}
                  </div>
                </div>
              </div>

              {/* Math Breakdown Table */}
              <div className="math-breakdown-box">
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Pro-Rated Calculation Breakdown
                </h4>

                <div className="math-row">
                  <span>Total Scheduled Weekdays in {billData.monthName}</span>
                  <strong>{billData.totalMonthWeekdays} Days</strong>
                </div>

                <div className="math-row">
                  <span>Daily Pro-Rata Meal Rate ({formatCurrency(billData.monthlyPlanPrice, currency)} ÷ {billData.totalMonthWeekdays} days)</span>
                  <strong>{formatCurrency(billData.dailyRate, currency)} / meal</strong>
                </div>

                <div className="math-row" style={{ color: '#10B981' }}>
                  <span>Delivered Lunch Meals (Days actually served)</span>
                  <strong>{billData.deliveredWeekdaysCount} Days</strong>
                </div>

                <div className="math-row savings-row">
                  <span>Paused / Skipped Days (Zero charge)</span>
                  <span>- {billData.pausedWeekdaysCount} Days (Saved {formatCurrency(billData.customerSavings, currency)})</span>
                </div>

                <div className="math-row total-row">
                  <span>Total Payable Bill ({billData.deliveredWeekdaysCount} days × {formatCurrency(billData.dailyRate, currency)})</span>
                  <span style={{ color: 'var(--primary)' }}>
                    {formatCurrency(billData.billedAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Itemized Pauses Log */}
              {billData.pausedDaysList && billData.pausedDaysList.length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Itemized Paused Dates (Deducted from Bill)
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {billData.pausedDaysList.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--paused-dark)' }}>
                          {formatDateDisplay(p.date)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                  No days were paused this month. Full scheduled weekday delivery completed.
                </div>
              )}

              {/* UPI QR & Payment Info Card */}
              {config?.upiId && (
                <div style={{ 
                  marginTop: '1.25rem', 
                  padding: '0.85rem 1rem', 
                  background: 'var(--bg-surface-elevated)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <QrCode size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Instant UPI Payment (GPay / PhonePe / Paytm)
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        UPI ID: <strong style={{ color: 'var(--primary)' }}>{config.upiId}</strong>
                      </div>
                    </div>
                  </div>

                  {!isPaid && (
                    <button
                      className="btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => onOpenPaymentGateway(customer, billData)}
                    >
                      Scan QR & Settle
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Payment Settling Controls */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Payment Status:
            </span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.825rem' }}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={isPaid}
            >
              <option value="UPI">UPI (GPay/PhonePe)</option>
              <option value="Cash">Cash on Delivery</option>
              <option value="Debit/Credit Card">Card / NetBanking</option>
            </select>

            <button
              type="button"
              className={isPaid ? 'btn-secondary' : 'btn-primary'}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
              onClick={handleTogglePayment}
              id="btn-toggle-payment"
            >
              {isPaid ? 'Mark as Unpaid' : 'Mark as Received / Paid'}
            </button>
          </div>

          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
