

# Maximus Solutions Group — Full Frontend Build Plan

## Current State

**Already built:** Splash, Login, Client Signup, Client Dashboard (basic), Client Bookings (empty), Client Map (placeholder), Client Profile (menu only), Service Request flow (4 steps), Provider Onboarding (6 steps), Provider Map/Jobs/Earnings/Profile (basic placeholders), BottomNav, design system.

**Missing:** 20+ screens referenced in menus or required for the Uber-like experience. All profile sub-pages link to 404. No admin panel. No real-time tracking, chat, quotes, reviews, or membership UI.

---

## What Will Be Built (Frontend Only — No Database)

### 1. Uber-Like Real-Time Experience

**Client: Live Tracking Screen** (`/client/tracking/:id`)
- Map placeholder showing provider location moving toward client
- Provider card at bottom: photo, name, rating, ETA, vehicle info
- Status steps: Confirmed → Provider En Route → Arrived → In Progress → Complete
- Call/Message buttons
- Cancel button with confirmation modal

**Provider: Job Accept Screen** (modal/bottom sheet on Jobs page)
- Incoming job alert with pulse animation
- Client info, service type, distance, estimated pay
- Accept / Decline buttons with countdown timer (like Uber)
- Auto-decline after 30s

### 2. Client Pages

**Client Profile Edit** (`/client/profile/edit`)
- Editable fields: name, phone, email, address, avatar upload
- Save button with validation

**Payment Methods** (`/client/payments`)
- List of saved cards (mock data)
- Add card form (card number, expiry, CVV)
- Default card toggle
- Stripe-style card icons

**Membership Plans** (`/client/membership`)
- 3-tier cards: Essential ($29/mo), Plus ($59/mo), Premium ($99/mo)
- Monthly/Annual toggle (20% discount)
- Feature comparison list
- Current plan badge
- Upgrade/Downgrade buttons

**Notifications** (`/client/notifications`)
- Notification list with icons, timestamps
- Read/unread states
- Categories: bookings, payments, promotions
- Mock notification data

**Help & Support** (`/client/support`)
- FAQ accordion
- Contact form (subject, message)
- Emergency contact number
- Live chat placeholder

**Booking Detail** (`/client/bookings/:id`)
- Full booking info card
- Provider details with rating
- Status timeline (vertical stepper)
- Invoice/receipt section
- Rate & Review button
- Re-book button

### 3. Provider Pages

**Provider Dashboard** (`/provider/dashboard`) — new landing after approval
- Today's stats: jobs completed, earnings, rating
- Upcoming jobs list
- Online/Offline toggle (like Uber driver)
- Quick stats cards

**Provider Job Detail** (`/provider/jobs/:id`)
- Client info, address, service details
- Navigation button (open in maps)
- Status update buttons: En Route → Arrived → Started → Complete
- Photo upload for before/after
- Timer for job duration
- Mark complete with summary

**Provider Business Info** (`/provider/profile/business`)
- Editable company name, EIN, address, employees
- Business verification status badge

**Provider Documents** (`/provider/profile/documents`)
- Document list with status (verified/pending/expired)
- Upload replacement documents
- Expiry date warnings

**Provider Skills** (`/provider/profile/skills`)
- Current skills with license status
- Add/remove skills
- Upload/replace license files

**Provider Vehicle** (`/provider/profile/vehicle`)
- Current vehicle info (editable)
- Add/remove vehicle toggle

**Provider Notifications** (`/provider/notifications`)
- Job alerts, payment confirmations, approval updates

**Provider Support** (`/provider/support`)
- Same structure as client support

### 4. Admin Panel

**Admin Dashboard** (`/admin`)
- Stats overview: total users, pending approvals, active jobs, revenue
- Charts placeholder for trends

**Admin Users** (`/admin/users`)
- Searchable table of all users
- Role filter (client/provider/admin)
- View/Edit/Suspend actions

**Admin Provider Approvals** (`/admin/approvals`)
- Pending provider applications list
- Review documents, approve/reject with notes

**Admin Jobs** (`/admin/jobs`)
- Active and completed jobs table
- Assign/reassign providers

**Admin Quotes** (`/admin/quotes`)
- Service requests awaiting quotes
- Create quote form (amount, scope, notes)
- Quote status tracking

### 5. Shared Components

**Chat/Messaging** (`/chat/:bookingId`)
- Message bubbles (client ↔ provider)
- Text input with send button
- Mock conversation data
- Timestamp grouping

**Review Modal** (reusable component)
- Star rating (1-5)
- Text comment
- Photo upload option
- Submit confirmation

**Quote Response Modal** (client-side)
- Quote details: amount, scope, provider
- Accept / Request Revision / Decline buttons

### 6. UX Enhancements

- Skeleton loaders on all list pages
- Pull-to-refresh gesture indicator
- Empty state illustrations on all list pages
- Status badges with color coding (green=active, amber=pending, red=cancelled)
- Toast notifications for all actions

---

## Route Summary (30+ routes)

```text
/                          Splash
/login                     Login
/client/signup             Client Sign Up
/client/dashboard          Client Dashboard
/client/bookings           Client Bookings List
/client/bookings/:id       Booking Detail
/client/tracking/:id       Live Tracking
/client/map                Nearby Providers
/client/profile            Client Profile Menu
/client/profile/edit       Edit Profile
/client/payments           Payment Methods
/client/membership         Membership Plans
/client/notifications      Notifications
/client/support            Help & Support
/client/request            Service Request Flow
/chat/:bookingId           Chat

/provider/onboarding       Provider Onboarding
/provider/dashboard        Provider Dashboard (post-approval)
/provider/map              Service Map
/provider/jobs             Jobs List
/provider/jobs/:id         Job Detail
/provider/earnings         Earnings
/provider/profile          Profile Menu
/provider/profile/business Business Info
/provider/profile/documents Documents
/provider/profile/skills   Skills & Licenses
/provider/profile/vehicle  Vehicle Info
/provider/notifications    Provider Notifications
/provider/support          Provider Support

/admin                     Admin Dashboard
/admin/users               User Management
/admin/approvals           Provider Approvals
/admin/jobs                Jobs Management
/admin/quotes              Quotes Management
```

---

## Implementation Order

Due to size, this will be implemented in batches:

**Batch 1:** Client profile sub-pages (edit, payments, membership, notifications, support) + booking detail
**Batch 2:** Provider dashboard, job detail, profile sub-pages
**Batch 3:** Real-time tracking, chat, reviews, quote modals
**Batch 4:** Admin panel (dashboard, users, approvals, jobs, quotes)
**Batch 5:** UX polish — skeletons, empty states, animations

All pages use mock/hardcoded data. Database integration will come later.

