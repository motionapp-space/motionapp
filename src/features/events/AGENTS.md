# EVENTS FEATURE KNOWLEDGE BASE

## OVERVIEW
Manages calendar scheduling, availability, and booking for Coaches and Clients.

## STRUCTURE
- **Calendar UI**: Built on `react-big-calendar` or custom grid.
- **Data Source**: `events` table (PostgreSQL).
- **Booking**: `booking_requests` table for pending approvals.

## KEY CONCEPTS
- **Event Types**:
  - `session`: Linked to a `training_session` and `client_plan`.
  - `block`: Coach unavailability / Out of Office.
  - `appointment`: Generic meeting.
- **Logic**:
  - **Availability**: Checks against `availability_windows` and existing `events`.
  - **Conflict**: Backend functions prevent overlapping bookings if configured.
  - **Recurrence**: Supported for availability windows (weekly).
