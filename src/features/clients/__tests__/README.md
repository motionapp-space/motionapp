# Clients Tests

## Test Coverage

The clients feature has comprehensive test coverage for:

### Unit Tests
- **API Layer** (`clients-api.test.ts`)
  - List clients with various filters
  - Search functionality
  - Active plan filtering
  - Active package filtering  
  - Last access filtering
  - Sorting (name, date, updated)
  - Pagination
  - Data transformation

- **Filter Utils** (`clients-filters.test.ts`)
  - Default filters parsing
  - URL params to filters conversion
  - Filters to URL params conversion
  - Multiple filter combinations

### Integration Tests
- **Clients List Page** (`clients-list.test.tsx`)
  - Rendering 20+ clients
  - Column display (Client, Status, Plan, Package, Last Session, Last Access, Actions)
  - Search by name/email
  - Filter by status (Active, Potential, Inactive, Archived)
  - Filter by "with active plan" checkbox
  - Filter by "with active package" checkbox
  - Filter by last access (7/30/90 days)
  - Combined filters (search + status + checkboxes)
  - Sorting by different columns
  - Empty states (no clients, no results)
  - Navigation to client profile
  - Responsive behavior (mobile/desktop)

## Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test clients-api.test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

## Test Files Structure

```
src/features/clients/__tests__/
├── clients-list.test.tsx      # Integration tests for the Clients page
├── clients-api.test.ts         # Unit tests for API functions
├── clients-filters.test.ts     # Unit tests for filter utilities
└── README.md                   # This file
```

## Key Test Scenarios

### Data Display
✅ All client data renders correctly
✅ Package sessions show as "5/10" format
✅ Plan name displays or shows "—"
✅ Dates formatted correctly (dd/MM/yy)
✅ Status badges colored appropriately

### Filtering
✅ Search filters by name and email
✅ Status dropdown filters correctly
✅ "With active plan" checkbox works
✅ "With active package" checkbox works
✅ Last access dropdown works (7/30/90 days)
✅ All filters work in combination

### User Interactions
✅ Click client row navigates to profile
✅ Archive/unarchive buttons work
✅ Sort options update the list
✅ Empty states show appropriate messages

### Performance
✅ Handles lists of 20+ clients without issues
✅ Pagination works correctly
✅ Filters update dynamically without full reload

## Notes

- Tests use mocked Supabase client to avoid database dependencies
- React Query is properly set up in test environment
- All tests include proper cleanup and isolation
- Tests cover both success and error scenarios
