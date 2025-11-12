import { Patient } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
  async getPatients(): Promise<Patient[]> {
    const response = await fetch(`${API_URL}/api/patients`);

    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }

    const data = await response.json();
    return data.patients || [];
  },

  async getPatientById(id: string): Promise<Patient> {
    const response = await fetch(`${API_URL}/api/patients/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch patient');
    }

    return response.json();
  },

  async searchPatients(query: string): Promise<Patient[]> {
    // Client-side search for simplicity
    const patients = await this.getPatients();

    if (!query.trim()) {
      return patients;
    }

    const searchTerm = query.toLowerCase();

    return patients.filter(patient =>
      patient.id.toLowerCase().includes(searchTerm) ||
      patient.medical_record_number.toLowerCase().includes(searchTerm) ||
      patient.first_name.toLowerCase().includes(searchTerm) ||
      patient.last_name.toLowerCase().includes(searchTerm) ||
      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm)
    );
  }
};
