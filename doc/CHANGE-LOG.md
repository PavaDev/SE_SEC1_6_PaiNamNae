<<<<<<< HEAD
# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning.

---

## [1.0.0] - 2026-02-11 - (Pavarit)

### Added
- Dockerfile into frontend and backend
- Docker Compose for local development
- .env file for Docker Compose
- Gitignore for .env files

### Changed
- Frontend api base url to environment variable

### Fixed


## [1.0.1] - 2026-02-12 - (Pavarit)

### Added
- Dockerfile.dev into frontend and backend
- docker-compose.dev.yml for local development

### Changed
- Dockerignore in frontend and backend

### Fixed
- Hmr reload issue in frontend for docker dev
- Hmr reload issue in frontend for docker dev


## [1.0.2] - 2026-02-13 - (Pavarit)

### Added
- End route api endpoint in server
- End route button in frontend

### Changed


### Fixed
- Route status tab bugs


## [1.0.3] - 2026-02-14 - (์Narathip)

### Added
- Review and Report modals with image upload (max 2 images) and star rating
- Review/Report buttons myTrip pages

### Changed
- myTrip conditional button display for "All" tab


## [1.0.4] - 2026-02-14 - (Panya)

### Added
- Review below my route on myTrip pages

### Changed
- Review buttons on myTrip pages disible when reviewed


## [1.0.5] - 2026-02-14 - (Pavarit)

### Added
- Review schema (migration)
- Review api endpoint in server (create, retrieve)
- Review route

### Changed
- User and Route schema to relate with review schema

### Fixed
- Hmr reload issue in frontend for docker dev


## [1.0.6] - 2026-02-15 - (Narathaip)

### Added
- Admin Report Management module:
  - Backend: CRUD endpoints (controller + service), Zod validation, routing
  - API docs: Swagger documentation for report endpoints
  - Frontend: composables + admin pages (list, detail, edit)
- AdminSidebar: navigation link for Report Management

### Changed
- Report type classification simplified to Driver/Passenger
- Note: Prisma models reused, no schema changes


## [1.0.7] - 2026-02-16 - (Pavarit)

### Added
- **Booking & Trip Management**
  - Driver rating and review on `myTrip` page
  - Driver reviews section in trip details
  - Self-booking prevention on `findTrip` page (drivers cannot book their own routes)
- **Admin Dashboard**
  - Route Reviews section in Route Details page
  - Individual User Review Modal in User Management list
  - Star action button in User table for quick review access
  - Included `ratingAverage` and `ratingCount` in the administrative user fetch API

### Changed
- **User Interface & UX**
  - Navigation bar visibility: "Create Trip" is now restricted to drivers only
  - Enhanced Admin modal aesthetics with `backdrop-blur` transparent backgrounds
- **Logic & Performance**
  - Optimized review fetching mechanisms and API response mapping
  - Refactored `myTrip` data mapping to utilize professional backend rating data

### Fixed
- **Admin Components**
  - Resolved data rendering issues in the User Review Modal caused by incorrect API pathing
  - MyTrip page buttons display issues


## [1.0.8] - 2026-02-16 - (Narathaip)

### Added 
- **Passenger Trip Progress & Reporting (MyTrip)**
  - Trip Status Progress Modal: 3-step journey tracking (Pending → Confirmed → Completed)
  - Report button with SVG document icon in header (right-aligned)
  - Report status display with color-coded badges (Pending/Approved/Rejected/Resolved)
  - Mock trip data: 4 sample trips with various statuses for testing
  - Auto-select functionality: First trip auto-selected on page load
  - Helper functions: `getStatusDotClass()`, `getStatusText()`, `getStatusDescription()`, `getReportStatusText()`
  - TripStatusProgressIcon component: Reusable progress visualization

### Changed
- Report button behavior: Changed from conditional rendering to always-visible with disabled state
- Disabled icon rendering: Switched from Font Awesome to inline SVG for consistency


