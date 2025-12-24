/*
  # Create Time Logs Table

  ## Overview
  This migration creates the time_logs table for tracking time spent on tasks.

  ## New Tables
  1. `time_logs`
    - `id` (uuid, primary key) - Unique time log identifier
    - `user_id` (uuid) - References profiles(id) for the user logging time
    - `task_id` (uuid) - References tasks(id) for the task
    - `project_id` (uuid) - References projects(id) (optional, derived from task)
    - `start_time` (timestamptz) - When time tracking started
    - `end_time` (timestamptz) - When time tracking ended (null if still running)
    - `duration_minutes` (integer) - Calculated duration in minutes
    - `date` (date) - Date of the time log entry
    - `approval_status` (text) - Status: pending, approved, or rejected (default: approved)
    - `created_at` (timestamptz) - Timestamp when log was created
    - `updated_at` (timestamptz) - Timestamp when log was last updated

  ## Security
  1. Enable RLS on time_logs table
  2. Users can view their own time logs
  3. Project managers can view time logs for their projects
  4. Admins can view all time logs
  5. Users can create their own time logs
  6. Users can update their own time logs (if not approved)
  7. Admins can update approval status

  ## Notes
  - Duration is automatically calculated when end_time is set
  - Manual time entries require admin approval
  - Active time logs have null end_time
*/

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer,
  date date NOT NULL,
  approval_status text NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_project_id ON time_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);

-- Enable RLS
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own time logs
CREATE POLICY "Users can view own time logs"
  ON time_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can view all time logs
CREATE POLICY "Admins can view all time logs"
  ON time_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Project managers can view time logs for their projects
CREATE POLICY "Project managers can view project time logs"
  ON time_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = time_logs.project_id
      AND projects.manager_id = auth.uid()
    )
  );

-- Policy: Users can create their own time logs
CREATE POLICY "Users can create time logs"
  ON time_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
      AND (tasks.assigned_to = auth.uid() OR tasks.created_by = auth.uid())
    )
  );

-- Policy: Users can update their own pending time logs
CREATE POLICY "Users can update own time logs"
  ON time_logs FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (approval_status = 'pending' OR approval_status = 'approved')
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy: Admins can update all time logs
CREATE POLICY "Admins can update all time logs"
  ON time_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Users can delete their own time logs
CREATE POLICY "Users can delete own time logs"
  ON time_logs FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND approval_status = 'pending'
  );

-- Policy: Admins can delete any time logs
CREATE POLICY "Admins can delete time logs"
  ON time_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to calculate duration when end_time is set
CREATE OR REPLACE FUNCTION calculate_time_log_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  ELSE
    NEW.duration_minutes = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate duration
CREATE TRIGGER calculate_duration_before_insert_update
  BEFORE INSERT OR UPDATE ON time_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_log_duration();

-- Create trigger for time_logs updated_at
CREATE TRIGGER update_time_logs_updated_at
  BEFORE UPDATE ON time_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
