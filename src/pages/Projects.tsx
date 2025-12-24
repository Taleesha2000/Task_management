// @ts-nocheck
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Users as UsersIcon } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function Projects() {
  const { profile, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_id: '',
    start_date: '',
    end_date: '',
    status: 'planned',
  });

  useEffect(() => {
    fetchProjects();
    if (isAdmin) {
      fetchUsers();
    }
  }, [profile]);

  const fetchProjects = async () => {
    try {
      let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'project_manager']);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(formData)
          .eq('id', editingProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').insert([formData]);
        if (error) throw error;
      }
      setModalOpen(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      manager_id: project.manager_id || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status,
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      manager_id: '',
      start_date: '',
      end_date: '',
      status: 'planned',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      planned: 'badge badge-gray',
      in_progress: 'badge badge-primary',
      completed: 'badge badge-success',
    };
    return badges[status] || 'badge badge-gray';
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your projects and teams</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <span className={`${getStatusBadge(project.status)} mt-2`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              {isAdmin && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {project.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
            )}

            <div className="space-y-2 text-sm text-gray-600">
              {project.start_date && (
                <div>
                  <span className="font-medium">Start:</span>{' '}
                  {new Date(project.start_date).toLocaleDateString()}
                </div>
              )}
              {project.end_date && (
                <div>
                  <span className="font-medium">End:</span>{' '}
                  {new Date(project.end_date).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600">Get started by creating your first project</p>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingProject ? 'Edit Project' : 'New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Project Name</label>
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

          {isAdmin && (
            <div>
              <label className="label">Project Manager</label>
              <select
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                className="input"
              >
                <option value="">Select manager</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              <label className="label">End Date</label>
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
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingProject ? 'Update' : 'Create'} Project
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
