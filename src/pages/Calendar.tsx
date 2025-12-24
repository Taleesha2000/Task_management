import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

interface Task {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export default function Calendar() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [profile, currentDate]);

  const fetchTasks = async () => {
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`assigned_to.eq.${profile?.id},created_by.eq.${profile?.id}`)
        .gte('end_date', start.toISOString().split('T')[0])
        .lte('end_date', end.toISOString().split('T')[0]);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startingDayOfWeek = monthStart.getDay();
  const previousMonthDays = Array(startingDayOfWeek).fill(null);

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.end_date) return false;
      return isSameDay(new Date(task.end_date), date);
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      to_do: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      on_hold: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const selectedDayTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-2">View your tasks and deadlines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
                {day}
              </div>
            ))}

            {previousMonthDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {daysInMonth.map((day) => {
              const dayTasks = getTasksForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600'
                      : isToday
                      ? 'bg-primary-50 border-primary-300'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex-1 flex flex-col justify-end space-y-1 mt-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className={`h-1 rounded-full ${
                            isSelected ? 'bg-white' : getStatusColor(task.status).split(' ')[0]
                          }`}
                        />
                      ))}
                      {dayTasks.length > 2 && (
                        <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                          +{dayTasks.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </h3>

          {selectedDate && (
            <div className="space-y-3">
              {selectedDayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tasks for this day</p>
                </div>
              ) : (
                selectedDayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{task.name}</h4>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
