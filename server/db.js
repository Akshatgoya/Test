import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  formatDateStr,
  parseDate,
  getCustomerStatusForDate,
  calculateCustomerMonthlyBill,
  calculateTransferSplit
} from './billingEngine.js';
import { processMorningClockNotifications } from './notificationEngine.js';
import { importMessyCustomers } from './importEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_CONFIG = {
  businessName: 'Annapurna Homestyle Tiffins',
  ownerName: 'Sunita Sharma',
  ownerPhone: '+91 98200 54321',
  currency: '₹',
  deliverySchedule: 'Monday to Friday (Lunch 12:30 PM - 1:30 PM)',
  address: 'Shop 4, Sunrise Heights, Sector 14, Navi Mumbai',
  upiId: 'annapurna.tiffins@okhdfcbank'
};

const INITIAL_PLANS = [
  {
    id: 'plan_classic_veg',
    name: 'Classic Veg Thali',
    description: '3 Whole-wheat Phulkas, Dal Tadka, Seasonal Sabzi, Basmati Rice, Salad & Pickle',
    monthlyPrice: 2800,
    dietary: 'Pure Veg',
    isPopular: true
  },
  {
    id: 'plan_deluxe_homestyle',
    name: 'Deluxe Homestyle Feast',
    description: '4 Ghee Phulkas, Paneer Special, Dry Veg Sabzi, Dal Fry, Jeera Rice, Boondi Raita & Sweet',
    monthlyPrice: 3500,
    dietary: 'Pure Veg',
    isPopular: false
  },
  {
    id: 'plan_jain_satvik',
    name: 'Jain Satvik Meal',
    description: 'Pure Satvik without Onion or Garlic. 4 Phulkas, Kadhi/Dal, Green Veggie, Khichdi/Rice, Salad',
    monthlyPrice: 3000,
    dietary: 'Jain',
    isPopular: false
  },
  {
    id: 'plan_high_protein_nonveg',
    name: 'Executive High-Protein Non-Veg',
    description: 'Fresh Chicken Curry or Egg Curry (3 days/wk) + Rich Dal, 4 Phulkas, Steamed Rice & Sprouts',
    monthlyPrice: 4200,
    dietary: 'Non-Veg',
    isPopular: false
  }
];

