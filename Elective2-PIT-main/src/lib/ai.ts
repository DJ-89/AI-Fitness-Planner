export async function generateWorkoutPlan(
  goal: string,
  fitnessLevel: string,
  daysPerWeek: number,
  availableEquipment: string[]
) {
  // STRICT PROMPT: We tell the AI exactly how many exercises and what names to use
  const prompt = `ACT AS A PRO TRAINER. Create a ${daysPerWeek}-day workout plan.
  GOAL: ${goal}
  LEVEL: ${fitnessLevel}
  EQUIPMENT: ${availableEquipment.join(', ') || 'gym equipment and bodyweight'}

  RULES:
  1. Names MUST be specific to the goal (e.g. "Fat Burning Circuit" if goal is Lose Weight).
  2. Each day MUST have at least 6-8 different exercises.
  3. Include specific sets/reps (e.g. 3 sets of 12 reps).
  4. Respond ONLY with a JSON array. No conversational text.

  JSON FORMAT:
  [{
    "name": "Specific Workout Name",
    "description": "How this workout helps with ${goal}",
    "duration_minutes": 45,
    "difficulty": "${fitnessLevel}",
    "exercises": [
      {"name": "Exercise Name", "sets": 3, "reps": "10-12", "notes": "Form tip"}
    ]
  }]`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a fitness API. You only output valid JSON arrays. No markdown, no prose.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6, // Lowered temperature for more consistent JSON
        max_tokens: 3000
      })
    })

    if (!response.ok) throw new Error('AI service unavailable')

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    
    // Clean the AI response in case it added markdown ```json tags
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim()
    
    const jsonMatch = cleanContent.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return generateFallbackWorkout(goal, fitnessLevel, daysPerWeek)
  } catch (error) {
    console.error('Error generating workout plan:', error)
    return generateFallbackWorkout(goal, fitnessLevel, daysPerWeek)
  }
}

function generateFallbackWorkout(goal: string, fitnessLevel: string, daysPerWeek: number) {
  const difficulties: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced'
  }

  const baseWorkouts = [
    {
      name: 'Full Body Strength',
      description: 'Complete full body workout focusing on major muscle groups',
      duration_minutes: 45,
      difficulty: difficulties[fitnessLevel] || 'beginner',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: fitnessLevel === 'beginner' ? 10 : fitnessLevel === 'intermediate' ? 15 : 20 },
        { name: 'Squats', sets: 3, reps: fitnessLevel === 'beginner' ? 12 : fitnessLevel === 'intermediate' ? 20 : 25 },
        { name: 'Lunges', sets: 3, reps: 10 },
        { name: 'Plank', sets: 3, reps: 1, notes: 'Hold for 30-60 seconds' },
        { name: 'Burpees', sets: 3, reps: fitnessLevel === 'beginner' ? 5 : fitnessLevel === 'intermediate' ? 10 : 15 }
      ]
    },
    {
      name: 'Cardio & Core',
      description: 'High intensity cardio with core strengthening',
      duration_minutes: 30,
      difficulty: difficulties[fitnessLevel] || 'beginner',
      exercises: [
        { name: 'Jumping Jacks', sets: 3, reps: 30, notes: '30 seconds' },
        { name: 'Mountain Climbers', sets: 3, reps: 20 },
        { name: 'Bicycle Crunches', sets: 3, reps: 15 },
        { name: 'Russian Twists', sets: 3, reps: 20 },
        { name: 'High Knees', sets: 3, reps: 30, notes: '30 seconds' }
      ]
    },
    {
      name: 'Upper Body Focus',
      description: 'Target chest, back, shoulders, and arms',
      duration_minutes: 40,
      difficulty: difficulties[fitnessLevel] || 'beginner',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 12 },
        { name: 'Tricep Dips', sets: 3, reps: 10 },
        { name: 'Pike Push-ups', sets: 3, reps: 8 },
        { name: 'Superman', sets: 3, reps: 12 },
        { name: 'Arm Circles', sets: 3, reps: 20, notes: '30 seconds each direction' }
      ]
    },
    {
      name: 'Lower Body Power',
      description: 'Legs and glutes focused workout',
      duration_minutes: 40,
      difficulty: difficulties[fitnessLevel] || 'beginner',
      exercises: [
        { name: 'Squats', sets: 4, reps: 15 },
        { name: 'Reverse Lunges', sets: 3, reps: 12 },
        { name: 'Calf Raises', sets: 3, reps: 20 },
        { name: 'Glute Bridges', sets: 3, reps: 15 },
        { name: 'Wall Sit', sets: 3, reps: 1, notes: 'Hold for 45 seconds' }
      ]
    }
  ]

  return baseWorkouts.slice(0, daysPerWeek)
}

// ai.ts

