-- Healthcare AI Clinical Data Analyzer - Database Initialization
-- This script runs once when the PostgreSQL container is first created
-- Creates tables and populates with 5 mock CKD patients with realistic clinical data

-- ============================================
-- Extensions and Configuration
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SET timezone = 'UTC';

-- ============================================
-- Schema Creation
-- ============================================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    -- Enhanced fields for comprehensive patient data
    weight DECIMAL(5, 2),
    height INTEGER,
    smoking_status VARCHAR(20),
    cvd_history BOOLEAN DEFAULT false,
    family_history_esrd BOOLEAN DEFAULT false,
    on_ras_inhibitor BOOLEAN DEFAULT false,
    on_sglt2i BOOLEAN DEFAULT false,
    nephrotoxic_meds BOOLEAN DEFAULT false,
    nephrologist_referral BOOLEAN DEFAULT false,
    diagnosis_date DATE,
    last_visit_date DATE,
    next_visit_date DATE,
    -- Home monitoring fields
    home_monitoring_device VARCHAR(100),
    home_monitoring_active BOOLEAN DEFAULT false,
    -- CKD treatment tracking
    ckd_treatment_active BOOLEAN DEFAULT false,
    ckd_treatment_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinical observations (lab results)
CREATE TABLE IF NOT EXISTS observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    observation_type VARCHAR(50) NOT NULL, -- 'eGFR', 'creatinine', 'uACR', 'blood_pressure', etc.
    value_numeric DECIMAL(10, 2),
    value_text VARCHAR(100),
    unit VARCHAR(20),
    observation_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'final', -- 'preliminary', 'final', 'amended'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinical conditions (diagnoses)
CREATE TABLE IF NOT EXISTS conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition_code VARCHAR(20) NOT NULL, -- ICD-10 code
    condition_name VARCHAR(200) NOT NULL,
    clinical_status VARCHAR(20) NOT NULL, -- 'active', 'resolved', 'inactive'
    onset_date DATE,
    recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20), -- 'mild', 'moderate', 'severe'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk assessments (AI-generated)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    risk_score DECIMAL(3, 2) NOT NULL, -- 0.00 to 1.00
    risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    recommendations TEXT[],
    reasoning TEXT,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_observations_patient_id ON observations(patient_id);
CREATE INDEX idx_observations_type ON observations(observation_type);
CREATE INDEX idx_observations_date ON observations(observation_date);
CREATE INDEX idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX idx_conditions_status ON conditions(clinical_status);
CREATE INDEX idx_risk_assessments_patient_id ON risk_assessments(patient_id);

-- ============================================
-- Mock Patient Data - 5 CKD Patients
-- ============================================


-- ============================================
-- PATIENT DATA POPULATION
-- ============================================


-- ============================================
-- Summary Statistics
-- ============================================

-- Create a view for easy patient summary
CREATE OR REPLACE VIEW patient_summary AS
SELECT
    p.id,
    p.medical_record_number,
    p.first_name || ' ' || p.last_name AS full_name,
    EXTRACT(YEAR FROM AGE(p.date_of_birth)) AS age,
    p.gender,
    COUNT(DISTINCT o.id) AS observation_count,
    COUNT(DISTINCT c.id) AS condition_count,
    MAX(CASE WHEN o.observation_type = 'eGFR' THEN o.value_numeric END) AS latest_egfr
FROM patients p
LEFT JOIN observations o ON p.id = o.patient_id
LEFT JOIN conditions c ON p.id = c.patient_id AND c.clinical_status = 'active'
GROUP BY p.id, p.medical_record_number, p.first_name, p.last_name, p.date_of_birth, p.gender;

-- ============================================
-- Verification
-- ============================================

-- Verify data was inserted
SELECT 'Database initialization complete' AS status;
SELECT 'Total patients: ' || COUNT(*) FROM patients;
SELECT 'Total observations: ' || COUNT(*) FROM observations;
SELECT 'Total conditions: ' || COUNT(*) FROM conditions;

-- Display patient summary
SELECT * FROM patient_summary ORDER BY medical_record_number;

-- ============================================
-- Patient Tracking Tables (CKD and Non-CKD)
-- ============================================
-- Migration 002: Create separate tracking tables for CKD and non-CKD patients

-- CKD Patient Data Table
CREATE TABLE IF NOT EXISTS ckd_patient_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,

    -- CKD Severity Classification
    ckd_severity VARCHAR(20) NOT NULL, -- 'mild', 'moderate', 'severe', 'kidney_failure'
    ckd_stage INTEGER NOT NULL, -- 1, 2, 3, 4, 5

    -- KDIGO Classification
    kdigo_gfr_category VARCHAR(5) NOT NULL, -- 'G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'
    kdigo_albuminuria_category VARCHAR(5) NOT NULL, -- 'A1', 'A2', 'A3'
    kdigo_health_state VARCHAR(10) NOT NULL, -- 'G1-A1', 'G3a-A2', etc.

    -- Monitoring
    is_monitored BOOLEAN DEFAULT false,
    monitoring_device VARCHAR(100), -- 'Minuteful Kidney Kit', etc.
    monitoring_frequency VARCHAR(50), -- 'weekly', 'biweekly', 'monthly', 'quarterly'
    last_monitoring_date DATE,

    -- Treatment
    is_treated BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CKD Treatments Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS ckd_treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ckd_patient_data_id UUID NOT NULL REFERENCES ckd_patient_data(id) ON DELETE CASCADE,

    treatment_name VARCHAR(100) NOT NULL,
    treatment_class VARCHAR(50), -- 'SGLT2i', 'MRA', 'Investigational', etc.
    dosage VARCHAR(50),
    start_date DATE,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Non-CKD Patient Data Table
CREATE TABLE IF NOT EXISTS non_ckd_patient_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,

    -- Risk Classification
    risk_level VARCHAR(20) NOT NULL, -- 'low', 'moderate', 'high'

    -- KDIGO Health State
    kdigo_health_state VARCHAR(10) NOT NULL, -- 'G1-A1', 'G2-A1', etc.

    -- Monitoring
    is_monitored BOOLEAN DEFAULT false,
    monitoring_device VARCHAR(100),
    monitoring_frequency VARCHAR(50), -- 'monthly', 'quarterly', 'biannually', 'annually'
    last_monitoring_date DATE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Non-CKD Risk Factors Table
CREATE TABLE IF NOT EXISTS non_ckd_risk_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    non_ckd_patient_data_id UUID NOT NULL REFERENCES non_ckd_patient_data(id) ON DELETE CASCADE,

    risk_factor_type VARCHAR(50) NOT NULL, -- 'diabetes', 'hypertension', 'obesity', 'smoking', 'family_history', etc.
    risk_factor_value VARCHAR(100), -- Specific value or severity
    severity VARCHAR(20), -- 'mild', 'moderate', 'severe'
    is_controlled BOOLEAN DEFAULT false,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ckd_patient_data_patient_id ON ckd_patient_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_ckd_patient_data_severity ON ckd_patient_data(ckd_severity);
CREATE INDEX IF NOT EXISTS idx_ckd_patient_data_stage ON ckd_patient_data(ckd_stage);
CREATE INDEX IF NOT EXISTS idx_ckd_patient_data_monitored ON ckd_patient_data(is_monitored);
CREATE INDEX IF NOT EXISTS idx_ckd_patient_data_treated ON ckd_patient_data(is_treated);
CREATE INDEX IF NOT EXISTS idx_ckd_patient_data_monitoring_freq ON ckd_patient_data(monitoring_frequency);
CREATE INDEX IF NOT EXISTS idx_ckd_patient_data_health_state ON ckd_patient_data(kdigo_health_state);

CREATE INDEX IF NOT EXISTS idx_ckd_treatments_patient_data_id ON ckd_treatments(ckd_patient_data_id);
CREATE INDEX IF NOT EXISTS idx_ckd_treatments_name ON ckd_treatments(treatment_name);
CREATE INDEX IF NOT EXISTS idx_ckd_treatments_active ON ckd_treatments(is_active);

CREATE INDEX IF NOT EXISTS idx_non_ckd_patient_data_patient_id ON non_ckd_patient_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_non_ckd_patient_data_risk_level ON non_ckd_patient_data(risk_level);
CREATE INDEX IF NOT EXISTS idx_non_ckd_patient_data_monitored ON non_ckd_patient_data(is_monitored);
CREATE INDEX IF NOT EXISTS idx_non_ckd_patient_data_monitoring_freq ON non_ckd_patient_data(monitoring_frequency);
CREATE INDEX IF NOT EXISTS idx_non_ckd_patient_data_health_state ON non_ckd_patient_data(kdigo_health_state);

CREATE INDEX IF NOT EXISTS idx_non_ckd_risk_factors_patient_data_id ON non_ckd_risk_factors(non_ckd_patient_data_id);
CREATE INDEX IF NOT EXISTS idx_non_ckd_risk_factors_type ON non_ckd_risk_factors(risk_factor_type);
CREATE INDEX IF NOT EXISTS idx_non_ckd_risk_factors_severity ON non_ckd_risk_factors(severity);

CREATE INDEX IF NOT EXISTS idx_ckd_severity_monitored ON ckd_patient_data(ckd_severity, is_monitored);
CREATE INDEX IF NOT EXISTS idx_ckd_stage_treated ON ckd_patient_data(ckd_stage, is_treated);
CREATE INDEX IF NOT EXISTS idx_non_ckd_risk_monitored ON non_ckd_patient_data(risk_level, is_monitored);

-- ================================================================
-- Generate 1000 Mock Patient Records with Comprehensive Clinical Data
-- ================================================================
-- This script generates diverse patient demographics, observations,
-- and conditions representing various CKD stages and risk levels

