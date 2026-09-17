import React, { useState } from 'react';
import { LogIn, User, Phone, MapPin, CheckCircle2, PauseCircle, Receipt, CalendarDays, X, LogOut, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function LoginModal({
  isOpen,
  onClose,
  customers = [],
  onOpenCreateAccount,
  onOpenPause,
  onOpenBill,
  onOpenCalendar,
  currency = '₹'
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loggedInCustomer, setLoggedInCustomer] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone) {
      setErrorMessage('Please enter your 10-digit registered phone number.');
      return;
    }

    const found = customers.find(c => {
      const custPhoneClean = (c.phone || '').replace(/\D/g, '');
      return custPhoneClean === cleanPhone || custPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(custPhoneClean);
    });

    if (found) {
      setLoggedInCustomer(found);
      setErrorMessage('');
    } else {
      setErrorMessage(`No active subscription found for phone "${phoneNumber}". Please check the number or create a new account.`);
    }
  };

  const handleQuickDemoLogin = (cust) => {
    setPhoneNumber(cust.phone);
    setLoggedInCustomer(cust);
    setErrorMessage('');
  };

  const handleLogout = () => {
    setLoggedInCustomer(null);
    setPhoneNumber('');
    setErrorMessage('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-login-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-icon">🔐</span>
            <div>
              <h2>{loggedInCustomer ? 'Customer Account Portal' : 'Customer Account Login'}</h2>
              <p className="modal-subtitle">
                {loggedInCustomer 
                  ? `Logged in as ${loggedInCustomer.name} (${loggedInCustomer.phone})`
                  : 'Access your daily meal schedule, pause deliveries, and view invoices'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loggedInCustomer ? (
            /* Logged-In Customer Portal View */
            <div className="customer-portal-view">
              <div className="portal-user-hero">
                <div className="user-avatar-lg">
                  <User size={32} />
                </div>
                <div className="user-hero-details">
                  <h3>{loggedInCustomer.name}</h3>
                  <div className="hero-tags">
                    <span className="badge badge-success">Active Subscriber</span>
                    <span className="badge badge-accent">{loggedInCustomer.planName}</span>
                    <span className="diet-pill">{loggedInCustomer.dietary || 'Pure Veg'}</span>
                  </div>
                </div>
                <button className="btn btn-sm btn-outline btn-logout" onClick={handleLogout} title="Log out of account">
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>

              {/* Delivery & Plan Details Card */}
              <div className="portal-info-grid">
                <div className="portal-card-item">
                  <span className="card-item-label">PHONE LOOKUP NUMBER</span>
                  <div className="card-item-val">
                    <Phone size={14} />
                    <span>{loggedInCustomer.phone}</span>
                  </div>
                </div>

                <div className="portal-card-item">
                  <span className="card-item-label">DELIVERY TIME SLOT</span>
                  <div className="card-item-val">
                    <span>⏰ {loggedInCustomer.deliverySlot || '12:30 PM'}</span>
                  </div>
                </div>

                <div className="portal-card-item col-span-2">
                  <span className="card-item-label">DROP-OFF ADDRESS</span>
                  <div className="card-item-val">
                    <MapPin size={14} />
                    <span>{loggedInCustomer.address}</span>
                  </div>
                </div>

                <div className="portal-card-item col-span-2">
                  <span className="card-item-label">TODAY'S DELIVERY STATUS</span>
                  <div className="card-item-status">
                    {loggedInCustomer.todayStatus?.status === 'active' ? (
                      <div className="status-pill status-active">
                        <CheckCircle2 size={16} />
                        <span>Scheduled for Today's Lunch Delivery ({loggedInCustomer.todayStatus?.date})</span>
                      </div>
                    ) : loggedInCustomer.todayStatus?.status === 'paused' ? (
                      <div className="status-pill status-paused">
                        <PauseCircle size={16} />
                        <span>Deliveries Paused Today ({loggedInCustomer.todayStatus?.reason || 'On Hold'})</span>
                      </div>
                    ) : (
                      <div className="status-pill status-weekend">
                        <span>Weekend / Non-delivery day</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="portal-actions-title">
                <span>MANAGE YOUR MEALS & INVOICES</span>
              </div>
              <div className="portal-action-buttons">
                <button
                  className="btn-portal-action"
                  onClick={() => {
                    onClose();
                    if (onOpenPause) onOpenPause(loggedInCustomer);
                  }}
                >
                  <PauseCircle size={18} style={{ color: 'var(--paused-orange)' }} />
                  <div>
                    <strong>Pause / Resume Deliveries</strong>
                    <small>Going on vacation? Pause days to save money</small>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </button>

                <button
                  className="btn-portal-action"
                  onClick={() => {
                    onClose();
                    if (onOpenBill) onOpenBill(loggedInCustomer);
                  }}
                >
                  <Receipt size={18} style={{ color: '#818CF8' }} />
                  <div>
                    <strong>View Pro-Rated Bill & Invoice</strong>
                    <small>Transparent daily calculations & UPI payment</small>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </button>

                <button
                  className="btn-portal-action"
                  onClick={() => {
                    onClose();
                    if (onOpenCalendar) onOpenCalendar(loggedInCustomer);
                  }}
                >
                  <CalendarDays size={18} style={{ color: '#34D399' }} />
                  <div>
                    <strong>Interactive Meal Calendar</strong>
                    <small>Day-by-day packing & delivery schedule</small>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="login-form-container">
              {errorMessage && (
                <div className="alert-banner alert-error">
                  <span>{errorMessage}</span>
                  <button className="alert-close" onClick={() => setErrorMessage('')}>&times;</button>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Enter Registered Phone Number *</label>
                  <div className="login-phone-wrapper">
                    <span className="phone-prefix">+91</span>
                    <input
                      type="tel"
                      className="form-input login-phone-input"
                      placeholder="e.g. 9820198201"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <span className="field-hint">
                    No password required! Simply enter the phone number you used during subscription.
                  </span>
                </div>

                <button type="submit" className="btn btn-primary btn-login-submit">
                  <LogIn size={18} />
                  <span>Sign In to Account</span>
                </button>
              </form>

              {/* Quick Demo Logins */}
              {customers.length > 0 && (
                <div className="demo-accounts-box">
                  <span className="demo-box-title">Quick Demo Logins (Click to Sign In):</span>
                  <div className="demo-login-pills">
                    {customers.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="demo-pill"
                        onClick={() => handleQuickDemoLogin(c)}
                      >
                        <span className="demo-pill-name">{c.name}</span>
                        <span className="demo-pill-phone">({c.phone})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* New User Callout */}
              <div className="new-account-callout">
                <div className="new-acc-text">
                  <strong>New to our homestyle tiffin service?</strong>
                  <p>Create an account and choose your customized weekday lunch plan in 60 seconds.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    onClose();
                    if (onOpenCreateAccount) onOpenCreateAccount();
                  }}
                >
                  Create Account &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