export async function generateNutritionSuggestions(
  goal: string,
  currentWeight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string,
  targetBudget: string // Added parameter
) {
  // 1. Calculate BMR using Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * currentWeight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * currentWeight + 6.25 * height - 5 * age - 161;
  }

  // 2. BMI Calculation (Basis for the meal types)
  const heightInMeters = height / 100;
  const bmi = currentWeight / (heightInMeters * heightInMeters);

  // 3. Activity multiplier
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  // 4. Adjust based on goal
  let targetCalories: number;
  if (goal.includes('lose') || goal.includes('cut')) {
    targetCalories = tdee - 500;
  } else if (goal.includes('gain') || goal.includes('bulk')) {
    targetCalories = tdee + 300;
  } else {
    targetCalories = tdee;
  }

  // 5. Macro distribution (balanced approach)
  const protein = Math.round((targetCalories * 0.3) / 4);
  const carbs = Math.round((targetCalories * 0.4) / 4);
  const fat = Math.round((targetCalories * 0.3) / 9);

  return {
    daily_calories: Math.round(targetCalories),
    protein_grams: protein,
    carbs_grams: carbs,
    fat_grams: fat,
    // Pass targetBudget and bmi to the meal plan generator
    meals: generateMealPlan(targetCalories, protein, carbs, fat, targetBudget, bmi)
  };
}

export function generateMealPlan(
  calories: number, 
  protein: number, 
  carbs: number, 
  fat: number, 
  targetBudget: string, 
  bmi: number
) {
  const mealDistribution = [0.25, 0.3, 0.25, 0.2]; // Breakfast, Lunch, Dinner, Snack
  
  // 1. Force lowercase so it perfectly matches your database strings
  const safeBudget = String(targetBudget || "").toLowerCase();
  
  // 2. Strict checks for all 3 budget tiers
  const isPremium = safeBudget.includes("premium");
  const isModerate = safeBudget.includes("moderate");
  
  const isCutting = bmi >= 25;
  const isBulking = bmi < 18.5;

  return [
    {
      name: 'Breakfast',
      calories: Math.round(calories * mealDistribution[0]) || 0,
      protein: Math.round(protein * mealDistribution[0]) || 0,
      carbs: Math.round(carbs * mealDistribution[0]) || 0,
      fat: Math.round(fat * mealDistribution[0]) || 0,
      time: '08:00',
      // PREMIUM -> MODERATE -> BUDGET (Student)
      suggestions: isPremium 
        ? (isCutting ? ['Egg white omelet with spinach', 'Greek yogurt with fresh berries'] : ['Avocado toast with poached eggs', 'Smoked salmon bagel'])
        : isModerate 
          ? ['Scrambled eggs with whole wheat toast', 'Greek yogurt with banana']
          : ['Oatmeal with sliced bananas', 'Boiled eggs with brown bread']
    },
    {
      name: 'Lunch',
      calories: Math.round(calories * mealDistribution[1]) || 0,
      protein: Math.round(protein * mealDistribution[1]) || 0,
      carbs: Math.round(carbs * mealDistribution[1]) || 0,
      fat: Math.round(fat * mealDistribution[1]) || 0,
      time: '13:00',
      suggestions: isPremium 
        ? (isCutting ? ['Grilled Atlantic salmon with asparagus', 'Seared tuna salad'] : ['Ribeye steak with quinoa', 'Grilled salmon with sweet potato'])
        : isModerate
          ? ['Grilled chicken breast with brown rice', 'Ground beef pasta']
          : ['Canned tuna pasta with olive oil', 'Boiled chicken breast with white rice']
    },
    {
      name: 'Dinner',
      calories: Math.round(calories * mealDistribution[2]) || 0,
      protein: Math.round(protein * mealDistribution[2]) || 0,
      carbs: Math.round(carbs * mealDistribution[2]) || 0,
      fat: Math.round(fat * mealDistribution[2]) || 0,
      time: '19:00',
      suggestions: isPremium 
        ? (isCutting ? ['Baked white fish with lemon', 'Lean beef stir-fry with peppers'] : ['Beef tenderloin with roasted potatoes', 'Shrimp scampi'])
        : isModerate
          ? ['Baked chicken thighs with broccoli', 'Lean pork chop with mixed greens']
          : ['Stir-fried cabbage with egg and rice', 'Sardines with tomato and rice']
    },
    {
      name: 'Snack',
      calories: Math.round(calories * mealDistribution[3]) || 0,
      protein: Math.round(protein * mealDistribution[3]) || 0,
      carbs: Math.round(carbs * mealDistribution[3]) || 0,
      fat: Math.round(fat * mealDistribution[3]) || 0,
      time: '16:00',
      suggestions: isPremium 
        ? ['Whey protein isolate shake', 'Mixed roasted nuts'] 
        : isModerate
          ? ['Apple with peanut butter', 'Cottage cheese']
          : ['Fresh banana', 'Hard-boiled egg']
    }
  ];
}

export async function chatWithTrainer(message: string, context?: any) {
  const prompt = `You are an AI fitness trainer assistant. The user asks: "${message}"
  ${context ? `Context: User's goal is ${context.goal}, fitness level is ${context.fitnessLevel}.` : ''}
  Provide a helpful, encouraging, and informative response about fitness, nutrition, or workout advice.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly and knowledgeable fitness trainer. Provide clear, actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error('AI service unavailable')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Sorry, I could not process your request. Please try again.'
  } catch (error) {
    console.error('Chat error:', error)
    return 'I apologize, but I\'m having trouble connecting right now. Here\'s some general advice: Stay consistent with your workouts, maintain proper form, eat balanced meals, and get adequate rest. Keep pushing forward!'
  }
}
