# Progression Timeline Feature Guide

## Overview

The **Progression Timeline** is an interactive visualization tool that lets you navigate through 24 months of patient CKD progression data. Watch how patients move through different KDIGO health states, observe lab value changes, and see when clinical interventions are recommended.

## How to Access

1. Open the application in your browser
2. Click the **"📈 Progression Timeline"** tab in the main navigation
3. Select a patient from the dropdown menu
4. Use the timeline controls to explore their 24-month progression

## Main Features

### 🎮 Timeline Controls

#### Slider
- **Drag the slider** to jump to any month (0-24)
- **Click markers** (0, 6, 12, 18, 24) for quick navigation to key timepoints

#### Navigation Buttons
- **⏮️ First**: Jump to Month 0 (baseline)
- **⏪ Previous**: Go back one month
- **▶️ Play**: Auto-advance through progression
- **⏸️ Pause**: Stop auto-playback
- **⏩ Next**: Advance one month
- **⏭️ Last**: Jump to Month 24 (current)

#### Playback Speed
- **0.5x**: Slow (2 seconds per month) - great for detailed review
- **1x**: Normal (1 second per month) - balanced viewing
- **2x**: Fast (0.5 seconds per month) - quick overview
- **4x**: Very Fast (0.25 seconds per month) - rapid scanning

### 📊 Health State Display

#### Current Month Information
At the top of each patient card, you'll see:
- **Patient Name** and MRN
- **Current Health State** (e.g., "G3a-A2") with color coding:
  - 🟢 **Green**: Low risk
  - 🟡 **Yellow**: Moderate risk
  - 🟠 **Orange**: High risk
  - 🔴 **Red**: Very high risk

#### Lab Values (3 Cards)

**1. eGFR Card** (Blue)
- Current eGFR value
- Change from previous month with arrow indicator:
  - ↑ **Green arrow**: Improvement (kidney function increasing)
  - ↓ **Red arrow**: Decline (kidney function decreasing)
  - → **Gray arrow**: Stable (minimal change)
- GFR Category (G1, G2, G3a, G3b, G4, or G5)

**2. uACR Card** (Amber)
- Current uACR value
- Change from previous month:
  - ↓ **Green arrow**: Improvement (albuminuria decreasing)
  - ↑ **Red arrow**: Worsening (albuminuria increasing)
  - → **Gray arrow**: Stable
- Albuminuria Category (A1, A2, or A3)

**3. CKD Stage Card** (Color-matched to risk)
- Current CKD stage (1-5)
- Stage name (e.g., "CKD Stage 3a")
- Background color matches risk level

### 🚨 Transition Alerts

When a patient transitions between health states, an alert banner appears:

**Critical Alerts** (Red banner with 🚨)
- eGFR dropped below 30 mL/min (Stage 4)
- eGFR dropped below 15 mL/min (Kidney failure)
- uACR exceeded 300 mg/g (Severe albuminuria)

**Warning Alerts** (Orange banner with ⚠️)
- Health state category changed
- Risk level increased
- Significant eGFR decline (>5 mL/min)

**Info Alerts** (Blue banner with ℹ️)
- Minor state changes
- Status updates

Each alert shows:
- Before and after health states
- Specific lab value changes

### 💊 Clinical Recommendations

Four recommendation badges may appear based on current cycle:

1. **🏥 Nephrology Referral Recommended**
   - Appears for G3b, G4, G5, or A3
   - Indicates need for specialist care

2. **🚨 Dialysis Planning Required**
   - Appears for G4 or G5
   - Urgent intervention needed

3. **💊 RAS Inhibitor Recommended**
   - Appears for A2 or A3
   - ACE inhibitor or ARB therapy

4. **💊 SGLT2i Recommended**
   - Appears for A2 or A3 with eGFR ≥20
   - Kidney-protective medication

### 📈 Mini Trend Chart

Below the cards, a simple line chart shows:
- **Blue line**: eGFR trajectory over 24 months
- **Red dot**: Current position on timeline
- **Gray grid**: Reference lines for scale
- **X-axis**: Month 0 to Month 24

## Common Workflows

### Workflow 1: Review a Patient's Complete Progression
1. Select patient from dropdown
2. Click "First" button (⏮️) to go to Month 0
3. Click "Play" (▶️) to watch progression unfold
4. Pause when you see alerts or significant changes
5. Review recommendations at each key transition point

### Workflow 2: Compare Specific Timepoints
1. Use slider to jump to Month 6
2. Note eGFR and uACR values
3. Jump to Month 12
4. Compare change indicators
5. Jump to Month 24 to see final outcome

### Workflow 3: Identify Intervention Points
1. Click "Play" with 1x speed
2. Watch for alert banners to appear
3. Pause when critical/warning alerts show
4. Review what triggered the alert
5. Note the recommended interventions

### Workflow 4: Analyze Treatment Response
1. Find a patient with declining values early on
2. Look for months where medications were likely started
3. Check if later months show improvement
4. Watch for transition from A3→A2 (albuminuria improving)
5. Check if eGFR stabilizes or improves

