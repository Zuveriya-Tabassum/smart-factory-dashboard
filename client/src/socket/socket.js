// Socket.io client
import { io } from 'socket.io-client'
import { API_URL } from '../services/api'

// Derive base host from API_URL and default to same host:port if needed
const base = API_URL.replace(/\/api.*$/, '')
export const socket = io(base, { transports: ['websocket'] })