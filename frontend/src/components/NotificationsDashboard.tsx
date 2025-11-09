import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Clock, Mail, MailOpen } from 'lucide-react';

interface Notification {
  id: string;
  patient_id: string;
  notification_type: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  acknowledged_at: string | null;
  first_name: string;
  last_name: string;
  medical_record_number: string;
  old_priority: string | null;
  new_priority: string;
}

interface NotificationStats {
  by_status: Array<{ status: string; count: string }>;
  unacknowledged: number;
}

const NotificationsDashboard = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = filter === 'all'
        ? `${apiUrl}/api/notifications`
        : `${apiUrl}/api/notifications?status=${filter}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.data);
      setError(null);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/notifications/stats/summary`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const acknowledgeNotification = async (notificationId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/notifications/${notificationId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge notification');
      }

      // Refresh notifications
      await fetchNotifications();
      await fetchStats();
    } catch (err) {
      console.error('Error acknowledging notification:', err);
      alert('Failed to acknowledge notification');
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'HIGH': return <Bell className="w-5 h-5 text-orange-600" />;
      default: return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'acknowledged': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'sent': return <MailOpen className="w-4 h-4 text-blue-600" />;
      case 'pending': return <Mail className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
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
          <AlertCircle className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">Error Loading Notifications</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Doctor Notifications</h1>
          <p className="text-gray-600 mt-1">Patient risk state change alerts</p>
        </div>
        {stats && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
            <div className="text-sm text-indigo-600 font-medium">Unacknowledged</div>
            <div className="text-2xl font-bold text-indigo-800">{stats.unacknowledged}</div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.by_status.map(stat => (
            <div key={stat.status} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 capitalize">{stat.status}</div>
                  <div className="text-2xl font-bold text-gray-800">{stat.count}</div>
                </div>
                {getStatusIcon(stat.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b">
        {['all', 'pending', 'sent', 'acknowledged'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              filter === tab
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications found</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow ${
                notification.status === 'pending' ? 'border-l-4 border-l-indigo-500' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  {getPriorityIcon(notification.priority)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {notification.first_name} {notification.last_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      <span className="text-sm text-gray-500">
                        MRN: {notification.medical_record_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                    {getStatusIcon(notification.status)}
                    <span className="capitalize">{notification.status}</span>
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(notification.created_at)}</div>
                </div>
              </div>

              {/* State Change Badge */}
              {notification.old_priority && (
                <div className="mb-4 inline-flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded">
                  <span className="text-sm text-gray-600">Risk Change:</span>
                  <span className="text-sm font-medium text-gray-700">{notification.old_priority}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-bold text-red-600">{notification.new_priority}</span>
                </div>
              )}

              {/* Message */}
              <div className="bg-gray-50 rounded p-4 mb-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {notification.message}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {notification.sent_at && (
                    <span>Sent: {new Date(notification.sent_at).toLocaleString()}</span>
                  )}
                  {notification.acknowledged_at && (
                    <span className="ml-4 text-green-600">
                      Acknowledged: {new Date(notification.acknowledged_at).toLocaleString()}
                    </span>
                  )}
                </div>
                {notification.status !== 'acknowledged' && (
                  <button
                    onClick={() => acknowledgeNotification(notification.id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsDashboard;