-- Function to generate random UUID v4
CREATE OR REPLACE FUNCTION random_uuid() RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Insert 1000 mock patients with diverse demographics
DO $$
DECLARE
  v_patient_id uuid;
  v_age integer;
  v_gender text;
  v_has_diabetes boolean;
  v_has_hypertension boolean;
  v_has_cvd boolean;
  v_weight decimal;
  v_height integer;
  v_bmi decimal;
  v_egfr decimal;
  v_uacr decimal;
  v_creatinine decimal;
  v_smoking text;
  v_ckd_stage integer;
  v_diagnosis_years integer;
  v_first_name text;
  v_last_name text;
  v_risk_level integer;
  v_random decimal;
  v_gfr_category text;
  v_alb_category text;
  v_health_state text;
  v_ckd_severity text;
  v_is_monitored boolean;
  v_monitoring_device text;
  v_monitoring_frequency text;
  v_is_treated boolean;

  -- Name arrays for random generation
  first_names_male text[] := ARRAY['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Raymond', 'Gregory', 'Alexander', 'Frank', 'Patrick', 'Raymond', 'Jack', 'Dennis', 'Jerry'];
  first_names_female text[] := ARRAY['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Dorothy', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen', 'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather'];
  last_names text[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

BEGIN
  -- Generate 1000 patients
  FOR i IN 1..1000 LOOP
    v_patient_id := random_uuid();

    -- Random demographics
    v_gender := CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END;
    v_age := 65 + floor(random() * 26)::integer; -- Ages 65-90 (all patients 65+)
    v_height := CASE
      WHEN v_gender = 'male' THEN 165 + floor(random() * 25)::integer
      ELSE 155 + floor(random() * 25)::integer
    END;
    v_weight := 55 + (random() * 60); -- 55-115 kg
    v_bmi := v_weight / ((v_height / 100.0) * (v_height / 100.0));

    -- Generate name
    v_first_name := CASE
      WHEN v_gender = 'male' THEN first_names_male[1 + floor(random() * array_length(first_names_male, 1))::integer]
      ELSE first_names_female[1 + floor(random() * array_length(first_names_female, 1))::integer]
    END;
    v_last_name := last_names[1 + floor(random() * array_length(last_names, 1))::integer];

    -- Risk factor distribution (realistic prevalence)
    v_has_diabetes := random() < 0.30; -- 30% have diabetes
    v_has_hypertension := random() < 0.45; -- 45% have hypertension
    v_has_cvd := random() < 0.20; -- 20% have CVD history

    -- Smoking status
    v_smoking := CASE
      WHEN random() < 0.50 THEN 'Never'
      WHEN random() < 0.70 THEN 'Former'
      ELSE 'Current'
    END;

    -- Determine patient category based on required distribution
    -- Distribution:
    --   64.5% - Not diagnosed with CKD
    --     12.0% - Low risk, no CKD diagnosis
    --     12.5% - Moderate risk, no CKD diagnosis
    --     40.0% - High risk, no CKD diagnosis
    --   35.5% - Diagnosed with CKD
    --     8.0% - Mild CKD (Stage 1-2)
    --    25.0% - Moderate CKD (Stage 3a-3b)
    --     2.0% - Severe CKD (Stage 4)
    --     0.5% - Kidney failure (Stage 5)
    -- Total: 100%

    v_random := random();

    IF v_random < 0.120 THEN
      -- 12.0% - Low risk, no CKD diagnosis
      v_risk_level := 1;
      v_egfr := 90 + (random() * 20); -- eGFR 90-110 (normal)
      v_uacr := random() * 15; -- uACR 0-15 (normal)
      v_creatinine := 0.7 + (random() * 0.3); -- Creatinine 0.7-1.0 (normal)
      v_ckd_stage := 0; -- No CKD diagnosis

    ELSIF v_random < 0.245 THEN
      -- 12.5% - Moderate risk, no CKD diagnosis (0.120 + 0.125 = 0.245)
      v_risk_level := 2;
      v_egfr := 75 + (random() * 25); -- eGFR 75-100 (normal but lower end)
      v_uacr := 10 + (random() * 20); -- uACR 10-30 (borderline)
      v_creatinine := 0.8 + (random() * 0.4); -- Creatinine 0.8-1.2 (normal)
      v_ckd_stage := 0; -- No CKD diagnosis

    ELSIF v_random < 0.645 THEN
      -- 40% - High risk, no CKD diagnosis (0.245 + 0.40 = 0.645)
      v_risk_level := 3;
      v_egfr := 60 + (random() * 30); -- eGFR 60-90 (not low enough for diagnosis)
      v_uacr := 15 + (random() * 20); -- uACR 15-35 (borderline but not diagnostic)
      v_creatinine := 0.9 + (random() * 0.5); -- Creatinine 0.9-1.4 (borderline)
      v_ckd_stage := 0; -- No CKD diagnosis yet, but high risk
      -- High risk patients more likely to have risk factors
      v_has_diabetes := v_has_diabetes OR random() < 0.5;
      v_has_hypertension := v_has_hypertension OR random() < 0.6;

    ELSIF v_random < 0.725 THEN
      -- 8% - Mild CKD (Stage 1-2) (0.645 + 0.08 = 0.725)
      v_risk_level := 2;
      v_ckd_stage := CASE WHEN random() < 0.5 THEN 1 ELSE 2 END;
      v_egfr := CASE
        WHEN v_ckd_stage = 1 THEN 90 + (random() * 20) -- Stage 1: eGFR >= 90
        ELSE 60 + (random() * 30) -- Stage 2: eGFR 60-89
      END;
      v_uacr := 30 + (random() * 100); -- uACR 30-130 (albuminuria present for diagnosis)
      v_creatinine := 0.9 + (random() * 0.5); -- Creatinine 0.9-1.4
      v_has_diabetes := v_has_diabetes OR random() < 0.3;
      v_has_hypertension := v_has_hypertension OR random() < 0.4;

    ELSIF v_random < 0.975 THEN
      -- 25% - Moderate CKD (Stage 3a-3b) (0.725 + 0.25 = 0.975)
      v_risk_level := 2;
      v_ckd_stage := 3;
      v_egfr := 30 + (random() * 30); -- eGFR 30-60 (Stage 3a-3b)
      v_uacr := 50 + (random() * 200); -- uACR 50-250
      v_creatinine := 1.3 + (random() * 1.0); -- Creatinine 1.3-2.3
      v_has_diabetes := v_has_diabetes OR random() < 0.4;
      v_has_hypertension := v_has_hypertension OR random() < 0.5;

    ELSIF v_random < 0.995 THEN
      -- 2% - Severe CKD (Stage 4) (0.975 + 0.02 = 0.995)
      v_risk_level := 3;
      v_ckd_stage := 4;
      v_egfr := 15 + (random() * 15); -- eGFR 15-30 (Stage 4)
      v_uacr := 100 + (random() * 400); -- uACR 100-500
      v_creatinine := 2.0 + (random() * 2.0); -- Creatinine 2.0-4.0
      v_has_diabetes := v_has_diabetes OR random() < 0.5;
      v_has_hypertension := v_has_hypertension OR random() < 0.6;

    ELSE
      -- 0.5% - Kidney failure (Stage 5) (0.995 to 1.0 = 0.005 or 0.5%)
      v_risk_level := 3;
      v_ckd_stage := 5;
      v_egfr := 5 + (random() * 10); -- eGFR 5-15 (Stage 5 - kidney failure)
      v_uacr := 300 + (random() * 700); -- uACR 300-1000
      v_creatinine := 4.0 + (random() * 4.0); -- Creatinine 4.0-8.0
      v_has_diabetes := v_has_diabetes OR random() < 0.6;
      v_has_hypertension := v_has_hypertension OR random() < 0.7;
    END IF;

    v_diagnosis_years := CASE
      WHEN v_ckd_stage >= 4 THEN floor(random() * 10)::integer
      WHEN v_ckd_stage = 3 THEN floor(random() * 8)::integer
      WHEN v_ckd_stage >= 1 THEN floor(random() * 5)::integer
      ELSE 0
    END;

    -- Insert patient
    INSERT INTO patients (
      id, medical_record_number, first_name, last_name,
      date_of_birth, gender, email, phone,
      weight, height, smoking_status, cvd_history, family_history_esrd,
      on_ras_inhibitor, on_sglt2i, nephrotoxic_meds, nephrologist_referral,
      diagnosis_date, last_visit_date, next_visit_date,
      home_monitoring_device, home_monitoring_active,
      ckd_treatment_active, ckd_treatment_type
    ) VALUES (
      v_patient_id,
      'MRN' || lpad((i + 100)::text, 5, '0'),
      v_first_name,
      v_last_name,
      (CURRENT_DATE - (v_age * 365 + floor(random() * 365)::integer))::date,
      v_gender,
      lower(v_first_name) || '.' || lower(v_last_name) || '@email.com',
      '+1-555-' || lpad(floor(random() * 10000)::text, 4, '0'),
      v_weight,
      v_height,
      v_smoking,
      v_has_cvd,
      random() < 0.10, -- 10% family history of ESRD
      v_has_diabetes OR v_has_hypertension, -- RAS inhibitor if DM or HTN
      v_has_diabetes AND random() < 0.30, -- 30% of diabetics on SGLT2i
      random() < 0.15, -- 15% on nephrotoxic meds
      v_ckd_stage >= 4 AND random() < 0.70, -- 70% of stage 4+ have nephro referral
      CASE WHEN v_diagnosis_years > 0 THEN (CURRENT_DATE - (v_diagnosis_years * 365))::date ELSE NULL END,
      (CURRENT_DATE - floor(random() * 90)::integer)::date, -- Last visit 0-90 days ago
      (CURRENT_DATE + (30 + floor(random() * 120)::integer))::date, -- Next visit 30-150 days from now
      -- Home monitoring: Varies by CKD stage and risk level
      CASE
        WHEN v_ckd_stage >= 4 AND random() < 0.95 THEN 'Minuteful Kidney'  -- 95% for severe CKD
        WHEN v_ckd_stage = 3 AND random() < 0.90 THEN 'Minuteful Kidney'   -- 90% for moderate CKD
        WHEN v_ckd_stage >= 1 AND random() < 0.75 THEN 'Minuteful Kidney'  -- 75% for mild CKD
        WHEN v_ckd_stage = 0 AND v_risk_level = 3 AND random() < 0.85 THEN 'Minuteful Kidney'  -- 85% for high risk non-CKD
        WHEN v_ckd_stage = 0 AND v_risk_level = 2 AND random() < 0.70 THEN 'Minuteful Kidney'  -- 70% for moderate risk non-CKD
        WHEN v_ckd_stage = 0 AND v_risk_level = 1 AND random() < 0.50 THEN 'Minuteful Kidney'  -- 50% for low risk non-CKD
        ELSE NULL
      END,
      CASE
        WHEN v_ckd_stage >= 4 AND random() < 0.95 THEN true
        WHEN v_ckd_stage = 3 AND random() < 0.90 THEN true
        WHEN v_ckd_stage >= 1 AND random() < 0.75 THEN true
        WHEN v_ckd_stage = 0 AND v_risk_level = 3 AND random() < 0.85 THEN true
        WHEN v_ckd_stage = 0 AND v_risk_level = 2 AND random() < 0.70 THEN true
        WHEN v_ckd_stage = 0 AND v_risk_level = 1 AND random() < 0.50 THEN true
        ELSE false
      END,
      -- CKD treatment: Varies by severity
      CASE
        WHEN v_ckd_stage >= 4 THEN random() < 0.90  -- 90% for severe/kidney failure
        WHEN v_ckd_stage = 3 THEN random() < 0.85   -- 85% for moderate
        WHEN v_ckd_stage >= 1 THEN random() < 0.70  -- 70% for mild
        ELSE false
      END,
      CASE
        WHEN v_ckd_stage >= 4 AND random() < 0.90 THEN
          CASE
            WHEN v_ckd_stage >= 4 THEN 'Nephrology care + medications'
            ELSE 'ACE inhibitors + diet management'
          END
        WHEN v_ckd_stage = 3 AND random() < 0.85 THEN 'ACE inhibitors + diet management'
        WHEN v_ckd_stage >= 1 AND random() < 0.70 THEN 'Lifestyle modifications + monitoring'
        ELSE NULL
      END
    );

    -- Insert comprehensive observations
    -- Kidney Function Panel
    INSERT INTO observations (patient_id, observation_type, value_numeric, value_text, unit, observation_date, status, notes) VALUES
      (v_patient_id, 'eGFR', v_egfr, NULL, 'mL/min/1.73m²', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE
          WHEN v_egfr < 15 THEN 'Stage 5 CKD - Kidney failure'
          WHEN v_egfr < 30 THEN 'Stage 4 CKD - Severe decrease'
          WHEN v_egfr < 45 THEN 'Stage 3b CKD'
          WHEN v_egfr < 60 THEN 'Stage 3a CKD'
          WHEN v_egfr < 90 THEN 'Stage 2 CKD - Mild decrease'
          ELSE 'Normal kidney function'
        END),
      (v_patient_id, 'eGFR_trend', NULL,
        CASE
          WHEN v_risk_level = 3 AND random() < 0.6 THEN 'down'
          WHEN v_risk_level = 1 THEN 'stable'
          ELSE CASE WHEN random() < 0.7 THEN 'stable' ELSE 'down' END
        END,
        NULL, CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'eGFR_change_percent',
        CASE
          WHEN v_risk_level = 3 THEN -(3 + random() * 12) -- High risk: -3% to -15%
          WHEN v_risk_level = 2 THEN -(random() * 5) -- Moderate risk: 0% to -5%
          ELSE (random() * 4 - 2) -- Low risk: -2% to +2%
        END,
        NULL, '%', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'serum_creatinine', v_creatinine, NULL, 'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE WHEN v_creatinine > 1.5 THEN 'Elevated' ELSE 'Normal' END),
      (v_patient_id, 'BUN', 10 + (v_creatinine - 0.8) * 25 + random() * 10, NULL, 'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'uACR', v_uacr, NULL, 'mg/g', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE
          WHEN v_uacr >= 300 THEN 'Severely increased albuminuria (A3)'
          WHEN v_uacr >= 30 THEN 'Moderately increased albuminuria (A2)'
          ELSE 'Normal albuminuria (A1)'
        END),
      (v_patient_id, 'proteinuria_category', NULL,
        CASE WHEN v_uacr >= 300 THEN 'A3' WHEN v_uacr >= 30 THEN 'A2' ELSE 'A1' END,
        NULL, CURRENT_TIMESTAMP - interval '1 day', 'final', NULL);

    -- Hematology & Electrolytes
    INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status, notes) VALUES
      (v_patient_id, 'hemoglobin',
        CASE
          WHEN v_ckd_stage >= 4 THEN 9 + random() * 3 -- Stage 4+: 9-12 (anemia common)
          WHEN v_ckd_stage = 3 THEN 11 + random() * 3 -- Stage 3: 11-14
          ELSE 12 + random() * 4 -- Normal: 12-16
        END,
        'g/dL', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE WHEN v_ckd_stage >= 4 THEN 'CKD-related anemia' ELSE NULL END),
      (v_patient_id, 'WBC', 5.0 + random() * 6.0, 'K/uL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'platelets', 150 + random() * 200, 'K/uL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'sodium', 135 + random() * 10, 'mEq/L', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'potassium',
        CASE
          WHEN v_ckd_stage >= 4 THEN 4.5 + random() * 1.5 -- Stage 4+: 4.5-6.0 (hyperkalemia risk)
          ELSE 3.5 + random() * 1.2 -- Normal: 3.5-4.7
        END,
        'mEq/L', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE WHEN v_ckd_stage >= 4 AND random() < 0.4 THEN 'Hyperkalemia risk' ELSE NULL END),
      (v_patient_id, 'chloride', 98 + random() * 10, 'mEq/L', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'bicarbonate',
        CASE
          WHEN v_ckd_stage >= 4 THEN 18 + random() * 6 -- Stage 4+: 18-24 (acidosis common)
          ELSE 22 + random() * 6 -- Normal: 22-28
        END,
        'mEq/L', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'calcium', 8.5 + random() * 1.5, 'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'phosphorus',
        CASE
          WHEN v_ckd_stage >= 4 THEN 4.5 + random() * 2 -- Elevated in advanced CKD
          ELSE 2.5 + random() * 2
        END,
        'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'magnesium', 1.7 + random() * 0.8, 'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'albumin', 3.0 + random() * 1.5, 'g/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL);

    -- Vital Signs, Metabolic & Cardiovascular Panel
    INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status, notes) VALUES
      (v_patient_id, 'heart_rate', 60 + random() * 40, 'bpm', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'oxygen_saturation', 92 + random() * 8, '%', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'HbA1c',
        CASE
          WHEN v_has_diabetes THEN 6.5 + random() * 2.5 -- Diabetics: 6.5-9.0%
          ELSE 4.5 + random() * 1.0 -- Non-diabetics: 4.5-5.5%
        END,
        '%', CURRENT_TIMESTAMP - interval '30 days', 'final',
        CASE WHEN v_has_diabetes AND random() < 0.3 THEN 'Suboptimal control' ELSE NULL END),
      (v_patient_id, 'glucose',
        CASE
          WHEN v_has_diabetes THEN 120 + random() * 100 -- Diabetics: 120-220 mg/dL
          ELSE 80 + random() * 40 -- Non-diabetics: 80-120 mg/dL
        END,
        'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'blood_pressure_systolic',
        CASE
          WHEN v_has_hypertension THEN 130 + random() * 30 -- HTN: 130-160
          ELSE 110 + random() * 20 -- Normal: 110-130
        END,
        'mmHg', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'blood_pressure_diastolic',
        CASE
          WHEN v_has_hypertension THEN 85 + random() * 15 -- HTN: 85-100
          ELSE 70 + random() * 15 -- Normal: 70-85
        END,
        'mmHg', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'total_cholesterol', 150 + random() * 100, 'mg/dL', CURRENT_TIMESTAMP - interval '60 days', 'final', NULL),
      (v_patient_id, 'LDL_cholesterol', 80 + random() * 100, 'mg/dL', CURRENT_TIMESTAMP - interval '60 days', 'final', NULL),
      (v_patient_id, 'HDL_cholesterol', 30 + random() * 40, 'mg/dL', CURRENT_TIMESTAMP - interval '60 days', 'final', NULL),
      (v_patient_id, 'triglycerides', 80 + random() * 200, 'mg/dL', CURRENT_TIMESTAMP - interval '60 days', 'final', NULL),
      (v_patient_id, 'BMI', v_bmi, 'kg/m²', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE
          WHEN v_bmi >= 30 THEN 'Obese'
          WHEN v_bmi >= 25 THEN 'Overweight'
          ELSE 'Normal weight'
        END);

    -- Insert conditions
    IF v_has_diabetes THEN
      INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, recorded_date, severity)
      VALUES (v_patient_id, 'E11.9', 'Type 2 Diabetes Mellitus', 'active',
        (CURRENT_DATE - (floor(random() * 3650) + 365))::date, CURRENT_TIMESTAMP,
        CASE WHEN random() < 0.3 THEN 'severe' WHEN random() < 0.6 THEN 'moderate' ELSE 'mild' END);
    END IF;

    IF v_has_hypertension THEN
      INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, recorded_date, severity)
      VALUES (v_patient_id, 'I10', 'Essential Hypertension', 'active',
        (CURRENT_DATE - (floor(random() * 3650) + 365))::date, CURRENT_TIMESTAMP,
        CASE WHEN random() < 0.2 THEN 'severe' WHEN random() < 0.5 THEN 'moderate' ELSE 'mild' END);
    END IF;

    IF v_has_cvd THEN
      INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, recorded_date, severity)
      VALUES (v_patient_id, 'I25.10', 'Coronary Artery Disease', 'active',
        (CURRENT_DATE - (floor(random() * 2920) + 730))::date, CURRENT_TIMESTAMP, 'moderate');
    END IF;

    IF v_ckd_stage >= 1 THEN
      INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, recorded_date, severity)
      VALUES (v_patient_id, 'N18.' || v_ckd_stage::text,
        'Chronic Kidney Disease, Stage ' || v_ckd_stage::text,
        'active',
        CASE WHEN v_diagnosis_years > 0 THEN (CURRENT_DATE - (v_diagnosis_years * 365))::date ELSE CURRENT_DATE END,
        CURRENT_TIMESTAMP,
        CASE
          WHEN v_ckd_stage >= 4 THEN 'severe'
          WHEN v_ckd_stage = 3 THEN 'moderate'
          ELSE 'mild'
        END);
    END IF;

    -- Calculate KDIGO classification
    -- GFR category
    v_gfr_category := CASE
      WHEN v_egfr >= 90 THEN 'G1'
      WHEN v_egfr >= 60 THEN 'G2'
      WHEN v_egfr >= 45 THEN 'G3a'
      WHEN v_egfr >= 30 THEN 'G3b'
      WHEN v_egfr >= 15 THEN 'G4'
      ELSE 'G5'
    END;

    -- Albuminuria category
    v_alb_category := CASE
      WHEN v_uacr < 30 THEN 'A1'
      WHEN v_uacr < 300 THEN 'A2'
      ELSE 'A3'
    END;

    v_health_state := v_gfr_category || '-' || v_alb_category;

    -- Insert tracking data based on CKD status
    IF v_ckd_stage >= 1 THEN
      -- CKD patient tracking data
      v_ckd_severity := CASE
        WHEN v_ckd_stage >= 5 THEN 'kidney_failure'
        WHEN v_ckd_stage = 4 THEN 'severe'
        WHEN v_ckd_stage = 3 THEN 'moderate'
        ELSE 'mild'
      END;

      -- 85% of CKD patients monitored (higher % than non-CKD, but not 100%)
      -- More severe stages have higher monitoring rates
      v_is_monitored := CASE
        WHEN v_ckd_stage >= 4 THEN random() < 0.95  -- 95% for severe/kidney failure
        WHEN v_ckd_stage = 3 THEN random() < 0.90   -- 90% for moderate
        ELSE random() < 0.75                         -- 75% for mild
      END;

      v_monitoring_device := CASE WHEN v_is_monitored THEN 'Minuteful Kidney' ELSE NULL END;
      v_monitoring_frequency := CASE
        WHEN v_is_monitored AND v_ckd_stage >= 4 THEN 'weekly'
        WHEN v_is_monitored AND v_ckd_stage = 3 THEN 'biweekly'
        WHEN v_is_monitored THEN 'monthly'
        ELSE NULL
      END;

      -- Treatment rates vary by severity: more severe = higher treatment rate
      v_is_treated := CASE
        WHEN v_ckd_stage >= 4 THEN random() < 0.90  -- 90% for severe/kidney failure
        WHEN v_ckd_stage = 3 THEN random() < 0.85   -- 85% for moderate
        ELSE random() < 0.70                         -- 70% for mild
      END;

      INSERT INTO ckd_patient_data (
        patient_id, ckd_severity, ckd_stage,
        kdigo_gfr_category, kdigo_albuminuria_category, kdigo_health_state,
        is_monitored, monitoring_device, monitoring_frequency,
        is_treated
      ) VALUES (
        v_patient_id, v_ckd_severity, v_ckd_stage,
        v_gfr_category, v_alb_category, v_health_state,
        v_is_monitored, v_monitoring_device, v_monitoring_frequency,
        v_is_treated
      );

    ELSE
      -- Non-CKD patient tracking data
      -- Monitoring rates vary by risk level: higher risk = higher monitoring rate
      v_is_monitored := CASE
        WHEN v_risk_level = 3 THEN random() < 0.85  -- 85% for high risk
        WHEN v_risk_level = 2 THEN random() < 0.70  -- 70% for moderate risk
        ELSE random() < 0.50                         -- 50% for low risk
      END;

      v_monitoring_device := CASE WHEN v_is_monitored THEN 'Minuteful Kidney' ELSE NULL END;
      v_monitoring_frequency := CASE
        WHEN v_is_monitored AND v_risk_level = 3 THEN 'monthly'
        WHEN v_is_monitored AND v_risk_level = 2 THEN 'quarterly'
        WHEN v_is_monitored THEN 'biannually'
        ELSE NULL
      END;

      INSERT INTO non_ckd_patient_data (
        patient_id, risk_level, kdigo_health_state,
        is_monitored, monitoring_device, monitoring_frequency
      ) VALUES (
        v_patient_id,
        CASE v_risk_level
          WHEN 1 THEN 'low'
          WHEN 2 THEN 'moderate'
          ELSE 'high'
        END,
        v_health_state,
        v_is_monitored, v_monitoring_device, v_monitoring_frequency
      );
    END IF;

  END LOOP;

  RAISE NOTICE 'Successfully generated 1000 mock patients with comprehensive clinical data';