## [1.0.9] - 2026-02-16 - (Narathaip)

### Added
- **Driver Route Reporting (MyRoute)**
  - Driver Report Modal with full form interface
  - Report category dropdown: 6 issue types (vehicle_issue, passenger_issue, road_issue, safety_issue, payment_issue, other)
  - Text input field for detailed description (optional)
  - Image upload capability: Max 2 images per report with preview and removal
  - Image validation: File type and count validation before submission
  - Driver report functions: `openDriverReportModal()`, `closeDriverReportModal()`, `handleDriverReportFiles()`, `removeDriverReportImage()`, `submitDriverReport()`
  - Form validation: Category selection required before submission
  - Report Modal state management: `showDriverReportModal`, `reportedRoute`, `driverReportCategory`, `driverReportText`, `driverReportImages`

### Changed
- Consistent styling with passenger report system
- Report button styling: Red button positioned with Edit/Complete actions

### Fixed
- File upload handling: Proper FormData construction for backend submission


## [1.0.10] - 2026-02-17 - (Panya)

### Added
- Add review tests case at folder tests/backend 


## [1.0.11] - 2026-02-17 - (Pavarit)

### Added
- **Report System (Prisma)**
  - New `Report` model in `schema.prisma` with relationships to `User` (Reporter & Target), `Route`, and `Booking`
  - Backend `ReportService` implemented with Prisma (replacing legacy mock data)
  - Support for `ReportCategory` (Vehicle, Passenger, Safety, Payment, etc.)
  - Support for `ReportStatus` (Pending, Approved, Rejected, Resolved)
- **Enhanced Report Tracking (Passenger & Driver)**
  - "Track Status" button replaces "Report" once a report is submitted
  - Tabbed View in `myTrip` Progress Modal for switching between Trip Details and Report Status
  - Professional Report Status timeline/card with admin feedback and timestamps
  - Background synchronization of report states using `/api/reports/me`

### Changed
- Unified passenger and driver reporting logic to use a single backend API contract
- Localized Thai status and category labels across the application


## [1.0.12] - 2026-02-17 - (Pavarit)

### Added
- **UI/UX Polishing**
  - **Skeleton Loaders** for `myTrip` and `myRoute` lists to improve perceived performance during data fetching

### Changed
- Cleared legacy hardcoded mock data in `allTrips` to prevent incorrect data flashing on load

### Fixed
- Resolved fetching bug in `myTrip` where review data was not loaded for the auto-selected first trip on initial mount


## [1.0.13] - 2026-02-17 - (Pavarit)

### Added
- **Admin Report Management Refinements**
  - **Flexible Search**: Allows searching for reporters/users by First Name, Last Name, Username, or Email
  - **Target User Search**: Dedicated filter to specifically find reports submitted against a particular person
  - Thai localization for Report Type (คนขับ/ผู้โดยสาร) and Status badges in the admin table

### Changed
- Streamlined Admin UI by removing mandatory User ID requirements from search labels for better practicality
- Improved Report Detail view to show full Target User names instead of raw IDs


## [1.0.14] - 2026-02-17 - (Narathaip)

### Fixed
- Resolved nuxt & prisma


## [1.0.15] - 2026-02-17 - (Narathaip)
### Added 
- Quick status buttons (3 buttons:Pending/Approved/Rejected)

### Fixed
- Reporter avatar not displaying


## [1.0.16] - 2026-02-17 - (Pavarit)

### Added
- **Expand Report Status**
  - Added `RESOLVED` (แก้ไขแล้ว) status to reports
  - Integrated "RESOLVED" into quick action buttons, filters, and badges across the Admin Dashboard
- **Role-Specific Report Categories**
  - Tailored reporting options based on user role (Driver vs Passenger) for better context
  - Added new `NO_SHOW` (ผู้โดยสารไม่มาพบตามจุดนัดหมาย) category for drivers
