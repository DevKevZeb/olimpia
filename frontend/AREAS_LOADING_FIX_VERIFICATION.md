# Areas Loading Fix - Verification Guide

## Issue Description

**Problem**: Areas not loading consistently in step 2 of registration process after filling personal data.

## Root Cause Analysis

The useAreasSelection hook was executing API calls regardless of the current step, causing:

1. Premature API calls before reaching step 2
2. Race conditions between form data updates and API calls
3. Inconsistent loading behavior due to timing issues

## Solution Implemented

**Step-Based Execution Control**: Modified useAreasSelection hook to only execute when `isStep2 = true`.

### Changes Made:

#### 1. useAreasSelection.ts

- Added `isStep2` parameter to UseAreasSelectionProps interface
- Updated fetchAreasPorGrado function to check `isStep2` before executing
- Added isStep2 to useEffect dependencies
- Enhanced debugging to track isStep2 value

#### 2. RegistrationPage.tsx

- Pass `isStep2: step === 2` to useAreasSelection hook
- This ensures areas are only loaded when user reaches step 2

## Verification Steps

### Manual Testing Procedure:

#### Step 1: Test Form Flow

1. **Open**: http://localhost:5174/registration
2. **Fill personal data** (Step 1):
   - CI: 12345678
   - Nombres: Test Student
   - Apellidos: Test Last Name
   - Teléfono: 12345678
   - Email: test@example.com
   - Grado: Select any grade
3. **Check console logs**:
   - Should see: `❌ No ejecutando fetchAreasPorGrado porque no estamos en step 2`
   - Should NOT see API calls to areas endpoint

#### Step 2: Test Areas Loading

4. **Click "Siguiente"** to go to step 2
5. **Check console logs**:

   - Should see: `🔄 useAreasSelection: useEffect disparado` with `isStep2: true`
   - Should see: `✅ Condiciones cumplidas, haciendo llamada API...`
   - Should see: `📊 Datos recibidos de la API:` with areas data
   - Should see: `✅ Áreas cargadas exitosamente: X áreas`

6. **Verify UI**:
   - Areas should load and display correctly
   - No "loading..." message should persist
   - Areas should be selectable

#### Step 3: Test Consistency

7. **Go back to step 1** (click "Anterior")
8. **Change grade** to a different option
9. **Return to step 2** (click "Siguiente")
10. **Verify**: Areas should reload for the new grade

### Expected Console Output Pattern:

```
Step 1 (areas should NOT load):
🚀 useAreasSelection: Hook inicializado con formData: {isStep2: false}
🔄 useAreasSelection: useEffect disparado - values: {isStep2: false}
🔍 fetchAreasPorGrado ejecutado - valores: {isStep2: false}
❌ No ejecutando fetchAreasPorGrado porque no estamos en step 2

Step 2 (areas SHOULD load):
🔄 useAreasSelection: useEffect disparado - values: {isStep2: true}
🔍 fetchAreasPorGrado ejecutado - valores: {isStep2: true}
✅ Condiciones cumplidas, haciendo llamada API...
📊 Datos recibidos de la API: {areas_niveles: [...]}
✅ Áreas cargadas exitosamente: X áreas
```

## Success Criteria

✅ **Areas do NOT load in step 1** (no premature API calls)
✅ **Areas DO load in step 2** (when isStep2 = true)  
✅ **Areas reload when changing grade in step 1 and returning to step 2**
✅ **No infinite loops or excessive API calls**
✅ **Consistent loading behavior across multiple test cycles**

## Troubleshooting

If areas still don't load:

1. Check browser console for error messages
2. Verify backend API is running and accessible
3. Check network tab for failed API requests
4. Ensure form data contains valid id_grado and id_convocatoria

## Testing Commands

```bash
# Start development server
cd /c/xampp/htdocs/oh-sansi/frontend
npm run dev

# Open browser console and navigate to:
# http://localhost:5174/registration

# Watch console logs during testing
```

## Files Modified

- `src/hooks/registration/useAreasSelection.ts` - Step-based execution control
- `src/pages/registration/RegistrationPage.tsx` - Pass isStep2 prop

## Next Steps

After verification:

1. Remove excessive debugging logs if desired
2. Consider adding user feedback for loading states
3. Test with edge cases (network failures, invalid data)
4. Update documentation for future developers

---

**Date**: $(date)
**Status**: Ready for verification
**Impact**: Fixes critical areas loading issue in student registration