// Helper to get realistic dates in current month / Sep 2026
function getSampleDate(dayOffset) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return formatDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function getTodayStr() {
  const d = new Date();
  return formatDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

const INITIAL_CUSTOMERS = [
  {
    id: 'cust_101',
    name: 'Aarav Patel',
    phone: '9820198201',
    email: 'aarav.patel@techcorp.in',
    address: 'Flat 402, Lotus Tower, Mindspace IT Park, Airoli',
    planId: 'plan_classic_veg',
    planName: 'Classic Veg Thali',
    planMonthlyPrice: 2800,
    dietary: 'Pure Veg',
    deliverySlot: '12:30 PM',
    notes: 'Please keep less oil. Ring doorbell twice.',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    pauses: [
      {
        id: 'pause_101_1',
        startDate: getSampleDate(-6),
        endDate: getSampleDate(-4),
        reason: 'Office Conference in Pune',
        createdAt: '2026-09-02T10:00:00Z'
      }
    ],
    payments: {
      '2026-09': { status: 'pending', method: null, paidAt: null }
    }
  },
  {
    id: 'cust_102',
    name: 'Priya Sundaram',
    phone: '9833445566',
    email: 'priya.sundaram@gmail.com',
    address: 'B-12, Green Acres, Vashi Sector 9',
    planId: 'plan_deluxe_homestyle',
    planName: 'Deluxe Homestyle Feast',
    planMonthlyPrice: 3500,
    dietary: 'Pure Veg',
    deliverySlot: '12:45 PM',
    notes: 'Extra spicy sambar or dal if possible.',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    pauses: [
      {
        id: 'pause_102_1',
        startDate: getTodayStr(), // Paused TODAY to show active vs. paused toggle!
        endDate: getSampleDate(2),
        reason: 'Ganesh Chaturthi Festivities at native place',
        createdAt: '2026-09-10T14:30:00Z'
      }
    ],
    payments: {
      '2026-09': { status: 'pending', method: null, paidAt: null }
    }
  },
  {
    id: 'cust_103',
    name: 'Kavita Jha',
    phone: '9769012345',
    email: 'kavita.jha@fintech.co',
    address: 'C-701, Odyssey Heights, Palm Beach Road, Sanpada',
    planId: 'plan_jain_satvik',
    planName: 'Jain Satvik Meal',
    planMonthlyPrice: 3000,
    dietary: 'Jain',
    deliverySlot: '1:00 PM',
    notes: 'Strictly Jain. No root vegetables, no garlic, no onion.',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    pauses: [],
    payments: {
      '2026-09': { status: 'paid', method: 'UPI', paidAt: '2026-09-01T11:20:00Z' }
    }
  },
  {
    id: 'cust_104',
    name: 'Rohan Mehra',
    phone: '9920556677',
    email: 'rohan.mehra@startup.io',
    address: 'Cabin 14, WeWork Cybercity, Turbhe',
    planId: 'plan_high_protein_nonveg',
    planName: 'Executive High-Protein Non-Veg',
    planMonthlyPrice: 4200,
    dietary: 'Non-Veg',
    deliverySlot: '1:15 PM',
    notes: 'Leave with reception security if on call.',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    pauses: [
      {
        id: 'pause_104_1',
        startDate: getSampleDate(3),
        endDate: getSampleDate(4),
        reason: 'Work from Home (Navi Mumbai)',
        createdAt: '2026-09-12T09:15:00Z'
      }
    ],
    payments: {
      '2026-09': { status: 'pending', method: null, paidAt: null }
    }
  },
  {
    id: 'cust_105',
    name: 'Dr. Sneha Kulkarni',
    phone: '9821098765',
    email: 'dr.sneha@lifecare.org',
    address: 'Consulting Room 3, Apollo Clinic, Seawoods',
    planId: 'plan_classic_veg',
    planName: 'Classic Veg Thali',
    planMonthlyPrice: 2800,
    dietary: 'Pure Veg',
    deliverySlot: '12:30 PM',
    notes: 'Delivery strictly before 1:00 PM (OPD hours).',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    pauses: [
      {
        id: 'pause_105_1',
        startDate: getTodayStr(), // Also paused today
        endDate: getTodayStr(),
        reason: 'Hospital Emergency Surgery Shift',
        createdAt: '2026-09-17T07:00:00Z'
      }
    ],
    payments: {
      '2026-09': { status: 'pending', method: null, paidAt: null }
    }
  },
  {
    id: 'cust_106',
    name: 'Manish Verma',
    phone: '9167234567',
    email: 'manish.v@consulting.com',
    address: 'A-204, Sea Queen Bay, Kharghar Sector 10',
    planId: 'plan_deluxe_homestyle',
    planName: 'Deluxe Homestyle Feast',
    planMonthlyPrice: 3500,
    dietary: 'Pure Veg',
    deliverySlot: '12:45 PM',
    notes: 'Phulkas without ghee please.',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    pauses: [],
    payments: {
      '2026-09': { status: 'pending', method: null, paidAt: null }
    }
  }
];

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.outbox) this.data.outbox = [];
        if (!this.data.systemClock) this.data.systemClock = getTodayStr();
      } else {
        this.data = {
          config: INITIAL_CONFIG,
          plans: INITIAL_PLANS,
          customers: INITIAL_CUSTOMERS,
          outbox: [],
          systemClock: getTodayStr()
        };
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database, using initial defaults:', err);
      this.data = {
        config: INITIAL_CONFIG,
        plans: INITIAL_PLANS,
        customers: INITIAL_CUSTOMERS,
        outbox: [],
        systemClock: getTodayStr()
      };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- CONFIG ---
  getConfig() {
    return this.data.config;
  }

  updateConfig(updates) {
    this.data.config = { ...this.data.config, ...updates };
    this.save();
    return this.data.config;
  }

  // --- PLANS ---
  getPlans() {
    return this.data.plans;
  }

  createPlan(planData) {
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: planData.name,
      description: planData.description || '',
      monthlyPrice: Number(planData.monthlyPrice) || 2800,
      dietary: planData.dietary || 'Pure Veg',
      isPopular: false
    };
    this.data.plans.push(newPlan);
    this.save();
    return newPlan;
  }

  // --- CUSTOMERS ---
  getCustomers({ search = '', statusFilter = 'all', targetDate = null } = {}) {
    const todayStr = targetDate || getTodayStr();
    let list = this.data.customers.map(c => {
      const todayStatus = getCustomerStatusForDate(c, todayStr);
      return {
        ...c,
        todayStatus
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'active') {
      list = list.filter(c => c.todayStatus.status === 'active');
    } else if (statusFilter === 'paused') {
      list = list.filter(c => c.todayStatus.status === 'paused');
    }

    return list;
  }

  getCustomerById(id, targetDate = null) {
    const customer = this.data.customers.find(c => c.id === id);
    if (!customer) return null;

    const todayStr = targetDate || getTodayStr();
    const todayStatus = getCustomerStatusForDate(customer, todayStr);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentBill = calculateCustomerMonthlyBill(customer, currentYear, currentMonth, todayStr);

    return {
      ...customer,
      todayStatus,
      currentBill
    };
  }

  createCustomer(custData) {
    const plan = this.data.plans.find(p => p.id === custData.planId) || this.data.plans[0];
    const newCustomer = {
      id: `cust_${Date.now()}`,
      name: custData.name.trim(),
      phone: custData.phone.replace(/[^0-9+]/g, '').trim(),
      email: custData.email ? custData.email.trim() : '',
      address: custData.address.trim(),
      planId: plan.id,
      planName: plan.name,
      planMonthlyPrice: Number(custData.planMonthlyPrice || plan.monthlyPrice),
      dietary: custData.dietary || plan.dietary || 'Pure Veg',
      deliverySlot: custData.deliverySlot || '12:30 PM',
      notes: custData.notes || '',
      startDate: custData.startDate || getTodayStr(),
      endDate: custData.endDate || null,
      pauses: [],
      payments: {}
    };

    this.data.customers.unshift(newCustomer);
    this.save();
    return this.getCustomerById(newCustomer.id);
  }

  updateCustomer(id, updates) {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;

    this.data.customers[idx] = {
      ...this.data.customers[idx],
      ...updates
    };
    this.save();
    return this.getCustomerById(id);
  }

  deleteCustomer(id) {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.customers.splice(idx, 1);
    this.save();
    return true;
  }

  // --- PAUSE & RESUME ---
  addPause(customerId, { startDate, endDate, reason }) {
    const customer = this.data.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    const pauseRecord = {
      id: `pause_${Date.now()}`,
      startDate,
      endDate,
      reason: reason ? reason.trim() : 'Requested Pause',
      createdAt: new Date().toISOString()
    };

    if (!customer.pauses) {
      customer.pauses = [];
    }

    customer.pauses.push(pauseRecord);
    this.save();
    return this.getCustomerById(customerId);
  }

  removePause(customerId, pauseId) {
    const customer = this.data.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    if (!customer.pauses) return customer;
    const initialLen = customer.pauses.length;
    customer.pauses = customer.pauses.filter(p => p.id !== pauseId);

    if (customer.pauses.length === initialLen) {
      throw new Error('Pause record not found');
    }

    this.save();
    return this.getCustomerById(customerId);
  }

  // --- BILLING & PAYMENTS ---
  getCustomerBill(customerId, year, month, targetDate = null) {
    const customer = this.data.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const bill = calculateCustomerMonthlyBill(customer, Number(year), Number(month), targetDate);
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const payment = (customer.payments && customer.payments[monthKey]) || { status: 'pending', method: null, paidAt: null };

    return {
      ...bill,
      payment
    };
  }

  recordPayment(customerId, year, month, { status = 'paid', method = 'UPI', transactionId = null, amount = null, notes = '' }) {
    const customer = this.data.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    if (!customer.payments) customer.payments = {};

    const bill = calculateCustomerMonthlyBill(customer, Number(year), Number(month));
    const paidAmount = amount !== null ? Number(amount) : bill.billedAmount;
    const txnId = transactionId || `TXN_${Date.now().toString(36).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNo = `REC-${year}${String(month).padStart(2, '0')}-${customer.phone.slice(-4)}`;

    customer.payments[monthKey] = {
      status,
      method,
      amount: paidAmount,
      transactionId: txnId,
      receiptNumber: receiptNo,
      notes: notes || '',
      paidAt: new Date().toISOString()
    };

    this.save();
    return this.getCustomerBill(customerId, year, month);
  }

  getMonthEndSummary(year, month, targetDate = null) {
    const y = Number(year);
    const m = Number(month);
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;

    const customerBills = this.data.customers.map(c => {
      const bill = calculateCustomerMonthlyBill(c, y, m, targetDate);
      const payment = (c.payments && c.payments[monthKey]) || { status: 'pending', method: null, paidAt: null };
      return {
        ...bill,
        payment
      };
    });

    const totalPotentialRevenue = customerBills.reduce((sum, b) => sum + b.monthlyPlanPrice, 0);
    const totalActualProRatedBilled = customerBills.reduce((sum, b) => sum + b.billedAmount, 0);
    const totalCustomerSavings = customerBills.reduce((sum, b) => sum + b.customerSavings, 0);
    const totalDeliveredDays = customerBills.reduce((sum, b) => sum + b.deliveredWeekdaysCount, 0);
    const totalPausedDays = customerBills.reduce((sum, b) => sum + b.pausedWeekdaysCount, 0);

    const paidBills = customerBills.filter(b => b.payment.status === 'paid');
    const totalCollected = paidBills.reduce((sum, b) => sum + b.billedAmount, 0);
    const pendingCollection = totalActualProRatedBilled - totalCollected;

    return {
      year: y,
      month: m,
      monthKey,
      totalCustomers: customerBills.length,
      totalPotentialRevenue: Math.round(totalPotentialRevenue),
      totalActualProRatedBilled: Math.round(totalActualProRatedBilled),
      totalCustomerSavings: Math.round(totalCustomerSavings),
      totalDeliveredDays,
      totalPausedDays,
      totalCollected: Math.round(totalCollected),
      pendingCollection: Math.round(pendingCollection),
      customerBills
    };
  }

  // --- DAILY DISPATCH SHEET ---
  getDispatchSheet(targetDateStr = null) {
    const todayStr = targetDateStr || getTodayStr();
    const targetDateObj = new Date(todayStr);
    const isWkday = targetDateObj.getDay() >= 1 && targetDateObj.getDay() <= 5;

    const activeList = [];
    const pausedList = [];
    const dietaryCounts = {
      'Pure Veg': 0,
      'Jain': 0,
      'Non-Veg': 0,
      'Other': 0
    };

    this.data.customers.forEach(customer => {
      const statusObj = getCustomerStatusForDate(customer, todayStr);
      if (statusObj.packLunch) {
        activeList.push({
          ...customer,
          todayStatus: statusObj
        });
        const diet = customer.dietary || 'Pure Veg';
        if (dietaryCounts[diet] !== undefined) {
          dietaryCounts[diet]++;
        } else {
          dietaryCounts['Other']++;
        }
      } else if (statusObj.status === 'paused') {
        pausedList.push({
          ...customer,
          todayStatus: statusObj
        });
      }
    });

    return {
      date: todayStr,
      isWeekend: !isWkday,
      totalToPack: activeList.length,
      totalPaused: pausedList.length,
      dietaryCounts,
      activeList,
      pausedList
    };
  }

  // --- RAW DATA ACCESS & DIRECT INSERT ---
  getRawCustomers() {
    return this.data.customers;
  }

  createCustomerDirect(customerData) {
    this.data.customers.unshift(customerData);
    this.save();
    return customerData;
  }

  // --- NOTIFICATION OUTBOX & SYSTEM CLOCK (LEVEL 1 - T1) ---
  getOutbox(filters = {}) {
    if (!this.data.outbox) this.data.outbox = [];
    let list = [...this.data.outbox];

    if (filters.date) {
      list = list.filter(m => m.date === filters.date);
    }
    if (filters.customerId) {
      list = list.filter(m => m.customerId === filters.customerId || m.recipientId === filters.customerId);
    }
    if (filters.type) {
      list = list.filter(m => m.type === filters.type);
    }
    return list;
  }

  addOutboxMessage(message) {
    if (!this.data.outbox) this.data.outbox = [];
    this.data.outbox.unshift(message);
    this.save();
    return message;
  }

  clearOutbox() {
    this.data.outbox = [];
    this.save();
    return { success: true, message: 'Outbox cleared' };
  }

  getClock() {
    return {
      currentDate: this.data.systemClock || getTodayStr()
    };
  }

  advanceClock(options = {}) {
    let targetDate;
    if (options && options.date) {
      targetDate = options.date;
    } else if (options && options.advanceDays) {
      const baseDate = parseDate(this.data.systemClock || getTodayStr());
      baseDate.setDate(baseDate.getDate() + Number(options.advanceDays));
      targetDate = formatDateStr(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());
    } else if (this.data.systemClock) {
      const baseDate = parseDate(this.data.systemClock);
      baseDate.setDate(baseDate.getDate() + 1);
      targetDate = formatDateStr(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());
    } else {
      targetDate = getTodayStr();
    }

    this.data.systemClock = targetDate;
    
    // Process morning notifications for all active non-paused customers
    const result = processMorningClockNotifications(this, targetDate);
    this.save();

    return {
      date: targetDate,
      isWeekday: result.isWeekday,
      dispatchedCount: result.dispatchedCount,
      notifications: result.notifications,
      totalOutboxMessages: this.data.outbox ? this.data.outbox.length : 0
    };
  }

  // --- SUBSCRIPTION TRANSFER & MID-CYCLE SPLIT (LEVEL 2 - T6) ---
  transferSubscription(sourceCustomerId, { effectiveDate, targetCustomerId, targetCustomerData }) {
    const sourceCustomer = this.data.customers.find(c => c.id === sourceCustomerId);
    if (!sourceCustomer) {
      throw new Error(`Source customer with ID ${sourceCustomerId} not found`);
    }

    if (!effectiveDate) {
      throw new Error('Effective date is required for subscription transfer');
    }

    // Calculate day before effective date for source customer's endDate
    const effDateObj = parseDate(effectiveDate);
    const dayBeforeObj = new Date(effDateObj);
    dayBeforeObj.setDate(dayBeforeObj.getDate() - 1);
    const dayBeforeStr = formatDateStr(
      dayBeforeObj.getFullYear(),
      dayBeforeObj.getMonth() + 1,
      dayBeforeObj.getDate()
    );

    const sourceOriginalEndDate = sourceCustomer.endDate || formatDateStr(
      effDateObj.getFullYear(),
      effDateObj.getMonth() + 1,
      new Date(effDateObj.getFullYear(), effDateObj.getMonth() + 1, 0).getDate()
    );

    let targetCustomer = null;
    if (targetCustomerId) {
      targetCustomer = this.data.customers.find(c => c.id === targetCustomerId);
      if (!targetCustomer) {
        throw new Error(`Target customer with ID ${targetCustomerId} not found`);
      }
      targetCustomer.planId = sourceCustomer.planId;
      targetCustomer.planName = sourceCustomer.planName;
      targetCustomer.planMonthlyPrice = sourceCustomer.planMonthlyPrice;
      targetCustomer.startDate = effectiveDate;
      targetCustomer.endDate = sourceOriginalEndDate;
      targetCustomer.transferredFrom = sourceCustomer.id;
      targetCustomer.transferEffectiveDate = effectiveDate;
    } else if (targetCustomerData) {
      const plan = this.data.plans.find(p => p.id === sourceCustomer.planId) || this.data.plans[0];
      targetCustomer = {
        id: `cust_${Date.now()}_transferred`,
        name: (targetCustomerData.name || 'Transferred Customer').trim(),
        phone: (targetCustomerData.phone || '').replace(/[^0-9+]/g, '').trim(),
        email: (targetCustomerData.email || '').trim(),
        address: (targetCustomerData.address || sourceCustomer.address || '').trim(),
        planId: sourceCustomer.planId,
        planName: sourceCustomer.planName,
        planMonthlyPrice: sourceCustomer.planMonthlyPrice,
        dietary: targetCustomerData.dietary || sourceCustomer.dietary || 'Pure Veg',
        deliverySlot: targetCustomerData.deliverySlot || sourceCustomer.deliverySlot || '12:30 PM',
        notes: targetCustomerData.notes || `Transferred from ${sourceCustomer.name} on ${effectiveDate}`,
        startDate: effectiveDate,
        endDate: sourceOriginalEndDate,
        transferredFrom: sourceCustomer.id,
        transferEffectiveDate: effectiveDate,
        pauses: [],
        payments: {}
      };
      this.data.customers.unshift(targetCustomer);
    } else {
      throw new Error('Either targetCustomerId or targetCustomerData must be provided');
    }

    // Update source customer's endDate
    sourceCustomer.endDate = dayBeforeStr;
    sourceCustomer.transferredTo = targetCustomer.id;
    sourceCustomer.transferEffectiveDate = effectiveDate;

    this.save();

    // Compute split billing for verification
    const year = effDateObj.getFullYear();
    const month = effDateObj.getMonth() + 1;
    const splitDetails = calculateTransferSplit(sourceCustomer, targetCustomer, year, month);

    return {
      success: true,
      message: `Subscription successfully transferred from ${sourceCustomer.name} to ${targetCustomer.name} effective ${effectiveDate}`,
      effectiveDate,
      sourceCustomer: this.getCustomerById(sourceCustomer.id),
      targetCustomer: this.getCustomerById(targetCustomer.id),
      splitDetails
    };
  }

  // --- MESSY DATA IMPORT (LEVEL 3 - T4) ---
  importMessyData(input) {
    const result = importMessyCustomers(input, this);
    this.save();
    return result;
  }
}

export const db = new Database();

