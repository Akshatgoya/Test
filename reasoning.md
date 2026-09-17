# Reasoning & Architectural Decisions: TiffinFlow

This document provides a comprehensive technical breakdown of the design choices, domain logic, mathematical formulation, and architecture implemented in **TiffinFlow**.

---

## 1. Problem Decomposition & Core Domain Rules

A home-style tiffin service operates under distinct constraints compared to standard e-commerce or on-demand delivery apps (like Swiggy/Zomato):

1. **Recurring Monthly Subscription with Weekday Delivery**:
   - Deliveries take place strictly on weekdays (Monday through Friday).
   - Weekends (Saturday and Sunday) are rest days and do not have scheduled deliveries.
   - The number of weekdays varies by calendar month (e.g., September 2026 has 22 weekdays; February can have 20; August can have 21 or 22).

2. **Pause & Resume with Zero-Charge for Skipped Days**:
   - Customers regularly pause their service for personal travel, festivals, office work shifts, fasting, or illness.
   - **Critical Business Rule**: Paused weekdays must **never** be charged.
   - If a customer pauses across a weekend (e.g., Friday to Monday), only the actual scheduled delivery days (Friday and Monday) should be deducted, preventing double-counting or erroneous deductions.

3. **Pro-Rated Month-End Billing**:
   - At month-end, the owner needs each customer's bill calculated fairly and transparently based on actual delivered days.
   - The invoice must clearly display:
     - Monthly Plan Price
     - Total Scheduled Weekdays in Month ($W$)
     - Daily Rate ($R = \frac{\text{Plan}}{W}$)
     - Delivered Days ($D$) and Billed Amount ($D \times R$)
     - Paused Days ($P$) and Customer Savings ($P \times R$)
     - Itemized list of paused dates with reasons.

4. **Owner Daily Operations & Quick Lookups**:
   - Customers are looked up by **phone number** (the universal identifier in Indian local commerce).
   - Real-time indicator for **TODAY**: Is this customer **Active Today** (deliver lunch) or **Paused Today** (do not pack lunch)?
   - Daily Kitchen Dispatch / Packing Sheet to prevent meal wastage.

---

## 2. Mathematical Formulation for Pro-Rated Billing

Let:
- $Y$ = Billing Year (e.g. 2026)
- $M$ = Billing Month (1 to 12)
- $S_{cust}$ = Customer Subscription Start Date
- $E_{cust}$ = Customer Subscription End Date (or end of month)
- $\text{Price}_{plan}$ = Monthly plan subscription price (e.g. ₹2,800)

### Step 1: Weekday Enumeration
Let $\mathcal{W}_{month}$ be the set of all calendar dates $d \in \text{Month}(Y, M)$ such that:
$$\text{DayOfWeek}(d) \in \{\text{Monday}, \text{Tuesday}, \text{Wednesday}, \text{Thursday}, \text{Friday}\}$$
Total Scheduled Month Weekdays:
$$W = |\mathcal{W}_{month}|$$

### Step 2: Eligible Subscriber Weekdays
Filter $\mathcal{W}_{month}$ for dates where the customer's subscription was active:
$$\mathcal{W}_{eligible} = \{d \in \mathcal{W}_{month} \mid S_{cust} \le d \le E_{cust}\}$$
$$W_{eligible} = |\mathcal{W}_{eligible}|$$

### Step 3: Paused Weekdays Deduction
Let $\mathcal{P}_{cust}$ be the union of all expanded date ranges in the customer's pause records. The set of paused weekdays in the billing month is:
$$\mathcal{P}_{month} = \mathcal{W}_{eligible} \cap \mathcal{P}_{cust}$$
Total Paused Weekdays:
$$P = |\mathcal{P}_{month}|$$

### Step 4: Delivered Weekdays
$$D = W_{eligible} - P$$

### Step 5: Pro-Rata Daily Rate & Financial Calculations
The standard fair daily meal rate:
$$R = \frac{\text{Price}_{plan}}{W}$$

Total Pro-Rated Billed Amount:
$$\text{Billed Amount} = \text{round}(D \times R, 2)$$

Total Customer Savings (Transparent Discount):
$$\text{Customer Savings} = \text{round}(P \times R, 2)$$

Verification Invariant:
$$\text{Billed Amount} + \text{Customer Savings} \approx \text{Price}_{plan} \quad (\text{exact up to cent/paisa rounding})$$

---

## 3. Architecture & Tech Stack Decisions

### Backend Architecture
- **Engine Isolation (`server/billingEngine.js`)**: Pure, deterministic, zero-dependency calculation engine. This ensures all math, date-range expansions, weekend filtering, and calendar statuses can be tested independently with high reliability.
- **Persistent Data Store (`server/db.js`)**: Robust JSON database file store with atomic read/write and seed data.
- **RESTful Endpoints (`server/server.js`)**: Express server providing granular endpoints for subscriptions, pause management, dispatch sheets, and payments.

### Frontend Architecture
- **Framework**: React 18 + Vite for sub-second build times and instant hot reloading.
- **Design System (`client/src/index.css`)**:
  - **Obsidian Dark Aesthetic**: Matte black background (`#0B0F19`), elevated surfaces (`#111827`), glowing saffron (`#FF7A1A`) and emerald (`#10B981`) accents.
  - **Responsive & Glassmorphic**: High-contrast tables, interactive calendar grids, and modal overlays.
  - **Theme Toggle**: Dual-theme support (Dark Mode by default, toggleable to Light Mode).
- **Interactive Payment Gateway (`client/src/components/PaymentModal.jsx`)**:
  - Real-time dynamic UPI QR code generator (`upi://pay?pa=...&pn=...&am=...&cu=INR`).
  - Card / NetBanking simulator with processing state machine, confetti celebration, and verified transaction receipts.
  - Cash on Delivery (COD) tracking.

---

## 4. Edge Cases Addressed

1. **Weekend Pause Overlaps**:
   - If a customer selects a pause from *Friday, Sep 11 to Monday, Sep 14* (4 calendar days), only 2 days (Friday and Monday) are deducted. Saturday and Sunday are ignored.
2. **Full Month Pause**:
   - If a customer pauses the entire month, $D = 0$, $\text{Billed Amount} = ₹0$, and $\text{Customer Savings} = \text{Price}_{plan}$.
3. **Mid-Month Onboarding**:
   - If a customer joins on the 15th of the month, only weekdays starting from the 15th are counted as eligible.
4. **Early Resume**:
   - Customers who return early from vacation can cancel scheduled pauses with a single click, instantly restoring their deliveries and recalculating the bill.
5. **Instant Phone Lookup**:
   - Fast debounced substring match on phone number allows the owner to find customers within 2 keystrokes.
