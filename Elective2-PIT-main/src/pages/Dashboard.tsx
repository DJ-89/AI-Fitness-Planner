import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { generateWorkoutPlan, generateNutritionSuggestions, chatWithTrainer } from '../lib/ai'
import { Dumbbell, Calendar, TrendingUp, MessageCircle, Plus, Trash2, CheckCircle, Send, Scale, Check } from 'lucide-react'
import { Workout } from '../types'
import ReactMarkdown from 'react-markdown';
import ConfirmModal from '../components/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'workouts' | 'progress' | 'nutrition' | 'chat'>('workouts')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // Progress & Nutrition State
  const [nutrition, setNutrition] = useState<any>(null)
  const [generatingNutrition, setGeneratingNutrition] = useState(false)
  const [progressEntries, setProgressEntries] = useState<any[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // State for expanding/collapsing exercises
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({})

  // Chat State
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([])
  const [isTyping, setIsTyping] = useState(false)

  // Form state for generating workout
  const [goal, setGoal] = useState('Build muscle')
  const [fitnessLevel, setFitnessLevel] = useState('intermediate')
  const [daysPerWeek, setDaysPerWeek] = useState(3)

  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  
  const [newHeight, setNewHeight] = useState('');
  const [targetBudget, setTargetBudget] = useState('Budget Friendly (Student friendly)');

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  async function fetchProfile() {
    const { data } = await supabase.from('user_profiles').select('*').eq('id', user!.id).maybeSingle();
    setProfile(data);
  }

  useEffect(() => {
    if (user) {
      fetchWorkouts()
      fetchNutrition()
      fetchProgress()
    }
  }, [user])

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const weight = formData.get('weight');
    const height = formData.get('height');
    const budget = formData.get('budget');
  
    if (!user) return;
  
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          weight_kg: Number(weight),
          height_cm: Number(height),
          budget_level: budget,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
  
      if (error) throw error;
  
      setProfile(data);
      setShowSaveSuccessModal(true); 

    } catch (error: any) {
      console.error("Error saving profile:", error.message);
      toast.error("Failed to save profile. Check your connection.");
    }
  }

  async function fetchWorkouts() {
    const { data } = await supabase.from('workouts').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
    setWorkouts(data || [])
    setLoading(false)
  }

  async function fetchNutrition() {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle()

      if (error) throw error
      setNutrition(data)
    } catch (error) {
      console.error('Error fetching nutrition:', error)
    }
  }

  async function fetchProgress() {
    const { data } = await supabase.from('progress').select('*').eq('user_id', user!.id).order('date', { ascending: false })
    setProgressEntries(data || [])
  }

  async function handleAddProgress(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('progress').insert({
        user_id: user!.id,
        weight: parseFloat(newWeight),
        notes: newNotes
      }).select().single();

      if (error) throw error;

      setProgressEntries([data, ...progressEntries]);
      setNewWeight('');
      setNewNotes('');
      toast.success("Progress logged successfully!");

    } catch (error: any) {
      console.error('Error saving progress:', error.message);
      toast.error(`Failed to save: ${error.message}`);
    }
  }

  async function handleGenerateNutrition() {
    setGeneratingNutrition(true);

    try {
      const finalWeight = Number(profile?.weight_kg) || Number(newWeight) || 70;
      const finalHeight = Number(profile?.height_cm) || Number(newHeight) || 175;
      const finalBudget = String(profile?.budget_level || targetBudget).toLowerCase();

      const heightInMeters = finalHeight / 100;
      const bmi = finalWeight / (heightInMeters * heightInMeters);

      let fitnessGoal = "maintain weight";
      if (bmi < 18.5) fitnessGoal = "gain weight";
      if (bmi >= 25) fitnessGoal = "lose weight";

      const data = await generateNutritionSuggestions(
        fitnessGoal,
        finalWeight, 
        finalHeight,  
        20,           
        'male',       
        'moderate',   
        finalBudget   
      );

      setMealPlan(data);
      toast.success("Meal plan generated successfully!");

    } catch (err) {
      console.error("Generation Error:", err);
      toast.error("Error generating meal plan.");
    } finally {
      setGeneratingNutrition(false);
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedWorkouts(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleChat() {
    if (!chatInput.trim()) return
    const userMessage = chatInput
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setIsTyping(true)
    try {
      const response = await chatWithTrainer(userMessage, { goal, fitnessLevel })
      setMessages(prev => [...prev, { role: 'ai', content: response }])
    } finally {
      setIsTyping(false)
    }
  }

  async function handleGenerateWorkout() {
    setGenerating(true)
    try {
      const aiWorkouts = await generateWorkoutPlan(goal, fitnessLevel, daysPerWeek, [])
      if (aiWorkouts && aiWorkouts.length > 0) {
        const workout = aiWorkouts[0]
        const { data, error } = await supabase.from('workouts').insert({
          user_id: user!.id,
          name: workout.name,
          description: workout.description,
          duration_minutes: Number(workout.duration_minutes),
          difficulty: workout.difficulty,
          exercises: workout.exercises
        }).select().single()
        if (!error) setWorkouts([data, ...workouts])
      }
      setShowGenerateModal(false)
    } finally {
      setGenerating(false)
    }
  }

  async function deleteWorkout(id: string) {
    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;
      setWorkouts(workouts.filter(w => w.id !== id));
    } catch (error: any) {
      console.error('Error deleting workout:', error.message);
      alert(`Failed to delete: ${error.message}`);
    }
  }

  function initiateDelete(id: string) {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('progress').delete().eq('id', itemToDelete);
      if (error) throw error;
      setProgressEntries(progressEntries?.filter(entry => entry.id !== itemToDelete));
      setDeleteModalOpen(false);
      setItemToDelete(null);
      toast.success("Entry deleted permanently!");
    } catch (error: any) {
      console.error('Error deleting progress:', error.message);
      toast.error("Failed to delete entry.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Global Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-sm text-white">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">AI Fitness Planner</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-600 font-semibold">{user?.full_name || 'User'}</span>
            <button onClick={signOut} className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs (Pill Style) */}
      <nav className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-2 py-3 overflow-x-auto">
            {[
              { id: 'workouts', label: 'Workouts', icon: Dumbbell },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'nutrition', label: 'Nutrition', icon: Calendar },
              { id: 'chat', label: 'AI Trainer', icon: MessageCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-5 rounded-full font-bold text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* WORKOUTS TAB */}
        {activeTab === 'workouts' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Your Workouts</h2>
              <button onClick={() => setShowGenerateModal(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95">
                <Plus className="w-5 h-5" />
                <span className="font-bold">Generate with AI</span>
              </button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {workouts.map((workout) => (
                <div key={workout.id} className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{workout.name}</h3>
                      <span className="inline-block mt-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-blue-100">
                        {workout.duration_minutes} minutes
                      </span>
                    </div>
                    <button onClick={() => deleteWorkout(workout.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                  
                  <div className="space-y-3 mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     {(expandedWorkouts[workout.id] ? workout.exercises : workout.exercises?.slice(0, 3)).map((ex, i) => (
                       <div key={i} className="flex items-center space-x-3 text-sm text-slate-700 font-medium">
                         <div className="bg-emerald-100 p-1 rounded-full"><CheckCircle className="w-3 h-3 text-emerald-600"/></div>
                         <span>{ex.name}: <span className="text-slate-500">{ex.sets}x{ex.reps}</span></span>
                       </div>
                     ))}
                     {workout.exercises.length > 3 && (
                       <button onClick={() => toggleExpand(workout.id)} className="text-blue-600 text-sm font-bold mt-2 hover:underline w-full text-center py-1">
                         {expandedWorkouts[workout.id] ? 'Show Less' : `+${workout.exercises.length - 3} more exercises`}
                       </button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NUTRITION TAB */}
        {activeTab === 'nutrition' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {!profile ? (
              <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-3">Personalize Your Plan</h3>
                <p className="text-slate-500 mb-8 font-medium">We use your body metrics and budget tier to calculate precision macros and realistic meals.</p>
                
                <form onSubmit={handleSaveProfile} className="grid grid-cols-2 gap-5 text-left">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Weight (kg)</label>
                    <input name="weight" type="number" placeholder="70" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold" required />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Height (cm)</label>
                    <input name="height" type="number" placeholder="175" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold" required />
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Target Budget</label>
                    <select name="budget" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold appearance-none">
                      <option value="budget-friendly">Budget Friendly (Student friendly)</option>
                      <option value="moderate">Moderate / Balanced</option>
                      <option value="premium">Premium / High Protein</option>
                    </select>
                  </div>
                  <button type="submit" className="col-span-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] text-lg">
                    Save Profile & Calculate
                  </button>
                </form>
              </div>
            ) : !mealPlan ? (
              <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] text-center max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Profile Locked In</h3>
                <p className="text-slate-500 mb-8 font-medium">Ready to build your <span className="text-slate-800 font-bold capitalize">{profile.budget_level}</span> plan based on your {profile.weight_kg}kg bodyweight.</p>
        
                <button 
                  onClick={handleGenerateNutrition} 
                  disabled={generatingNutrition}
                  className="w-full bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center space-x-2"
                >
                  {generatingNutrition ? (
                    <span className="animate-pulse">AI is cooking...</span>
                  ) : (
                    <span>Generate AI Meal Plan</span>
                  )}
                </button>
                <button onClick={() => setProfile(null)} className="mt-6 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors uppercase tracking-wider">
                  Edit Stats
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 p-2 rounded-lg"><Scale className="w-5 h-5 text-slate-600"/></div>
                    <p className="text-slate-600 font-medium">Plan for <strong className="text-slate-900">{profile.weight_kg}kg</strong> <span className="text-slate-300 mx-2">|</span> <span className="capitalize font-bold text-slate-900">{profile.budget_level}</span> tier</p>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => setProfile(null)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border border-slate-200">
                      Edit Profile
                    </button>
                    <button onClick={handleGenerateNutrition} disabled={generatingNutrition} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-colors border border-blue-100">
                      {generatingNutrition ? "Generating..." : "Regenerate"}
                    </button>
                  </div>
                </div>

                {/* Macro Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><Dumbbell className="w-16 h-16 text-emerald-900"/></div>
                     <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2 z-10">Calories</p>
                     <p className="text-3xl lg:text-4xl font-black text-emerald-900 z-10">{mealPlan.daily_calories}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col items-center text-center shadow-sm">
                     <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Protein</p>
                     <p className="text-3xl lg:text-4xl font-black text-blue-900">{mealPlan.protein_grams}g</p>
                  </div>
                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex flex-col items-center text-center shadow-sm">
                     <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Carbs</p>
                     <p className="text-3xl lg:text-4xl font-black text-amber-900">{mealPlan.carbs_grams}g</p>
                  </div>
                  <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex flex-col items-center text-center shadow-sm">
                     <p className="text-xs font-black text-rose-700 uppercase tracking-widest mb-2">Fats</p>
                     <p className="text-3xl lg:text-4xl font-black text-rose-900">{mealPlan.fat_grams}g</p>
                  </div>
                </div>

                {/* Meal Cards */}
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center"><Calendar className="w-6 h-6 mr-3 text-blue-500"/> Your Daily Menu</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {mealPlan.meals?.map((meal: any, i: number) => (
                      <div key={i} className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
                        <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">{meal.time}</p>
                            <h4 className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{meal.name}</h4>
                          </div>
                        </div>
                        <div className="p-5 flex-1 bg-white">
                          <ul className="space-y-3">
                            {meal.suggestions?.map((s:any, j:any) => (
                              <li key={j} className="flex items-start text-slate-700 font-medium text-sm">
                                <span className="mr-3 text-blue-500 font-black mt-0.5">•</span>
                                <span className="leading-relaxed">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROGRESS TAB */}
        {activeTab === 'progress' && (
          <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Input Column */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 h-fit sticky top-24">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-50 p-2 rounded-xl"><Scale className="w-6 h-6 text-blue-600"/></div>
                <h3 className="text-xl font-black text-slate-900">Log Weight</h3>
              </div>
              
              <form onSubmit={handleAddProgress} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Bodyweight (kg)</label>
                   <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="0.0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors font-semibold" required />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1">Notes (Optional)</label>
                   <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="How do you feel today?" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors min-h-[100px] resize-none font-medium text-sm" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
                  Save Entry
                </button>
              </form>
            </div>
            
            {/* History Column */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Tracking History</h3>
              
              <div className="space-y-3">
                {progressEntries?.map((entry) => (
                  <div key={entry.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-blue-100 transition-colors">
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-slate-500 mb-1">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      {entry.notes && <p className="text-slate-600 text-sm font-medium bg-slate-50 inline-block px-3 py-1.5 rounded-lg border border-slate-100">{entry.notes}</p>}
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <p className="text-2xl font-black text-slate-900">{entry.weight} <span className="text-sm text-slate-400 font-bold tracking-widest">KG</span></p>
                      <button 
                        onClick={() => initiateDelete(entry.id)} 
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!progressEntries || progressEntries.length === 0) && (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
                    <h4 className="text-lg font-black text-slate-700 mb-1">No data yet</h4>
                    <p className="text-slate-500 font-medium text-sm">Log your first weight entry to start tracking.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI TRAINER TAB */}
        {activeTab === 'chat' && (
           <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] flex flex-col h-[700px] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
             
             {/* Chat Header */}
             <div className="p-5 bg-white border-b border-slate-100 flex items-center space-x-3 z-10">
                <div className="bg-blue-100 p-2.5 rounded-full"><MessageCircle className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <h3 className="font-black text-slate-900">AI Personal Trainer</h3>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center"><span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span> Online</p>
                </div>
             </div>

             {/* Chat History */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
               {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                    <Dumbbell className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-slate-600 font-bold">Ask me about form, routines, or nutrition!</p>
                 </div>
               )}

               {messages.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] sm:max-w-[75%] p-5 text-[15px] font-medium leading-relaxed shadow-sm ${
                     msg.role === 'user' 
                       ? 'bg-blue-600 text-white rounded-3xl rounded-br-sm' 
                       : 'bg-white border border-slate-100 rounded-3xl rounded-bl-sm text-slate-700'
                   }`}>
                     {msg.role === 'user' ? (
                       msg.content
                     ) : (
                       <ReactMarkdown 
                         components={{
                           strong: ({node, ...props}) => <strong className="font-black text-slate-900" {...props} />,
                           p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                           ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 space-y-2 marker:text-blue-500" {...props} />,
                           ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4 space-y-2 marker:text-blue-500 font-bold" {...props} />,
                           li: ({node, ...props}) => <li className="text-slate-700 font-medium" {...props} />
                         }}
                       >
                         {msg.content}
                       </ReactMarkdown>
                     )}
                   </div>
                 </div>
               ))}
               {isTyping && (
                 <div className="flex justify-start">
                   <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-bl-sm flex space-x-2 shadow-sm">
                     <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                     <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   </div>
                 </div>
               )}
             </div>

             {/* Input Area */}
             <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10">
               <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-full p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                 <input 
                   value={chatInput} 
                   onChange={(e) => setChatInput(e.target.value)} 
                   onKeyDown={(e) => e.key === 'Enter' && handleChat()} 
                   placeholder="Type your fitness question..." 
                   className="flex-1 px-5 py-3 bg-transparent text-sm outline-none font-medium placeholder:text-slate-400" 
                 />
                 <button onClick={handleChat} disabled={!chatInput.trim() || isTyping} className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 transition-colors text-white rounded-full flex items-center justify-center active:scale-95">
                   <Send className="w-5 h-5 ml-0.5"/>
                 </button>
               </div>
             </div>
           </div>
        )}
      </main>

      {/* MODALS */}
      {showGenerateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
              <div className="flex justify-center mb-6">
                 <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl"><Dumbbell className="w-8 h-8"/></div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-6 text-center">Plan Your Routine</h3>
      
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Fitness Goal</label>
                  <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-semibold transition-all">
                    <option>Lose weight & Get Lean</option>
                    <option>Build Muscle (Hypertrophy)</option>
                    <option>Max Strength & Power</option>
                    <option>Endurance & Stamina</option>
                    <option>Bodyweight Mastery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Experience Level</label>
                  <select value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-semibold transition-all">
                    <option value="beginner">Beginner (0-6 months)</option>
                    <option value="intermediate">Intermediate (1-2 years)</option>
                    <option value="advanced">Advanced (3+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Days Per Week</label>
                  <input type="number" min="1" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(parseInt(e.target.value) || 1)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-semibold transition-all"/>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button onClick={() => setShowGenerateModal(false)} className="flex-1 px-4 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleGenerateWorkout} disabled={generating} className="flex-1 px-4 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-xl shadow-slate-200">
                  {generating ? 'Creating...' : 'Generate Plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal 
          isOpen={deleteModalOpen}
          title="Delete Progress Entry?"
          message="Are you sure you want to delete this log? This action cannot be undone."
          onCancel={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete} 
        />

      {showSaveSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Profile Saved!</h3>
            <p className="text-slate-500 mb-8 font-medium">Your metrics are locked in. You can now generate your personalized meal plan.</p>
            <button onClick={() => setShowSaveSuccessModal(false)} className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl shadow-slate-200 transition-all active:scale-95">
              Awesome
            </button>
          </div>
        </div>
      )}
        
    </div>
  )
}