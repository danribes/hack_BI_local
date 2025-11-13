# Patient Filtering System - User Guide

## Overview

The patient filtering system provides doctors with powerful tools to triage and manage their patient population based on CKD status, severity, treatment status, risk level, and monitoring status.

---

## Features

### 🎯 **Hierarchical Filtering**

The system uses a **three-level hierarchy** that progressively narrows down the patient list:

1. **Level 1:** Patient Type (All / CKD / Non-CKD)
2. **Level 2:** Severity/Risk (e.g., Mild, Moderate, Severe for CKD)
3. **Level 3:** Status (e.g., Treated/Not Treated, Monitored/Not Monitored)

### 📊 **Real-Time Statistics**

Every filter button shows the **patient count** for that category, making it easy to understand the distribution of your patient population at a glance.

### 🔍 **Combined with Search**

Filters work **in combination** with the search bar, allowing you to:
1. Filter to a specific patient group (e.g., "Moderate CKD + Treated")
2. Then search by name within that filtered set

---

## Filter Structure

### For CKD Patients

```
CKD Patients (355)
├── All Severities (355)
├── Mild CKD (80)
│   ├── All (80)
│   ├── Treated (64)
│   └── Not Treated (16)
├── Moderate CKD (250)
│   ├── All (250)
│   ├── Treated (200)
│   └── Not Treated (50)
├── Severe CKD (20)
│   ├── All (20)
│   ├── Treated (18)
│   └── Not Treated (2)
└── Kidney Failure (5)
    ├── All (5)
    ├── Treated (5)
    └── Not Treated (0)
```

### For Non-CKD Patients

```
Non-CKD Patients (645)
├── All Risk Levels (645)
├── Low Risk (245)
│   ├── All (245)
│   ├── Monitored (0)
│   └── Not Monitored (245)
├── Moderate Risk (0)
│   ├── All (0)
│   ├── Monitored (0)
│   └── Not Monitored (0)
└── High Risk (400)
    ├── All (400)
    ├── Monitored (240)
    └── Not Monitored (160)
```

**Note:** In the current real-world distribution, all Low Risk Non-CKD patients are grouped together. Only High Risk Non-CKD patients have monitoring status tracking.

---

## Usage Examples

### Example 1: Find All CKD Patients

**Goal:** See all patients with diagnosed CKD

**Steps:**
1. Click **"CKD Patients (355)"**
2. Patient list now shows 355 CKD patients
3. All severities are included

**Result:** List shows Mild, Moderate, Severe, and Kidney Failure patients

---

### Example 2: Find Untreated Moderate CKD Patients

**Goal:** Identify moderate CKD patients who are not yet on treatment

**Steps:**
1. Click **"CKD Patients (355)"**
2. Click **"Moderate CKD (250)"**
3. Click **"Not Treated (50)"**

**Result:** List shows 50 moderate CKD patients without active treatment

**Clinical Use:** These patients may need treatment initiation (SGLT2i, RAS inhibitors, etc.)

---

### Example 3: Find High-Risk Non-CKD Patients Who Need Monitoring

**Goal:** Identify high-risk patients who aren't being monitored yet

**Steps:**
1. Click **"Non-CKD Patients (645)"**
2. Click **"High Risk (400)"**
3. Click **"Not Monitored (160)"**

**Result:** List shows 160 high-risk non-CKD patients without active monitoring

**Clinical Use:** These patients should be considered for Minuteful Kidney Kit or other monitoring programs

---

### Example 4: Find Severe CKD Patients for Nephrology Referral

**Goal:** Review all severe CKD patients for specialist referral

**Steps:**
1. Click **"CKD Patients (355)"**
2. Click **"Severe CKD (20)"**
3. Optionally click **"Treated (18)"** to see those already on treatment

**Result:** List shows severe CKD patients (Stage 4)

**Clinical Use:** All Stage 4 patients should have nephrology follow-up

---

### Example 5: Search Within a Filtered Group

**Goal:** Find a specific patient within the moderate CKD group

**Steps:**
1. Click **"CKD Patients (355)"**
2. Click **"Moderate CKD (250)"**
3. Type patient name in search bar (e.g., "Rodriguez")

**Result:** Shows only patients named Rodriguez who have moderate CKD

**Clinical Use:** Quick access to specific patients within a clinical category

---

## Visual Design

### Color Coding

The filter system uses **intuitive color coding**:

| Color | Meaning | Used For |
|-------|---------|----------|
| 🔵 **Blue** | General/Informational | All Patients, Non-CKD |
| 🟢 **Green** | Low Risk / Good Status | Low Risk, Treated, Monitored |
| 🟡 **Yellow** | Mild/Moderate Risk | Mild CKD, Moderate Risk |
| 🟠 **Orange** | High Risk / Moderate Severity | Moderate CKD, High Risk |
| 🔴 **Red** | Severe / Very High Risk | Severe CKD, CKD Patients |
| 🟣 **Purple** | Critical | Kidney Failure |
| ⚫ **Gray** | Neutral / Not Treated | All Severities/Risks, Not Treated/Monitored |

### Button States

- **Active (Selected):** Colored background with white text, shadow
- **Inactive (Available):** White background with gray border
- **Hover:** Border darkens, subtle shadow appears

---

## Statistics Panel

At the top of the filter panel, you'll see:

```
Filter Patients                          Total: 1000 patients
```

This always shows the **total number of patients** in your database.

Each filter button shows its count in parentheses:
- **CKD Patients (355)** - 355 patients have CKD
- **Moderate CKD (250)** - 250 patients have moderate CKD
- **Treated (200)** - 200 of those moderate CKD patients are treated

---

## Active Filters Summary

When filters are active, a summary bar appears at the bottom showing:

