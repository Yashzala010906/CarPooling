# 🚗 Odoo Enterprise Carpooling Platform

An enterprise-grade, peer-to-peer corporate carpooling web application built for seamless workplace commutes, real turn-by-turn road tracking, eco-friendly carbon accounting, and Indian Rupee (`₹`) financial transactions.

---

## 🌟 Key Features

### 🛡️ Dual-Role Authentication & Security
- **Employee & Administrator Access**: Separate registration and portal login tabs for Employees and System Administrators.
- **Strict Real-World Validation**:
  - **Email**: Standard RFC domain validation that blocks temporary and disposable email services.
  - **Password**: Enforces strong password rules (8+ characters, uppercase letter `A-Z`, lowercase letter `a-z`, number `0-9`, and special character `!@#$%^&*`).
  - **Live Password Checklist**: Real-time visual feedback checklist rendered under password fields.

### 🗺️ Turn-by-Turn Real Road Routing & Live Map Tracking
- **Interactive OpenStreetMap**: Rendered with high-performance CartoDB Voyager tiles.
- **OSRM Driving Engine**: Calculates real turn-by-turn road polyline geometry, exact driving distance in kilometers (`km`), and travel duration in minutes.
- **Live Marker Tracking**: Socket.IO integrated driver vehicle location updates with fallback simulated route motion.

### 💰 Indian Rupee (`₹`) Financial System & Wallet
- **Complete Rupee System**: All fares, balances, fuel parameter configs (`₹95/L`), and distance rates (`₹6/km`) configured in Indian Rupees (`₹`).
- **Instant Wallet Top-Ups**: Quick recharge buttons (`+₹100`, `+₹200`, `+₹500`, `+₹1000`) and custom amount entry.
- **Multi-Gateway Payment Flow**: Discharges ride fares via **Wallet Balance**, **UPI**, **Credit/Debit Card**, or **Cash**.

### 🏁 Complete Ride & Automated History Ledger
- **One-Click Ride Completion**: Passengers and drivers can initiate ride completion and payment directly from the **My Trips** tab.
- **Automated Ride History**: Successfully paid rides are saved to the **Ride History** ledger with full transaction breakdown.

### 📊 Company Administration Control Room
- **Corporate Analytics**: Overview of total company carbon saved (`kg CO₂`), active vehicle catalogues, and registered employee rosters.
- **Parameter Management**: Configure organization-wide fuel costs, distance rates, and insurance verification mandates.
- **User Access Controls**: Grant or revoke employee participation access in real-time.

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 (Vite)
- **Styling & UI**: Modern Vanilla CSS Design System, Glassmorphism, Micro-animations
- **Iconography**: Lucide React Icons
- **Mapping & GIS**: Leaflet, CartoDB Voyager Tiles, OSRM Routing API
- **Backend & Database**: Supabase (PostgreSQL, Realtime Sync, Storage)
- **Real-Time Communications**: Socket.IO Client

---

## 📁 Repository Structure

```text
├── src/
│   ├── components/
│   │   ├── ChatSim.jsx         # Coworker live chat simulator
│   │   ├── MapMockup.jsx       # Leaflet & OSRM map renderer
│   │   ├── RealMap.jsx         # Real-time road tracking map component
│   │   └── Sidebar.jsx         # Enterprise navigation sidebar
│   ├── context/
│   │   └── AppContext.jsx      # Global React state & Supabase data provider
│   ├── lib/
│   │   ├── geo.js              # Geographic & OSRM route calculations
│   │   ├── mappers.js          # Supabase database row-to-model mappers
│   │   ├── socketService.js    # Socket.IO connection manager
│   │   ├── supabase.js         # Supabase client initialization
│   │   └── validation.js       # Real-world email & password validators
│   └── views/
│       ├── Admin/              # Company Control Room & Admin Dashboard
│       ├── Auth/               # Login & Registration views
│       ├── Dashboard/          # Employee Home & Commute metrics
│       ├── FindRide/           # Search & Route confirmation
│       ├── History/            # Completed Ride History ledger
│       ├── MyTrips/            # Active commute tracking & payment gateway
│       ├── OfferRide/          # Vehicle & Commute publication
│       ├── Reports/            # Corporate analytics & Carbon savings
│       └── Wallet/             # Rupee wallet balance & Top-ups
├── .env                        # Environment configuration
├── package.json                # Dependencies & scripts
├── reset_db.js                 # Database wipe utility
└── seed_admin.js               # Default Admin seeder utility
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm or yarn

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Yashzala010906/CarPooling.git
cd CarPooling
npm install
```

### 2. Environment Configuration

Ensure `.env` exists in the project root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://scmmklcnvikjvntonjya.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server

Start the local development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173/` or `http://localhost:5174/`.

---

## 🔑 Default Accounts & Database Utilities

### Default Administrator Account
To seed the default **System Administrator** account into your Supabase database:

```bash
node seed_admin.js
```

- **Admin Email**: `admin@gmail.com`
- **Admin Password**: `Admin@1234`
- **Role**: `Administrator`

### Database Reset Utility
To clear all records in your Supabase database down to 0:

```bash
node reset_db.js
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
