// @ts-nocheck
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, Play, Square, Plus } from 'lucide-react';
import Modal from '../components/Modal';

interface TimeLog {
  id: string;
  user_id: string;
  task_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  date: string;
  approval_status: string;
}

interface Task {
  id: string;
  name: string;
}

export default function TimeTracking() {
  const { profile } = useAuth();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [formData, setFormData] = useState({
    task_id: '',
    start_time: '',
    end_time: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTimeLogs();
    fetchTasks();
    checkActiveLog();
  }, [profile]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeLog) {
      interval = setInterval(() => {
        const start = new Date(activeLog.start_time).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  const checkActiveLog = async () => {
    try {
      const { data } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', profile?.id)
        .is('end_time', null)
        .maybeSingle();

      setActiveLog(data);
    } catch (error) {
      console.error('Error checking active log:', error);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', profile?.id)
        .order('start_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTimeLogs(data || []);
    } catch (error) {
      console.error('Error fetching time logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('id, name')
        .or(`assigned_to.eq.${profile?.id},created_by.eq.${profile?.id}`);

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const startTimer = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .insert([
          {
            user_id: profile?.id,
            task_id: taskId,
            start_time: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setActiveLog(data);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const stopTimer = async () => {
    if (!activeLog) return;

    try {
      const { error } = await supabase
        .from('time_logs')
        .update({ end_time: new Date().toISOString() })
        .eq('id', activeLog.id);

      if (error) throw error;
      setActiveLog(null);
      setElapsedTime(0);
      fetchTimeLogs();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('time_logs').insert([
        {
          user_id: profile?.id,
          task_id: formData.task_id,
          start_time: formData.start_time,
          end_time: formData.end_time,
          date: formData.date,
          approval_status: 'pending',
        },
      ]);

      if (error) throw error;
      setModalOpen(false);
      setFormData({
        task_id: '',
        start_time: '',
        end_time: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchTimeLogs();
    } catch (error) {
      console.error('Error adding manual entry:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-2">Track time spent on your tasks</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Manual Entry</span>
        </button>
      </div>

      <div className="card">
        {activeLog ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
              <Clock className="w-12 h-12 text-green-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {formatTime(elapsedTime)}
            </h3>
            <p className="text-gray-600 mb-6">
              Tracking: {tasks.find(t => t.id === activeLog.task_id)?.name}
            </p>
            <button onClick={stopTimer} className="btn btn-danger flex items-center space-x-2 mx-auto">
              <Square className="w-5 h-5" />
              <span>Stop Timer</span>
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Timer for Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => startTimer(task.id)}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors text-left group"
                >
                  <span className="font-medium text-gray-900">{task.name}</span>
                  <Play className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                </button>
              ))}
            </div>
            {tasks.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No tasks available. Create a task first to start tracking time.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Log History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Task</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Start</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">End</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {timeLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900">
                    {tasks.find(t => t.id === log.task_id)?.name || 'Unknown Task'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(log.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(log.start_time).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {log.end_time ? new Date(log.end_time).toLocaleTimeString() : 'Running...'}
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">
                    {formatDuration(log.duration_minutes)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge ${
                        log.approval_status === 'approved'
                          ? 'badge-success'
                          : log.approval_status === 'rejected'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {log.approval_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {timeLogs.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No time logs yet</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Manual Time Entry"
      >
        <form onSubmit={handleManualEntry} className="space-y-4">
          <div>
            <label className="label">Task</label>
            <select
              value={formData.task_id}
              onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Manual entries require admin approval before they count toward your total hours.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              Add Entry
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