END $$;

-- Clean up function
DROP FUNCTION IF NOT EXISTS random_uuid();

-- ============================================
-- Treatment and Adherence Tracking System
-- ============================================
-- Migration 007: Adds comprehensive treatment and adherence tracking
-- for realistic disease progression simulation

-- ============================================
-- 1. Cycle Metadata - System-wide Cycle Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS cycle_metadata (
    id SERIAL PRIMARY KEY,
    current_cycle INTEGER NOT NULL DEFAULT 0,
    total_cycles INTEGER NOT NULL DEFAULT 24,
    cycle_duration_months INTEGER NOT NULL DEFAULT 1,
    simulation_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    last_advance_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure only one row exists
    CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize with cycle 0
INSERT INTO cycle_metadata (id, current_cycle, total_cycles, cycle_duration_months, simulation_start_date)
VALUES (1, 0, 24, 1, NOW())
ON CONFLICT (id) DO NOTHING;

CREATE INDEX idx_cycle_metadata_current ON cycle_metadata(current_cycle);

COMMENT ON TABLE cycle_metadata IS 'System-wide cycle tracking for cohort-based progression simulation';
COMMENT ON COLUMN cycle_metadata.current_cycle IS 'Current cycle number (0-24). Incremented by "Next Cycle" button';
COMMENT ON COLUMN cycle_metadata.last_advance_date IS 'Timestamp of last cycle advancement';

-- ============================================
-- 2. Patient Treatments
-- ============================================
CREATE TABLE IF NOT EXISTS patient_treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Treatment details
    medication_name VARCHAR(100) NOT NULL,
    medication_class VARCHAR(50) NOT NULL, -- 'RAS_INHIBITOR', 'SGLT2I', 'GLP1_RA', etc.

    -- Timing
    started_cycle INTEGER NOT NULL, -- Cycle when treatment started
    started_date TIMESTAMP NOT NULL,
    stopped_cycle INTEGER, -- null if ongoing
    stopped_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'stopped', 'paused'

    -- Adherence tracking
    baseline_adherence DECIMAL(3, 2) NOT NULL DEFAULT 0.80, -- Initial adherence (0.00-1.00)
    current_adherence DECIMAL(3, 2) NOT NULL DEFAULT 0.80, -- Current adherence score

    -- Expected vs actual effect tracking
    expected_egfr_benefit DECIMAL(5, 2), -- Expected eGFR improvement (mL/min)
    expected_uacr_reduction DECIMAL(4, 2), -- Expected uACR reduction (percentage, 0.30 = 30% reduction)

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_adherence_range CHECK (baseline_adherence BETWEEN 0 AND 1 AND current_adherence BETWEEN 0 AND 1),
    CONSTRAINT check_status CHECK (status IN ('active', 'stopped', 'paused'))
);

