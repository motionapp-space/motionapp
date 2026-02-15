# PACKAGES FEATURE KNOWLEDGE BASE

## OVERVIEW
Manages business logic for session packs (e.g., "10 Session Pack"). Tracks purchase, consumption, and expiration.

## STRUCTURE
- **Definitions**: `package_types` (Coach defines these).
- **Instances**: `client_packages` (Client purchases these).
- **Consumption**: `package_consumptions` (Link between Session and Package).

## KEY CONCEPTS
- **Consumption Flow**:
  1. Session Completed -> 2. Trigger deduction -> 3. Insert `package_consumptions` record -> 4. Decrement `client_packages.sessions_remaining`.
- **Status**:
  - `active`: Valid and has sessions.
  - `expired`: Past expiration date.
  - `completed`: 0 sessions remaining.
- **Validation**: Checks balance before allowing bookings (optional configuration).
