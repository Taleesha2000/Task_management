# Employee Task & Time Tracking System

A comprehensive web-based application for managing employee tasks, projects, and time tracking with secure authentication and role-based access control.

## Features

### Authentication & Authorization
- Secure JWT-based authentication with Supabase
- Role-based access control (Admin, Project Manager, Employee)
- User registration and login
- Profile management

### User Management (Admin Only)
- View all users
- Assign roles to users
- Activate/deactivate user accounts
- Manage user permissions

### Project Management
- Create and manage projects
- Assign project managers
- Set project timelines and status
- Track project progress

### Task Management
- Create, update, and delete tasks
- Assign tasks to team members
- Set task priorities and deadlines
- Track task status (To Do, In Progress, Completed, On Hold)
- Filter tasks by status

### Time Tracking
- Start/stop timer for active tasks
- Manual time entry with approval workflow
- View time log history
- Track daily and weekly hours
- Automatic duration calculation

### Calendar View
- Visual calendar interface
- View tasks by date
- See upcoming deadlines
- Month navigation

### Reports & Analytics
- Task distribution charts
- Project progress tracking
- Team productivity metrics
- Time utilization reports
- Interactive visualizations

### Dashboard
- Personalized dashboard for each user role
- Real-time statistics
- Quick access to assigned tasks
- Recent activity overview

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Lucide React for icons
- React Router for navigation
- Recharts for data visualization
- date-fns for date handling

### Backend
- Supabase (PostgreSQL database)
- Row Level Security (RLS) policies
- Supabase Authentication
- Real-time subscriptions

## Database Schema

### Tables
- **profiles** - Extended user information and roles
- **projects** - Project details and assignments
- **project_members** - Junction table for project team members
- **tasks** - Task information and assignments
- **time_logs** - Time tracking entries
- **notifications** - In-app notifications

## User Roles & Permissions

### Admin
- Full system access
- User management and role assignment
- All project and task operations
- View all reports and analytics
- System configuration

### Project Manager
- View assigned projects
- Manage project tasks and timelines
- View team calendars
- Generate project reports
- Update task status

### Employee
- View assigned tasks
- Create personal tasks
- Track time on tasks
- View personal calendar
- Access personal dashboard

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.tsx   # Main layout with navigation
│   └── Modal.tsx    # Modal component
├── contexts/        # React contexts
│   └── AuthContext.tsx  # Authentication state
├── lib/            # Utilities and configuration
│   ├── supabase.ts      # Supabase client
│   └── database.types.ts # TypeScript types
├── pages/          # Page components
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── Tasks.tsx
│   ├── TimeTracking.tsx
│   ├── Calendar.tsx
│   ├── Reports.tsx
│   ├── Users.tsx
│   ├── Login.tsx
│   └── Register.tsx
├── App.tsx         # Main app component
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## Security Features

- Row Level Security (RLS) enabled on all tables
- Secure authentication with JWT tokens
- Role-based access control at database level
- Protected API routes
- Encrypted passwords
- Input validation

## Design Principles

- Clean and modern UI/UX
- Responsive design for all devices
- Consistent color scheme and branding
- Intuitive navigation
- Accessible interface
- Fast load times

## Default User Setup

After setting up the system, create your first admin user through registration, then manually update their role in the database:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## Future Enhancements

- Email notifications
- Mobile application
- Advanced reporting
- File attachments
- Team chat
- Calendar integrations
- Export to Excel/PDF
- API endpoints for third-party integrations

## License

This project is proprietary software.

## Support

For support and questions, please contact your system administrator.