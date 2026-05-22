/**
 * api.ts — Axios instance + typed API calls for every backend endpoint.
 * All components import from here, never calling axios directly.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',   // proxied to http://localhost:8000 by Vite
  timeout: 15000,
})

// ── Inject JWT token on every request ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Types ───────────────────────────────────────────────────────────
export interface UserProfile {
  id: number
  username: string
  email: string
  xp: number
  level: number
  level_title: string
  streak: number
  avatar: string
  created_at: string
}

export interface CourseOut {
  id: number
  title: string
  description: string
  created_at: string
}

export interface NodeOut {
  id: number
  course_id: number
  title: string
  youtube_url: string
  node_type: 'essential' | 'remedial' | 'fast_track'
  summary: string
  order_index: number
  is_completed: boolean
  is_locked: boolean
}

export interface QuestionOut {
  id: number
  level: number
  q_type: 'mcq' | 'fib' | 'code'
  question_text: string
  options: string[]
  xp_reward: number
}

export interface AnswerItem {
  question_id: number
  answer: string
}

export interface QuizResult {
  score_percent: number
  xp_earned: number
  result: 'fail' | 'pass' | 'ace'
  correct_count: number
  total_count: number
  next_node_id: number | null
  next_node_title: string | null
  next_node_type: string | null
  breakdown: {
    question_id: number
    level: number
    q_type: string
    correct: boolean
    user_answer: string
    correct_answer: string
    xp_awarded: number
  }[]
}

export interface CourseProgressOut {
  course_id: number
  course_title: string
  total_nodes: number
  completed_nodes: number
  completion_percent: number
  nodes: {
    node_id: number
    node_title: string
    node_type: string
    completed: boolean
    score: number
    attempts: number
  }[]
}

// ── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  register: (username: string, email: string, password: string, avatar = 'warrior') =>
    api.post<{ access_token: string }>('/auth/register', { username, email, password, avatar }),

  login: (username: string, password: string) =>
    api.post<{ access_token: string }>('/auth/login', { username, password }),
}

// ── Users ─────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get<UserProfile>('/users/me'),
  getProgress: () => api.get<CourseProgressOut[]>('/users/me/progress'),
}

// ── Courses ───────────────────────────────────────────────────────────
export const courseApi = {
  list: () => api.get<CourseOut[]>('/courses'),
  getNodes: (courseId: number) => api.get<NodeOut[]>(`/courses/${courseId}/nodes`),
  getQuestions: (courseId: number, nodeId: number) =>
    api.get<QuestionOut[]>(`/courses/${courseId}/nodes/${nodeId}/questions`),
}

// ── Quiz ──────────────────────────────────────────────────────────────
export const quizApi = {
  submit: (nodeId: number, answers: AnswerItem[]) =>
    api.post<QuizResult>('/quiz/submit', { node_id: nodeId, answers }),
}

export default api