CREATE INDEX idx_treatments_patient ON patient_treatments(patient_id);
CREATE INDEX idx_treatments_status ON patient_treatments(status);
CREATE INDEX idx_treatments_class ON patient_treatments(medication_class);
CREATE INDEX idx_treatments_cycle ON patient_treatments(started_cycle);

COMMENT ON TABLE patient_treatments IS 'Tracks medication treatments and adherence for CKD patients';
COMMENT ON COLUMN patient_treatments.baseline_adherence IS 'Initial adherence score when treatment started (0.00-1.00)';
COMMENT ON COLUMN patient_treatments.current_adherence IS 'Current adherence score calculated from lab trends (0.00-1.00)';

-- ============================================
-- 3. Adherence History
-- ============================================
CREATE TABLE IF NOT EXISTS adherence_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_id UUID NOT NULL REFERENCES patient_treatments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Cycle tracking
    cycle_number INTEGER NOT NULL,
    measured_at TIMESTAMP NOT NULL,

    -- Adherence calculation
    adherence_score DECIMAL(3, 2) NOT NULL, -- 0.00-1.00
    calculation_method VARCHAR(50) NOT NULL, -- 'lab_trend', 'manual', 'pill_count', 'self_report'

    -- Supporting data for lab-based calculation
    egfr_value DECIMAL(5, 2),
    uacr_value DECIMAL(8, 2),
    egfr_change_from_baseline DECIMAL(6, 2),
    uacr_change_from_baseline DECIMAL(8, 2),

    -- Expected vs actual
    expected_egfr DECIMAL(5, 2), -- What we expected with 100% adherence
    actual_egfr DECIMAL(5, 2), -- What we observed
    adherence_indicator VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor', 'very_poor'

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_adherence_score CHECK (adherence_score BETWEEN 0 AND 1),
    CONSTRAINT unique_adherence_record UNIQUE (treatment_id, cycle_number)
);

CREATE INDEX idx_adherence_treatment ON adherence_history(treatment_id);
CREATE INDEX idx_adherence_patient ON adherence_history(patient_id);
CREATE INDEX idx_adherence_cycle ON adherence_history(cycle_number);
CREATE INDEX idx_adherence_score ON adherence_history(adherence_score);

COMMENT ON TABLE adherence_history IS 'Tracks adherence scores over time for treated patients';
COMMENT ON COLUMN adherence_history.adherence_score IS 'Calculated adherence (1.0 = perfect, 0.0 = none)';

-- ============================================
-- 4. Treatment Recommendations Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS treatment_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Recommendation details
    recommended_medication_class VARCHAR(50) NOT NULL,
    recommended_medication VARCHAR(100),
    recommendation_reason TEXT NOT NULL,

    -- Clinical context
    recommended_at_cycle INTEGER NOT NULL,
    recommended_at TIMESTAMP NOT NULL DEFAULT NOW(),
    health_state_at_recommendation VARCHAR(10),
    egfr_at_recommendation DECIMAL(5, 2),
    uacr_at_recommendation DECIMAL(8, 2),

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'implemented'
    implemented_at TIMESTAMP,
    implemented_cycle INTEGER,
    treatment_id UUID REFERENCES patient_treatments(id), -- Links to actual treatment if implemented

    -- Decision tracking
    decision_made_by VARCHAR(100),
    decision_notes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_rec_status CHECK (status IN ('pending', 'accepted', 'declined', 'implemented'))
);

CREATE INDEX idx_treatment_recs_patient ON treatment_recommendations(patient_id);
CREATE INDEX idx_treatment_recs_status ON treatment_recommendations(status);
CREATE INDEX idx_treatment_recs_cycle ON treatment_recommendations(recommended_at_cycle);
CREATE INDEX idx_treatment_recs_class ON treatment_recommendations(recommended_medication_class);

COMMENT ON TABLE treatment_recommendations IS 'Tracks AI-generated treatment recommendations and their implementation status';

-- ============================================
-- 5. Lab Values History (Enhanced)
-- ============================================
-- Add treatment-related columns to health_state_history
ALTER TABLE health_state_history
ADD COLUMN IF NOT EXISTS is_treated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS active_treatments TEXT[], -- Array of active medication classes
ADD COLUMN IF NOT EXISTS average_adherence DECIMAL(3, 2), -- Average adherence across all active treatments
ADD COLUMN IF NOT EXISTS treatment_effect_egfr DECIMAL(5, 2), -- Estimated treatment benefit on eGFR
ADD COLUMN IF NOT EXISTS treatment_effect_uacr DECIMAL(6, 2); -- Estimated treatment benefit on uACR

COMMENT ON COLUMN health_state_history.is_treated IS 'Whether patient has active treatments during this cycle';
COMMENT ON COLUMN health_state_history.average_adherence IS 'Average adherence score (0-1) for this cycle';

-- Add progression metadata to patient_progression_state
ALTER TABLE patient_progression_state
ADD COLUMN IF NOT EXISTS natural_trajectory VARCHAR(20), -- 'worsening' (always, unless treated)
ADD COLUMN IF NOT EXISTS last_updated_cycle INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_decline_locked BOOLEAN DEFAULT true; -- Ensures consistent decline rate

COMMENT ON COLUMN patient_progression_state.natural_trajectory IS 'Natural disease trajectory (always worsening without treatment)';
COMMENT ON COLUMN patient_progression_state.base_decline_locked IS 'If true, decline rate stays constant (realistic CKD progression)';

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to get current system cycle
CREATE OR REPLACE FUNCTION get_current_cycle()
RETURNS INTEGER AS $$
DECLARE
    current_cycle_num INTEGER;
BEGIN
    SELECT current_cycle INTO current_cycle_num FROM cycle_metadata WHERE id = 1;
    RETURN current_cycle_num;
END;
$$ LANGUAGE plpgsql;

-- Function to advance system cycle
CREATE OR REPLACE FUNCTION advance_system_cycle()
RETURNS INTEGER AS $$
DECLARE
    new_cycle INTEGER;
BEGIN
    UPDATE cycle_metadata
    SET
        current_cycle = current_cycle + 1,
        last_advance_date = NOW(),
        updated_at = NOW()
    WHERE id = 1
    RETURNING current_cycle INTO new_cycle;

    RETURN new_cycle;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient's active treatments
