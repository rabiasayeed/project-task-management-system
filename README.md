# Project & Task Management System

A full-stack Project & Task Management System built using the MERN stack.

This application allows users to create and manage projects, add project members, create and manage tasks, track progress, receive notifications, and work with role-based permissions.

## Features

### Authentication & User Management

- User registration
- User login
- Logout
- JWT-based authentication
- Password hashing using bcrypt
- Protected application pages
- User roles:
  - ADMIN
  - USER
- Admin can view users

### Project Management

Users can:

- Create projects
- View projects
- View project details
- Edit projects
- Delete projects
- Archive projects

Each project contains:

- Name
- Description
- Status
- Priority
- Start date
- Due date
- Owner
- Members
- Created date
- Updated date

Project statuses:

- PLANNING
- IN_PROGRESS
- COMPLETED
- ARCHIVED

Project priorities:

- LOW
- MEDIUM
- HIGH

### Project Members

Project owners can:

- Add members
- Remove members
- Manage project settings

Project members can:

- View the project
- View project tasks
- Create tasks
- Update tasks assigned to them

### Task Management

Tasks contain:

- Title
- Description
- Project
- Assigned user
- Status
- Priority
- Due date
- Created date
- Updated date

Task statuses:

- TODO
- IN_PROGRESS
- REVIEW
- COMPLETED

Task priorities:

- LOW
- MEDIUM
- HIGH
- CRITICAL

### Task Search, Filtering & Sorting

Tasks can be:

- Searched by title
- Filtered by status
- Filtered by priority
- Filtered by assigned user
- Filtered by due date
- Sorted by created date
- Sorted by priority
- Sorted by due date

Multiple filters can be used together.

### Dashboard

The dashboard displays:

- Total projects
- Active projects
- Completed projects
- Total tasks
- Pending tasks
- Completed tasks
- Overdue tasks
- High-priority tasks
- Project progress

Project progress is calculated dynamically from task completion.

### Overdue Tasks

A task is considered overdue when:

- Its due date has passed
- Its status is not COMPLETED

Overdue status is calculated dynamically rather than being unnecessarily stored in the database.

### Notifications

Notifications are generated for events such as:

- User added to a project
- Task assigned to a user
- Task completed
- Task approaching its due date

Users can:

- View notifications
- Mark notifications as read
- Mark all notifications as read

### State Management

Redux Toolkit is used for shared application state including:

- Authentication
- Current user
- Projects
- Tasks
- Notifications

Local component state is used where appropriate for UI-specific state such as forms and modals.

### API State Handling

The frontend handles:

- Loading states
- Success states
- Error states
- Empty states

### Optimistic Updates

Task status updates use optimistic UI behavior.

The interface updates immediately while the API request is processed. If the request fails, the previous state can be restored and an error is displayed.

### Pagination

Task pagination includes:

- Current page
- Total pages
- Total records
- Previous page
- Next page

Pagination works together with task search and filters.

### Form Validation

Frontend validation is implemented for important forms.

Validation covers:

- Required fields
- Email
- Password
- Project name
- Task title
- Dates
- Due dates
- Priority
- Status

Backend validation is also implemented.

### Role-Based Access Control

The application implements role-based permissions.

#### Admin

- View users
- View all projects
- View all tasks

#### Project Owner

- Manage project
- Manage project members
- Manage project tasks

#### Project Member

- View project
- View project tasks
- Create tasks
- Update permitted tasks

Authorization is enforced on the backend.

---

# Technology Stack

## Frontend

- React
- Vite
- Redux Toolkit
- React Router
- React Hook Form
- Zod
- Axios
- CSS
- Tailwind CSS

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- dotenv

## Database

MongoDB is used as the application database.

---

# Project Structure

```text
project-task-management-system/
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── store.js
│   │   └── index.css
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md