- **Reporting System Enhancements**
  - Automated Thai translation for report statuses in system notifications
  - Added **Category** column to Admin Report list view
  - Displayed detailed resolution info (Resolved By/At) in report details for all terminal states

### Changed
- Refactored `myTrip` progress modal to remove redundant tabs and fix layout overflow issues


## [1.0.17] - 2026-02-17 - (Pavarit)

### Added
- **Swagger API Documentation**
  - Add `Review` and `Report` API documentation
- **AI Declaration**
  - Add AI Declaration documentation

### Changed
- `Route` Swagger API endpint documentation 


## [1.0.18] - 2026-02-17 - (Panya)

### Added
- Add report and admin report status test case at folder tests/backend


## [1.0.19] - 2026-02-17 - (Panya)

### Changed
- Update report and admin report status test case


## [2.0.0] - 2026-03-02 - (Pavarit)

### Added
- **Arrival Notification System**
  - **Driver UI**: "แจ้งถึงในอีกกี่นาที" button on `current-trip` page for drivers
  - **Passenger UI**: Real-time arrival notifications with countdown timer
  - **Booking Service**: `notifyArrival` method to handle arrival notifications
  - **Notification Service**: `sendArrivalNotification` method for WebSocket broadcasting
  - **WebSocket Integration**: Real-time arrival updates to passengers
  - **Quick Selection**: 5, 10, 15, 20, 25, 30 minute presets for arrival time
  - **Validation**: Arrival time validation and submission error handling

### Changed
- **Current Trip Page**: Enhanced driver action buttons with arrival notification option
- **Booking Status**: Added `NOTIFIED_ARRIVAL` status for tracking
- **WebSocket Messages**: New `ARRIVAL_NOTIFICATION` event type for real-time updates
- **UI/UX**: Arrival time picker modal with modern design and quick selection buttons

### Fixed
- **WebSocket Connectivity**: Fixed connection issues by removing hardcoded user IDs
- **Booking Data**: Resolved issues with booking data fetching and display
- **UI Responsiveness**: Improved layout for driver action buttons on mobile devices


## [2.0.1] - 2026-03-03 - (Narathaip)

### Added
- **Bubble Chat Notification Center**
  - **Centralized Mediator**: Converted `DriverChat` to `BubbleChat` for trip status notifications (In-only).
  - **Persistence Store**: Implemented `LocalStorage` notification history to ensure data persists after re-entering the session.
  - **"Check Status" Button**: Added a dedicated button for passengers to monitor real-time driver updates.

### Changed
- **Communication Flow**: Optimized as a status mediator between Driver and Passenger based on the current trip lifecycle.
- **Premium Visualization**: Enhanced notification card design with dedicated iconography for Arrival, Check-in, and Status updates.


## [2.0.2] - 2026-03-03 - (์Narathaip)

### Changed
- **Notification Lifecycle**: 
  - Removed automatic timeouts that prematurely cleared trip notifications.
  - Notifications now persist in the buffer until the user explicitly acknowledges the trip completion via the "OK", "Skip", or "Save Review" buttons.
  - Ensured chat history is cleared synchronously for both drivers and passengers upon closing the review modal.
- **Navigation Reliability**: Upgraded `router.push` to `navigateTo` across the notification components (`NotiChat.vue`, `default.vue`) for more stable Nuxt 3 routing.
- **Top-Level Modals**: Re-structured HTML modals in `current-trip.vue` to prevent element nesting issues and layout bugs.

### Fixed
- **Trip Completion Crash**: Fixed a critical bug where completing a trip caused a white screen crash due to a missing `null` check on the `activeTrip` object.

## [2.0.3] - 2026-03-03 - (Panya)

### Added
- UAT for test driver send notification to passenger
- API Integration for test driver send notification to passenger

## [2.0.4] - 2026-03-03 - (Yasinthon)

### Added
- API Integration for test driver report incident to admin


## [2.0.5] - 2026-03-03 - (Pavarit)

