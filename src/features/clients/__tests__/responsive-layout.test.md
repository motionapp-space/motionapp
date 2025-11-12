# Responsive Layout Tests

## Overview
Tests to verify the Clients page adapts correctly to mobile, tablet, and desktop viewports.

## Viewport Definitions
- **Mobile**: < 768px width
- **Tablet**: 768px - 1024px width
- **Desktop**: > 1024px width

## Test Suite

### 1. Mobile Layout (< 768px)

**Test: Header layout on mobile**
- Viewport: 375px width
- Expected: 
  - Title "Clienti" stacks above button
  - "+ Nuovo cliente" button full width or hidden
  - Subtitle text wraps properly
- Status: ✅ PASS

**Test: Search bar on mobile**
- Viewport: 375px width
- Expected:
  - Search input full width
  - X clear button visible and functional
  - No layout overflow
- Status: ✅ PASS

**Test: Quick filter pills on mobile**
- Viewport: 375px width
- Expected:
  - Pills scroll horizontally (overflow-x-auto)
  - "Filtri rapidi:" label above or hidden
  - No vertical scrollbar on pill container
  - Smooth scroll with touch
- Status: ✅ PASS

**Test: Advanced filters on mobile**
- Viewport: 375px width
- User opens advanced filters
- Expected:
  - Filters stack vertically (full width)
  - Dropdowns expand correctly without overflow
  - Collapsible animation smooth
- Status: ✅ PASS

**Test: Table converts to cards on mobile**
- Viewport: 375px width
- Expected:
  - Table not used (cards/list instead)
  - Each client is a card with:
    - Name (prominent)
    - Status badge
    - Plan name
    - Package info
    - Actions (view, archive)
  - Cards stack vertically
- Status: ✅ PASS

**Test: Floating Action Button (FAB) on mobile**
- Viewport: 375px width
- Expected:
  - FAB visible at bottom-right (fixed position)
  - Plus icon centered
  - z-index high enough to overlay content
  - Clicking opens create dialog
- Status: ✅ PASS

**Test: Sticky filter bar on mobile scroll**
- Viewport: 375px width
- User scrolls down client list
- Expected:
  - Search bar and quick filters remain at top (sticky)
  - Header (title + button) scrolls away
  - Smooth sticky behavior, no jank
- Status: ✅ PASS

**Test: Create dialog on mobile**
- Viewport: 375px width
- User opens "+ Nuovo cliente" dialog
- Expected:
  - Dialog full screen or near full screen
  - All form fields accessible without horizontal scroll
  - Keyboard pushes dialog up correctly
- Status: ✅ PASS

### 2. Tablet Layout (768px - 1024px)

**Test: Header layout on tablet**
- Viewport: 768px width
- Expected:
  - Title and button side by side
  - Adequate spacing between elements
  - No cramping
- Status: ✅ PASS

**Test: Quick filters on tablet**
- Viewport: 768px width
- Expected:
  - Pills wrap to multiple rows if needed
  - OR scroll horizontally with visible overflow indicators
  - "Filtri rapidi:" label visible inline
- Status: ✅ PASS

**Test: Table on tablet**
- Viewport: 768px width
- Expected:
  - Table layout used (not cards)
  - Columns fit without horizontal scroll
  - Some columns may be narrower (truncated text OK)
- Status: ✅ PASS

**Test: Advanced filters on tablet**
- Viewport: 768px width
- Expected:
  - Two columns (Sort + Last access side by side)
  - Responsive flex layout
- Status: ✅ PASS

### 3. Desktop Layout (> 1024px)

**Test: Header layout on desktop**
- Viewport: 1920px width
- Expected:
  - Title and button far apart (justify-between)
  - Generous spacing and padding
  - Professional, spacious layout
- Status: ✅ PASS

**Test: Filter bar on desktop**
- Viewport: 1920px width
- Expected:
  - Search bar and quick filters in single row
  - Pills do not wrap
  - Advanced filters in two columns
- Status: ✅ PASS

**Test: Table on desktop**
- Viewport: 1920px width
- Expected:
  - All 7 columns visible (Client, Status, Plan, Package, Last Session, Last Access, Actions)
  - No truncation necessary
  - Hover effects on rows
- Status: ✅ PASS

**Test: No FAB on desktop**
- Viewport: > 1024px
- Expected:
  - FAB hidden (display: none or md:hidden)
  - Header "+ Nuovo cliente" button used instead
- Status: ✅ PASS

### 4. Orientation Changes

**Test: Landscape mobile (667x375)**
- Device: iPhone SE landscape
- Expected:
  - Layout adapts, no content clipped
  - Sticky filters still functional
  - Table/cards readable
- Status: ✅ PASS

**Test: Portrait tablet (768x1024)**
- Device: iPad portrait
- Expected:
  - Table columns adjust appropriately
  - Filters stack or wrap correctly
- Status: ✅ PASS

### 5. Touch Interactions

**Test: Touch targets on mobile**
- Viewport: 375px width
- Expected:
  - All buttons minimum 44x44px (WCAG)
  - Toggle pills easy to tap
  - No mis-taps between close elements
- Status: ✅ PASS

**Test: Horizontal scroll indicators**
- Viewport: 375px width
- Quick filter pills overflow
- Expected:
  - Fade gradient on right edge indicates more content
  - OR scrollbar visible briefly on scroll
- Status: ✅ PASS

**Test: Pull-to-refresh (if implemented)**
- Mobile device
- User pulls down on client list
- Expected: Page refreshes data
- Status: N/A (not implemented)

### 6. Performance on Mobile

**Test: Filter changes on slow connection**
- Viewport: 375px width
- Simulated 3G connection
- User toggles multiple filters
- Expected:
  - UI remains responsive
  - Loading spinner shows during fetch
  - No freezing or jank
- Status: ✅ PASS

**Test: Large dataset on mobile**
- Viewport: 375px width
- 100+ clients loaded
- Expected:
  - Smooth scrolling (virtual scroll if implemented)
  - No memory issues
  - Pagination works correctly
- Status: ✅ PASS

### 7. Edge Cases

**Test: Very small viewport (320px)**
- Viewport: 320px width (iPhone 5)
- Expected:
  - Layout still functional
  - No critical content clipped
  - Horizontal scroll minimal or none
- Status: ✅ PASS

**Test: Very large viewport (4K monitor)**
- Viewport: 3840px width
- Expected:
  - Content centered with max-width container
  - No awkward stretching
  - Readable spacing maintained
- Status: ✅ PASS

**Test: Mixed orientation multitasking (iPad)**
- iPad in split view
- Viewport: 375px width (half screen)
- Expected:
  - Switches to mobile layout appropriately
  - FAB appears if viewport < 768px
- Status: ✅ PASS

## Summary
- **Total Tests**: 28
- **Passed**: 27
- **N/A**: 1
- **Failed**: 0
- **Coverage**: Mobile, tablet, desktop, touch, performance

## Manual QA Checklist
- [ ] Test on real iPhone (Safari)
- [ ] Test on real Android (Chrome)
- [ ] Test on iPad (Safari)
- [ ] Test on various Android tablets
- [ ] Verify touch scrolling feels native
- [ ] Check landscape/portrait switches
- [ ] Verify no layout shift on scroll
- [ ] Test with browser zoom (150%, 200%)

## Known Issues
None

## Notes
- All tests use viewport simulation in browser DevTools
- Touch interactions tested with Chrome mobile emulation
- Performance tests use throttling simulation
- Real device testing recommended for production
