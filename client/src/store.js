import { configureStore, createSlice } from '@reduxjs/toolkit';

const savedUser = JSON.parse(localStorage.getItem('user') || 'null');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    token: localStorage.getItem('token'),
    loading: false,
    error: null
  },
  reducers: {
    authLoading: (state, action) => { state.loading = action.payload; },
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
      state.loading = false;
      state.error = null;
    },
    setAuthError: (state, action) => { state.error = action.payload; state.loading = false; },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: { items: [], current: null, loading: false, error: null },
  reducers: {
    projectsLoading: (state, action) => { state.loading = action.payload; },
    setProjects: (state, action) => { state.items = action.payload; state.loading = false; state.error = null; },
    setCurrent: (state, action) => { state.current = action.payload; },
    setProjectsError: (state, action) => { state.error = action.payload; state.loading = false; }
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], pagination: {}, loading: false, error: null },
  reducers: {
    tasksLoading: (state, action) => { state.loading = action.payload; },
    setTasks: (state, action) => {
      state.items = action.payload.tasks || [];
      state.pagination = action.payload.pagination || {};
      state.loading = false;
      state.error = null;
    },
    addTask: (state, action) => { state.items.unshift(action.payload); },
    removeTask: (state, action) => { state.items = state.items.filter(t => t._id !== action.payload); },
    updateTask: (state, action) => {
      const index = state.items.findIndex(t => t._id === action.payload._id);
      if (index >= 0) state.items[index] = action.payload;
    },
    setTasksError: (state, action) => { state.error = action.payload; state.loading = false; }
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    notificationsLoading: (state, action) => { state.loading = action.payload; },
    setNotifications: (state, action) => { state.items = action.payload; state.loading = false; state.error = null; },
    markRead: (state, action) => {
      const n = state.items.find(x => x._id === action.payload);
      if (n) n.read = true;
    },
    markAllRead: state => { state.items.forEach(n => { n.read = true; }); },
    setNotificationsError: (state, action) => { state.error = action.payload; state.loading = false; }
  }
});

export const { authLoading, setAuth, setAuthError, logout } = authSlice.actions;
export const { projectsLoading, setProjects, setCurrent, setProjectsError } = projectSlice.actions;
export const { tasksLoading, setTasks, addTask, removeTask, updateTask, setTasksError } = taskSlice.actions;
export const { notificationsLoading, setNotifications, markRead, markAllRead, setNotificationsError } = notificationSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    projects: projectSlice.reducer,
    tasks: taskSlice.reducer,
    notifications: notificationSlice.reducer
  }
});