## Understanding the Data

### Progression Patterns

You'll observe 4 main patterns across the 230 patients:

**Progressive Decliners (~30%)**
- Steady eGFR decline over 24 months
- May transition through multiple GFR categories
- Often develop worsening albuminuria
- Will trigger multiple alerts

**Stable Patients (~50%)**
- eGFR remains relatively constant
- Minor fluctuations month-to-month
- Health state remains the same
- Few or no alerts

**Improvers (~15%)**
- eGFR may stabilize or slightly improve
- Albuminuria decreases (A3→A2→A1)
- Health state improves
- Info alerts about treatment effectiveness

**Rapid Progressors (~5%)**
- Fast eGFR decline (multiple mL/min per month)
- Multiple category transitions
- Critical alerts in short timespan
- Urgent recommendations appear

### Realistic Variations

Month-to-month, you'll see:
- **Natural fluctuation**: ±1-2 mL/min in eGFR is normal
- **Measurement variability**: Small uACR changes expected
- **Trending over time**: Focus on overall direction, not single values

## Tips for Best Experience

### Performance
- Timeline works best with first 20 patients (pre-selected)
- If loading is slow, refresh the browser
- Charts render quickly on modern browsers

### Navigation
- Use keyboard arrow keys on slider for precise control
- Click month markers (0, 6, 12, 18, 24) for quick jumps
- Pause playback before using slider to avoid conflicts

### Analysis
- **Look for patterns**: Does decline accelerate or stabilize?
- **Note transitions**: When do alerts first appear?
- **Compare patients**: Switch between patients to see different progression types
- **Watch the trend chart**: Gives visual overview of entire 24 months

### Clinical Insights
- **Early alerts matter**: Critical alerts early on suggest rapid progression
- **Recommendation timing**: Note when nephrologist referral first recommended
- **Treatment effects**: Watch for stabilization after medication recommendations
- **Risk escalation**: Track color changes (green→yellow→orange→red)

## Troubleshooting

### "No Progression Data Available"
**Cause**: Database hasn't been initialized with progression tracking

**Solution**: Run the initialization script:
```bash
psql $DATABASE_URL -f scripts/initialize_progression_tracking.sql
```

### "Failed to fetch progression data"
**Cause**: Backend API not responding or patient has no data

**Solutions**:
1. Check backend is running
2. Verify database connection
3. Try a different patient
4. Refresh the page

### Playback not smooth
**Cause**: Browser rendering performance

**Solutions**:
1. Reduce playback speed (try 0.5x)
2. Close other browser tabs
3. Use a modern browser (Chrome, Firefox, Edge)

### Data looks wrong
**Cause**: Demo data randomization

**Note**: Data is randomly generated but follows realistic patterns. Each patient will have unique progression but all follow clinical guidelines.

## Technical Details

### Data Source
- Fetches from `/api/progression/patient/:id?months=24`
- Includes all 25 time points (Month 0-24)
- Transitions fetched from state transition table
- Auto-refreshes when patient changes

### Update Frequency
- Real-time: No polling, static historical data
- Change patient: Fetches new data immediately
- Navigate cycles: Instant (client-side only)

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (not supported)

## Example Scenarios

### Scenario 1: Catching Early Decline
- Month 0: eGFR 58, uACR 25 → G2-A1 (Green)
- Month 6: eGFR 52, uACR 35 → G3a-A2 (Yellow) ⚠️ Alert!
- **Recommendation appears**: RAS inhibitor
- Month 12: eGFR 48, uACR 40 → G3a-A2 (Yellow) - continuing decline
- Month 18: eGFR 42, uACR 50 → G3b-A2 (Red) ⚠️ Alert!
- **Recommendation appears**: Nephrology referral
- Month 24: eGFR 38, uACR 65 → G3b-A2 (Red)

### Scenario 2: Treatment Success
- Month 0: eGFR 45, uACR 420 → G3a-A3 (Red)
- Month 3: Started RAS inhibitor + SGLT2i (hypothetically)
- Month 6: eGFR 46, uACR 280 → G3a-A2 (Orange) ℹ️ Info: Improving!
- Month 12: eGFR 47, uACR 150 → G3a-A2 (Orange) - continued improvement
- Month 24: eGFR 48, uACR 85 → G3a-A2 (Orange) - stabilized

### Scenario 3: Rapid Progression
- Month 0: eGFR 32, uACR 180 → G3b-A2 (Red)
- Month 4: eGFR 28, uACR 220 → G4-A2 (Red) 🚨 Critical!
- Month 8: eGFR 22, uACR 280 → G4-A2 (Red)
- Month 12: eGFR 16, uACR 350 → G4-A3 (Red) 🚨 Critical!
- Month 16: eGFR 13, uACR 400 → G5-A3 (Red) 🚨 Kidney Failure!
- **Dialysis planning** recommendation appears

---

**Enjoy exploring the progression data! This tool brings 24 months of patient history to life in an interactive, educational format.**

For questions or issues, check the main [PROGRESSION_TRACKING_README.md](./PROGRESSION_TRACKING_README.md)
