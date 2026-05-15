export interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  name: string
  description: string
  duration_minutes: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  exercises: Exercise[]
  created_at: string
  updated_at: string
}

export interface Exercise {
  id?: string
  workout_id?: string
  name: string
  sets: number
  reps: number
  weight?: number
  notes?: string
}

export interface NutritionPlan {
  id: string
  user_id: string
  date: string
  meals: Meal[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  created_at: string
}

export interface Meal {
  id?: string
  nutrition_plan_id?: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
}

export interface ProgressEntry {
  id: string
  user_id: string
  date: string
  weight?: number
  body_fat?: number
  muscle_mass?: number
  notes?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  message: string
  response: string
  created_at: string
}

export interface WorkoutPlan {
  id: string
  user_id: string
  goal: string
  fitness_level: string
  days_per_week: number
  workouts: Workout[]
  created_at: string
}
