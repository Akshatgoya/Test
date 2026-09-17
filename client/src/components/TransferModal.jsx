import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../utils/api';

export default function TransferModal({ isOpen, onClose, customer, onTransferSuccess }) {
  const [effectiveDate, setEffectiveDate] = useState('2026-09-15');
  const [targetName, setTargetName] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [dietary, setDietary] = useState('Pure Veg');
  const [deliverySlot, setDeliverySlot] = useState('12:30 PM');
  const [notes, setNotes] = useState('');

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && customer) {
      // Set initial defaults
      setEffectiveDate('2026-09-15');
      setTargetAddress(customer.address || '');
      setDietary(customer.dietary || 'Pure Veg');
      setDeliverySlot(customer.deliverySlot || '12:30 PM');
      loadPreview('2026-09-15');
    }
  }, [isOpen, customer]);

  const loadPreview = async (date) => {
    if (!customer || !date) return;
    try {
      setLoadingPreview(true);
      setError(null);
      const data = await api.getTransferPreview(customer.id, date);
      setPreview(data);
    } catch (err) {
      console.warn('Failed to load transfer preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setEffectiveDate(newDate);
    loadPreview(newDate);
  };

  const handlePreloadSampleRecipient = () => {
    setTargetName('Rohit Saraf');
    setTargetPhone('9833112244');
    setTargetAddress('Flat 903, Sky Crest, Palm Beach Road, Vashi');
    setNotes('Subscribed via mid-cycle corporate transfer.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetName.trim()) {
      setError('Please provide the new customer recipient name.');
      return;
    }
    if (!targetPhone.trim()) {
      setError('Please provide the new customer phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        effectiveDate,
        targetCustomerData: {
          name: targetName.trim(),
          phone: targetPhone.trim(),
          address: targetAddress.trim(),
          dietary,
          deliverySlot,
          notes: notes.trim() || `Transferred from ${customer.name} effective ${effectiveDate}`
        }
      };

      const result = await api.transferSubscription(customer.id, payload);
      if (onTransferSuccess) {
        onTransferSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to transfer subscription');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-extra-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-icon">🔄</span>
            <div>
              <h2>Mid-Cycle Subscription Transfer</h2>
              <p className="modal-subtitle">
                Level 2 Twist: Plan and monthly billing cycle carry over seamlessly; billing splits pro-rata by who was served.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div className="alert-banner alert-error">
                <span>{error}</span>
                <button type="button" className="alert-close" onClick={() => setError(null)}>&times;</button>
              </div>
            )}

            <div className="transfer-grid">
            {/* Left Column: Source & Recipient details */}
            <div className="transfer-form-col">
              {/* Source Subscriber Banner */}
              <div className="transfer-source-card">
                <div className="source-badge">ORIGINAL SUBSCRIBER</div>
                <h4>{customer.name}</h4>
                <div className="source-details">
                  <span>Phone: <strong>{customer.phone}</strong></span>
                  <span>Plan: <strong>{customer.planName}</strong> (₹{customer.planMonthlyPrice}/mo)</span>
                  <span>Cycle: <strong>{customer.startDate}</strong> to <strong>{customer.endDate || '2026-09-30'}</strong></span>
                </div>
              </div>

              <div className="form-group">
                <label>Transfer Effective Date (Mid-Cycle Cutover):</label>
                <input
                  type="date"
                  className="input-field"
                  value={effectiveDate}
                  onChange={handleDateChange}
                  required
                />
                <span className="field-hint">
                  {customer.name} will be served up to the day before. The new recipient takes over from this date.
                </span>
              </div>

              <div className="section-divider-title">
                <span>NEW RECIPIENT INFORMATION</span>
                <button
                  type="button"
                  className="btn-link-sm"
                  onClick={handlePreloadSampleRecipient}
                >
                  Fill Sample Recipient
                </button>
              </div>

              <div className="form-group">
                <label>New Customer Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Rohit Saraf"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Customer Phone Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="e.g. 9833112244"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Delivery Address</label>
                <textarea
                  className="input-field textarea-field"
                  rows="2"
                  placeholder="Street, Building, Flat / Office No."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dietary Preference</label>
                  <select
                    className="input-field"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                  >
                    <option value="Pure Veg">Pure Veg</option>
                    <option value="Jain">Jain Satvik</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Slot</label>
                  <select
                    className="input-field"
                    value={deliverySlot}
                    onChange={(e) => setDeliverySlot(e.target.value)}
                  >
                    <option value="12:30 PM">12:30 PM (Early Slot)</option>
                    <option value="12:45 PM">12:45 PM (Standard)</option>
                    <option value="1:00 PM">1:00 PM (Late Lunch)</option>
                    <option value="1:15 PM">1:15 PM (Corporate)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Live Pro-Rata Split Billing Preview */}
            <div className="transfer-preview-col">
              <div className="preview-header">
                <h3>⚡ Live Split-Billing Preview</h3>
                <span className="badge badge-accent">Calculated by Served Weekdays</span>
              </div>

              {loadingPreview ? (
                <div className="loading-box">Recalculating split bills...</div>
              ) : preview ? (
                <div className="split-preview-card">
                  <div className="split-metric-row">
                    <div className="split-side source-side">
                      <div className="side-tag">SOURCE: {customer.name}</div>
                      <div className="side-date-range">
                        {preview.source.startDate} &rarr; {preview.source.endDate}
                      </div>
                      <div className="side-stat">
                        <span className="side-stat-label">Served Weekdays:</span>
                        <span className="side-stat-val">{preview.source.deliveredWeekdays} Days</span>
                      </div>
                      <div className="side-stat">
                        <span className="side-stat-label">Daily Rate:</span>
                        <span className="side-stat-val">₹{preview.dailyRate}/day</span>
                      </div>
                      <div className="side-bill-total">
                        <span className="bill-label">Pro-Rated Share:</span>
                        <span className="bill-val">₹{preview.source.billedAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="split-divider">
                      <span>&rarr;</span>
                    </div>

                    <div className="split-side target-side">
                      <div className="side-tag">TARGET: {targetName || 'New Recipient'}</div>
                      <div className="side-date-range">
                        {preview.target.startDate} &rarr; {preview.target.endDate}
                      </div>
                      <div className="side-stat">
                        <span className="side-stat-label">Served Weekdays:</span>
                        <span className="side-stat-val">{preview.target.deliveredWeekdays} Days</span>
                      </div>
                      <div className="side-stat">
                        <span className="side-stat-label">Daily Rate:</span>
                        <span className="side-stat-val">₹{preview.dailyRate}/day</span>
                      </div>
                      <div className="side-bill-total">
                        <span className="bill-label">Pro-Rated Share:</span>
                        <span className="bill-val">₹{preview.target.billedAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Split Summary Footer */}
                  <div className="split-summary-footer">
                    <div className="summary-line">
                      <span>Total Month Weekdays:</span>
                      <strong>{preview.totalMonthWeekdays} Days ({preview.splitSummary.totalDeliveredWeekdays} Served)</strong>
                    </div>
                    <div className="summary-line highlight">
                      <span>Total Plan Conservation:</span>
                      <strong>₹{preview.splitSummary.totalBilledAmount.toLocaleString('en-IN')} / ₹{preview.monthlyPlanPrice.toLocaleString('en-IN')}</strong>
                    </div>
                    {preview.splitSummary.planPriceBalanced && (
                      <div className="conservation-pill">
                        ✅ Perfect Balance: Source + Target = Full Monthly Plan Price
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="preview-fallback">
                  Select a valid date to preview split pro-rations.
                </div>
              )}

              <div className="transfer-explanation">
                <h4>📜 Transfer Rules & Guarantees:</h4>
                <ul>
                  <li>The source subscriber's cycle terminates automatically on the day before the transfer.</li>
                  <li>The new recipient inherits the remainder of the monthly term with 0 setup fee.</li>
                  <li>Neither customer is charged for weekend days or days they were not subscribed.</li>
                </ul>
              </div>
            </div>
          </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !preview}>
              {submitting ? 'Executing Transfer...' : '🚀 Execute Subscription Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
