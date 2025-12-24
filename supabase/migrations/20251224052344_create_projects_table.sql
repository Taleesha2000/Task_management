/*
  # Create Projects Table

  ## Overview
  This migration creates the projects table and project_members junction table for managing projects and team assignments.

  ## New Tables
  1. `projects`
    - `id` (uuid, primary key) - Unique project identifier
    - `name` (text) - Project name
    - `description` (text) - Project description (optional)
    - `manager_id` (uuid) - References profiles(id) for project manager
    - `start_date` (date) - Project start date (optional)
    - `end_date` (date) - Project end date (optional)
    - `status` (text) - Project status: planned, in_progress, or completed (default: planned)
    - `created_at` (timestamptz) - Timestamp when project was created
    - `updated_at` (timestamptz) - Timestamp when project was last updated

  2. `project_members`
    - `id` (uuid, primary key) - Unique identifier
    - `project_id` (uuid) - References projects(id)
    - `user_id` (uuid) - References profiles(id)
    - `created_at` (timestamptz) - Timestamp when member was added

  ## Security
  1. Enable RLS on both tables
  2. Admins can perform all operations
  3. Project managers can view and update their assigned projects
  4. Project members can view projects they're assigned to
  5. Employees can view projects they're members of

  ## Notes
  - Project managers are assigned via manager_id field
  - Team members are assigned via project_members junction table
  - All dates are optional to support flexible project planning
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_members junction table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Projects Policies

-- Policy: Admins can view all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Project managers can view their projects
CREATE POLICY "Project managers can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'project_manager')
    )
  );

-- Policy: Project members can view their assigned projects
CREATE POLICY "Project members can view assigned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- Policy: Admins can insert projects
CREATE POLICY "Admins can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update all projects
CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
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

-- Policy: Project managers can update their projects
CREATE POLICY "Project managers can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Policy: Admins can delete projects
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Project Members Policies

-- Policy: Users can view project members of their projects
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
    )
  );

-- Policy: Admins can insert project members
CREATE POLICY "Admins can insert project members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete project members
CREATE POLICY "Admins can delete project members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
