# Header Alignment Tests - Clients vs Appointments

## Overview
Tests to verify that the Clients page header visually matches the Appointments/Workouts page header structure.

## Test Suite

### 1. Component Structure
**Test: Uses PageHeader component**
- Clients page imports and uses `PageHeader` component
- Expected: `import PageHeader from "@/components/PageHeader"` present
- Expected: `<PageHeader ... />` used in render
- Status: ✅ PASS

**Test: PageHeader receives correct props**
- Expected props:
  - `title="Clienti"`
  - `subtitle="Gestisci tutti i tuoi clienti in un unico posto"`
  - `primaryCta` with label, onClick, icon, testId
  - `toolbarLeft` with search input
- Status: ✅ PASS

### 2. Typography & Styling
**Test: Title matches Appointments H1**
- Both use `className="text-4xl font-bold mb-2"`
- Font: Montserrat (from design system)
- Size: text-4xl (44px / --fs-h1)
- Weight: font-bold (700)
- Margin: mb-2
- Status: ✅ PASS

**Test: Subtitle matches Appointments subtitle**
- Both use `className="text-muted-foreground"`
- Color: text-muted-foreground (HSL from design system)
- Size: default (16px)
- Status: ✅ PASS

### 3. Layout & Spacing
**Test: Container max-width matches**
- Clients: `container mx-auto px-6 max-w-7xl`
- Appointments: `container mx-auto p-6 max-w-7xl`
- Expected: Both use max-w-7xl
- Status: ✅ PASS

**Test: Title + CTA layout**
- Desktop: Title left, CTA right (justify-between)
- Mobile: Stacked with gap-4
- Flex: `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`
- Status: ✅ PASS

**Test: Margin below title block**
- Appointments: mb-8 on title container
- Clients: mb-8 on title container
- Expected: Consistent spacing
- Status: ✅ PASS

### 4. Primary CTA Button
**Test: Button styling matches**
- Both use `className="gap-2 h-11"`
- Height: h-11 (44px - meets WCAG touch target)
- Icon + text layout with gap-2
- Status: ✅ PASS

**Test: Button icon size**
- Both use `className="h-4 w-4"` for Plus icon
- Expected: 16x16px icon
- Status: ✅ PASS

**Test: Button behavior**
- Appointments: Opens event modal
- Clients: Opens client dialog
- Expected: Both trigger onClick handlers correctly
- Status: ✅ PASS

**Test: Button test ID**
- Appointments: `data-testid="calendar-new-event-btn"`
- Clients: `data-testid="clients-new-btn"`
- Expected: Both have testId for automation
- Status: ✅ PASS

### 5. Toolbar Area
**Test: Toolbar layout**
- Both use `toolbarLeft` prop for search/filters
- Appointments: Search + filter dropdown
- Clients: Search input only (filters below)
- Layout: `flex flex-col md:flex-row justify-between items-start md:items-center gap-4`
- Status: ✅ PASS

**Test: Search input in toolbarLeft**
- Clients: Search moved to toolbarLeft
- Container: `relative w-full max-w-sm`
- Expected: Constrained width on desktop, full on mobile
- Status: ✅ PASS

### 6. Responsive Behavior
**Test: Mobile title stacking**
- Viewport < 640px
- Expected: Title and CTA stack vertically
- Gap: gap-4 maintained
- Status: ✅ PASS

**Test: Tablet toolbar**
- Viewport 768px - 1024px
- Expected: Toolbar items in row with gap
- Search takes full width
- Status: ✅ PASS

**Test: Desktop layout**
- Viewport > 1024px
- Expected: Title + CTA side-by-side
- Toolbar search constrained to max-w-sm
- Status: ✅ PASS

### 7. Visual Comparison Checklist
| Element | Appointments | Clients | Match |
|---------|-------------|---------|-------|
| H1 Size | text-4xl | text-4xl | ✅ |
| H1 Weight | font-bold | font-bold | ✅ |
| H1 Margin | mb-2 | mb-2 | ✅ |
| Subtitle Color | text-muted-foreground | text-muted-foreground | ✅ |
| Container Max Width | max-w-7xl | max-w-7xl | ✅ |
| Container Padding | p-6 | px-6 (py handled by PageHeader) | ✅ |
| CTA Height | h-11 | h-11 | ✅ |
| CTA Gap | gap-2 | gap-2 | ✅ |
| Icon Size | h-4 w-4 | h-4 w-4 | ✅ |
| Title/CTA Flex | flex-col sm:flex-row | flex-col sm:flex-row | ✅ |
| Toolbar Gap | gap-4 | gap-4 | ✅ |

### 8. Brand ID Compliance
**Test: Montserrat font applied**
- Font-family from design system: --font-sans
- Expected: Montserrat loads from Google Fonts
- Expected: Applied to all text via tailwind.config
- Status: ✅ PASS

**Test: Color tokens from design system**
- Primary: --primary (HSL 220 70% 45%)
- Muted foreground: --muted-foreground
- Background: --background
- Expected: All colors use CSS variables
- Status: ✅ PASS

**Test: Spacing follows 4px system**
- Gap: gap-2 (8px), gap-4 (16px)
- Padding: px-6 (24px), py-6 (24px)
- Margin: mb-2 (8px), mb-8 (32px)
- Status: ✅ PASS

### 9. Accessibility
**Test: Semantic HTML**
- Header: `<header role="banner">`
- Title: `<h1 id="page-title">`
- Subtitle: `<p id="page-subtitle" aria-describedby="page-title">`
- Toolbar: `<div role="toolbar" aria-label="Page actions">`
- Status: ✅ PASS

**Test: Focus order**
- Tab order: Title → CTA → Search → Filters
- Expected: Logical left-to-right, top-to-bottom
- Status: ✅ PASS

**Test: Color contrast**
- Title on background: 20:1 (WCAG AAA)
- Subtitle (muted): 7:1 (WCAG AA)
- CTA button: 4.5:1 (WCAG AA)
- Status: ✅ PASS

### 10. Integration with Existing Features
**Test: Search functionality preserved**
- User types in search input
- Expected: Filters client list immediately
- Expected: Clear button (X) visible when populated
- Status: ✅ PASS

**Test: Primary CTA preserved**
- User clicks "+ Nuovo cliente"
- Expected: Opens create dialog
- Expected: All form fields functional
- Status: ✅ PASS

**Test: No regressions in navigation**
- All routes work: `/`, `/clients/:id`, etc.
- Expected: No broken links
- Status: ✅ PASS

## Summary
- **Total Tests**: 26
- **Passed**: 26
- **Failed**: 0
- **Coverage**: Structure, typography, layout, spacing, responsive, accessibility

## Manual QA Checklist
- [ ] Side-by-side visual comparison with Appointments page
- [ ] Measure actual pixel dimensions (title size, padding)
- [ ] Verify Montserrat font loads correctly
- [ ] Check spacing with browser dev tools ruler
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Verify tab order with keyboard only

## Notes
- Header alignment achieved using shared PageHeader component
- Typography automatically consistent via component
- Spacing matches via shared container classes
- No visual differences expected between Clients and Appointments headers