CREATE OR REPLACE FUNCTION get_active_treatments(p_patient_id UUID)
RETURNS TABLE (
    medication_name VARCHAR,
    medication_class VARCHAR,
    adherence DECIMAL,
    started_cycle INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.medication_name,
        pt.medication_class,
        pt.current_adherence,
        pt.started_cycle
    FROM patient_treatments pt
    WHERE pt.patient_id = p_patient_id
    AND pt.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate adherence from lab trends
CREATE OR REPLACE FUNCTION calculate_adherence_from_labs(
    p_treatment_id UUID,
    p_current_egfr DECIMAL,
    p_current_uacr DECIMAL,
    p_baseline_egfr DECIMAL,
    p_baseline_uacr DECIMAL,
    p_expected_egfr_benefit DECIMAL,
    p_expected_uacr_reduction DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    actual_egfr_change DECIMAL;
    actual_uacr_change DECIMAL;
    adherence_from_egfr DECIMAL;
    adherence_from_uacr DECIMAL;
    final_adherence DECIMAL;
BEGIN
    -- Calculate actual changes
    actual_egfr_change := p_current_egfr - p_baseline_egfr;
    actual_uacr_change := (p_current_uacr - p_baseline_uacr) / NULLIF(p_baseline_uacr, 0);

    -- Estimate adherence from eGFR (higher is better adherence)
    IF p_expected_egfr_benefit IS NOT NULL THEN
        adherence_from_egfr := GREATEST(0, LEAST(1, actual_egfr_change / NULLIF(p_expected_egfr_benefit, 0)));
    ELSE
        adherence_from_egfr := NULL;
    END IF;

    -- Estimate adherence from uACR (more reduction = better adherence)
    IF p_expected_uacr_reduction IS NOT NULL THEN
        adherence_from_uacr := GREATEST(0, LEAST(1, -actual_uacr_change / NULLIF(p_expected_uacr_reduction, 0)));
    ELSE
        adherence_from_uacr := NULL;
    END IF;

    -- Average both if available, otherwise use whichever is available
    IF adherence_from_egfr IS NOT NULL AND adherence_from_uacr IS NOT NULL THEN
        final_adherence := (adherence_from_egfr + adherence_from_uacr) / 2.0;
    ELSIF adherence_from_egfr IS NOT NULL THEN
        final_adherence := adherence_from_egfr;
    ELSIF adherence_from_uacr IS NOT NULL THEN
        final_adherence := adherence_from_uacr;
    ELSE
        final_adherence := 0.5; -- Default to moderate adherence if can't calculate
    END IF;

    -- Ensure in valid range
    final_adherence := GREATEST(0, LEAST(1, final_adherence));

    RETURN final_adherence;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Indexes for Performance
-- ============================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_health_state_patient_cycle
ON health_state_history(patient_id, cycle_number);

CREATE INDEX IF NOT EXISTS idx_treatments_patient_status
ON patient_treatments(patient_id, status);

-- ============================================
-- Migration 007 Complete
-- ============================================

SELECT 'Treatment and Adherence Tracking System created successfully!' AS status;

-- ============================================
-- Migration 008: Jardiance Adherence Tracking System
-- Implements complete medication adherence monitoring
-- Based on Minuteful Kidney Variable Dictionary
-- ============================================

-- ============================================
-- 1. Add Comorbidity Flags to Patients Table
-- ============================================

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS has_diabetes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_hypertension BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_heart_failure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_cad BOOLEAN DEFAULT false;

-- Create indexes for quick filtering
CREATE INDEX IF NOT EXISTS idx_patients_has_diabetes ON patients(has_diabetes);
CREATE INDEX IF NOT EXISTS idx_patients_has_hypertension ON patients(has_hypertension);

COMMENT ON COLUMN patients.has_diabetes IS 'Computed flag: Patient has Type 1 or Type 2 Diabetes';
COMMENT ON COLUMN patients.has_hypertension IS 'Computed flag: Patient has Essential Hypertension';
COMMENT ON COLUMN patients.has_heart_failure IS 'Computed flag: Patient has Heart Failure';
COMMENT ON COLUMN patients.has_cad IS 'Computed flag: Patient has Coronary Artery Disease';

-- ============================================
-- 2. Jardiance Prescriptions Table
-- ============================================

CREATE TABLE IF NOT EXISTS jardiance_prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Prescription details
    prescribed BOOLEAN DEFAULT true,
    currently_taking BOOLEAN DEFAULT true,
    medication VARCHAR(100) NOT NULL, -- "Jardiance (empagliflozin) 10mg" or "25mg"
    dosage VARCHAR(20) NOT NULL, -- "10mg", "25mg"

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE, -- NULL if currently active

    -- Prescriber information
    prescriber_name VARCHAR(100),
    prescriber_npi VARCHAR(20),

    -- Indication
    indication VARCHAR(100), -- "CKD with diabetes", "CKD without diabetes", "Heart failure"

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT check_dosage CHECK (dosage IN ('10mg', '25mg'))
);

CREATE INDEX idx_jardiance_prescriptions_patient_id ON jardiance_prescriptions(patient_id);
CREATE INDEX idx_jardiance_prescriptions_active ON jardiance_prescriptions(currently_taking) WHERE currently_taking = true;
CREATE INDEX idx_jardiance_prescriptions_dates ON jardiance_prescriptions(start_date, end_date);

COMMENT ON TABLE jardiance_prescriptions IS 'Tracks all Jardiance prescriptions for patients';
COMMENT ON COLUMN jardiance_prescriptions.currently_taking IS 'TRUE if patient is actively taking this prescription';
COMMENT ON COLUMN jardiance_prescriptions.end_date IS 'NULL for active prescriptions, set date when discontinued';

-- ============================================
-- 3. Jardiance Refills Table
-- ============================================

CREATE TABLE IF NOT EXISTS jardiance_refills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES jardiance_prescriptions(id) ON DELETE CASCADE,

    -- Refill details
    refill_date DATE NOT NULL,
    days_supply INTEGER NOT NULL, -- Usually 30 or 90 days
    quantity INTEGER NOT NULL, -- Number of tablets

    -- Expected vs actual
    expected_refill_date DATE, -- When we expected them to refill
    gap_days INTEGER, -- Calculated: actual refill date - expected refill date (positive = late)

    -- Pharmacy information
    pharmacy_name VARCHAR(100),
    pharmacy_npi VARCHAR(20),

    -- Cost information (optional)
    copay_amount DECIMAL(10, 2),
    cost_barrier_reported BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_days_supply CHECK (days_supply BETWEEN 7 AND 365),
    CONSTRAINT check_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_jardiance_refills_prescription_id ON jardiance_refills(prescription_id);
CREATE INDEX idx_jardiance_refills_date ON jardiance_refills(refill_date);
CREATE INDEX idx_jardiance_refills_gap ON jardiance_refills(gap_days) WHERE gap_days > 7;

COMMENT ON TABLE jardiance_refills IS 'Tracks every refill event for Jardiance prescriptions';
COMMENT ON COLUMN jardiance_refills.gap_days IS 'Days between expected and actual refill. Positive = late, Negative = early';
COMMENT ON COLUMN jardiance_refills.expected_refill_date IS 'Calculated as previous_refill_date + days_supply';

-- ============================================
-- 4. Jardiance Adherence Metrics Table
-- ============================================

CREATE TABLE IF NOT EXISTS jardiance_adherence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES jardiance_prescriptions(id) ON DELETE CASCADE,

    -- Assessment period
    assessment_date DATE NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    period_days INTEGER NOT NULL, -- Usually 30, 90, or 180 days

    -- Primary adherence metrics
    mpr DECIMAL(5, 2) NOT NULL, -- Medication Possession Ratio (0.00 to 100.00)
    pdc DECIMAL(5, 2) NOT NULL, -- Proportion of Days Covered (0.00 to 100.00)

    -- Adherence category
    category VARCHAR(20) NOT NULL, -- 'High' (≥80%), 'Medium' (60-79%), 'Low' (<60%)

    -- Supporting data
    total_refills INTEGER NOT NULL,
    total_days_supply INTEGER NOT NULL,
    total_quantity INTEGER NOT NULL,

    -- Gap analysis
    total_gap_days INTEGER DEFAULT 0,
    max_gap_days INTEGER DEFAULT 0,
    gap_count INTEGER DEFAULT 0, -- Number of gaps > 7 days

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_mpr_range CHECK (mpr BETWEEN 0 AND 100),
    CONSTRAINT check_pdc_range CHECK (pdc BETWEEN 0 AND 100),
    CONSTRAINT check_category CHECK (category IN ('High', 'Medium', 'Low')),
    CONSTRAINT check_period_dates CHECK (period_end_date >= period_start_date),
    CONSTRAINT check_period_days CHECK (period_days = (period_end_date - period_start_date + 1))
);

CREATE INDEX idx_jardiance_adherence_prescription_id ON jardiance_adherence(prescription_id);
CREATE INDEX idx_jardiance_adherence_date ON jardiance_adherence(assessment_date);
CREATE INDEX idx_jardiance_adherence_category ON jardiance_adherence(category);
CREATE INDEX idx_jardiance_adherence_mpr ON jardiance_adherence(mpr);

COMMENT ON TABLE jardiance_adherence IS 'Computed adherence metrics over specific time periods';
COMMENT ON COLUMN jardiance_adherence.mpr IS 'MPR = (Total days supply / Days in period) × 100';
COMMENT ON COLUMN jardiance_adherence.pdc IS 'PDC = (Days with medication available / Days in period) × 100';
COMMENT ON COLUMN jardiance_adherence.category IS 'High: MPR≥80%, Medium: 60-79%, Low: <60%';

-- ============================================
-- 5. Adherence Barriers Table
-- ============================================

CREATE TABLE IF NOT EXISTS adherence_barriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES jardiance_prescriptions(id) ON DELETE CASCADE,

    -- Barrier details
    barrier_type VARCHAR(50) NOT NULL,
    barrier_description TEXT,

    -- Status
    identified_date DATE NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolution_date DATE,
    resolution_notes TEXT,

    -- Severity
    severity VARCHAR(20), -- 'Low', 'Medium', 'High', 'Critical'

    -- Intervention tracking
    intervention_required BOOLEAN DEFAULT false,
    intervention_type VARCHAR(100),
    intervention_date DATE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_barrier_type CHECK (barrier_type IN (
        'Cost concerns',
        'Forgetfulness',
        'Side effects',
        'Access/Transportation',
        'Complex regimen',
        'Lack of symptoms',
        'Health literacy',
        'Depression/Mental health',
        'Pharmacy issues',
        'Insurance issues',
        'Other'
    )),
    CONSTRAINT check_resolution_dates CHECK (
        resolution_date IS NULL OR resolution_date >= identified_date
    ),
    CONSTRAINT check_severity CHECK (severity IN ('Low', 'Medium', 'High', 'Critical'))
);

CREATE INDEX idx_adherence_barriers_prescription_id ON adherence_barriers(prescription_id);
CREATE INDEX idx_adherence_barriers_type ON adherence_barriers(barrier_type);
CREATE INDEX idx_adherence_barriers_resolved ON adherence_barriers(resolved) WHERE resolved = false;
CREATE INDEX idx_adherence_barriers_severity ON adherence_barriers(severity);

