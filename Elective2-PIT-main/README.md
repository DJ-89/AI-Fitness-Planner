# 🏋️‍♂️ AI Fitness Planner

A comprehensive, AI-powered web application designed to generate personalized workout routines, calculate precision macros, suggest budget-tailored meal plans, and provide an interactive AI training assistant.

## ✨ Core Features

### 🥗 Smart Nutrition Engine

*  Dynamic Macro Calculation:  Automatically calculates BMR and TDEE using the Mifflin-St Jeor Equation based on user weight, height, age, and gender.
*  BMI-Driven Goals:  Automatically adjusts caloric surplus/deficit targets based on user BMI, categorized into Bulking, Cutting, or Maintenance.
*  3-Tier Budget Meal Planning: 
*  Budget-Friendly (Student):  High-protein staples utilizing accessible ingredients like canned tuna, eggs, and oats.
*  Moderate/Balanced:  Standard fitness meals such as chicken breast, ground beef, and brown rice.
*  Premium/High Protein:  Western fine-dining fitness meals including Ribeye steak, Atlantic salmon, and quinoa.


*  Macro Dashboard:  Visual breakdown of daily target Calories, Protein, Carbs, and Fats with modern UI progress cards.

### 🏋️‍♂️ AI-Powered Workouts

*  Custom Generation:  Creates tailored routines based on specific fitness goals (Hypertrophy, Endurance, Strength), experience levels, and availability.
*  Interactive UI:  Expandable exercise cards detailing specific sets, reps, and form notes with a polished Tailwind CSS design.

### 📈 Progress Tracking

*  Weight Logging:  Track body weight changes over time with date stamps and custom daily notes.
*  History Management:  Clean, interactive history feed with secure delete functionality and professional modals.

### 💬 AI Personal Trainer

*  Context-Aware Chat:  Real-time chat interface powered by Groq API (Llama models).
*  Rich Formatting:  Supports React Markdown for cleanly formatted advice, including bullet points and structured workout advice.

---

## 🛠️ Technology Stack

 Frontend Environment: 

*  Framework:  React 19 (TypeScript)
*  Build Tool:  Vite
*  Styling:  Tailwind CSS (Custom shadows, animations, and responsive design)
*  Icons & UI:  Lucide React, React Hot Toast

 Backend & Database: 

*  Platform:  Supabase (PostgreSQL, Auth, RLS)
*  Email:  Resend (Custom SMTP for bypassing provider rate limits)

 AI Integration: 

*  Inference:  Groq Cloud
*  Models:  Llama 3.1 8B/70B

---

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/DJ-89/AI-Fitness-Planner
cd ai-fitness-planner

```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://wryitqukyezjcvjrhhln.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyeWl0cXVreWV6amN2anJoaGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDYyNDYsImV4cCI6MjA5MzAyMjI0Nn0.RgzIuk9Ybos4tBRSn6U3LnTg6Q_0wJfwjPzqkx7StMA
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_PYfXUR862sIWF-pVsfS7rw_VT_ubzB4
VITE_GROQ_API_KEY=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

```

### 3. Database Schema

Run the provided SQL scripts in the Supabase SQL Editor to initialize `user_profiles`, `workouts`, `progress`, and `nutrition_plans` tables with proper Row Level Security (RLS).

### 4. Custom SMTP (Resend)

To ensure reliable authentication emails, configure your Resend API key in the Supabase Authentication settings.

---

## 👥 Development Team

DAN JOSHUA PAMISA
HEXEL RANA
ASHARY PANGANDAMAN
ASHER DRECK ABIAN

---

## 📄 License

This project is created for educational purposes. Always consult with a healthcare professional before starting any new fitness or nutrition program.