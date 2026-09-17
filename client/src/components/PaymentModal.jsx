import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Printer,
  Sparkles,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, formatDateDisplay } from '../utils/formatters.js';

export default function PaymentModal({
  customer,
  billData,
  config,
  onClose,
  onRecordPayment,
  currency = '₹'
}) {
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cash'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [paidReceipt, setPaidReceipt] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Card Simulator form state
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('821');
  const [cardName, setCardName] = useState(customer?.name || '');

  // Cash state
  const [collectorName, setCollectorName] = useState(config?.ownerName || 'Kitchen Staff');
  const [cashNote, setCashNote] = useState('Cash received during lunch delivery');

  const amount = billData?.billedAmount || 0;
  const upiId = config?.upiId || 'annapurna.tiffins@okhdfcbank';
  const businessName = config?.businessName || 'Annapurna Tiffins';

  // Generate UPI payment intent string & QR code
  const upiIntent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Tiffin-${customer?.name}-${billData?.monthName || 'Month'}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(upiIntent)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSimulateOnlinePayment = async (methodName, customTxn = null, notes = '') => {
    setIsProcessing(true);
    setProcessingStep('Connecting to secure payment gateway...');

    setTimeout(() => {
      setProcessingStep('Verifying 3D Secure authentication...');
    }, 700);

    setTimeout(async () => {
      setProcessingStep('Authorizing funds & issuing receipt...');

      try {
        const txnId = customTxn || `TXN_${Date.now().toString(36).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
        const updatedBill = await onRecordPayment(customer.id, 2026, 9, {
          status: 'paid',
          method: methodName,
          transactionId: txnId,
          amount: amount,
          notes: notes
        });

        setIsProcessing(false);
        setPaidReceipt({
          transactionId: txnId,
          method: methodName,
          amount: amount,
          receiptNumber: updatedBill.payment?.receiptNumber || `REC-202609-${customer.phone.slice(-4)}`,
          date: new Date().toLocaleString('en-IN')
        });

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (err) {
        setIsProcessing(false);
        alert('Payment processing failed. Please try again.');
      }
    }, 1500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg payment-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} style={{ color: 'var(--primary)' }} />
              Payment Collection & Settlement
            </h3>
            <p>
              Customer: <strong>{customer?.name}</strong> • Amount Due: <strong>{formatCurrency(amount, currency)}</strong>
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {paidReceipt ? (
            /* Success Receipt View */
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Payment Received Successfully!
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Account marked as SETTLED for {billData?.monthName}.
              </p>

              {/* Receipt Details Box */}
              <div style={{
                maxWidth: 440,
                margin: '0 auto',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receipt Number:</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{paidReceipt.receiptNumber}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transaction ID:</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', fontFamily: 'monospace' }}>{paidReceipt.transactionId}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment Method:</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{paidReceipt.method}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date & Time:</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{paidReceipt.date}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0 0' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Amount Paid:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>{formatCurrency(paidReceipt.amount, currency)}</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button className="btn-secondary" onClick={handlePrintReceipt}>
                  <Printer size={16} />
                  <span>Print Receipt</span>
                </button>
                <button className="btn-primary" onClick={onClose}>
                  <span>Done</span>
                </button>
              </div>
            </div>
          ) : isProcessing ? (
            /* Processing Animation */
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div style={{
                width: 50,
                height: 50,
                border: '3px solid rgba(255, 107, 0, 0.2)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1.5rem auto'
              }}></div>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Processing Payment of {formatCurrency(amount, currency)}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {processingStep}
              </p>
            </div>
          ) : (
            /* Payment Selection Tabs */
            <div>
              {/* Payment Method Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'upi' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: paymentMethod === 'upi' ? 'var(--primary-light)' : 'var(--bg-surface-elevated)',
                    color: paymentMethod === 'upi' ? 'var(--primary)' : 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                  id="tab-pay-upi"
                >
                  <QrCode size={22} />
                  <span>UPI Dynamic QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'card' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: paymentMethod === 'card' ? 'var(--primary-light)' : 'var(--bg-surface-elevated)',
                    color: paymentMethod === 'card' ? 'var(--primary)' : 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                  id="tab-pay-card"
                >
                  <CreditCard size={22} />
                  <span>Card / NetBanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'cash' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: paymentMethod === 'cash' ? 'var(--primary-light)' : 'var(--bg-surface-elevated)',
                    color: paymentMethod === 'cash' ? 'var(--primary)' : 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                  id="tab-pay-cash"
                >
                  <Banknote size={22} />
                  <span>Cash on Delivery</span>
                </button>
              </div>

              {/* METHOD 1: Dynamic UPI QR */}
              {paymentMethod === 'upi' && (
                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                  <div style={{
                    display: 'inline-block',
                    background: '#ffffff',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    marginBottom: '1rem'
                  }}>
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      style={{ width: 180, height: 180, display: 'block' }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginTop: '0.5rem' }}>
                      SCAN WITH ANY UPI APP (GPay / PhonePe / Paytm)
                    </span>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Exact Payable Amount: <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{formatCurrency(amount, currency)}</strong>
                    </p>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      marginTop: '0.5rem',
                      fontSize: '0.85rem'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>UPI ID:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{upiId}</strong>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        style={{ color: copiedUpi ? '#10B981' : 'var(--primary)', padding: '2px 4px' }}
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '0.7rem 1.5rem', margin: '0 auto', fontSize: '0.95rem' }}
                    onClick={() => handleSimulateOnlinePayment('UPI (Auto QR)')}
                    id="btn-confirm-upi"
                  >
                    <CheckCircle2 size={18} />
                    <span>I Have Paid — Verify & Settle Account</span>
                  </button>
                </div>
              )}

              {/* METHOD 2: Card / Net Banking Simulator */}
              {paymentMethod === 'card' && (
                <div style={{ maxWidth: 460, margin: '0 auto' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    color: 'white',
                    marginBottom: '1.25rem',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
                        Instant Card Checkout
                      </span>
                      <CreditCard size={22} style={{ color: 'var(--primary)' }} />
                    </div>

                    <div style={{ fontSize: '1.25rem', letterSpacing: '2px', fontFamily: 'monospace', marginBottom: '1rem' }}>
                      {cardNumber}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase' }}>Cardholder</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cardName || customer?.name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase' }}>Expires</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cardExpiry}</div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }}
                    onClick={() => handleSimulateOnlinePayment('Debit/Credit Card')}
                    id="btn-confirm-card"
                  >
                    <ShieldCheck size={18} />
                    <span>Pay {formatCurrency(amount, currency)} via Secured Card</span>
                  </button>
                </div>
              )}

              {/* METHOD 3: Cash on Delivery */}
              {paymentMethod === 'cash' && (
                <div style={{ maxWidth: 460, margin: '0 auto' }}>
                  <div className="form-group">
                    <label className="form-label">Cash Received By</label>
                    <input
                      type="text"
                      className="form-input"
                      value={collectorName}
                      onChange={(e) => setCollectorName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Receipt Note / Voucher</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cashNote}
                      onChange={(e) => setCashNote(e.target.value)}
                    />
                  </div>

                  <div style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cash Amount Handed Over:</span>
                    <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>{formatCurrency(amount, currency)}</strong>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }}
                    onClick={() => handleSimulateOnlinePayment('Cash on Delivery', null, `${cashNote} (Collected by ${collectorName})`)}
                    id="btn-confirm-cash"
                  >
                    <Banknote size={18} />
                    <span>Acknowledge Cash & Mark Paid</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