COMMENT ON TABLE adherence_barriers IS 'Tracks identified barriers to medication adherence and their resolution';
COMMENT ON COLUMN adherence_barriers.barrier_type IS 'Standardized barrier categories from Variable Dictionary';
COMMENT ON COLUMN adherence_barriers.resolved IS 'TRUE when barrier has been addressed';

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to calculate MPR for a prescription over a period
CREATE OR REPLACE FUNCTION calculate_jardiance_mpr(
    p_prescription_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS DECIMAL(5, 2) AS $$
DECLARE
    v_total_days_supply INTEGER;
    v_period_days INTEGER;
    v_mpr DECIMAL(5, 2);
BEGIN
    -- Calculate total days supply from refills in period
    SELECT COALESCE(SUM(days_supply), 0)
    INTO v_total_days_supply
    FROM jardiance_refills
    WHERE prescription_id = p_prescription_id
      AND refill_date BETWEEN p_start_date AND p_end_date;

    -- Calculate period length
    v_period_days := p_end_date - p_start_date + 1;

    -- Calculate MPR
    IF v_period_days > 0 THEN
        v_mpr := LEAST((v_total_days_supply::DECIMAL / v_period_days) * 100, 100.00);
    ELSE
        v_mpr := 0;
    END IF;

    RETURN v_mpr;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_jardiance_mpr IS 'Calculates Medication Possession Ratio for a prescription over a date range';

-- Function to determine adherence category from MPR
CREATE OR REPLACE FUNCTION get_adherence_category(p_mpr DECIMAL)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF p_mpr >= 80 THEN
        RETURN 'High';
    ELSIF p_mpr >= 60 THEN
        RETURN 'Medium';
    ELSE
        RETURN 'Low';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_adherence_category IS 'Converts MPR percentage to adherence category (High/Medium/Low)';

-- Function to get latest adherence for a prescription
CREATE OR REPLACE FUNCTION get_latest_adherence(p_prescription_id UUID)
RETURNS TABLE (
    mpr DECIMAL(5, 2),
    pdc DECIMAL(5, 2),
    category VARCHAR(20),
    assessment_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ja.mpr,
        ja.pdc,
        ja.category,
        ja.assessment_date
    FROM jardiance_adherence ja
    WHERE ja.prescription_id = p_prescription_id
    ORDER BY ja.assessment_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_latest_adherence IS 'Returns most recent adherence metrics for a prescription';

-- Function to get active barriers for a prescription
CREATE OR REPLACE FUNCTION get_active_barriers(p_prescription_id UUID)
RETURNS TABLE (
    barrier_type VARCHAR(50),
    identified_date DATE,
    severity VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ab.barrier_type,
        ab.identified_date,
        ab.severity
    FROM adherence_barriers ab
    WHERE ab.prescription_id = p_prescription_id
      AND ab.resolved = false
    ORDER BY
        CASE ab.severity
            WHEN 'Critical' THEN 1
            WHEN 'High' THEN 2
            WHEN 'Medium' THEN 3
            WHEN 'Low' THEN 4
            ELSE 5
        END,
        ab.identified_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_barriers IS 'Returns all unresolved barriers for a prescription, ordered by severity';

-- ============================================
-- 7. Trigger to Update Comorbidity Flags
-- ============================================

CREATE OR REPLACE FUNCTION update_comorbidity_flags()
RETURNS TRIGGER AS $$
BEGIN
    -- Update patient comorbidity flags based on conditions table
    UPDATE patients p
    SET
        has_diabetes = EXISTS (
            SELECT 1 FROM conditions c
            WHERE c.patient_id = NEW.patient_id
              AND c.clinical_status = 'active'
              AND (c.condition_code LIKE 'E11%' OR c.condition_code LIKE 'E10%')
        ),
        has_hypertension = EXISTS (
            SELECT 1 FROM conditions c
            WHERE c.patient_id = NEW.patient_id
              AND c.clinical_status = 'active'
              AND c.condition_code = 'I10'
        ),
        has_heart_failure = EXISTS (
            SELECT 1 FROM conditions c
            WHERE c.patient_id = NEW.patient_id
              AND c.clinical_status = 'active'
              AND c.condition_code LIKE 'I50%'
        ),
        has_cad = EXISTS (
            SELECT 1 FROM conditions c
            WHERE c.patient_id = NEW.patient_id
              AND c.clinical_status = 'active'
              AND c.condition_code LIKE 'I25%'
        )
    WHERE p.id = NEW.patient_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on conditions table
DROP TRIGGER IF EXISTS trg_update_comorbidity_flags ON conditions;
CREATE TRIGGER trg_update_comorbidity_flags
    AFTER INSERT OR UPDATE ON conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_comorbidity_flags();

COMMENT ON FUNCTION update_comorbidity_flags IS 'Automatically updates patient comorbidity flags when conditions are added/modified';

-- ============================================
-- 8. View: Complete Patient Adherence Summary
-- ============================================

CREATE OR REPLACE VIEW patient_jardiance_summary AS
SELECT
    p.id as patient_id,
    p.medical_record_number as mrn,
    p.first_name || ' ' || p.last_name as patient_name,
    p.has_diabetes,
    p.has_hypertension,
    p.on_ras_inhibitor,

    -- Prescription info
    jp.id as prescription_id,
    jp.currently_taking,
    jp.medication,
    jp.dosage,
    jp.start_date as prescription_start_date,
    jp.end_date as prescription_end_date,

    -- Latest adherence
    la.mpr as latest_mpr,
    la.pdc as latest_pdc,
    la.category as adherence_category,
    la.assessment_date as last_assessment_date,

    -- Refill info
    (SELECT COUNT(*) FROM jardiance_refills jr WHERE jr.prescription_id = jp.id) as total_refills,
    (SELECT MAX(refill_date) FROM jardiance_refills jr WHERE jr.prescription_id = jp.id) as last_refill_date,
    (SELECT AVG(gap_days) FROM jardiance_refills jr WHERE jr.prescription_id = jp.id AND gap_days > 0) as avg_refill_gap,

    -- Barriers
    (SELECT COUNT(*) FROM adherence_barriers ab WHERE ab.prescription_id = jp.id AND ab.resolved = false) as active_barriers_count,
    (SELECT string_agg(barrier_type, ', ') FROM adherence_barriers ab WHERE ab.prescription_id = jp.id AND ab.resolved = false) as active_barriers

FROM patients p
LEFT JOIN jardiance_prescriptions jp ON p.id = jp.patient_id AND jp.currently_taking = true
LEFT JOIN LATERAL (
    SELECT mpr, pdc, category, assessment_date
    FROM jardiance_adherence ja
    WHERE ja.prescription_id = jp.id
    ORDER BY assessment_date DESC
    LIMIT 1
) la ON true
WHERE jp.id IS NOT NULL OR p.on_sglt2i = true;

COMMENT ON VIEW patient_jardiance_summary IS 'Complete summary of patient Jardiance prescriptions and adherence metrics';

-- ============================================
-- 9. Initialize Comorbidity Flags for Existing Patients
-- ============================================

-- Update comorbidity flags for all existing patients
UPDATE patients p
SET
    has_diabetes = EXISTS (
        SELECT 1 FROM conditions c
        WHERE c.patient_id = p.id
          AND c.clinical_status = 'active'
          AND (c.condition_code LIKE 'E11%' OR c.condition_code LIKE 'E10%')
    ),
    has_hypertension = EXISTS (
        SELECT 1 FROM conditions c
        WHERE c.patient_id = p.id
          AND c.clinical_status = 'active'
          AND c.condition_code = 'I10'
    ),
    has_heart_failure = EXISTS (
        SELECT 1 FROM conditions c
        WHERE c.patient_id = p.id
          AND c.clinical_status = 'active'
          AND c.condition_code LIKE 'I50%'
    ),
    has_cad = EXISTS (
        SELECT 1 FROM conditions c
        WHERE c.patient_id = p.id
          AND c.clinical_status = 'active'
          AND c.condition_code LIKE 'I25%'
    );

-- ============================================
-- Migration 008 Complete
-- ============================================

SELECT 'Migration 008: Jardiance Adherence Tracking installed successfully' AS status;

-- ============================================
-- Populate 1001 Realistic CKD Patients
-- ============================================

-- ===============================================================
-- POPULATE 1001 PATIENTS WITH COMPREHENSIVE CKD DATA + VERIFICATION
-- Based on: Unified_CKD_Complete_Specification_Enhanced_v3
-- ===============================================================
-- This script generates 1001 realistic patients with:
-- - Unique name combinations (no duplicate first+last name pairs)
-- - Gender-appropriate names with verification
-- - Demographics and vital signs
-- - Comprehensive lab values
-- - Comorbidities and conditions
-- - Medications and prescriptions
-- - Refill history for adherence tracking
-- - Risk assessments
-- - POST-GENERATION VERIFICATION:
--   * Duplicate name detection
--   * Gender-name concordance check
-- ===============================================================

DO $$
DECLARE
    v_patient_id UUID;
    v_age INTEGER;
    v_has_diabetes BOOLEAN;
    v_has_hypertension BOOLEAN;
    v_has_heart_failure BOOLEAN;
    v_has_obesity BOOLEAN;
    v_weight DECIMAL;
    v_height INTEGER;
    v_bmi DECIMAL;
    v_egfr DECIMAL;
    v_uacr DECIMAL;
    v_creatinine DECIMAL;
    v_hba1c DECIMAL;
    v_sbp INTEGER;
    v_dbp INTEGER;
    v_gender VARCHAR(10);
    v_first_name TEXT;
    v_last_name TEXT;
    v_name_exists BOOLEAN;
    v_retry_count INTEGER;

    -- Expanded gender-specific name arrays (75 names each for more combinations)
    v_male_first_names TEXT[] := ARRAY[
        'James', 'Robert', 'Michael', 'William', 'David',
        'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher',
        'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald',
        'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
        'Kevin', 'Brian', 'George', 'Edward', 'Ronald',
        'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
        'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen',
        'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin',
        'Samuel', 'Raymond', 'Gregory', 'Frank', 'Alexander',
        'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler',
        'Aaron', 'Jose', 'Adam', 'Henry', 'Nathan',
        'Douglas', 'Zachary', 'Peter', 'Kyle', 'Walter',
        'Ethan', 'Jeremy', 'Harold', 'Keith', 'Christian',
        'Roger', 'Noah', 'Gerald', 'Carl', 'Terry',
        'Sean', 'Austin', 'Arthur', 'Lawrence', 'Jesse'
    ];

    v_female_first_names TEXT[] := ARRAY[
        'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara',
        'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
        'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra',
        'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
        'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah',
        'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
        'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna',
        'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen',
        'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel',
        'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather',
        'Diane', 'Ruth', 'Julie', 'Joyce', 'Virginia',
        'Victoria', 'Kelly', 'Lauren', 'Christina', 'Joan',
        'Evelyn', 'Judith', 'Megan', 'Cheryl', 'Andrea',
        'Hannah', 'Jacqueline', 'Martha', 'Gloria', 'Teresa',
        'Ann', 'Sara', 'Madison', 'Frances', 'Kathryn'
    ];

    v_last_names TEXT[] := ARRAY[
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
        'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
        'Lee', 'Perez', 'Thompson', 'White', 'Harris',
        'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
        'Walker', 'Young', 'Allen', 'King', 'Wright',
        'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
        'Green', 'Adams', 'Nelson', 'Baker', 'Hall',
        'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
    ];

    v_prescription_id UUID;
    v_med_name TEXT;
    v_med_class TEXT;
    v_days_supply INTEGER;
    v_refill_date DATE;
    v_patient_counter INTEGER := 0;
    v_batch_size INTEGER := 100;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting population of 1001 patients with unique names...';
    RAISE NOTICE '========================================';

    -- Generate 1001 patients
    FOR i IN 1..1001 LOOP
        v_patient_id := gen_random_uuid();
        v_patient_counter := v_patient_counter + 1;

        -- Progress notification every 100 patients
        IF v_patient_counter % v_batch_size = 0 THEN
            RAISE NOTICE 'Processed % patients...', v_patient_counter;
        END IF;

        -- Determine gender first (roughly equal distribution)
        v_gender := CASE WHEN random() < 0.48 THEN 'male' ELSE 'female' END;

        -- Generate unique name combination
        v_name_exists := TRUE;
        v_retry_count := 0;
        WHILE v_name_exists AND v_retry_count < 100 LOOP
            -- Pick gender-appropriate first name
            IF v_gender = 'male' THEN
                v_first_name := v_male_first_names[1 + floor(random() * array_length(v_male_first_names, 1))::int];
            ELSE
                v_first_name := v_female_first_names[1 + floor(random() * array_length(v_female_first_names, 1))::int];
            END IF;

            -- Pick random last name
            v_last_name := v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int];

            -- Check if this combination already exists
            SELECT EXISTS(
                SELECT 1 FROM patients
                WHERE first_name = v_first_name AND last_name = v_last_name
            ) INTO v_name_exists;

            v_retry_count := v_retry_count + 1;
        END LOOP;

        -- If we couldn't find a unique combination, add a middle initial
        IF v_name_exists THEN
            v_first_name := v_first_name || ' ' || chr(65 + floor(random() * 26)::int) || '.';
        END IF;

        -- Generate demographics
        v_age := 40 + floor(random() * 45)::INTEGER;  -- Ages 40-85
        v_height := 160 + floor(random() * 30)::INTEGER;  -- 160-190 cm
        v_weight := 60 + (random() * 60);  -- 60-120 kg
        v_bmi := v_weight / ((v_height / 100.0) ^ 2);
        v_has_obesity := v_bmi >= 30;

        -- Determine comorbidities (correlated with age and BMI)
        v_has_diabetes := (random() < 0.45) OR (v_age > 60 AND random() < 0.6) OR (v_bmi > 32 AND random() < 0.55);
        v_has_hypertension := (random() < 0.60) OR (v_age > 65 AND random() < 0.75) OR v_has_diabetes;
        v_has_heart_failure := (v_age > 70 AND random() < 0.15) OR (v_has_diabetes AND v_has_hypertension AND random() < 0.10);

        -- Generate vital signs
        v_sbp := 110 + floor(random() * 70)::INTEGER;  -- 110-180 mmHg
        v_dbp := 70 + floor(random() * 30)::INTEGER;   -- 70-100 mmHg

        -- If hypertensive, increase BP
        IF v_has_hypertension THEN
            v_sbp := v_sbp + 15 + floor(random() * 20)::INTEGER;
            v_dbp := v_dbp + 10 + floor(random() * 15)::INTEGER;
        END IF;

        -- Generate lab values based on comorbidities
        -- eGFR: Lower if diabetes/hypertension/age
        v_egfr := 90 - (CASE WHEN v_has_diabetes THEN 15 ELSE 0 END)
                     - (CASE WHEN v_has_hypertension THEN 10 ELSE 0 END)
                     - ((v_age - 40) * 0.5)
                     + (random() * 30 - 15);
        v_egfr := GREATEST(15, LEAST(120, v_egfr));  -- Clamp between 15-120

        -- uACR: Higher if diabetes/CKD
        IF v_has_diabetes OR v_egfr < 60 THEN
            v_uacr := 30 + (random() * 400);  -- Likely proteinuria
        ELSE
            v_uacr := 5 + (random() * 40);   -- Normal to mild
        END IF;

        -- Creatinine (inversely related to eGFR)
        v_creatinine := 0.7 + (120 - v_egfr) / 100.0 + (random() * 0.3);

        -- HbA1c (elevated if diabetic)
        IF v_has_diabetes THEN
            v_hba1c := 6.5 + (random() * 3.5);  -- 6.5-10% (diabetic range)
        ELSE
            v_hba1c := 5.0 + (random() * 1.0);  -- 5-6% (normal)
        END IF;

        -- Insert patient
        INSERT INTO patients (
            id,
            medical_record_number,
            first_name,
            last_name,
            date_of_birth,
            gender,
            email,
            phone,
            weight,
            height,
            bmi,
            systolic_bp,
            diastolic_bp,
            bp_control_status,
            heart_rate,
            oxygen_saturation,
            smoking_status,
            has_diabetes,
            has_hypertension,
            has_heart_failure,
            has_cad,
            has_aki_history,
            has_obesity,
            has_metabolic_syndrome,
            cvd_history,
            family_history_esrd,
            on_ras_inhibitor,
            on_sglt2i,
            resistant_hypertension,
            antihypertensive_count,
            ckd_diagnosed,
            monitoring_status,
            current_risk_score,
            last_visit_date,
            next_visit_date
        ) VALUES (
            v_patient_id,
            'MRN' || lpad(i::text, 6, '0'),
            v_first_name,
            v_last_name,
            (CURRENT_DATE - (v_age * 365 + floor(random() * 365)::int))::date,
            v_gender,
            lower(regexp_replace(v_first_name, '[^a-zA-Z]', '', 'g')) || '.' || lower(v_last_name) || i || '@example.com',
            '555-' || lpad(floor(random() * 10000)::text, 4, '0') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
            v_weight,
            v_height,
            v_bmi,
            v_sbp,
            v_dbp,
            CASE WHEN v_sbp >= 140 OR v_dbp >= 90 THEN 'Uncontrolled' ELSE 'Controlled' END,
            60 + floor(random() * 40)::INTEGER,  -- Heart rate 60-100
            95 + (random() * 5),  -- O2 sat 95-100%
            CASE
                WHEN random() < 0.50 THEN 'Never'
                WHEN random() < 0.85 THEN 'Former'
                ELSE 'Current'
            END,
            v_has_diabetes,
            v_has_hypertension,
            v_has_heart_failure,
            v_has_heart_failure AND random() < 0.4,  -- CAD
            v_age > 65 AND random() < 0.12,  -- AKI history
            v_has_obesity,
            v_has_obesity AND v_has_hypertension AND v_has_diabetes,
            v_has_heart_failure OR (random() < 0.15),
            random() < 0.18,  -- Family history ESRD
            v_has_hypertension OR (v_egfr < 60 AND v_uacr >= 30),  -- On RAS inhibitor
            v_has_diabetes AND v_egfr >= 20 AND v_egfr < 75 AND v_uacr >= 30,  -- On SGLT2i
            v_sbp >= 160 AND v_has_hypertension,  -- Resistant HTN
            CASE
                WHEN v_has_hypertension AND v_sbp >= 160 THEN 3 + floor(random() * 2)::INTEGER
                WHEN v_has_hypertension THEN 1 + floor(random() * 2)::INTEGER
                ELSE 0
            END,
            v_egfr < 60 OR v_uacr >= 30,  -- CKD diagnosed
            CASE WHEN v_egfr < 60 THEN 'active' ELSE 'inactive' END,
            floor(random() * 100)::INTEGER,
            CURRENT_DATE - (floor(random() * 90)::INTEGER),  -- Last visit within 3 months
            CURRENT_DATE + (30 + floor(random() * 120)::INTEGER)  -- Next visit 1-5 months
        );

        -- ============================================
        -- Insert observations (labs)
        -- ============================================

        -- eGFR (multiple measurements over past 12 months)
        FOR j IN 0..3 LOOP
            INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status)
            VALUES (
                v_patient_id,
                'eGFR',
                v_egfr + (random() * 10 - 5) - (j * (random() * 2)),  -- Slight decline over time
                'mL/min/1.73m²',
                CURRENT_DATE - ((j * 90 + floor(random() * 30)::INTEGER)),
                'final'
            );
        END LOOP;

        -- uACR
        FOR j IN 0..3 LOOP
            INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status)
            VALUES (
                v_patient_id,
                'uACR',
                v_uacr + (random() * 50 - 25),
                'mg/g',
                CURRENT_DATE - ((j * 90 + floor(random() * 30)::INTEGER)),
                'final'
            );
        END LOOP;

        -- Serum Creatinine
        INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status)
        VALUES (v_patient_id, 'Creatinine', v_creatinine, 'mg/dL', CURRENT_DATE - floor(random() * 90)::INTEGER, 'final');

        -- Potassium
        INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status)
        VALUES (v_patient_id, 'Potassium', 3.5 + (random() * 1.5), 'mEq/L', CURRENT_DATE - floor(random() * 90)::INTEGER, 'final');

        -- HbA1c (if diabetic)
        IF v_has_diabetes THEN
            INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status)
            VALUES (v_patient_id, 'HbA1c', v_hba1c, '%', CURRENT_DATE - floor(random() * 90)::INTEGER, 'final');
        END IF;

        -- Lipid panel
        INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status) VALUES
        (v_patient_id, 'Total Cholesterol', 150 + (random() * 100), 'mg/dL', CURRENT_DATE - floor(random() * 180)::INTEGER, 'final'),
        (v_patient_id, 'LDL', 70 + (random() * 100), 'mg/dL', CURRENT_DATE - floor(random() * 180)::INTEGER, 'final'),
        (v_patient_id, 'HDL', 35 + (random() * 40), 'mg/dL', CURRENT_DATE - floor(random() * 180)::INTEGER, 'final'),
        (v_patient_id, 'Triglycerides', 80 + (random() * 200), 'mg/dL', CURRENT_DATE - floor(random() * 180)::INTEGER, 'final');

        -- Additional labs
        INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status) VALUES
        (v_patient_id, 'Hemoglobin', 11.5 + (random() * 4.5), 'g/dL', CURRENT_DATE - floor(random() * 90)::INTEGER, 'final'),
        (v_patient_id, 'Albumin', 3.0 + (random() * 1.5), 'g/dL', CURRENT_DATE - floor(random() * 90)::INTEGER, 'final'),
        (v_patient_id, 'Calcium', 8.5 + (random() * 1.5), 'mg/dL', CURRENT_DATE - floor(random() * 90)::INTEGER, 'final'),
        (v_patient_id, 'Phosphorus', 2.5 + (random() * 2.0), 'mg/dL', CURRENT_DATE - floor(random() * 90)::INTEGER, 'final'),
        (v_patient_id, 'Uric Acid', 4.0 + (random() * 5.0), 'mg/dL', CURRENT_DATE - floor(random() * 180)::INTEGER, 'final');

        -- ============================================
        -- Insert conditions
        -- ============================================

        IF v_has_diabetes THEN
            INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity)
            VALUES (
                v_patient_id,
                'E11.22',
                'Type 2 Diabetes Mellitus with Diabetic Chronic Kidney Disease',
                'active',
                (CURRENT_DATE - ((2 + floor(random() * 8)::INTEGER) * 365))::date,
                CASE WHEN v_hba1c > 9 THEN 'severe' WHEN v_hba1c > 7.5 THEN 'moderate' ELSE 'mild' END
            );
        END IF;

        IF v_has_hypertension THEN
            INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity)
            VALUES (
                v_patient_id,
                'I12.9',
                'Hypertensive Chronic Kidney Disease',
                'active',
                (CURRENT_DATE - ((3 + floor(random() * 10)::INTEGER) * 365))::date,
                CASE WHEN v_sbp >= 160 THEN 'severe' WHEN v_sbp >= 140 THEN 'moderate' ELSE 'mild' END
            );
        END IF;

        IF v_has_heart_failure THEN
            INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity)
            VALUES (
                v_patient_id,
                'I50.9',
                'Heart Failure, Unspecified',
                'active',
                (CURRENT_DATE - ((1 + floor(random() * 5)::INTEGER) * 365))::date,
                'moderate'
            );
        END IF;

        IF v_egfr < 60 OR v_uacr >= 30 THEN
            INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity)
            VALUES (
                v_patient_id,
                CASE
                    WHEN v_egfr >= 60 THEN 'N18.2'  -- Stage 2
                    WHEN v_egfr >= 45 THEN 'N18.31' -- Stage 3a
                    WHEN v_egfr >= 30 THEN 'N18.32' -- Stage 3b
                    WHEN v_egfr >= 15 THEN 'N18.4'  -- Stage 4
                    ELSE 'N18.5'                     -- Stage 5
                END,
                CASE
                    WHEN v_egfr >= 60 THEN 'Chronic Kidney Disease, Stage 2'
                    WHEN v_egfr >= 45 THEN 'Chronic Kidney Disease, Stage 3a'
                    WHEN v_egfr >= 30 THEN 'Chronic Kidney Disease, Stage 3b'
                    WHEN v_egfr >= 15 THEN 'Chronic Kidney Disease, Stage 4'
                    ELSE 'Chronic Kidney Disease, Stage 5'
                END,
                'active',
                (CURRENT_DATE - ((1 + floor(random() * 3)::INTEGER) * 365))::date,
                CASE WHEN v_egfr < 30 THEN 'severe' WHEN v_egfr < 60 THEN 'moderate' ELSE 'mild' END
            );
        END IF;

        -- ============================================
        -- Insert prescriptions and refills
        -- ============================================

        -- RAS Inhibitor (if indicated)
        IF v_has_hypertension OR (v_egfr < 60 AND v_uacr >= 30) THEN
            v_med_name := CASE floor(random() * 3)::INTEGER
                WHEN 0 THEN 'Lisinopril'
                WHEN 1 THEN 'Losartan'
                ELSE 'Valsartan'
            END;
            v_med_class := CASE WHEN v_med_name = 'Lisinopril' THEN 'ACEi' ELSE 'ARB' END;

            INSERT INTO prescriptions (
                patient_id, medication_name, generic_name, medication_class,
                prescribed_date, dosage, frequency, quantity_per_fill, days_supply,
                refills_authorized, refills_remaining, status
            ) VALUES (
                v_patient_id, v_med_name, v_med_name, v_med_class,
                CURRENT_DATE - floor(random() * 730)::INTEGER,
                '10mg', 'Once daily', 30, 30, 11, floor(random() * 12)::INTEGER, 'active'
            )
            RETURNING id INTO v_prescription_id;

            -- Generate 12 months of refills
            FOR j IN 1..12 LOOP
                v_refill_date := CURRENT_DATE - ((12 - j) * 30 + floor(random() * 10 - 5)::INTEGER);

                -- Simulate occasional missed refills (10% chance)
                IF random() > 0.10 THEN
                    INSERT INTO refills (
                        prescription_id, patient_id, fill_date, quantity_dispensed,
                        days_supply, fill_status, cost_patient
                    ) VALUES (
                        v_prescription_id, v_patient_id, v_refill_date, 30, 30,
                        'completed', 5 + (random() * 20)
                    );
                END IF;
            END LOOP;
        END IF;

        -- SGLT2i (Jardiance) if indicated
        IF v_has_diabetes AND v_egfr >= 20 AND v_egfr < 75 AND v_uacr >= 30 THEN
            INSERT INTO prescriptions (
                patient_id, medication_name, generic_name, medication_class,
                prescribed_date, dosage, frequency, quantity_per_fill, days_supply,
                refills_authorized, refills_remaining, status
            ) VALUES (
                v_patient_id, 'Jardiance', 'Empagliflozin', 'SGLT2i',
                CURRENT_DATE - floor(random() * 365)::INTEGER,
                '10mg', 'Once daily', 30, 30, 11, floor(random() * 12)::INTEGER, 'active'
            )
            RETURNING id INTO v_prescription_id;

            -- Generate refills
            FOR j IN 1..12 LOOP
                v_refill_date := CURRENT_DATE - ((12 - j) * 30 + floor(random() * 10 - 5)::INTEGER);

                -- Simulate suboptimal adherence (15% miss rate)
                IF random() > 0.15 THEN
                    INSERT INTO refills (
                        prescription_id, patient_id, fill_date, quantity_dispensed,
                        days_supply, fill_status, cost_patient
                    ) VALUES (
                        v_prescription_id, v_patient_id, v_refill_date, 30, 30,
                        'completed', 25 + (random() * 50)
                    );
                END IF;
            END LOOP;
        END IF;

        -- Statin (most CKD patients should be on one)
        IF v_egfr < 60 OR v_age > 50 THEN
            INSERT INTO prescriptions (
                patient_id, medication_name, generic_name, medication_class,
                prescribed_date, dosage, frequency, quantity_per_fill, days_supply,
                refills_authorized, refills_remaining, status
            ) VALUES (
                v_patient_id, 'Atorvastatin', 'Atorvastatin', 'Statin',
                CURRENT_DATE - floor(random() * 730)::INTEGER,
                '20mg', 'Once daily', 30, 30, 11, floor(random() * 12)::INTEGER, 'active'
            )
            RETURNING id INTO v_prescription_id;

            -- Good adherence for statins (90%)
            FOR j IN 1..12 LOOP
                v_refill_date := CURRENT_DATE - ((12 - j) * 30 + floor(random() * 10 - 5)::INTEGER);

                IF random() > 0.10 THEN
                    INSERT INTO refills (
                        prescription_id, patient_id, fill_date, quantity_dispensed,
                        days_supply, fill_status, cost_patient
                    ) VALUES (
                        v_prescription_id, v_patient_id, v_refill_date, 30, 30,
                        'completed', 3 + (random() * 10)
                    );
                END IF;
            END LOOP;
        END IF;

        -- Diuretic (if hypertensive or heart failure)
        IF v_has_heart_failure OR (v_has_hypertension AND v_sbp >= 150) THEN
            INSERT INTO prescriptions (
                patient_id, medication_name, generic_name, medication_class,
                prescribed_date, dosage, frequency, quantity_per_fill, days_supply,
                refills_authorized, refills_remaining, status
            ) VALUES (
                v_patient_id,
                CASE WHEN v_has_heart_failure THEN 'Furosemide' ELSE 'Hydrochlorothiazide' END,
                CASE WHEN v_has_heart_failure THEN 'Furosemide' ELSE 'Hydrochlorothiazide' END,
                CASE WHEN v_has_heart_failure THEN 'Loop Diuretic' ELSE 'Thiazide' END,
                CURRENT_DATE - floor(random() * 730)::INTEGER,
                CASE WHEN v_has_heart_failure THEN '40mg' ELSE '25mg' END,
                'Once daily', 30, 30, 11, floor(random() * 12)::INTEGER, 'active'
            );
        END IF;

        -- Metformin (if diabetic and eGFR >30)
        IF v_has_diabetes AND v_egfr >= 30 THEN
            INSERT INTO prescriptions (
                patient_id, medication_name, generic_name, medication_class,
                prescribed_date, dosage, frequency, quantity_per_fill, days_supply,
                refills_authorized, refills_remaining, status
            ) VALUES (
                v_patient_id, 'Metformin', 'Metformin', 'Biguanide',
                CURRENT_DATE - floor(random() * 730)::INTEGER,
                '1000mg', 'Twice daily', 60, 30, 11, floor(random() * 12)::INTEGER, 'active'
            );
        END IF;

    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Successfully populated 1001 patients!';
    RAISE NOTICE '========================================';

