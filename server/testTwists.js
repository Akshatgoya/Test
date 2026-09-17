import { db } from './db.js';
import { normalizePhone, parseMixedDate, importMessyCustomers } from './importEngine.js';
import { processMorningClockNotifications } from './notificationEngine.js';
import { calculateTransferSplit, calculateCustomerMonthlyBill } from './billingEngine.js';

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

console.log('🧪 Starting Antigravity Twists Verification Test Suite...\n');

// ==========================================
// TEST SUITE 1: LEVEL 1 — T1 (INTEGRATE & CLOCK/OUTBOX)
// ==========================================
console.log('--- TEST SUITE 1: Level 1 (T1) Morning Notifications & Clock ---');

// Clean outbox before test
db.clearOutbox();
assert(db.getOutbox().length === 0, 'Outbox cleared successfully');

// Case 1A: Advance clock to a Weekend (e.g. 2026-09-06 is Sunday)
const sundayResult = db.advanceClock({ date: '2026-09-06' });
assert(sundayResult.isWeekday === false, 'Sep 6, 2026 correctly identified as Weekend');
assert(sundayResult.dispatchedCount === 0, '0 notifications dispatched on Weekend');
assert(db.getOutbox().length === 0, 'Outbox remains empty on Weekend');

// Case 1B: Advance clock to a Weekday (e.g. 2026-09-01 is Tuesday)
// On Sep 1, 2026:
// Check who is paused in INITIAL_CUSTOMERS:
// Sneha is paused on today, Priya on today.
// Let's test Sep 1: no one in initial data is paused on Sep 1 except anyone with pause on that date.
const weekdayResult = db.advanceClock({ date: '2026-09-01' });
assert(weekdayResult.isWeekday === true, 'Sep 1, 2026 correctly identified as Weekday');
assert(weekdayResult.dispatchedCount > 0, `Dispatched notifications to active subscribers (got ${weekdayResult.dispatchedCount})`);

// Verify outbox messages
const outboxMessages = db.getOutbox({ date: '2026-09-01' });
assert(outboxMessages.length === weekdayResult.dispatchedCount, 'Outbox count matches dispatched count');
assert(outboxMessages[0].type === 'delivery_reminder', 'Notification type is delivery_reminder');
assert(outboxMessages[0].phone !== undefined && outboxMessages[0].phone.length >= 10, 'Notification includes valid customer phone');
assert(outboxMessages[0].message.includes('2026-09-01'), 'Message includes delivery date');

// Case 1C: Verify paused customer is NOT notified
// Let's create a customer paused on 2026-09-02
const testPausedCust = db.createCustomerDirect({
  id: 'test_paused_cust',
  name: 'Test Paused User',
  phone: '9999911111',
  planId: 'plan_classic_veg',
  planName: 'Classic Veg Thali',
  planMonthlyPrice: 2800,
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  pauses: [
    {
      id: 'p_test',
      startDate: '2026-09-02',
      endDate: '2026-09-02',
      reason: 'Doctor Visit'
    }
  ],
  payments: {}
});

db.clearOutbox();
const sep2Result = db.advanceClock({ date: '2026-09-02' });
const notifiedIds = sep2Result.notifications.map(n => n.customerId);
assert(!notifiedIds.includes('test_paused_cust'), 'Paused customer was NOT sent a delivery notification on Sep 2');

// Clean up test customer
db.deleteCustomer('test_paused_cust');

// ==========================================
// TEST SUITE 2: LEVEL 2 — T6 (LIFECYCLE & SUBSCRIPTION TRANSFER)
// ==========================================
console.log('\n--- TEST SUITE 2: Level 2 (T6) Subscription Transfer & Mid-Cycle Split ---');

// Create a clean source customer starting Sep 1, 2026 on Deluxe Feast (₹3,500/month, 22 weekdays in Sep)
const sourceCust = db.createCustomerDirect({
  id: 'cust_transfer_src',
  name: 'Karan Mehra',
  phone: '9870000001',
  address: '101 Horizon Towers, Vashi',
  planId: 'plan_deluxe_homestyle',
  planName: 'Deluxe Homestyle Feast',
  planMonthlyPrice: 3500,
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  pauses: [],
  payments: {}
});