### Added
- **Email Notification System**
  - **Driver UI**: "แจ้งถึงในอีกกี่นาที" button on `current-trip` page for drivers
  - **Passenger UI**: Real-time arrival notifications with countdown timer
  - **Booking Service**: `notifyArrival` method to handle arrival notifications
  - **Notification Service**: `sendArrivalNotification` method for WebSocket broadcasting
  - **WebSocket Integration**: Real-time arrival updates to passengers
  - **Quick Selection**: 5, 10, 15, 20, 25, 30 minute presets for arrival time
  - **Validation**: Arrival time validation and submission error handling 
  - **Email Service**: `sendArrivalNotificationEmail` method for sending arrival notifications to passengers
  - **Email Service**: `sendNoShowEmail` method for sending no-show 
- UAT for test driver report incident to admin

## [2.0.6] - 2026-03-03 - (Arimeta)

### Changed
- **Refact folder name**
  - docs to doc
  - src to code
  - tests to test

### Added
- **Folders**
  - Added adapt_blueprint and test_report in doc
  - Added test_data and test_design in folder test
- **Documents**
  - Added User_manual, adapt_blueprint and test_report to doc
  - Added sprint2 to sprint_backlog
  - Added test_data and test_design to test

## [2.0.7] - 2026-03-15 - (Narathaip)

### Fixed
- **Frontend Build Recovery**
  - Fixed `RollupError` in `pages/current-trip.vue` caused by malformed HTML (redundant `</div>` tag).
  - Fixed `SyntaxError` in `app.vue` caused by duplicate `useAuth` declarations.
- **UI Restoration**
  - Restored the Navigation Bar in `pages/current-trip.vue` by reactivating the header section.
- **Docker Build**
  - Resolved build failures preventing `docker compose up --build` from completing.

### Added / Improved
- **Authentication Stability**
  - Added `fetchMe` to `useAuth` composable to reliably sync user profiles.
  - Improved Layouts (`default.vue`, `default_v1.vue`) to automatically handle missing user data and restore Login/Register visibility.
- **Database Support**
  - Streamlined database reset and seeding process by ensuring connectivity.


## [2.0.8] - 2026-03-15 - (Narathaip)

### Added / Improved
- **Enhanced Arrival Notification System**
  - Added **Driver's Name** to the passenger arrival modal for better identification.
  - Implemented **Theme-based UI**: The notification modal now dynamically switches to an **Orange/Amber** theme when an emergency or delay is reported.
  - Added support for **"เหตุผลที่มาถึงช้า" (Reason for Delay)** allowing drivers to provide context for arrival updates.
  - Improved **Emergency Alert Persistence**: Ensured emergency notifications reappear for passengers if a new alert is sent, even if the previous modal was dismissed.
- **Backend API & Validation**
  - Updated `Booking` validations to support `reason` and `minutes` in arrival notifications.
  - Added robust validation for `notify-wait` and `passenger-status` updates.

### Fixed
- **UI & Layout Stability**
  - Resolved a **Duplicate Overlay** issue in `pages/current-trip.vue` where multiple backdrop elements were rendering simultaneously.
  - Cleaned up redundant HTML tags causing layout inconsistencies in the trip management interface.
=======
# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning.

---

## [1.0.0] - 2026-02-11 - (Pavarit)

### Added
- Dockerfile into frontend and backend
- Docker Compose for local development
- .env file for Docker Compose
- Gitignore for .env files

### Changed
- Frontend api base url to environment variable

### Fixed


## [1.0.1] - 2026-02-12 - (Pavarit)

### Added
- Dockerfile.dev into frontend and backend
- docker-compose.dev.yml for local development

### Changed
- Dockerignore in frontend and backend

### Fixed
- Hmr reload issue in frontend for docker dev
- Hmr reload issue in frontend for docker dev


## [1.0.2] - 2026-02-13 - (Pavarit)