END $$;

-- ===============================================================
-- COMPREHENSIVE VERIFICATION QUERIES
-- ===============================================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'RUNNING VERIFICATION CHECKS...';
RAISE NOTICE '========================================';

-- ===============================================================
-- 1. DUPLICATE NAME DETECTION
-- ===============================================================

DO $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_duplicate_count
    FROM (
        SELECT first_name, last_name, COUNT(*) as dup_count
        FROM patients
        GROUP BY first_name, last_name
        HAVING COUNT(*) > 1
    ) dup;

    RAISE NOTICE '';
    RAISE NOTICE '--- DUPLICATE NAME CHECK ---';
    IF v_duplicate_count = 0 THEN
        RAISE NOTICE '✓ PASSED: No duplicate names found!';
    ELSE
        RAISE WARNING '✗ FAILED: Found % duplicate name combinations!', v_duplicate_count;
    END IF;
END $$;

-- Show detailed duplicate names if any exist
SELECT
    first_name,
    last_name,
    gender,
    COUNT(*) as occurrences,
    STRING_AGG(medical_record_number, ', ') as mrns
FROM patients
GROUP BY first_name, last_name, gender
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, first_name, last_name;

-- ===============================================================
-- 2. GENDER-NAME CONCORDANCE CHECK
-- ===============================================================

