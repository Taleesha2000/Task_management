export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'project_manager' | 'employee'
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: 'admin' | 'project_manager' | 'employee'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'admin' | 'project_manager' | 'employee'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          manager_id: string | null
          start_date: string | null
          end_date: string | null
          status: 'planned' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          manager_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'planned' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          manager_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'planned' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          name: string
          description: string | null
          project_id: string | null
          assigned_to: string | null
          status: 'to_do' | 'in_progress' | 'completed' | 'on_hold'
          start_date: string | null
          end_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          project_id?: string | null
          assigned_to?: string | null
          status?: 'to_do' | 'in_progress' | 'completed' | 'on_hold'
          start_date?: string | null
          end_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          project_id?: string | null
          assigned_to?: string | null
          status?: 'to_do' | 'in_progress' | 'completed' | 'on_hold'
          start_date?: string | null
          end_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      time_logs: {
        Row: {
          id: string
          user_id: string
          task_id: string
          project_id: string | null
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          date: string
          approval_status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          project_id?: string | null
          start_time: string
          end_time?: string | null
          duration_minutes?: number | null
          date: string
          approval_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          project_id?: string | null
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          date?: string
          approval_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'task_assignment' | 'deadline_reminder' | 'status_change' | 'approval_request'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'task_assignment' | 'deadline_reminder' | 'status_change' | 'approval_request'
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'task_assignment' | 'deadline_reminder' | 'status_change' | 'approval_request'
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}
