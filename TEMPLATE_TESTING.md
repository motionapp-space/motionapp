# Template Detail Testing Guide

This document outlines the test scenarios for the Template Detail page to ensure the read/edit modes work correctly.

## Test Scenarios

### 1. Mode Handling

#### Read Mode (Default)
- **URL**: `/templates/:id` or `/templates/:id?mode=read`
- **Expected Behavior**:
  - "Sola lettura" badge is visible
  - "Modifica" button is present
  - All form inputs (name, category, description) are disabled
  - "Aggiungi giorno" button is hidden
  - Day cards show in read-only mode (no edit/delete buttons)

#### Edit Mode
- **URL**: `/templates/:id?mode=edit`
- **Expected Behavior**:
  - No "Sola lettura" badge
  - "Salva" and "Annulla" buttons are present
  - All form inputs are enabled and editable
  - "Aggiungi giorno" button is visible
  - Day cards show edit/delete buttons

#### Backward Compatibility
- **URL**: `/templates/:id?readonly=1`
- **Expected Behavior**: Should work exactly like `mode=read`

### 2. Mode Toggling

#### Read → Edit
1. Start at `/templates/:id?mode=read`
2. Click "Modifica" button
3. **Expected**: URL changes to `?mode=edit`, UI switches to edit mode

#### Edit → Read
1. Start at `/templates/:id?mode=edit`
2. Click "Annulla" button
3. **Expected**: URL changes to `?mode=read`, UI switches to read mode, unsaved changes are discarded

### 3. Editing Functionality

#### Editing Template Metadata
1. Navigate to `/templates/:id?mode=edit`
2. Change template name, category, or description
3. Click "Salva"
4. **Expected**: 
   - Success toast appears
   - Changes are saved to backend
   - Mode switches to read automatically
   - Updated values are displayed

#### Adding Days
1. Navigate to `/templates/:id?mode=edit`
2. Click "Aggiungi giorno"
3. **Expected**: New day card appears at the bottom

#### Editing Exercises
1. Navigate to `/templates/:id?mode=edit`
2. Expand a day card
3. Add/edit/duplicate/delete exercises
4. Click "Salva"
5. **Expected**: Changes persist after save

### 4. Read-Only Restrictions

#### In Read Mode
1. Navigate to `/templates/:id?mode=read`
2. Try to interact with form fields
3. **Expected**: All inputs are disabled, no editing possible
4. Try to find "Aggiungi giorno" button
5. **Expected**: Button is not present
6. Look at day cards
7. **Expected**: No edit/delete buttons visible

### 5. Error Handling

#### Template Not Found (404)
1. Navigate to `/templates/non-existent-id?mode=read`
2. **Expected**:
   - Redirects to `/templates/non-existent-id/missing`
   - Shows "Template non trovato" alert
   - Shows recovery options if coming from client plan

### 6. Navigation Flows

#### From Template List
1. On `/templates` page, click "Apri" on a template card
2. **Expected**: Opens at `/templates/:id?mode=read`

3. On `/templates` page, click "Modifica" on a template card
4. **Expected**: Opens at `/templates/:id?mode=edit`

#### From Client Plan
1. On client detail page, click "derivato da template" link
2. **Expected**: Opens at `/templates/:id?mode=read`

### 7. PDF Export

#### Export in Any Mode
1. Navigate to template detail (read or edit mode)
2. Click "PDF" button
3. **Expected**: PDF download starts with current template data

## Manual Testing Checklist

- [ ] Read mode shows correct UI elements
- [ ] Edit mode shows correct UI elements
- [ ] Backward compatibility with `readonly=1` works
- [ ] Toggle from read to edit works
- [ ] Toggle from edit to read works
- [ ] Template metadata can be edited
- [ ] Days can be added/removed in edit mode
- [ ] Exercises can be managed in edit mode
- [ ] Save button persists changes
- [ ] Annulla button discards changes
- [ ] All inputs disabled in read mode
- [ ] No edit buttons visible in read mode
- [ ] 404 redirects to missing page
- [ ] Navigation from template list works
- [ ] Navigation from client plan works
- [ ] PDF export works in both modes

## Common Issues to Watch For

1. **JSON Display Instead of UI**: If you see raw JSON on the page, the TemplateDetail component is not rendering the editor UI properly.

2. **Mode Not Updating**: If clicking "Modifica" or "Annulla" doesn't change the UI, check that the `mode` state is being read from URL params correctly.

3. **Inputs Not Disabled**: If inputs are editable in read mode, verify the `readonly` prop is being passed correctly to all form components.

4. **Changes Not Saving**: If edits don't persist, check that the `handleSave` function is calling the mutation and the backend is responding successfully.

5. **Missing Template Handling**: If 404s show a blank page, verify the error code check `(error as any)?.code === "PGRST116"` is working.