### Added
- End route api endpoint in server
- End route button in frontend

### Changed


### Fixed
- Route status tab bugs


## [1.0.3] - 2026-02-14 - (์Narathip)

### Added
- Review and Report modals with image upload (max 2 images) and star rating
- Review/Report buttons myTrip pages

### Changed
- myTrip conditional button display for "All" tab


## [1.0.4] - 2026-02-14 - (Panya)

### Added
- Review below my route on myTrip pages

### Changed
- Review buttons on myTrip pages disible when reviewed


## [1.0.5] - 2026-02-14 - (Pavarit)

### Added
- Review schema (migration)
- Review api endpoint in server (create, retrieve)
- Review route

### Changed
- User and Route schema to relate with review schema

### Fixed
- Hmr reload issue in frontend for docker dev


## [1.0.6] - 2026-02-15 - (Narathaip)

### Added
- Admin Report Management module:
  - Backend: CRUD endpoints (controller + service), Zod validation, routing
  - API docs: Swagger documentation for report endpoints
  - Frontend: composables + admin pages (list, detail, edit)
- AdminSidebar: navigation link for Report Management

### Changed
- Report type classification simplified to Driver/Passenger
- Note: Prisma models reused, no schema changes


## [1.0.7] - 2026-02-16 - (Pavarit)

### Added
- **Booking & Trip Management**
  - Driver rating and review on `myTrip` page
  - Driver reviews section in trip details
  - Self-booking prevention on `findTrip` page (drivers cannot book their own routes)
- **Admin Dashboard**
  - Route Reviews section in Route Details page
  - Individual User Review Modal in User Management list
  - Star action button in User table for quick review access
  - Included `ratingAverage` and `ratingCount` in the administrative user fetch API

### Changed
- **User Interface & UX**
  - Navigation bar visibility: "Create Trip" is now restricted to drivers only
  - Enhanced Admin modal aesthetics with `backdrop-blur` transparent backgrounds
- **Logic & Performance**
  - Optimized review fetching mechanisms and API response mapping
  - Refactored `myTrip` data mapping to utilize professional backend rating data

### Fixed
- **Admin Components**
  - Resolved data rendering issues in the User Review Modal caused by incorrect API pathing
  - MyTrip page buttons display issues


## [1.0.8] - 2026-02-16 - (Narathaip)

### Added 
- **Passenger Trip Progress & Reporting (MyTrip)**
  - Trip Status Progress Modal: 3-step journey tracking (Pending → Confirmed → Completed)
  - Report button with SVG document icon in header (right-aligned)
  - Report status display with color-coded badges (Pending/Approved/Rejected/Resolved)
  - Mock trip data: 4 sample trips with various statuses for testing
  - Auto-select functionality: First trip auto-selected on page load
  - Helper functions: `getStatusDotClass()`, `getStatusText()`, `getStatusDescription()`, `getReportStatusText()`
  - TripStatusProgressIcon component: Reusable progress visualization

### Changed
- Report button behavior: Changed from conditional rendering to always-visible with disabled state
- Disabled icon rendering: Switched from Font Awesome to inline SVG for consistency


## [1.0.9] - 2026-02-16 - (Narathaip)

### Added
- **Driver Route Reporting (MyRoute)**
  - Driver Report Modal with full form interface
  - Report category dropdown: 6 issue types (vehicle_issue, passenger_issue, road_issue, safety_issue, payment_issue, other)
  - Text input field for detailed description (optional)
  - Image upload capability: Max 2 images per report with preview and removal
  - Image validation: File type and count validation before submission
  - Driver report functions: `openDriverReportModal()`, `closeDriverReportModal()`, `handleDriverReportFiles()`, `removeDriverReportImage()`, `submitDriverReport()`
  - Form validation: Category selection required before submission
  - Report Modal state management: `showDriverReportModal`, `reportedRoute`, `driverReportCategory`, `driverReportText`, `driverReportImages`

