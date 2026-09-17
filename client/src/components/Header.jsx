import React from 'react';
import { Search, X, Plus, Settings, Utensils, Moon, Sun, Clock, UploadCloud, LogIn } from 'lucide-react';

export default function Header({
  config,
  searchQuery,
  setSearchQuery,
  onOpenSubscribe,
  onOpenSettings,
  onOpenClock,
  onOpenImport,
  onOpenLogin,
  theme,
  onToggleTheme
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <Utensils size={24} />
          </div>
          <div className="brand-text">
            <h1>{config?.businessName || 'TiffinFlow'}</h1>
            <p>Home-Style Lunch Delivery & Pro-Rated Billing</p>
          </div>
        </div>

        {/* Global Phone / Name Search */}
        <div className="header-search">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Lookup by phone (e.g. 98201) or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="phone-lookup-input"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="header-actions">
          {/* Level 1 Twist: Clock & Outbox */}
          <button
            className="btn-header-twist btn-twist-clock"
            onClick={onOpenClock}
            title="System Clock & Morning Notification Outbox (Level 1 Twist)"
            id="btn-clock-outbox"
          >
            <Clock size={16} />
            <span>Clock & Outbox</span>
          </button>

          {/* Level 3 Twist: Import Messy Data */}
          <button
            className="btn-header-twist btn-twist-import"
            onClick={onOpenImport}
            title="Import Messy Customer List (Level 3 Twist)"
            id="btn-import-data"
          >
            <UploadCloud size={16} />
            <span>Import Data</span>
          </button>

          {/* Theme Toggle */}
          <button
            className="btn-icon"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            id="btn-toggle-theme"
          >
            {theme === 'dark' ? <Sun size={18} style={{ color: '#FBBF24' }} /> : <Moon size={18} />}
          </button>

          {/* Customer Account Login / Portal */}
          <button
            className="btn-header-login"
            onClick={onOpenLogin}
            title="Log in to your customer account (phone lookup portal)"
            id="btn-customer-login"
          >
            <LogIn size={16} style={{ color: '#818CF8' }} />
            <span>Customer Login</span>
          </button>

          <button
            className="btn-primary"
            onClick={onOpenSubscribe}
            id="btn-add-customer"
            title="Create customer account and subscribe to monthly tiffin plan"
          >
            <Plus size={18} />
            <span>Create Account</span>
          </button>

          <button
            className="btn-icon"
            onClick={onOpenSettings}
            title="Kitchen & Billing Settings"
            id="btn-settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

