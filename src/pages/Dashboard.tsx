// @ts-nocheck
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  CheckSquare,
  Clock,
  FolderKanban,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface Stats {
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  totalProjects: number;
  totalTimeToday: number;
  overdueTasks: number;
}

interface Task {
  id: string;
  name: string;
  status: string;
  end_date: string | null;
  project_id: string | null;
}

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    totalProjects: 0,
    totalTimeToday: 0,
    overdueTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      if (!profile) return;

      let tasksQuery = supabase
        .from('tasks')
        .select('*', { count: 'exact' });

      if (!isAdmin) {
        tasksQuery = tasksQuery.or(`assigned_to.eq.${profile.id},created_by.eq.${profile.id}`);
      }

      const { data: tasks, count } = await tasksQuery;

      const inProgress = tasks?.filter(t => t.status === 'in_progress').length || 0;
      const completed = tasks?.filter(t => t.status === 'completed').length || 0;
      const overdue = tasks?.filter(t =>
        t.end_date && new Date(t.end_date) < new Date() && t.status !== 'completed'
      ).length || 0;

      let projectsQuery = supabase
        .from('projects')
        .select('*', { count: 'exact' });

      if (!isAdmin) {
        projectsQuery = projectsQuery.or(`manager_id.eq.${profile.id}`);
      }

      const { count: projectCount } = await projectsQuery;

      const today = new Date().toISOString().split('T')[0];
      let timeQuery = supabase
        .from('time_logs')
        .select('duration_minutes')
        .eq('date', today);

      if (!isAdmin) {
        timeQuery = timeQuery.eq('user_id', profile.id);
      }

      const { data: timeLogs } = await timeQuery;
      const totalTime = timeLogs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

      setStats({
        totalTasks: count || 0,
        inProgressTasks: inProgress,
        completedTasks: completed,
        totalProjects: projectCount || 0,
        totalTimeToday: totalTime,
        overdueTasks: overdue,
      });

      const { data: recent } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentTasks(recent || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'In Progress',
      value: stats.inProgressTasks,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Completed',
      value: stats.completedTasks,
      icon: CheckSquare,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Projects',
      value: stats.totalProjects,
      icon: FolderKanban,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Hours Today',
      value: (stats.totalTimeToday / 60).toFixed(1),
      icon: Clock,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      to_do: 'badge badge-gray',
      in_progress: 'badge badge-warning',
      completed: 'badge badge-success',
      on_hold: 'badge badge-danger',
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Tasks</h2>
        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks yet</p>
          ) : (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.name}</h3>
                  {task.end_date && (
                    <p className="text-sm text-gray-500 mt-1">
                      Due: {new Date(task.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={getStatusBadge(task.status)}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
