import React, { useState } from 'react';
import { X, UserPlus, Utensils, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../utils/formatters.js';

export default function SubscribeModal({
  plans = [],
  onClose,
  onSubscribe,
  onSwitchToLogin,
  currency = '₹'
}) {
  const getTodayStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    planId: plans[0]?.id || '',
    dietary: 'Pure Veg',
    deliverySlot: '12:30 PM - 1:15 PM',
    notes: '',
    startDate: getTodayStr()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlan = plans.find(p => p.id === formData.planId) || plans[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubscribe({
        ...formData,
        planMonthlyPrice: selectedPlan?.monthlyPrice || 2800,
        planName: selectedPlan?.name || 'Classic Veg Thali'
      });

      // Confetti celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onClose();
    } catch (err) {
      alert(err.message || 'Failed to subscribe customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>Create Customer Account & Subscription</h3>
            <p>Register an account and activate your weekday homestyle lunch delivery</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit} id="subscribe-form">
          <div className="modal-body">
            {/* Quick Switch to Login */}
            {onSwitchToLogin && (
              <div className="account-switch-banner">
                <span>Already have an active subscription?</span>
                <button
                  type="button"
                  className="btn-link-highlight"
                  onClick={() => {
                    onClose();
                    onSwitchToLogin();
                  }}
                >
                  Log in to Customer Account &rarr;
                </button>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rohan Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  id="sub-name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Primary Lookup) *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9820198201"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  id="sub-phone"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Drop-off Delivery Address & Landmark *</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="e.g. Flat 301, Sunrise Heights, Mindspace IT Park"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                id="sub-address"
              />
            </div>

            {/* Plan Selector */}
            <div className="form-group">
              <label className="form-label">Choose Monthly Tiffin Plan *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {plans.map((p) => {
                  const isSelected = formData.planId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setFormData({ ...formData, planId: p.id, dietary: p.dietary || formData.dietary })}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface-elevated)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {p.name}
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                          {formatCurrency(p.monthlyPrice, currency)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.35 }}>
                        {p.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Dietary Preference</label>
                <select
                  className="form-select"
                  value={formData.dietary}
                  onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                  id="sub-diet"
                >
                  <option value="Pure Veg">Pure Veg (Standard)</option>
                  <option value="Jain">Jain Satvik (No onion, no garlic)</option>
                  <option value="Non-Veg">Non-Veg (Chicken/Egg days)</option>
                  <option value="Less Spicy">Less Spicy / Senior Friendly</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Lunch Time Slot</label>
                <select
                  className="form-select"
                  value={formData.deliverySlot}
                  onChange={(e) => setFormData({ ...formData, deliverySlot: e.target.value })}
                  id="sub-slot"
                >
                  <option value="12:15 PM - 12:45 PM">12:15 PM - 12:45 PM (Early)</option>
                  <option value="12:30 PM - 1:15 PM">12:30 PM - 1:15 PM (Standard)</option>
                  <option value="1:00 PM - 1:45 PM">1:00 PM - 1:45 PM (Late)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Subscription Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  id="sub-start-date"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Special Cooking / Packing Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Extra salad, less oil, ring twice"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  id="sub-notes"
                />
              </div>
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
              disabled={isSubmitting}
              id="btn-submit-subscriber"
            >
              <UserPlus size={18} />
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account & Activate Subscription'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