```
Active Filters:  [CKD] [moderate] [treated]        Clear All Filters
```

Click **"Clear All Filters"** to reset to viewing all patients.

---

## Clinical Workflows

### Workflow 1: Daily Triage

**Use Case:** Start your day by reviewing patients who need attention

**Steps:**
1. **High-Risk Non-CKD Not Monitored**
   - Click Non-CKD → High Risk → Not Monitored
   - Review 160 patients who should start monitoring

2. **Moderate/Severe CKD Not Treated**
   - Click CKD → Moderate → Not Treated (50 patients)
   - Click CKD → Severe → Not Treated (2 patients)
   - Review treatment initiation needs

3. **Kidney Failure Patients**
   - Click CKD → Kidney Failure (5 patients)
   - Review dialysis planning and specialist coordination

---

### Workflow 2: Population Health Management

**Use Case:** Understand your patient population distribution

**Steps:**
1. **View Total Population**
   - Default view: 1000 patients
   - 35.5% have CKD (355 patients)
   - 64.5% are Non-CKD (645 patients)

2. **CKD Severity Distribution**
   - Mild: 80 (22.5% of CKD)
   - Moderate: 250 (70.4% of CKD)
   - Severe: 20 (5.6% of CKD)
   - Kidney Failure: 5 (1.4% of CKD)

3. **Treatment Gaps**
   - 90% of CKD patients are monitored ✓
   - 80% of CKD patients are treated ✓
   - 60% of high-risk non-CKD are monitored ⚠️

---

### Workflow 3: Quality Improvement Project

**Use Case:** Improve SGLT2i prescription rates in moderate CKD

**Steps:**
1. **Identify Target Population**
   - Click CKD → Moderate CKD → Not Treated
   - 50 moderate CKD patients without treatment

2. **Review Individual Charts**
   - Click each patient to see details
   - Check for contraindications (eGFR <20, potassium >5.5)
   - Review diabetes status (SGLT2i benefit)

3. **Track Progress**
   - After prescribing, filter again
   - Goal: Reduce "Not Treated" count from 50 to <10

---

## API Endpoints Used

### GET /api/patients/statistics

Returns hierarchical statistics for the filter UI:

```json
{
  "status": "success",
  "statistics": {
    "total_patients": 1000,
    "ckd": {
      "total": 355,
      "mild": { "total": 80, "treated": 64, "not_treated": 16 },
      "moderate": { "total": 250, "treated": 200, "not_treated": 50 },
      "severe": { "total": 20, "treated": 18, "not_treated": 2 },
      "kidney_failure": { "total": 5, "treated": 5, "not_treated": 0 }
    },
    "non_ckd": {
      "total": 645,
      "low": { "total": 245, "monitored": 0, "not_monitored": 245 },
      "moderate": { "total": 0, "monitored": 0, "not_monitored": 0 },
      "high": { "total": 400, "monitored": 240, "not_monitored": 160 }
    }
  }
}
```

### GET /api/patients/filter

Filters patients based on query parameters:

**Query Parameters:**
- `has_ckd`: `true` | `false`
- `severity`: `mild` | `moderate` | `severe` | `kidney_failure`
- `is_treated`: `true` | `false`
- `risk_level`: `low` | `moderate` | `high`
- `is_monitored`: `true` | `false`

**Example:**
```
GET /api/patients/filter?has_ckd=true&severity=moderate&is_treated=false
```

Returns 50 moderate CKD patients who are not treated.

---

## Keyboard Shortcuts (Future Enhancement)

_Not yet implemented, but planned:_

- **Alt + 1:** All Patients
- **Alt + 2:** CKD Patients
- **Alt + 3:** Non-CKD Patients
- **Alt + R:** Clear All Filters
- **Alt + S:** Focus Search Bar

---

## Troubleshooting

### No patients showing after filtering

**Possible Causes:**
1. **No patients match the criteria** - Check the count in the filter button (might be 0)
2. **Search term is too specific** - Clear the search bar
3. **Multiple conflicting filters** - Click "Clear All Filters"

**Solution:** Click "Clear All Filters" and start over

---

### Statistics not loading

**Possible Causes:**
1. **Backend API not running**
2. **Database connection issue**
3. **No patients in database**

**Solution:**
1. Check backend is running: `docker compose ps`
2. Generate patients: `curl -X POST http://localhost:3000/api/init/populate-realistic-cohort`
3. Refresh the page

---

### Counts don't match expectations

**Possible Causes:**
1. **Database was recently updated**
2. **Patients were added/removed**

**Solution:** Refresh the page to reload statistics

---

## Best Practices

1. **Start broad, then narrow:** Begin with patient type, then drill down
2. **Use statistics to guide:** Look at counts before clicking
3. **Combine with search:** Filter first, then search by name
4. **Track gaps:** Focus on "Not Treated" and "Not Monitored" categories
5. **Regular review:** Check high-risk/severe groups daily

---

## Future Enhancements

### Planned Features

1. **Save Filter Presets**
   - Save common filter combinations
   - E.g., "My High-Risk Patients", "Treatment Gaps"

2. **Export Filtered Lists**
   - Download CSV of filtered patients
   - Share with team members

3. **Automated Alerts**
   - Email when "Not Treated" count exceeds threshold
   - Dashboard widgets for key metrics

4. **Advanced Filters**
   - Filter by last visit date
   - Filter by specific lab value ranges
   - Filter by medication adherence

5. **Bulk Actions**
   - Send reminders to all filtered patients
   - Schedule appointments for filtered group

---

## Support

For issues or questions:
- Check this guide first
- Review the troubleshooting section
- Contact your system administrator

---

**Version:** 1.0
**Last Updated:** November 2025
**Component:** PatientFilters.tsx, /api/patients/statistics, /api/patients/filter
