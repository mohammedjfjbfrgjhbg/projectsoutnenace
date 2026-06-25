// Central configuration for Backend API and Socket.io URLs
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:8000' : window.location.origin);
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isLocal ? 'http://localhost:3000' : window.location.origin);
