import { useState, useEffect } from 'react';
import {ClipboardCheck, Pill, XCircle, CheckCircle, AlertTriangle, User, Calendar, Activity } from 'lucide-react';

interface DoctorAction {
  id: string;
  patient_id: string;
  action_type: string;
  priority: string;
  action_title: string;
  action_description: string;
  recommended_action: string;
  clinical_summary: any;
  status: string;
  created_at: string;
  due_date: string;
  first_name: string;
  last_name: string;
  medical_record_number: string;
  age: number;
  gender: string;
  ckd_stage: string;
  egfr_at_diagnosis?: number;
  ckd_stage_at_diagnosis?: string;
  protocol_name?: string;
  medication_orders?: any;
  lab_monitoring_schedule?: any;
  referrals?: any;
  lifestyle_modifications?: any;
}

interface Stats {
  diagnoses: {
    confirmed_diagnoses: number;
    pending_confirmation: number;
    total_diagnoses: number;
    patients_diagnosed: number;
  };
  pending_actions: Array<{
    action_type: string;
    priority: string;
    count: number;
  }>;
}

const CKDDiagnosisActionQueue = () => {
  const [actions, setActions] = useState<DoctorAction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedAction, setSelectedAction] = useState<DoctorAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
    fetchStats();
  }, []);

  const fetchActions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/ckd-diagnosis/actions`);

      if (!response.ok) {
        throw new Error(`Failed to fetch actions: ${response.status}`);
      }

      const data = await response.json();
      setActions(data.data);
      setError(null);
    } catch (err) {
      console.error('Error loading actions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/ckd-diagnosis/stats`);

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const confirmDiagnosis = async (actionId: string) => {
    try {
      setProcessingAction(actionId);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(
        `${apiUrl}/api/ckd-diagnosis/actions/${actionId}/confirm-diagnosis`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirmed_by: 'Dr. Smith', // TODO: Get from auth
            notes: 'Diagnosis confirmed after clinical review'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to confirm diagnosis');
      }

      await fetchActions();
      await fetchStats();
      setSelectedAction(null);
      alert('✓ CKD Diagnosis confirmed successfully');
    } catch (err) {
      console.error('Error confirming diagnosis:', err);
      alert('Failed to confirm diagnosis');
    } finally {
      setProcessingAction(null);
    }
  };

  const approveTreatment = async (actionId: string) => {
    try {
      setProcessingAction(actionId);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(
        `${apiUrl}/api/ckd-diagnosis/actions/${actionId}/approve-treatment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approved_by: 'Dr. Smith', // TODO: Get from auth
            notes: 'Treatment protocol approved - initiate immediately'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve treatment');
      }

      await fetchActions();
      await fetchStats();
      setSelectedAction(null);
      alert('✓ Treatment protocol approved and initiated');
    } catch (err) {
      console.error('Error approving treatment:', err);
      alert('Failed to approve treatment');
    } finally {
      setProcessingAction(null);
    }
  };

  const declineAction = async (actionId: string) => {
    const reason = prompt('Please provide a reason for declining:');
    if (!reason) return;

    try {
      setProcessingAction(actionId);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(
        `${apiUrl}/api/ckd-diagnosis/actions/${actionId}/decline`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            declined_by: 'Dr. Smith', // TODO: Get from auth
            notes: reason
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to decline action');
      }

      await fetchActions();
      await fetchStats();
      setSelectedAction(null);
    } catch (err) {
      console.error('Error declining action:', err);
      alert('Failed to decline action');
    } finally {
      setProcessingAction(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'confirm_ckd_diagnosis': return <ClipboardCheck className="w-5 h-5" />;
      case 'approve_treatment': return <Pill className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatDueDate = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) {
      return { text: 'OVERDUE', color: 'text-red-600 font-bold' };
    } else if (hoursUntilDue < 24) {
      return { text: `${Math.floor(hoursUntilDue)}h remaining`, color: 'text-orange-600' };
    } else {
      return { text: `${Math.floor(hoursUntilDue / 24)}d remaining`, color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center text-red-800">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">Error Loading Actions</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">CKD Diagnosis Action Queue</h1>
        <p className="text-gray-600 mt-1">Review and approve CKD diagnoses and treatment protocols</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Pending Actions</div>
            <div className="text-2xl font-bold text-indigo-800">{actions.length}</div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Pending Confirmation</div>
            <div className="text-2xl font-bold text-orange-800">{stats.diagnoses.pending_confirmation}</div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Confirmed (30d)</div>
            <div className="text-2xl font-bold text-green-800">{stats.diagnoses.confirmed_diagnoses}</div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Patients Diagnosed</div>
            <div className="text-2xl font-bold text-gray-800">{stats.diagnoses.patients_diagnosed}</div>
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-4">
        {actions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No pending actions - all caught up!</p>
          </div>
        ) : (
          actions.map(action => (
            <div
              key={action.id}
              className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">{getActionIcon(action.action_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {action.first_name} {action.last_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(action.priority)}`}>
                        {action.priority}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        MRN: {action.medical_record_number}
                      </span>
                      <span>{action.age}y {action.gender}</span>
                      {action.ckd_stage_at_diagnosis && (
                        <span className="font-medium text-red-600">
                          Stage {action.ckd_stage_at_diagnosis} CKD
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm flex items-center ${formatDueDate(action.due_date).color}`}>
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDueDate(action.due_date).text}
                  </div>
                </div>
              </div>

              {/* Action Title */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="font-semibold text-blue-900">{action.action_title}</p>
              </div>

              {/* Action Description */}
              <div className="mb-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded">
                  {action.action_description}
                </pre>
              </div>

              {/* Treatment Protocol Details */}
              {action.action_type === 'approve_treatment' && action.medication_orders && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded p-4">
                  <h4 className="font-semibold text-green-900 mb-2">📋 Treatment Protocol Details</h4>
                  <div className="space-y-2 text-sm">
                    {action.medication_orders.ras_inhibitor?.recommended && (
                      <div>
                        <span className="font-medium">RAS Inhibitor:</span> {action.medication_orders.ras_inhibitor.options.join(', ')}
                      </div>
                    )}
                    {action.medication_orders.sglt2_inhibitor?.recommended && (
                      <div>
                        <span className="font-medium">SGLT2 Inhibitor:</span> {action.medication_orders.sglt2_inhibitor.options.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Created: {new Date(action.created_at).toLocaleString()}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedAction(selectedAction?.id === action.id ? null : action)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {selectedAction?.id === action.id ? 'Hide Details' : 'View Details'}
                  </button>

                  {action.action_type === 'confirm_ckd_diagnosis' && (
                    <button
                      onClick={() => confirmDiagnosis(action.id)}
                      disabled={processingAction === action.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{processingAction === action.id ? 'Processing...' : 'Confirm Diagnosis'}</span>
                    </button>
                  )}

                  {action.action_type === 'approve_treatment' && (
                    <button
                      onClick={() => approveTreatment(action.id)}
                      disabled={processingAction === action.id}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Pill className="w-4 h-4" />
                      <span>{processingAction === action.id ? 'Processing...' : 'Approve & Initiate'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => declineAction(action.id)}
                    disabled={processingAction === action.id}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedAction?.id === action.id && action.clinical_summary && (
                <div className="mt-4 pt-4 border-t bg-gray-50 rounded p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Clinical Summary</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(action.clinical_summary, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CKDDiagnosisActionQueue;
