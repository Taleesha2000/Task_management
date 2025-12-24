// @ts-nocheck
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TaskStats {
  status: string;
  count: number;
}

interface ProjectProgress {
  name: string;
  completed: number;
  total: number;
}

interface UserProductivity {
  user: string;
  hours: number;
  tasks: number;
}

export default function Reports() {
  const { profile, isAdmin, isProjectManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState<TaskStats[]>([]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [userProductivity, setUserProductivity] = useState<UserProductivity[]>([]);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    fetchReports();
  }, [profile]);

  const fetchReports = async () => {
    try {
      const { data: tasks } = await supabase.from('tasks').select('status, project_id');

      const statusCounts = tasks?.reduce((acc: Record<string, number>, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      const statsData = Object.entries(statusCounts || {}).map(([status, count]) => ({
        status: status.replace('_', ' ').toUpperCase(),
        count: count as number,
      }));

      setTaskStats(statsData);

      const { data: projects } = await supabase.from('projects').select('id, name');

      const progressData = await Promise.all(
        (projects || []).map(async (project) => {
          const { data: projectTasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('project_id', project.id);

          const total = projectTasks?.length || 0;
          const completed = projectTasks?.filter((t) => t.status === 'completed').length || 0;

          return {
            name: project.name,
            completed,
            total,
          };
        })
      );

      setProjectProgress(progressData);

      if (isAdmin || isProjectManager) {
        const { data: timeLogs } = await supabase
          .from('time_logs')
          .select('user_id, duration_minutes, task_id');

        const { data: profiles } = await supabase.from('profiles').select('id, full_name');

        const userStats = profiles?.map((profile) => {
          const userLogs = timeLogs?.filter((log) => log.user_id === profile.id) || [];
          const hours = userLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;
          const taskIds = new Set(userLogs.map((log) => log.task_id));

          return {
            user: profile.full_name,
            hours: Math.round(hours * 10) / 10,
            tasks: taskIds.size,
          };
        });

        setUserProductivity(userStats || []);
      }

      const { data: allTimeLogs } = await supabase.from('time_logs').select('duration_minutes');
      const total = allTimeLogs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
      setTotalHours(Math.round((total / 60) * 10) / 10);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

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
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Track performance and productivity metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {taskStats.reduce((sum, stat) => sum + stat.count, 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalHours}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{projectProgress.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{userProductivity.length}</p>
            </div>
            <div className="p-3 bg-cyan-50 rounded-xl">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Task Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {taskStats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="total" fill="#e5e7eb" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {(isAdmin || isProjectManager) && userProductivity.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Productivity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userProductivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="user" />
              <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="hours" fill="#0ea5e9" name="Hours" />
              <Bar yAxisId="right" dataKey="tasks" fill="#f59e0b" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
