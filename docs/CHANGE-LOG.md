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