// Transfer on mid-cycle: Sep 15, 2026
// Sep 2026 weekdays:
// Week 1: Sep 1, 2, 3, 4 (4 days)
// Week 2: Sep 7, 8, 9, 10, 11 (5 days)
// Week 3 before Sep 15: Sep 14 (1 day) -> Total Karan served = 10 weekdays!
// Target customer from Sep 15 to Sep 30:
// Week 3 from Sep 15: Sep 15, 16, 17, 18 (4 days)
// Week 4: Sep 21, 22, 23, 24, 25 (5 days)
// Week 5: Sep 28, 29, 30 (3 days) -> Total Target served = 12 weekdays!
// Total weekdays = 10 + 12 = 22 weekdays.

const transferResult = db.transferSubscription('cust_transfer_src', {
  effectiveDate: '2026-09-15',
  targetCustomerData: {
    name: 'Ananya Roy',
    phone: '9870000002',
    address: '204 Sapphire Heights, Sanpada'
  }
});

assert(transferResult.success === true, 'Transfer executed successfully');
assert(transferResult.sourceCustomer.endDate === '2026-09-14', `Source customer endDate adjusted to day before transfer (2026-09-14, got ${transferResult.sourceCustomer.endDate})`);
assert(transferResult.targetCustomer.startDate === '2026-09-15', `Target customer startDate set to effective date (2026-09-15, got ${transferResult.targetCustomer.startDate})`);
assert(transferResult.targetCustomer.endDate === '2026-09-30', `Target customer carries over original cycle endDate (2026-09-30, got ${transferResult.targetCustomer.endDate})`);
assert(transferResult.targetCustomer.planMonthlyPrice === 3500, 'Target customer carries over original plan monthly price ₹3,500');

// Verify split billing
const split = transferResult.splitDetails;
assert(split.source.deliveredWeekdays === 10, `Source served exactly 10 weekdays (got ${split.source.deliveredWeekdays})`);
assert(split.target.deliveredWeekdays === 12, `Target served exactly 12 weekdays (got ${split.target.deliveredWeekdays})`);
assert(split.splitSummary.totalDeliveredWeekdays === 22, `Total served weekdays equals 22 (got ${split.splitSummary.totalDeliveredWeekdays})`);

const expectedSourceBill = Math.round((10 * (3500 / 22)) * 100) / 100;
const expectedTargetBill = Math.round((12 * (3500 / 22)) * 100) / 100;
assert(Math.abs(split.source.billedAmount - expectedSourceBill) < 0.05, `Source billed ₹${expectedSourceBill} (got ₹${split.source.billedAmount})`);
assert(Math.abs(split.target.billedAmount - expectedTargetBill) < 0.05, `Target billed ₹${expectedTargetBill} (got ₹${split.target.billedAmount})`);
assert(split.splitSummary.planPriceBalanced === true, `Total split billing satisfies plan price conservation ₹3,500`);

// Clean up
db.deleteCustomer('cust_transfer_src');
db.deleteCustomer(transferResult.targetCustomer.id);

// ==========================================
// TEST SUITE 3: LEVEL 3 — T4 (MESSY DATA IMPORTER)
// ==========================================
console.log('\n--- TEST SUITE 3: Level 3 (T4) Messy Data Importer ---');

// Helper phone normalization tests
assert(normalizePhone('+91 98200-54321') === '9820054321', 'Normalizes +91 and dashes');
assert(normalizePhone('098200 54321') === '9820054321', 'Normalizes leading 0 and spaces');
assert(normalizePhone('(98200) 54321') === '9820054321', 'Normalizes parentheses');

// Helper date parsing tests
assert(parseMixedDate('2026-09-01') === '2026-09-01', 'Parses standard ISO YYYY-MM-DD');
assert(parseMixedDate('15/09/2026') === '2026-09-15', 'Parses DD/MM/YYYY');
assert(parseMixedDate('1-Sep-2026') === '2026-09-01', 'Parses textual date 1-Sep-2026');
assert(parseMixedDate('September 15, 2026') === '2026-09-15', 'Parses long date September 15, 2026');

