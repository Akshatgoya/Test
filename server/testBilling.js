import {
  isWeekday,
  getMonthWeekdays,
  expandDateRange,
  checkCustomerDatePaused,
  getCustomerStatusForDate,
  calculateCustomerMonthlyBill
} from './billingEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('🧪 Starting Billing Engine & Pause Logic Tests...\n');

// Test 1: Weekday validation & Month Weekday counts
console.log('Test Suite 1: Weekday counting');
const sep2026Weekdays = getMonthWeekdays(2026, 9); // Sep 2026
// In Sep 2026: Sep 1 is Tuesday, Sep 30 is Wednesday.
// Let's verify total weekdays in Sep 2026:
// Week 1: Sep 1, 2, 3, 4 (4 days)
// Week 2: Sep 7, 8, 9, 10, 11 (5 days)
// Week 3: Sep 14, 15, 16, 17, 18 (5 days)
// Week 4: Sep 21, 22, 23, 24, 25 (5 days)
// Week 5: Sep 28, 29, 30 (3 days)
// Total = 4 + 5 + 5 + 5 + 3 = 22 weekdays.
assert(sep2026Weekdays.length === 22, `Sep 2026 has exactly 22 weekdays (got ${sep2026Weekdays.length})`);
assert(sep2026Weekdays[0] === '2026-09-01', 'First weekday of Sep 2026 is 2026-09-01');
assert(sep2026Weekdays[sep2026Weekdays.length - 1] === '2026-09-30', 'Last weekday of Sep 2026 is 2026-09-30');

// Test 2: Full Month Active Subscriber (0 Pauses)
console.log('\nTest Suite 2: Full Month Active (0 Pauses)');
const customerNoPause = {
  id: 'cust_01',
  name: 'Aarav Patel',
  phone: '9876543210',
  planName: 'Homestyle Standard Thali',
  planMonthlyPrice: 2800,
  startDate: '2026-09-01',
  pauses: []
};

const billNoPause = calculateCustomerMonthlyBill(customerNoPause, 2026, 9, '2026-09-30');
assert(billNoPause.totalMonthWeekdays === 22, 'Total month weekdays is 22');
assert(billNoPause.pausedWeekdaysCount === 0, 'Paused weekdays count is 0');
assert(billNoPause.deliveredWeekdaysCount === 22, 'Delivered weekdays count is 22');
assert(billNoPause.billedAmount === 2800, `Billed amount is full plan price ₹2,800 (got ${billNoPause.billedAmount})`);
assert(billNoPause.customerSavings === 0, 'Customer savings is ₹0');

// Test 3: Weekend Pause Guard (Customer pauses Fri-Mon, 4 calendar days, only 2 weekdays)
console.log('\nTest Suite 3: Weekend Pause Guard');
// Sep 11, 2026 is Friday, Sep 12 is Saturday, Sep 13 is Sunday, Sep 14 is Monday.
const customerWeekendPause = {
  id: 'cust_02',
  name: 'Priya Sharma',
  phone: '9820011223',
  planName: 'Deluxe Lunch Plan',
  planMonthlyPrice: 3300,
  startDate: '2026-09-01',
  pauses: [
    {
      id: 'p_1',
      startDate: '2026-09-11', // Friday
      endDate: '2026-09-14',   // Monday
      reason: 'Weekend Outing'
    }
  ]
};

const billWeekendPause = calculateCustomerMonthlyBill(customerWeekendPause, 2026, 9, '2026-09-30');
// Only Friday Sep 11 and Monday Sep 14 are weekdays. Sep 12 & 13 are weekends!
assert(billWeekendPause.pausedWeekdaysCount === 2, `Paused weekdays count is 2, not 4 (got ${billWeekendPause.pausedWeekdaysCount})`);
assert(billWeekendPause.deliveredWeekdaysCount === 20, `Delivered weekdays count is 20 (got ${billWeekendPause.deliveredWeekdaysCount})`);
const expectedDailyRate = 3300 / 22; // 150
assert(billWeekendPause.dailyRate === 150, `Daily rate is ₹150 (got ${billWeekendPause.dailyRate})`);
assert(billWeekendPause.billedAmount === 3000, `Billed amount is 20 * ₹150 = ₹3,000 (got ${billWeekendPause.billedAmount})`);
assert(billWeekendPause.customerSavings === 300, `Customer saved 2 * ₹150 = ₹300 (got ${billWeekendPause.customerSavings})`);

