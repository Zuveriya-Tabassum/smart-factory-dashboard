// API helper for the client
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

function getToken() {
  return localStorage.getItem('token') || ''
}

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text || 'Unexpected response'}`)
  }
  return res.json()
}

export async function fetchMachines() {
  const res = await fetch(`${API_URL}/api/machines`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text || 'Unexpected response'}`)
  }
  return res.json()
}

export async function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register({ name, email, password, role }) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  })
}

// Machine control APIs
export async function startMachine(id) {
  return apiFetch(`/api/machines/${id}/start`, { method: 'POST' })
}
export async function stopMachine(id) {
  return apiFetch(`/api/machines/${id}/stop`, { method: 'POST' })
}
export async function resetMachine(id) {
  return apiFetch(`/api/machines/${id}/reset`, { method: 'POST' })
}
export async function assignJob(id, job) {
  return apiFetch(`/api/machines/${id}/assign`, { method: 'POST', body: JSON.stringify({ job }) })
}
export async function setMode(id, mode) {
  return apiFetch(`/api/machines/${id}/mode`, { method: 'POST', body: JSON.stringify({ mode }) })
}
export async function emergencyShutdown(reason) {
  return apiFetch('/api/machines/emergency/shutdown', { method: 'POST', body: JSON.stringify({ reason }) })
}
export async function seedMachines() {
  return apiFetch('/api/machines/seed', { method: 'POST' })
}

// Alerts
export async function listAlertsCorrect(machineId) {
  const query = machineId ? `?machineId=${encodeURIComponent(machineId)}` : ''
  return apiFetch(`/api/alerts${query}`)
}
export async function resolveAlert(id) {
  return apiFetch(`/api/alerts/${id}/resolve`, { method: 'POST' })
}
// NEW: Acknowledge alert with note
export async function acknowledgeAlert(id, note) {
  return apiFetch(`/api/alerts/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ note }) })
}

// Logs (Admin)
export async function fetchLogs(page = 1, limit = 20, filters = {}) {
  const params = new URLSearchParams({ page, limit })
  if (filters.machineId) params.set('machineId', String(filters.machineId))
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const query = `?${params.toString()}`
  return apiFetch(`/api/logs${query}`)
}

// Admin endpoints
export async function getPendingUsers() {
  return apiFetch('/api/auth/pending')
}
export async function approveUser(id) {
  return apiFetch(`/api/auth/approve/${id}`, { method: 'POST' })
}
export async function getRoleCounts() {
  return apiFetch('/api/auth/counts')
}
export async function getUsersByRole(role) {
  const query = `?role=${encodeURIComponent(role)}`
  return apiFetch(`/api/auth/users${query}`)
}
// NEW: Reject pending user
export async function rejectUser(id) {
  return apiFetch(`/api/auth/reject/${id}`, { method: 'POST' })
}

// NEW: Update user role (Admin)
export async function updateUserRole(id, role) {
  return apiFetch(`/api/auth/role/${id}`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}

// NEW: Update machine thresholds (Admin)
export async function updateThresholds(id, { maxTemperature, minEfficiency }) {
  return apiFetch(`/api/machines/${id}/thresholds`, {
    method: 'POST',
    body: JSON.stringify({ maxTemperature, minEfficiency }),
  })
}

// NEW: Maintenance controls
export async function startMaintenance(id, reason) {
  return apiFetch(`/api/machines/${id}/maintenance/start`, { method: 'POST', body: JSON.stringify({ reason }) })
}
export async function clearMaintenance(id) {
  return apiFetch(`/api/machines/${id}/maintenance/clear`, { method: 'POST' })
}

// NEW: Suspend / Reactivate user
export async function suspendUser(id) {
  return apiFetch(`/api/auth/suspend/${id}`, { method: 'POST' })
}
export async function reactivateUser(id) {
  return apiFetch(`/api/auth/reactivate/${id}`, { method: 'POST' })
}

// Machine CRUD (Admin)
export async function createMachine({ name, type }) {
  return apiFetch(`/api/machines`, { method: 'POST', body: JSON.stringify({ name, type }) })
}
export async function updateMachine(id, payload) {
  return apiFetch(`/api/machines/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export async function deleteMachine(id) {
  return apiFetch(`/api/machines/${id}`, { method: 'DELETE' })
}
// Assign engineer (Admin)
export async function assignEngineer(id, engineerId) {
  return apiFetch(`/api/machines/${id}/assign-engineer`, { method: 'POST', body: JSON.stringify({ engineerId }) })
}

// Analytics summary
export async function fetchAnalyticsSummary() {
  return apiFetch(`/api/analytics/summary`)
}

// Logs export CSV (Admin)
export async function exportLogsCsv(filters = {}) {
  const params = new URLSearchParams();
  if (filters.machineId) params.append('machineId', filters.machineId);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  const url = `${API_URL}/api/logs/export${params.toString() ? `?${params.toString()}` : ''}`;

  // Use token header to pass auth
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to export logs (${res.status})`);
  }
  const blob = await res.blob();
  return blob;
}