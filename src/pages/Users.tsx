// @ts-nocheck
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { Users as UsersIcon, Edit2, UserCheck, UserX } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function Users() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    role: 'employee',
    status: 'active',
  });

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: formData.role,
          status: formData.status,
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      setModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const openEditModal = (user: Profile) => {
    setEditingUser(user);
    setFormData({
      role: user.role,
      status: user.status,
    });
    setModalOpen(true);
  };

  const toggleUserStatus = async (user: Profile) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: 'badge badge-danger',
      project_manager: 'badge badge-primary',
      employee: 'badge badge-gray',
    };
    return badges[role] || 'badge badge-gray';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'badge badge-success' : 'badge badge-gray';
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage user roles and permissions</p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={getRoleBadge(user.role)}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={getStatusBadge(user.status)}>{user.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === 'active'
                            ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit User"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">Editing user:</p>
            <p className="font-semibold text-gray-900">{editingUser?.full_name}</p>
            <p className="text-sm text-gray-600">{editingUser?.email}</p>
          </div>

          <div>
            <label className="label">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
              required
            >
              <option value="employee">Employee</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Admins have full access, Project Managers can manage projects, Employees have basic access
            </p>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Inactive users cannot log in to the system
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              Update User
            </button>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setEditingUser(null);
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
