# 🍱 TiffinFlow - Home-Style Tiffin Management & Pro-Rated Billing Platform

A modern, production-grade management and pro-rated billing system built for home-style tiffin (lunch delivery) services. It guarantees that **customers are billed only for the days lunch was actually served**, with full support for weekday delivery schedules, automated pause/resume handling (vacations, festivals, fasts), instant phone lookup, kitchen dispatch manifests, and an interactive payment & UPI QR settlement gateway.

---

## 🌟 Key Features

1. **Deterministic Weekday Pro-Rated Billing**:
   - Tiffins are scheduled strictly on weekdays (Monday through Friday).
   - $\text{Daily Rate} = \frac{\text{Monthly Plan Price}}{\text{Total Scheduled Weekdays in Month}}$.
   - $\text{Final Bill} = \text{Delivered Weekdays} \times \text{Daily Rate}$.
   - $\text{Customer Savings} = \text{Paused Weekdays} \times \text{Daily Rate}$ (clearly displayed on invoices).
2. **Automated Pause & Resume Engine**:
   - Single-date and date-range pause selection with presets (Today, Tomorrow, Next 3 Days, Next Week).
   - Weekend days are automatically filtered out to ensure zero accidental deductions.
   - Live savings preview before confirming a pause.
   - One-click early resume / pause cancellation.
3. **Instant Phone Lookup & Status Tracking**:
   - Real-time search by phone number (10-digit or partial digits) or name.
   - Live daily status indicator: 🟢 **Active Today (Pack Lunch)** vs. ⏸️ **Paused Today (Do Not Pack)**.
4. **Kitchen Packing Manifest (Today's Dispatch Sheet)**:
   - Live count of active dabbas to pack today.
   - Dietary breakdown pills: Pure Veg, Jain Satvik, Non-Veg.
   - Printable delivery sheet with route, contact, and cooking notes.
   - Dedicated "Do Not Pack" list to prevent meal waste.
5. **Integrated Payment & Settlement System**:
   - Dynamic UPI QR Code generator (pre-filled with customer amount and UPI intent for Google Pay, PhonePe, Paytm).
   - Card / NetBanking instant checkout simulator.
   - Cash on Delivery tracking with receipt vouchers.
   - Verified Transaction ID and Receipt Number generation.
6. **WhatsApp Billing & Printable Invoices**:
   - One-click preformatted WhatsApp invoice sender (`https://wa.me/...`).
   - Clean printable invoice view (`@media print`).
7. **Sleek Obsidian Dark Theme**:
   - Matte black background (`#0B0F19`), glowing neon saffron (`#FF7A1A`) and emerald (`#10B981`) accents, and interactive theme switcher (Dark ↔ Light).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Akshatgoya/Test.git
   cd Test
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the backend server (Port 4000):**
   ```bash
   cd server
   node server.js
   ```

2. **Start the frontend Vite dev server (Port 5173):**
   ```bash
   cd client
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:5173/
   ```

### Running Automated Tests
To run the automated billing formula and pause verification tests:
```bash
node server/testBilling.js
```

---

## 📂 Project Structure

```
├── server/
│   ├── billingEngine.js      # Core deterministic weekday math & pro-rata billing logic
│   ├── db.js                 # Persistent JSON database with realistic sample customers & plans
│   ├── server.js             # Express REST API endpoints
│   ├── testBilling.js        # Automated unit test suite
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx         # Branding, phone search, theme toggle, settings
│   │   │   ├── StatsOverview.jsx  # KPI summary cards
│   │   │   ├── CustomerList.jsx   # Subscriber table with quick actions
│   │   │   ├── DispatchSheet.jsx  # Today's kitchen packing manifest
│   │   │   ├── BillingLedger.jsx  # Month-end billing accounts ledger
│   │   │   ├── SubscribeModal.jsx # New customer onboarding
│   │   │   ├── PauseModal.jsx     # Date-range pause picker & live savings calculator
│   │   │   ├── BillModal.jsx      # Pro-rated month-end invoice
│   │   │   ├── PaymentModal.jsx   # UPI QR code, Card, and Cash payment gateway
│   │   │   ├── CalendarView.jsx   # Color-coded weekday delivery calendar
│   │   │   └── SettingsModal.jsx  # Business branding & currency customization
│   │   ├── utils/
│   │   │   ├── api.js             # API client
│   │   │   └── formatters.js      # Currency, date, and WhatsApp message builder
│   │   ├── index.css              # Obsidian dark theme design system
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── index.html
│   └── package.json
└── package.json
```
