import React, { useState } from 'react';
import { X, Settings, Check, Building2, Phone, IndianRupee, MapPin } from 'lucide-react';

export default function SettingsModal({ config, onClose, onSaveConfig }) {
  const [formData, setFormData] = useState({
    businessName: config?.businessName || '',
    ownerName: config?.ownerName || '',
    ownerPhone: config?.ownerPhone || '',
    currency: config?.currency || '₹',
    deliverySchedule: config?.deliverySchedule || '',
    address: config?.address || '',
    upiId: config?.upiId || ''
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveConfig(formData);
      onClose();
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>Tiffin Service Branding & Settings</h3>
            <p>Customize for any home tiffin center or cloud kitchen</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} id="settings-form">
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Tiffin Center / Brand Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Annapurna Homestyle Tiffins, Maa Ki Rasoi..."
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
                id="setting-biz-name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Owner / Chef Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Owner Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <select
                  className="form-select"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  id="setting-currency"
                >
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="$">$ (USD / CAD / AUD)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">UPI ID for Invoices</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. business@okhdfcbank"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kitchen Address</label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Standard Delivery Schedule Tagline</label>
              <input
                type="text"
                className="form-input"
                value={formData.deliverySchedule}
                onChange={(e) => setFormData({ ...formData, deliverySchedule: e.target.value })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              id="btn-save-settings"
            >
              <Check size={18} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