### Changed
- Consistent styling with passenger report system
- Report button styling: Red button positioned with Edit/Complete actions

### Fixed
- File upload handling: Proper FormData construction for backend submission


## [1.0.10] - 2026-02-17 - (Panya)

### Added
- Add review tests case at folder tests/backend 


## [1.0.11] - 2026-02-17 - (Pavarit)

### Added
- **Report System (Prisma)**
  - New `Report` model in `schema.prisma` with relationships to `User` (Reporter & Target), `Route`, and `Booking`
  - Backend `ReportService` implemented with Prisma (replacing legacy mock data)
  - Support for `ReportCategory` (Vehicle, Passenger, Safety, Payment, etc.)
  - Support for `ReportStatus` (Pending, Approved, Rejected, Resolved)
- **Enhanced Report Tracking (Passenger & Driver)**
  - "Track Status" button replaces "Report" once a report is submitted
  - Tabbed View in `myTrip` Progress Modal for switching between Trip Details and Report Status
  - Professional Report Status timeline/card with admin feedback and timestamps
  - Background synchronization of report states using `/api/reports/me`

### Changed
- Unified passenger and driver reporting logic to use a single backend API contract
- Localized Thai status and category labels across the application


## [1.0.12] - 2026-02-17 - (Pavarit)

### Added
- **UI/UX Polishing**
  - **Skeleton Loaders** for `myTrip` and `myRoute` lists to improve perceived performance during data fetching

### Changed
- Cleared legacy hardcoded mock data in `allTrips` to prevent incorrect data flashing on load

### Fixed
- Resolved fetching bug in `myTrip` where review data was not loaded for the auto-selected first trip on initial mount


## [1.0.13] - 2026-02-17 - (Pavarit)

### Added
- **Admin Report Management Refinements**
  - **Flexible Search**: Allows searching for reporters/users by First Name, Last Name, Username, or Email
  - **Target User Search**: Dedicated filter to specifically find reports submitted against a particular person
  - Thai localization for Report Type (คนขับ/ผู้โดยสาร) and Status badges in the admin table

### Changed
- Streamlined Admin UI by removing mandatory User ID requirements from search labels for better practicality
- Improved Report Detail view to show full Target User names instead of raw IDs


## [1.0.14] - 2026-02-17 - (Narathaip)

### Fixed
- Resolved nuxt & prisma


## [1.0.15] - 2026-02-17 - (Narathaip)
### Added 
- Quick status buttons (3 buttons:Pending/Approved/Rejected)

### Fixed
- Reporter avatar not displaying


## [1.0.16] - 2026-02-17 - (Pavarit)

### Added
- **Expand Report Status**
  - Added `RESOLVED` (แก้ไขแล้ว) status to reports
  - Integrated "RESOLVED" into quick action buttons, filters, and badges across the Admin Dashboard
- **Role-Specific Report Categories**
  - Tailored reporting options based on user role (Driver vs Passenger) for better context
  - Added new `NO_SHOW` (ผู้โดยสารไม่มาพบตามจุดนัดหมาย) category for drivers
- **Reporting System Enhancements**
  - Automated Thai translation for report statuses in system notifications
  - Added **Category** column to Admin Report list view
  - Displayed detailed resolution info (Resolved By/At) in report details for all terminal states

### Changed
- Refactored `myTrip` progress modal to remove redundant tabs and fix layout overflow issues


## [1.0.17] - 2026-02-17 - (Pavarit)

### Added
- **Swagger API Documentation**
  - Add `Review` and `Report` API documentation
- **AI Declaration**
  - Add AI Declaration documentation

### Changed
- `Route` Swagger API endpint documentation 


## [1.0.18] - 2026-02-17 - (Panya)

### Added
- Add report and admin report status test case at folder tests/backend


## [1.0.19] - 2026-02-17 - (Panya)

### Changed
- Update report and admin report status test case


## [2.0.0] - 2026-03-02 - (Pavarit)

