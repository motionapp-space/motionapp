# Template Detail Read/Edit Mode Fix

## Problem
The TemplateDetail page was only showing raw JSON data instead of rendering the actual template editor UI. Users couldn't view or edit templates properly.

## Solution
Completely refactored `src/pages/TemplateDetail.tsx` to:

1. **Render Full Editor UI**: Now uses the same components as TemplateEditor (DayCardCompact, form inputs, etc.)
2. **Support Read/Edit Modes**: Handles both modes via query parameters
3. **Mode Toggling**: Users can switch between read and edit modes seamlessly
4. **Save Functionality**: Properly saves changes and returns to read mode
5. **Backward Compatibility**: Still supports the old `?readonly=1` parameter

## Key Features

### URL Structure
- **Read Mode**: `/templates/:id?mode=read` (default)
- **Edit Mode**: `/templates/:id?mode=edit`
- **Backward Compatibility**: `/templates/:id?readonly=1` → read mode

### Read Mode
- Shows "Sola lettura" badge
- "Modifica" button to enter edit mode
- All inputs disabled
- No add/delete buttons visible
- Export PDF available

### Edit Mode
- No read-only badge
- "Salva" and "Annulla" buttons
- All inputs enabled
- Can add/edit/delete days and exercises
- Auto-returns to read mode after saving

## Technical Changes

### Before
```tsx
// Only showed JSON
<pre className="text-xs overflow-auto p-4 bg-muted rounded">
  {JSON.stringify(data.data, null, 2)}
</pre>
```

### After
```tsx
// Full editor UI with state management
const [days, setDays] = useState<Day[]>([]);
const [name, setName] = useState("");
// ... all editor functionality

// Renders actual editor components
<DayCardCompact
  key={day.id}
  day={day}
  onUpdateTitle={(title) => handleUpdateDayTitle(day.id, title)}
  // ... all edit handlers
  readonly={readonly}
/>
```

## Files Changed

1. **src/pages/TemplateDetail.tsx**
   - Complete rewrite to include full editor functionality
   - Added state management for days, name, description, category
   - Added all CRUD handlers (add, update, duplicate, delete)
   - Integrated save functionality
   - Added mode toggling logic

2. **TEMPLATE_TESTING.md**
   - Comprehensive testing guide
   - Manual test scenarios
   - Expected behaviors
   - Common issues to watch for

3. **TEMPLATE_FIX_SUMMARY.md** (this file)
   - Documentation of the fix
   - Before/after comparison

## Navigation Flow

### From Template List
```
Templates Page → Click "Apri" → /templates/:id?mode=read
Templates Page → Click "Modifica" → /templates/:id?mode=edit
```

### From Client Plan
```
Client Detail → Click "derivato da template" → /templates/:id?mode=read
```

### Within Template Detail
```
Read Mode → Click "Modifica" → Edit Mode
Edit Mode → Click "Salva" → Save + return to Read Mode
Edit Mode → Click "Annulla" → Discard changes + return to Read Mode
```

## Error Handling

### Template Not Found (404)
- Redirects to `/templates/:id/missing`
- Shows recovery options
- Doesn't crash or show blank page

## Testing

See `TEMPLATE_TESTING.md` for:
- Complete test scenarios
- Manual testing checklist
- Expected behaviors for each scenario
- Common issues and troubleshooting

## Maintenance Notes

### To Prevent Future Breakage
1. Always test both read and edit modes when making changes
2. Ensure all form inputs respect the `readonly` prop
3. Verify mode toggling works correctly
4. Test saving and canceling functionality
5. Check that 404s redirect properly

### Key Props to Remember
- `readonly={mode === "read"}` - Controls edit access
- `disabled={readonly}` - For all input fields
- `data-testid` attributes - For testing

## Related Components

- `src/components/plan-editor/DayCardCompact.tsx` - Day display/edit component
- `src/components/plan-editor/ExerciseRowCompact.tsx` - Exercise display/edit
- `src/features/templates/hooks/useTemplate.ts` - Template fetching
- `src/features/templates/hooks/useUpdateTemplate.ts` - Template updates
- `src/pages/Plans.tsx` - Template list page
