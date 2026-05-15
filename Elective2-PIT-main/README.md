# AI Fitness Planner

An AI-powered web application for personalized workout plans, nutrition suggestions, and fitness tracking.

## 🚀 Features

- **AI-Powered Workout Generation**: Get personalized workout plans based on your goals, fitness level, and available equipment
- **Nutrition Suggestions**: Receive customized meal plans and macro recommendations
- **AI Chatbot Trainer**: Ask fitness questions and get instant advice
- **Progress Tracking**: Log your workouts and track improvements over time
- **User Authentication**: Secure sign-up and sign-in with Supabase Auth
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons
- Recharts for data visualization

### Backend & Database
- Supabase (PostgreSQL database, Authentication, Real-time subscriptions)

### AI Integration
- Groq API with Llama 3.1 for AI-powered features
- Fallback algorithms when AI service is unavailable

### Deployment
- Vercel for hosting

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- A Groq API key ([groq.com](https://console.groq.com))

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-fitness-planner.git
cd ai-fitness-planner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the following schema:

```sql
-- Users table
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts table
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  exercises JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress entries table
CREATE TABLE progress_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL,
  body_fat DECIMAL,
  muscle_mass DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrition plans table
CREATE TABLE nutrition_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meals JSONB,
  total_calories INTEGER,
  total_protein INTEGER,
  total_carbs INTEGER,
  total_fat INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for workouts table
CREATE POLICY "Users can CRUD own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- Policies for progress_entries table
CREATE POLICY "Users can CRUD own progress" ON progress_entries
  FOR ALL USING (auth.uid() = user_id);

-- Policies for nutrition_plans table
CREATE POLICY "Users can CRUD own nutrition plans" ON nutrition_plans
  FOR ALL USING (auth.uid() = user_id);

-- Policies for chat_messages table
CREATE POLICY "Users can CRUD own chat messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);
```

3. Get your Supabase URL and Anon Key from Settings > API

### 4. Get Groq API Key

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key in the API Keys section

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### 6. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add the environment variables in Vercel settings
4. Deploy!

## 📁 Project Structure

```
ai-fitness-planner/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and API clients
│   │   ├── supabase.ts   # Supabase client configuration
│   │   └── ai.ts         # AI integration functions
│   ├── pages/            # Page components
│   │   ├── SignIn.tsx    # Authentication page
│   │   └── Dashboard.tsx # Main dashboard
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── .env.example          # Environment variables template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🤖 AI Features

### 1. Workout Plan Generation
- Uses LLM to create personalized workout routines
- Considers user's goal, fitness level, and available equipment
- Falls back to predefined templates if AI is unavailable

### 2. Nutrition Suggestions
- Calculates BMR using Mifflin-St Jeor Equation
- Generates macro distributions based on goals
- Provides meal suggestions with timing

### 3. AI Chatbot Trainer
- Natural language conversations about fitness
- Context-aware responses based on user profile
- Instant feedback on form, technique, and programming

## 👥 Team Members & Roles

| Role | Member | Responsibilities |
|------|--------|------------------|
| Team Leader | [Name] | Project coordination, sprint planning |
| Frontend Developer | [Name] | React components, state management |
| Backend Developer | [Name] | Supabase setup, database design |
| AI Specialist | [Name] | AI integration, prompt engineering |
| UI/UX Designer | [Name] | Design system, user experience |
| QA/Documentation | [Name] | Testing, documentation |

## 📝 API Documentation

### AI Endpoints

#### Generate Workout Plan
```typescript
generateWorkoutPlan(
  goal: string,
  fitnessLevel: string,
  daysPerWeek: number,
  availableEquipment: string[]
): Promise<Workout[]>
```

#### Generate Nutrition Suggestions
```typescript
generateNutritionSuggestions(
  goal: string,
  currentWeight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string
): Promise<NutritionPlan>
```

#### Chat with Trainer
```typescript
chatWithTrainer(
  message: string,
  context?: { goal: string, fitnessLevel: string }
): Promise<string>
```

## 🧪 Testing

Run tests (when implemented):
```bash
npm test
```

## 📄 License

This project is created for educational purposes.

## 🔗 Links

- **Live Demo**: [Deploy your app and add link here]
- **GitHub Repository**: [Your GitHub repo URL]
- **Supabase**: [supabase.com](https://supabase.com)
- **Groq**: [groq.com](https://groq.com)

## 🙏 Acknowledgments

- Supabase for the backend infrastructure
- Groq for fast AI inference
- Vercel for deployment
- The open-source community

---

**Note**: This is a student project for educational purposes. Always consult with a healthcare professional before starting any new fitness or nutrition program.