// Import Batch with:
// 1. Valid customer with DD/MM/YYYY
// 2. Duplicate phone in batch
// 3. Duplicate phone matching existing database customer (Aarav Patel: 9820198201)
// 4. Blank line / record
// 5. Missing name
// 6. Invalid phone (< 10 digits)
// 7. Valid customer with mixed date and +91 phone

const messyInput = [
  // 1. Valid record 1
  {
    name: 'Devika Nair',
    phone: '+91 97733 12345',
    startDate: '01/09/2026',
    address: 'Flat 502, Palm Beach, Sanpada',
    plan: 'Jain Satvik Meal'
  },
  // 2. Blank record
  {},
  // 3. Missing name
  {
    name: '',
    phone: '98888 77777',
    startDate: '2026-09-01'
  },
  // 4. Invalid phone
  {
    name: 'Rajesh Sharma',
    phone: '12345', // too short
    startDate: '2026-09-01'
  },
  // 5. Duplicate phone matching Devika (row 1)
  {
    name: 'Devika Nair Clone',
    phone: '9773312345',
    startDate: '2026-09-05'
  },
  // 6. Duplicate phone matching existing customer in DB
  {
    name: 'Imposter Aarav',
    phone: '+91-98201-98201',
    startDate: '2026-09-01'
  },
  // 7. Valid record 2
  {
    name: 'Tanvi Deshmukh',
    phone: '098199 88221',
    startDate: '15-Sep-2026',
    address: 'B-404, Sea Green, Belapur',
    plan: 'Deluxe Homestyle Feast'
  }
];

const report = db.importMessyData(messyInput);

assert(Array.isArray(report.imported), 'Report contains imported array');
assert(Array.isArray(report.deduped), 'Report contains deduped array');
assert(Array.isArray(report.rejected), 'Report contains rejected array');

assert(report.imported.length === 2, `Exactly 2 customers imported (got ${report.imported.length})`);
assert(report.deduped.length === 2, `Exactly 2 duplicate records caught (got ${report.deduped.length})`);
assert(report.rejected.length === 3, `Exactly 3 invalid/blank records rejected (got ${report.rejected.length})`);

// Verify imported data details
const devika = report.imported.find(c => c.name === 'Devika Nair');
assert(devika !== undefined, 'Devika Nair imported');
assert(devika.phone === '9773312345', `Phone normalized to 9773312345 (got ${devika.phone})`);
assert(devika.startDate === '2026-09-01', `Date normalized to 2026-09-01 (got ${devika.startDate})`);
assert(devika.planId === 'plan_jain_satvik', `Plan matched to plan_jain_satvik (got ${devika.planId})`);

const tanvi = report.imported.find(c => c.name === 'Tanvi Deshmukh');
assert(tanvi !== undefined, 'Tanvi Deshmukh imported');
assert(tanvi.phone === '9819988221', `Phone normalized from 098199 88221 (got ${tanvi.phone})`);
assert(tanvi.startDate === '2026-09-15', `Date normalized from 15-Sep-2026 to 2026-09-15 (got ${tanvi.startDate})`);

// Clean up imported test records from database
report.imported.forEach(c => db.deleteCustomer(c.id));

// Test CSV parsing as well
const rawCsv = `Name,Phone,StartDate,Address,Plan
Vikram Batra,9820098200,01/09/2026,"Sector 17, Vashi",Classic Veg
,9820011111,01/09/2026,Missing Name,Classic Veg
Rahul Dravid,98200,01/09/2026,Bad Phone,Classic Veg
Vikram Batra Dup,9820098200,01/09/2026,Duplicate In Batch,Classic Veg
`;

const csvReport = db.importMessyData(rawCsv);
assert(csvReport.imported.length === 1, `CSV: Exactly 1 valid imported (got ${csvReport.imported.length})`);
assert(csvReport.rejected.length === 2, `CSV: 2 rejected (missing name, short phone) (got ${csvReport.rejected.length})`);
assert(csvReport.deduped.length === 1, `CSV: 1 duplicate phone caught (got ${csvReport.deduped.length})`);

csvReport.imported.forEach(c => db.deleteCustomer(c.id));

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 3 LEVELS (T1, T6, T4) VERIFIED AND PASSING 100%!');
}
