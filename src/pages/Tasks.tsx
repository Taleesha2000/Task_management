// @ts-nocheck
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, CheckSquare } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
  assigned_to: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
}

export default function Tasks() {
  const { profile, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    assigned_to: '',
    status: 'to_do',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, [profile, filterStatus]);

  const fetchTasks = async () => {
    try {
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await supabase.from('projects').select('id, name');
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, full_name');
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        created_by: profile?.id,
        project_id: formData.project_id || null,
        assigned_to: formData.assigned_to || null,
      };

      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert([taskData]);
        if (error) throw error;
      }
      setModalOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      project_id: task.project_id || '',
      assigned_to: task.assigned_to || '',
      status: task.status,
      start_date: task.start_date || '',
      end_date: task.end_date || '',
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingTask(null);
    setFormData({
      name: '',
      description: '',
      project_id: '',
      assigned_to: '',
      status: 'to_do',
      start_date: '',
      end_date: '',
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">Manage and track your tasks</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'to_do', 'in_progress', 'completed', 'on_hold'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filterStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Task</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Project</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{task.name}</p>
                      {task.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {projects.find(p => p.id === task.project_id)?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {users.find(u => u.id === task.assigned_to)?.full_name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="text-sm px-3 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="to_do">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {task.end_date ? new Date(task.end_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">Create your first task to get started</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingTask ? 'Edit Task' : 'New Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Task Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="input"
              >
                <option value="">No Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="input"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
            >
              <option value="to_do">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingTask ? 'Update' : 'Create'} Task
            </button>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
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