### Added
- **Arrival Notification System**
  - **Driver UI**: "แจ้งถึงในอีกกี่นาที" button on `current-trip` page for drivers
  - **Passenger UI**: Real-time arrival notifications with countdown timer
  - **Booking Service**: `notifyArrival` method to handle arrival notifications
  - **Notification Service**: `sendArrivalNotification` method for WebSocket broadcasting
  - **WebSocket Integration**: Real-time arrival updates to passengers
  - **Quick Selection**: 5, 10, 15, 20, 25, 30 minute presets for arrival time
  - **Validation**: Arrival time validation and submission error handling

### Changed
- **Current Trip Page**: Enhanced driver action buttons with arrival notification option
- **Booking Status**: Added `NOTIFIED_ARRIVAL` status for tracking
- **WebSocket Messages**: New `ARRIVAL_NOTIFICATION` event type for real-time updates
- **UI/UX**: Arrival time picker modal with modern design and quick selection buttons

### Fixed
- **WebSocket Connectivity**: Fixed connection issues by removing hardcoded user IDs
- **Booking Data**: Resolved issues with booking data fetching and display
- **UI Responsiveness**: Improved layout for driver action buttons on mobile devices


## [2.0.1] - 2026-03-03 - (Narathaip)

### Added
- **Bubble Chat Notification Center**
  - **Centralized Mediator**: Converted `DriverChat` to `BubbleChat` for trip status notifications (In-only).
  - **Persistence Store**: Implemented `LocalStorage` notification history to ensure data persists after re-entering the session.
  - **"Check Status" Button**: Added a dedicated button for passengers to monitor real-time driver updates.

### Changed
- **Communication Flow**: Optimized as a status mediator between Driver and Passenger based on the current trip lifecycle.
- **Premium Visualization**: Enhanced notification card design with dedicated iconography for Arrival, Check-in, and Status updates.


## [2.0.2] - 2026-03-03 - (์Narathaip)

### Changed
- **Notification Lifecycle**: 
  - Removed automatic timeouts that prematurely cleared trip notifications.
  - Notifications now persist in the buffer until the user explicitly acknowledges the trip completion via the "OK", "Skip", or "Save Review" buttons.
  - Ensured chat history is cleared synchronously for both drivers and passengers upon closing the review modal.
- **Navigation Reliability**: Upgraded `router.push` to `navigateTo` across the notification components (`NotiChat.vue`, `default.vue`) for more stable Nuxt 3 routing.
- **Top-Level Modals**: Re-structured HTML modals in `current-trip.vue` to prevent element nesting issues and layout bugs.

### Fixed
- **Trip Completion Crash**: Fixed a critical bug where completing a trip caused a white screen crash due to a missing `null` check on the `activeTrip` object.

## [2.0.3] - 2026-03-03 - (Panya)

### Added
- UAT for test driver send notification to passenger
- API Integration for test driver send notification to passenger

## [2.0.4] - 2026-03-03 - (Yasinthon)

### Added
- API Integration for test driver report incident to admin


## [2.0.5] - 2026-03-03 - (Pavarit)

### Added
- **Email Notification System**
  - **Driver UI**: "แจ้งถึงในอีกกี่นาที" button on `current-trip` page for drivers
  - **Passenger UI**: Real-time arrival notifications with countdown timer
  - **Booking Service**: `notifyArrival` method to handle arrival notifications
  - **Notification Service**: `sendArrivalNotification` method for WebSocket broadcasting
  - **WebSocket Integration**: Real-time arrival updates to passengers
  - **Quick Selection**: 5, 10, 15, 20, 25, 30 minute presets for arrival time
  - **Validation**: Arrival time validation and submission error handling 
  - **Email Service**: `sendArrivalNotificationEmail` method for sending arrival notifications to passengers
  - **Email Service**: `sendNoShowEmail` method for sending no-show 
- UAT for test driver report incident to admin

