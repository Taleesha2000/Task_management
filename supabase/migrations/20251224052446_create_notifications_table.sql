/*
  # Create Notifications Table

  ## Overview
  This migration creates the notifications table for managing in-app notifications.

  ## New Tables
  1. `notifications`
    - `id` (uuid, primary key) - Unique notification identifier
    - `user_id` (uuid) - References profiles(id) for the recipient
    - `title` (text) - Notification title
    - `message` (text) - Notification message content
    - `type` (text) - Notification type: task_assignment, deadline_reminder, status_change, or approval_request
    - `read` (boolean) - Whether notification has been read (default: false)
    - `created_at` (timestamptz) - Timestamp when notification was created

  ## Security
  1. Enable RLS on notifications table
  2. Users can view their own notifications
  3. Users can update their own notifications (mark as read)
  4. System can insert notifications for any user

  ## Notes
  - Notifications are user-specific
  - Users can only see and manage their own notifications
  - Read status can be toggled by the user
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('task_assignment', 'deadline_reminder', 'status_change', 'approval_request')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: System can insert notifications (authenticated users can create for others if admin)
CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Users can insert their own notifications
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