// Test 4: Multiple Pauses & Partial Month
console.log('\nTest Suite 4: Multiple Pauses & Pro-Rata Accuracy');
const customerMultiPause = {
  id: 'cust_03',
  name: 'Vikram Joshi',
  phone: '9811223344',
  planName: 'Executive Meal',
  planMonthlyPrice: 4400, // 4400 / 22 = 200 per meal
  startDate: '2026-09-01',
  pauses: [
    {
      id: 'p_2',
      startDate: '2026-09-08',
      endDate: '2026-09-10', // Tue, Wed, Thu (3 weekdays)
      reason: 'Travel for conference'
    },
    {
      id: 'p_3',
      startDate: '2026-09-22',
      endDate: '2026-09-22', // Tuesday (1 weekday)
      reason: 'Fasting'
    }
  ]
};

const billMultiPause = calculateCustomerMonthlyBill(customerMultiPause, 2026, 9, '2026-09-30');
assert(billMultiPause.pausedWeekdaysCount === 4, `Total 4 paused weekdays (got ${billMultiPause.pausedWeekdaysCount})`);
assert(billMultiPause.deliveredWeekdaysCount === 18, `Total 18 delivered weekdays (got ${billMultiPause.deliveredWeekdaysCount})`);
assert(billMultiPause.dailyRate === 200, `Daily rate is ₹200 (got ${billMultiPause.dailyRate})`);
assert(billMultiPause.billedAmount === 3600, `Billed amount is 18 * ₹200 = ₹3,600 (got ${billMultiPause.billedAmount})`);
assert(billMultiPause.customerSavings === 800, `Customer savings is 4 * ₹200 = ₹800 (got ${billMultiPause.customerSavings})`);
assert(billMultiPause.billedAmount + billMultiPause.customerSavings === 4400, 'Billed amount + savings matches total plan price');

// Test 5: Entire Month Paused
console.log('\nTest Suite 5: Entire Month Paused');
const customerFullPause = {
  id: 'cust_04',
  name: 'Sunita Rao',
  phone: '9711002233',
  planName: 'Mini Thali',
  planMonthlyPrice: 2200,
  startDate: '2026-09-01',
  pauses: [
    {
      id: 'p_all',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      reason: 'Annual Vacation abroad'
    }
  ]
};
const billFullPause = calculateCustomerMonthlyBill(customerFullPause, 2026, 9, '2026-09-30');
assert(billFullPause.deliveredWeekdaysCount === 0, 'Delivered weekdays is 0');
assert(billFullPause.billedAmount === 0, `Billed amount is ₹0 for fully paused month (got ${billFullPause.billedAmount})`);
assert(billFullPause.customerSavings === 2200, 'Customer savings is full ₹2,200');

// Test 6: Active vs. Paused Status on Specific Dates
console.log('\nTest Suite 6: Active vs. Paused Status Check');
// On 2026-09-09 (Wed), Vikram is paused (conference)
const statusOnPausedDay = getCustomerStatusForDate(customerMultiPause, '2026-09-09');
assert(statusOnPausedDay.status === 'paused', `Status on Sep 9 is paused (got ${statusOnPausedDay.status})`);
assert(statusOnPausedDay.packLunch === false, 'Do not pack lunch on paused day');

// On 2026-09-15 (Tue), Vikram is active
const statusOnActiveDay = getCustomerStatusForDate(customerMultiPause, '2026-09-15');
assert(statusOnActiveDay.status === 'active', `Status on Sep 15 is active (got ${statusOnActiveDay.status})`);
assert(statusOnActiveDay.packLunch === true, 'Pack lunch on active day');

// On 2026-09-13 (Sunday), Vikram is on weekend rest
const statusOnWeekend = getCustomerStatusForDate(customerMultiPause, '2026-09-13');
assert(statusOnWeekend.status === 'weekend', `Status on Sunday Sep 13 is weekend (got ${statusOnWeekend.status})`);
assert(statusOnWeekend.packLunch === false, 'Do not pack lunch on weekend');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL BILLING & PAUSE RULES VERIFIED SUCCESSFULLY!\n');
}