## [2.0.6] - 2026-03-03 - (Arimeta)

### Changed
- **Refact folder name**
  - docs to doc
  - src to code
  - tests to test

### Added
- **Folders**
  - Added adapt_blueprint and test_report in doc
  - Added test_data and test_design in folder test
- **Documents**
  - Added User_manual, adapt_blueprint and test_report to doc
  - Added sprint2 to sprint_backlog
  - Added test_data and test_design to test


## [3.0.0] - 2026-03-15 - (Narathaip)

### Fixed
- **Frontend Build Recovery**
  - Fixed `RollupError` in `pages/current-trip.vue` caused by malformed HTML (redundant `</div>` tag).
  - Fixed `SyntaxError` in `app.vue` caused by duplicate `useAuth` declarations.
- **UI Restoration**
  - Restored the Navigation Bar in `pages/current-trip.vue` by reactivating the header section.
- **Docker Build**
  - Resolved build failures preventing `docker compose up --build` from completing.

### Added / Improved
- **Authentication Stability**
  - Added `fetchMe` to `useAuth` composable to reliably sync user profiles.
  - Improved Layouts (`default.vue`, `default_v1.vue`) to automatically handle missing user data and restore Login/Register visibility.
- **Database Support**
  - Streamlined database reset and seeding process by ensuring connectivity.


## [3.0.1] - 2026-03-15 - (Narathaip)

### Added / Improved
- **Enhanced Arrival Notification System**
  - Added **Driver's Name** to the passenger arrival modal for better identification.
  - Implemented **Theme-based UI**: The notification modal now dynamically switches to an **Orange/Amber** theme when an emergency or delay is reported.
  - Added support for **"เหตุผลที่มาถึงช้า" (Reason for Delay)** allowing drivers to provide context for arrival updates.
  - Improved **Emergency Alert Persistence**: Ensured emergency notifications reappear for passengers if a new alert is sent, even if the previous modal was dismissed.
- **Backend API & Validation**
  - Updated `Booking` validations to support `reason` and `minutes` in arrival notifications.
  - Added robust validation for `notify-wait` and `passenger-status` updates.

### Fixed
- **UI & Layout Stability**
  - Resolved a **Duplicate Overlay** issue in `pages/current-trip.vue` where multiple backdrop elements were rendering simultaneously.
  - Cleaned up redundant HTML tags causing layout inconsistencies in the trip management interface.


## [3.0.2] - 2026-03-16 - (Pavarit)

### Added / Improved
- **Global Arrival Notification System**
  - Migrated the **High-Awareness Arrival Modal** from `current-trip.vue` to `layouts/default.vue`, enabling global visibility across all pages.
  - Implemented **Auto-Dismiss for Chat**: The Trip Chat bubble now automatically closes when the arrival modal appears to prevent UI overlap and ensure passenger awareness.
  - Redesigned **Arrival Chat Dialogue**: Upgraded arrival notifications within the trip chat to feature a **High-Awareness Dialogue UI** (matching the modal's aesthetic) for better visibility.
  - Improved **Global Socket Synchronization**: Optimized the `booking:driverArriving` listener to handle real-time updates globally.
- **Backend & Endpoint Optimization**
  - Refined the **Arrival Notification Endpoint** logic to dynamically detect existing notices and set the `isUpdate` flag.
  - Updated the API to handle the `reason` field, enabling drivers to send context-rich arrival updates.
  - Added `ENABLE_EMAIL_NOTIFICATION` environment variable to control the email notification service during development and testing.
- **Icon Modernization & Performance**

### Fixed
- **UI Redundancy & Cleanup**
  - Removed duplicate arrival modal templates and conflicting logic from `layouts/default.vue` and `current-trip.vue`.
  - Resolved **Missing Icon** issues in the global modal and notification panels caused by outdated library references.
  - Fixed Z-index layering issues between chat bubbles and high-priority notification overlays.
>>>>>>> main