DO $$
DECLARE
    v_male_with_female_names INTEGER;
    v_female_with_male_names INTEGER;
    v_total_errors INTEGER;
BEGIN
    -- Check males with female names
    SELECT COUNT(*) INTO v_male_with_female_names
    FROM patients
    WHERE gender = 'male'
      AND TRIM(REGEXP_REPLACE(first_name, ' [A-Z]\.', '')) IN (
        'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara',
        'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
        'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra',
        'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
        'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah',
        'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
        'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna',
        'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen',
        'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel',
        'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather',
        'Diane', 'Ruth', 'Julie', 'Joyce', 'Virginia',
        'Victoria', 'Kelly', 'Lauren', 'Christina', 'Joan',
        'Evelyn', 'Judith', 'Megan', 'Cheryl', 'Andrea',
        'Hannah', 'Jacqueline', 'Martha', 'Gloria', 'Teresa',
        'Ann', 'Sara', 'Madison', 'Frances', 'Kathryn'
      );

    -- Check females with male names
    SELECT COUNT(*) INTO v_female_with_male_names
    FROM patients
    WHERE gender = 'female'
      AND TRIM(REGEXP_REPLACE(first_name, ' [A-Z]\.', '')) IN (
        'James', 'Robert', 'Michael', 'William', 'David',
        'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher',
        'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald',
        'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
        'Kevin', 'Brian', 'George', 'Edward', 'Ronald',
        'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
        'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen',
        'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin',
        'Samuel', 'Raymond', 'Gregory', 'Frank', 'Alexander',
        'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler',
        'Aaron', 'Jose', 'Adam', 'Henry', 'Nathan',
        'Douglas', 'Zachary', 'Peter', 'Kyle', 'Walter',
        'Ethan', 'Jeremy', 'Harold', 'Keith', 'Christian',
        'Roger', 'Noah', 'Gerald', 'Carl', 'Terry',
        'Sean', 'Austin', 'Arthur', 'Lawrence', 'Jesse'
      );

    v_total_errors := v_male_with_female_names + v_female_with_male_names;

    RAISE NOTICE '';
    RAISE NOTICE '--- GENDER-NAME CONCORDANCE CHECK ---';
    IF v_total_errors = 0 THEN
        RAISE NOTICE '✓ PASSED: All names match patient gender!';
    ELSE
        RAISE WARNING '✗ FAILED: Found % gender-name mismatches!', v_total_errors;
        RAISE WARNING '  - Males with female names: %', v_male_with_female_names;
        RAISE WARNING '  - Females with male names: %', v_female_with_male_names;
    END IF;
END $$;

-- Show detailed gender-name mismatches if any exist
SELECT
    'Male patient with female name' as issue,
    medical_record_number,
    first_name,
    last_name,
    gender
FROM patients
WHERE gender = 'male'
  AND TRIM(REGEXP_REPLACE(first_name, ' [A-Z]\.', '')) IN (
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara',
    'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra',
    'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'
  )
UNION ALL
SELECT
    'Female patient with male name' as issue,
    medical_record_number,
    first_name,
    last_name,
    gender
FROM patients
WHERE gender = 'female'
  AND TRIM(REGEXP_REPLACE(first_name, ' [A-Z]\.', '')) IN (
    'James', 'Robert', 'Michael', 'William', 'David',
    'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher',
    'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald',
    'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth'
  )
ORDER BY gender, first_name;

-- ===============================================================
-- 3. STANDARD VERIFICATION QUERIES
-- ===============================================================

-- Count patients
SELECT
    'Total Patients' as metric,
    COUNT(*) as count
FROM patients;

-- Gender distribution
SELECT
    'Gender Distribution' as section,
    gender,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM patients), 1) as percentage
FROM patients
GROUP BY gender
ORDER BY gender;

-- Count by CKD status
SELECT
    'CKD Status Distribution' as section,
    CASE WHEN ckd_diagnosed THEN 'Has CKD' ELSE 'No CKD' END as status,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM patients), 1) as percentage
FROM patients
GROUP BY ckd_diagnosed
ORDER BY ckd_diagnosed DESC;

-- Count observations
SELECT
    'Total Observations' as metric,
    COUNT(*) as count
FROM observations;

-- Count prescriptions
SELECT
    'Total Prescriptions' as metric,
    COUNT(*) as count
FROM prescriptions;

-- Count refills
SELECT
    'Total Refills' as metric,
    COUNT(*) as count
FROM refills;

-- Summary by condition
SELECT
    'Top Conditions' as section,
    condition_name,
    COUNT(*) as patient_count
FROM conditions
GROUP BY condition_name
ORDER BY patient_count DESC
LIMIT 10;

-- Summary by medication class
SELECT
    'Top Medication Classes' as section,
    medication_class,
    COUNT(DISTINCT patient_id) as patient_count
FROM prescriptions
GROUP BY medication_class
ORDER BY patient_count DESC;

-- eGFR distribution
SELECT
    'eGFR Distribution' as section,
    CASE
        WHEN value_numeric >= 90 THEN 'G1 (≥90)'
        WHEN value_numeric >= 60 THEN 'G2 (60-89)'
        WHEN value_numeric >= 45 THEN 'G3a (45-59)'
        WHEN value_numeric >= 30 THEN 'G3b (30-44)'
        WHEN value_numeric >= 15 THEN 'G4 (15-29)'
        ELSE 'G5 (<15)'
    END as gfr_category,
    COUNT(*) as count
FROM (
    SELECT DISTINCT ON (patient_id) value_numeric
    FROM observations
    WHERE observation_type = 'eGFR'
    ORDER BY patient_id, observation_date DESC
) recent_egfr
GROUP BY gfr_category
ORDER BY
    CASE
        WHEN gfr_category = 'G1 (≥90)' THEN 1
        WHEN gfr_category = 'G2 (60-89)' THEN 2
        WHEN gfr_category = 'G3a (45-59)' THEN 3
        WHEN gfr_category = 'G3b (30-44)' THEN 4
        WHEN gfr_category = 'G4 (15-29)' THEN 5
        ELSE 6
    END;

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'VERIFICATION COMPLETE!';
RAISE NOTICE '========================================';
RAISE NOTICE 'Data population complete! Review results above.';
