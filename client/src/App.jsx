import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import StatsOverview from './components/StatsOverview.jsx';
import CustomerList from './components/CustomerList.jsx';
import DispatchSheet from './components/DispatchSheet.jsx';
import BillingLedger from './components/BillingLedger.jsx';
import SubscribeModal from './components/SubscribeModal.jsx';
import PauseModal from './components/PauseModal.jsx';
import BillModal from './components/BillModal.jsx';
import CalendarView from './components/CalendarView.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import PaymentModal from './components/PaymentModal.jsx';
import ClockOutboxModal from './components/ClockOutboxModal.jsx';
import TransferModal from './components/TransferModal.jsx';
import ImportModal from './components/ImportModal.jsx';
import LoginModal from './components/LoginModal.jsx';
import { api } from './utils/api.js';
import { Users, Utensils, Receipt, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState(null);
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [monthSummary, setMonthSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'dispatch' | 'billing'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'paused'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Theme: Black / Dark background by default
  const [theme, setTheme] = useState('dark');

  // Modals state
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pauseModalCustomer, setPauseModalCustomer] = useState(null);
  const [billModalCustomer, setBillModalCustomer] = useState(null);
  const [calendarModalCustomer, setCalendarModalCustomer] = useState(null);
  const [paymentModalData, setPaymentModalData] = useState(null); // { customer, billData }

  // New Twist Modals & Account Auth
  const [clockModalOpen, setClockModalOpen] = useState(false);
  const [transferModalCustomer, setTransferModalCustomer] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [cfg, pls, custs, summary] = await Promise.all([
        api.getConfig(),
        api.getPlans(),
        api.getCustomers(),
        api.getMonthEndSummary(2026, 9)
      ]);
      setConfig(cfg);
      setPlans(pls);
      setCustomers(custs);
      setMonthSummary(summary);
    } catch (err) {
      console.error('Error loading initial tiffin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtered customer list by search query and status filter
  const fetchFilteredCustomers = async () => {
    try {
      const data = await api.getCustomers({
        search: searchQuery,
        status: statusFilter
      });
      setCustomers(data);
    } catch (err) {
      console.error('Error searching customers:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredCustomers();
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  // Handler: Add new subscriber
  const handleSubscribe = async (formData) => {
    const newCust = await api.createCustomer(formData);
    showToast(`🎉 Activated monthly plan for ${newCust.name}!`);
    await loadInitialData();
  };

  // Handler: Add pause
  const handleAddPause = async (customerId, pauseData) => {
    const updatedCust = await api.addPause(customerId, pauseData);
    showToast(`⏸️ Delivery pause saved. Deductions applied to bill!`);
    await loadInitialData();
    return updatedCust;
  };

  // Handler: Resume early (cancel pause)
  const handleResumePause = async (customerId, pauseId) => {
    const updatedCust = await api.removePause(customerId, pauseId);
    showToast(`▶️ Resumed deliveries! Pause schedule updated.`);
    await loadInitialData();
    if (pauseModalCustomer?.id === customerId) {
      setPauseModalCustomer(updatedCust);
    }
    return updatedCust;
  };

  // Handler: Payment recording
  const handleRecordPayment = async (customerId, year, month, paymentData) => {
    const updated = await api.recordPayment(customerId, year, month, paymentData);
    showToast(`💳 Payment recorded and account marked as Settled!`);
    await loadInitialData();
    return updated;
  };

  // Handler: Open payment gateway
  const handleOpenPaymentGateway = (customer, billData) => {
    setPaymentModalData({ customer, billData });
  };

  // Handler: Delete customer
  const handleDeleteCustomer = async (cust) => {
    if (!window.confirm(`Are you sure you want to cancel subscription for ${cust.name}?`)) return;
    await api.deleteCustomer(cust.id);
    showToast(`Subscription cancelled for ${cust.name}`);
    await loadInitialData();
  };

  // Handler: Update Settings
  const handleSaveConfig = async (newConfig) => {
    const updated = await api.updateConfig(newConfig);
    setConfig(updated);
    showToast(`Kitchen settings saved successfully`);
  };

  // KPI Calculations
  const activeTodayCount = customers.filter(c => c.todayStatus?.status === 'active').length;
  const pausedTodayCount = customers.filter(c => c.todayStatus?.status === 'paused').length;

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        config={config}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSubscribe={() => setSubscribeModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenClock={() => setClockModalOpen(true)}
        onOpenImport={() => setImportModalOpen(true)}
        onOpenLogin={() => setLoginModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="main-content">
        {/* Top KPIs */}
        <StatsOverview
          activeTodayCount={activeTodayCount}
          pausedTodayCount={pausedTodayCount}
          totalSubscribers={customers.length}
          monthSummary={monthSummary}
          currency={config?.currency || '₹'}
        />

        {/* Tab Navigation */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
            id="tab-customers"
          >
            <Users size={18} />
            <span>Subscribers & Phone Lookup</span>
            <span className="tab-badge">{customers.length}</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'dispatch' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispatch')}
            id="tab-dispatch"
          >
            <Utensils size={18} />
            <span>Today's Kitchen Dispatch</span>
            <span className="tab-badge">{activeTodayCount} to pack</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
            id="tab-billing"
          >
            <Receipt size={18} />
            <span>Month-End Billing Ledger</span>
          </button>
        </div>

        {/* Active Tab Views */}
        {activeTab === 'customers' && (
          <CustomerList
            customers={customers}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onOpenPause={(cust) => setPauseModalCustomer(cust)}
            onOpenBill={(cust) => setBillModalCustomer(cust)}
            onOpenCalendar={(cust) => setCalendarModalCustomer(cust)}
            onOpenTransfer={(cust) => setTransferModalCustomer(cust)}
            onDeleteCustomer={handleDeleteCustomer}
            currency={config?.currency || '₹'}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'dispatch' && (
          <DispatchSheet
            onFetchDispatch={api.getDispatchSheet}
            currency={config?.currency || '₹'}
          />
        )}

        {activeTab === 'billing' && (
          <BillingLedger
            config={config}
            onFetchMonthEndSummary={api.getMonthEndSummary}
            onOpenBill={(cust) => setBillModalCustomer(cust)}
            currency={config?.currency || '₹'}
          />
        )}
      </main>

      {/* Modals */}
      {subscribeModalOpen && (
        <SubscribeModal
          plans={plans}
          onClose={() => setSubscribeModalOpen(false)}
          onSubscribe={handleSubscribe}
          onSwitchToLogin={() => {
            setSubscribeModalOpen(false);
            setLoginModalOpen(true);
          }}
          currency={config?.currency || '₹'}
        />
      )}

      {pauseModalCustomer && (
        <PauseModal
          customer={pauseModalCustomer}
          onClose={() => setPauseModalCustomer(null)}
          onAddPause={handleAddPause}
          onResumePause={handleResumePause}
          currency={config?.currency || '₹'}
        />
      )}

      {billModalCustomer && (
        <BillModal
          customer={billModalCustomer}
          config={config}
          onClose={() => setBillModalCustomer(null)}
          onRecordPayment={handleRecordPayment}
          onFetchBill={api.getCustomerBill}
          onOpenPaymentGateway={handleOpenPaymentGateway}
          currency={config?.currency || '₹'}
        />
      )}

      {paymentModalData && (
        <PaymentModal
          customer={paymentModalData.customer}
          billData={paymentModalData.billData}
          config={config}
          onClose={() => setPaymentModalData(null)}
          onRecordPayment={handleRecordPayment}
          currency={config?.currency || '₹'}
        />
      )}

      {calendarModalCustomer && (
        <CalendarView
          customer={calendarModalCustomer}
          onClose={() => setCalendarModalCustomer(null)}
          onFetchBill={api.getCustomerBill}
          currency={config?.currency || '₹'}
        />
      )}

      {settingsModalOpen && (
        <SettingsModal
          config={config}
          onClose={() => setSettingsModalOpen(false)}
          onSaveConfig={handleSaveConfig}
        />
      )}

      {/* Level 1 Twist: Clock & Morning Notifications Outbox */}
      <ClockOutboxModal
        isOpen={clockModalOpen}
        onClose={() => setClockModalOpen(false)}
        onDateChanged={async (date) => {
          showToast(`🌅 Clock updated to ${date}`);
          await loadInitialData();
        }}
      />

      {/* Level 2 Twist: Mid-Cycle Subscription Transfer */}
      <TransferModal
        isOpen={!!transferModalCustomer}
        customer={transferModalCustomer}
        onClose={() => setTransferModalCustomer(null)}
        onTransferSuccess={async (res) => {
          showToast(`🔄 Subscription transferred from ${res.sourceCustomer.name} to ${res.targetCustomer.name}!`);
          await loadInitialData();
        }}
      />

      {/* Level 3 Twist: Messy Data Importer */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={async (report) => {
          showToast(`📥 Ingested ${report.imported?.length || 0} subscriptions!`);
          await loadInitialData();
        }}
      />

      {/* Customer Account Login & Portal Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        customers={customers}
        onOpenCreateAccount={() => {
          setLoginModalOpen(false);
          setSubscribeModalOpen(true);
        }}
        onOpenPause={(cust) => {
          setLoginModalOpen(false);
          setPauseModalCustomer(cust);
        }}
        onOpenBill={(cust) => {
          setLoginModalOpen(false);
          setBillModalCustomer(cust);
        }}
        onOpenCalendar={(cust) => {
          setLoginModalOpen(false);
          setCalendarModalCustomer(cust);
        }}
        currency={config?.currency || '₹'}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-msg">
          <CheckCircle2 size={18} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
