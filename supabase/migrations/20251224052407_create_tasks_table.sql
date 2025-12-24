/*
  # Create Tasks Table

  ## Overview
  This migration creates the tasks table for managing individual tasks within projects.

  ## New Tables
  1. `tasks`
    - `id` (uuid, primary key) - Unique task identifier
    - `name` (text) - Task name
    - `description` (text) - Task description (optional)
    - `project_id` (uuid) - References projects(id) (optional for personal tasks)
    - `assigned_to` (uuid) - References profiles(id) for assigned user (optional)
    - `status` (text) - Task status: to_do, in_progress, completed, or on_hold (default: to_do)
    - `start_date` (date) - Task start date (optional)
    - `end_date` (date) - Task end date (optional)
    - `created_by` (uuid) - References profiles(id) for task creator
    - `created_at` (timestamptz) - Timestamp when task was created
    - `updated_at` (timestamptz) - Timestamp when task was last updated

  ## Security
  1. Enable RLS on tasks table
  2. Users can view their own tasks (created by or assigned to them)
  3. Project managers can view tasks for their projects
  4. Admins can view all tasks
  5. Users can create tasks
  6. Users can update their own tasks
  7. Admins can update and delete any tasks

  ## Notes
  - Tasks can be associated with projects or be personal tasks (project_id null)
  - Tasks can be unassigned (assigned_to null)
  - All users can create tasks for themselves
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'to_do' CHECK (status IN ('to_do', 'in_progress', 'completed', 'on_hold')),
  start_date date,
  end_date date,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tasks assigned to them or created by them
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

-- Policy: Admins can view all tasks
CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Project managers can view tasks for their projects
CREATE POLICY "Project managers can view project tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.manager_id = auth.uid()
    )
  );

-- Policy: Project members can view project tasks
CREATE POLICY "Project members can view project tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Policy: Users can create tasks
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_id
        AND projects.manager_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
      )
    )
  );

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
  );

-- Policy: Admins can update all tasks
CREATE POLICY "Admins can update all tasks"
  ON tasks FOR UPDATE
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

-- Policy: Project managers can update their project tasks
CREATE POLICY "Project managers can update project tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.manager_id = auth.uid()
    )
  );

-- Policy: Admins can delete tasks
CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger for tasks updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
