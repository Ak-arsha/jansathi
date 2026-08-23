import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Bot, FileText, Search, Sparkles, 
  Landmark, HeartPulse, LogOut, ExternalLink, 
  Check, Clock, X, ChevronRight, Calculator, Bookmark, CheckCircle, CheckCircle2, RefreshCw, Send, Globe,
  ShieldAlert, CreditCard, UserCheck, Scale, FileCheck, Mic, MicOff, VolumeX
} from "lucide-react"
import { Link } from "react-router"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/providers/trpc"

export default function Home() {
  const { user, logout } = useAuth()
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScheme, setSelectedScheme] = useState<any>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatLang, setChatLang] = useState<'en' | 'hi'>('en')
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; executionChain?: any[] }>>([
    { 
      sender: 'bot', 
      text: 'Namaste! I am JanSathi Agentic AI, powered by multi-agent reasoning, speech translation, and BeautifulSoup4 web scraping. How can I assist you today?' 
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)

  // Grievance Draft Form State
  const [grievanceForm, setGrievanceForm] = useState({
    department: 'Food & Civil Supplies',
    subject: 'Delay in Ration Card Issue',
    description: 'Applied for BPL Ration Card 45 days ago (Ref #RC-8921). No action taken by Food Supply Inspector.',
    state: 'Uttar Pradesh'
  })
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null)

  // Document Vault Search State
  const [docVaultSearch, setDocVaultSearch] = useState('')

  // Eligibility Checker Form State
  const [eligibilityForm, setEligibilityForm] = useState({
    age: 30,
    gender: 'male',
    state: 'Uttar Pradesh',
    occupation: 'farmer',
    annualIncome: 150000,
    socialCategory: 'General',
    ownsLand: true,
    hasDisability: false
  })
  const [matchedSchemesResult, setMatchedSchemesResult] = useState<any[] | null>(null)
  const [isMatching, setIsMatching] = useState(false)

  // API Queries & Mutations
  const { data: schemesList = [], isLoading: isSchemesLoading, refetch: refetchSchemes } = trpc.schemes.list.useQuery({
    search: searchQuery,
    category: selectedCategory === 'all' ? undefined : selectedCategory
  })

  const { data: categories = [] } = trpc.schemes.categories.useQuery()
  const { data: schemeStats } = trpc.schemes.stats.useQuery()
  const { data: trackedApps = [], refetch: refetchApps } = trpc.applications.list.useQuery(undefined, { enabled: !!user })

  const chatMutation = trpc.assistant.chat.useMutation({
    onSuccess: (data) => {
      setChatError(null)
      setChatMessages((prev) => [...prev, { sender: 'bot', text: data.reply, executionChain: (data as any).executionChain }])
      speakText(data.reply)
    },
    onError: (error) => {
      setChatError(error.message)
      setChatMessages((prev) => [...prev, { sender: 'bot', text: "I'm having trouble connecting right now. Please try again." }])
    }
  })

  const matchMutation = trpc.schemes.match.useMutation({
    onSuccess: (data) => {
      setEligibilityError(null)
      setMatchedSchemesResult(data.filter((result: any) => result.verdict !== 'not_eligible'))
      setIsMatching(false)
    },
    onError: (error) => {
      setEligibilityError(error.message)
      setIsMatching(false)
    }
  })

  const trackMutation = trpc.applications.track.useMutation({
    onSuccess: () => {
      refetchApps()
    }
  })

  const removeTrackMutation = trpc.applications.remove.useMutation({
    onSuccess: () => {
      refetchApps()
    }
  })

  // Speech Translation & Controls
  const startSpeechToText = () => {
    if (isListening) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is supported in Chrome, Edge, and Safari. Please type or switch browsers.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = chatLang === 'hi' ? 'hi-IN' : 'en-US'
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      setChatError('Voice input stopped. Please try again or type your message.')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
      handleSendMessage(transcript)
    }

    recognition.start()
  }

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[*#`_]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = chatLang === 'hi' ? 'hi-IN' : 'en-US'

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Document Vault Static Knowledge Base
  const docVaultData = [
    {
      id: 'aadhaar',
      title: 'Aadhaar Card Enrolment / Correction',
      category: 'Identity',
      icon: UserCheck,
      docs: ['Proof of Identity (PAN / Passport / Voter ID)', 'Proof of Address (Electricity bill / Rent agreement)', 'Date of Birth Certificate / 10th Marksheet'],
      portal: 'https://uidai.gov.in'
    },
    {
      id: 'pan',
      title: 'PAN Card (Permanent Account Number)',
      category: 'Financial',
      icon: CreditCard,
      docs: ['Aadhaar Card (Instant e-PAN via OTP)', 'Passport Size Photographs', 'Proof of Address'],
      portal: 'https://onlineservices.tin.nsdl.com'
    },
    {
      id: 'ration',
      title: 'Ration Card (NFSA / BPL / AAY)',
      category: 'Welfare',
      icon: FileText,
      docs: ['Aadhaar of all family members', 'Income Certificate from Tehsildar', 'Electricity/Rent Bill', 'Family Passport Photo'],
      portal: 'https://nfsa.gov.in'
    },
    {
      id: 'ayushman',
      title: 'Ayushman Bharat Health Card (PM-JAY)',
      category: 'Health',
      icon: HeartPulse,
      docs: ['Aadhaar Card', 'Ration Card / SECC 2011 Name inclusion', 'Active Mobile Number'],
      portal: 'https://pmjay.gov.in'
    },
    {
      id: 'caste_income',
      title: 'Income & Caste / Domicile Certificate',
      category: 'Civic',
      icon: FileCheck,
      docs: ['Aadhaar Card', 'Ration Card', 'Self-Declaration Affidavit', 'Land / Salary Slips'],
      portal: 'https://edistrict.up.gov.in'
    },
    {
      id: 'passport',
      title: 'Indian Passport (Normal / Tatkaal)',
      category: 'Travel',
      icon: Landmark,
      docs: ['Aadhaar Card', 'PAN Card', 'Birth Certificate / 10th Certificate', 'Bank Passbook'],
      portal: 'https://passportindia.gov.in'
    }
  ]

  const filteredDocVault = docVaultData.filter(d => 
    d.title.toLowerCase().includes(docVaultSearch.toLowerCase()) || 
    d.category.toLowerCase().includes(docVaultSearch.toLowerCase()) ||
    d.docs.some(doc => doc.toLowerCase().includes(docVaultSearch.toLowerCase()))
  )

  // Handlers
  const handleSendMessage = (textToSend?: string) => {
    const msg = textToSend || inputMessage
    if (!msg.trim()) return

    setChatMessages((prev) => [...prev, { sender: 'user', text: msg }])
    if (!textToSend) setInputMessage('')

    chatMutation.mutate({ message: msg, lang: chatLang, useAgenticAI: true })
  }

  const handleRunEligibilityCheck = () => {
    setEligibilityError(null)
    setMatchedSchemesResult(null)
    setIsMatching(true)
    matchMutation.mutate({
      profile: {
        age: eligibilityForm.age,
        gender: eligibilityForm.gender,
        state: eligibilityForm.state,
        occupation: eligibilityForm.occupation,
        annualIncome: eligibilityForm.annualIncome,
        socialCategory: eligibilityForm.socialCategory,
        ownsLand: eligibilityForm.ownsLand,
        hasDisability: eligibilityForm.hasDisability
      }
    })
  }

  const handleGenerateGrievanceDraft = () => {
    const draft = `To,
The Nodal Grievance Officer,
Department of ${grievanceForm.department},
Government of ${grievanceForm.state}.

Subject: Public Grievance regarding ${grievanceForm.subject}

Respected Sir/Madam,

I am writing to formally lodge a public grievance regarding the delay in service delivery.
Details of issue:
${grievanceForm.description}

As per Citizen Charter guidelines, this public service should be rendered within the stipulated timeframe. I request your immediate intervention to resolve this issue and expedite the process.

Yours faithfully,
[Your Name / Citizen]
Contact / Aadhaar Ref: [Your Ref Number]
Lodged via JanSathi Agentic AI Public Grievance Helper (CPGRAMS / State Portal)`

    setGeneratedDraft(draft)
  }

  const isSchemeTracked = (schemeId: number) => {
    return trackedApps.some((app: any) => app.scheme.id === schemeId)
  }

  const handleToggleTrackScheme = (schemeSlug: string, schemeId: number) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    const trackedItem = trackedApps.find((app: any) => app.scheme.id === schemeId)
    if (trackedItem) {
      removeTrackMutation.mutate({ id: trackedItem.application.id })
    } else {
      trackMutation.mutate({ schemeSlug })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  JanSathi
                </span>
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[10px] font-semibold">
                    Public service guide
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#schemes" className="hover:text-indigo-600 transition">Schemes</a>
            <a href="#eligibility" className="hover:text-indigo-600 transition">Eligibility</a>
            <a href="#doc-vault" className="hover:text-indigo-600 transition">Doc Vault</a>
            <a href="#grievance" className="hover:text-indigo-600 transition">Grievance Helper</a>
            {user && (
              <a href="#my-schemes" className="hover:text-indigo-600 transition flex items-center">
                <Bookmark className="w-3.5 h-3.5 mr-1 text-amber-500" /> My Schemes ({trackedApps.length})
              </a>
            )}
          </nav>

          {/* Controls: User Auth */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Avatar className="w-9 h-9 border border-indigo-200 dark:border-indigo-800 shadow-sm">
                  <AvatarImage src={user.avatar || ""} />
                  <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-blue-500 text-white font-bold">
                    {user.name?.slice(0, 2).toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-500">@{user.unionId}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-slate-500 hover:text-rose-600">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-700">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/20">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> Find a scheme. Know your documents. Take the next step.
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
            Find the support meant <br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              for your life right now
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            JanSathi turns a long government search into a short, practical answer: a relevant scheme, an honest eligibility signal, the documents to prepare, and the official place to apply.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center shadow-xl shadow-indigo-500/10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2">
              <Search className="w-5 h-5 text-indigo-500 ml-3 mr-2" />
              <input
                type="text"
                placeholder="Search schemes e.g. PM Kisan, Ayushman Bharat, Aadhaar, CPGRAMS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-0 text-sm sm:text-base placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 mr-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
              <a href="#schemes" className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition flex items-center">
                Search
              </a>
            </div>
            
            {/* Quick Tag Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
              <span className="text-slate-400 font-medium">Popular Searches:</span>
              {['PM-Kisan', 'Ayushman Bharat', 'Aadhaar', 'Ration Card', 'CPGRAMS'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 mb-8">
            <a href="#eligibility" className="bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-indigo-700 transition">Check my eligibility <ChevronRight className="inline w-4 h-4 ml-1" /></a>
            <a href="#schemes" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl px-5 py-3 text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition">Browse all schemes</a>
          </div>

          {/* Useful platform signals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{schemeStats?.totalSchemes ?? '—'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">curated schemes</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{schemeStats?.categories ?? '—'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">areas of support</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
              <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">2</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">languages supported</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">official links</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Scheme Explorer Section */}
      <section id="schemes" className="py-16 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <Badge className="mb-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Knowledge Base
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">Explore Welfare Schemes</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Filter by category or search for specific benefits and grants.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                All Schemes
              </button>
              {categories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Scheme Cards Grid */}
          {isSchemesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
              ))}
            </div>
          ) : schemesList.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">No schemes found</h3>
              <p className="text-xs text-slate-500 mt-1">Try searching for another keyword or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemesList.map((scheme: any) => {
                const tracked = isSchemeTracked(scheme.id)
                return (
                  <Card key={scheme.id} className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300">
                          {scheme.category}
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] uppercase">
                          {scheme.level}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold leading-snug line-clamp-2">{scheme.name}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-1">{scheme.ministry}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-4 text-xs text-slate-600 dark:text-slate-400 space-y-3">
                      <p className="line-clamp-3 leading-relaxed">{scheme.summary}</p>
                      
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Key Benefit: </span>
                        <span>{scheme.benefits}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedScheme(scheme)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold p-0 hover:bg-transparent"
                      >
                        View Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>

                      <Button
                        size="sm"
                        variant={tracked ? "outline" : "default"}
                        onClick={() => handleToggleTrackScheme(scheme.slug, scheme.id)}
                        className={`text-xs ${tracked ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      >
                        {tracked ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" /> Saved
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 mr-1" /> Track
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Interactive Eligibility Checker Section */}
      <section id="eligibility" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-3">
              <Calculator className="w-3.5 h-3.5 text-amber-500" /> Instant Match Engine
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Check Your Scheme Eligibility</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Enter your basic details below to find all government welfare schemes you qualify for.
            </p>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 sm:p-8">
              <CardTitle className="text-xl sm:text-2xl font-bold flex items-center">
                <Sparkles className="w-6 h-6 mr-2" /> Citizen Eligibility Evaluator
              </CardTitle>
              <CardDescription className="text-indigo-100 text-xs sm:text-sm">
                Evaluated in real-time by the JanSathi Eligibility Reasoning Engine
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label className="text-xs font-semibold">Age (Years)</Label>
                  <Input
                    type="number"
                    value={eligibilityForm.age}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, age: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Gender</Label>
                  <select
                    value={eligibilityForm.gender}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, gender: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">State / Union Territory</Label>
                  <Input
                    type="text"
                    value={eligibilityForm.state}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, state: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Occupation</Label>
                  <select
                    value={eligibilityForm.occupation}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, occupation: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="farmer">Farmer / Agriculturalist</option>
                    <option value="student">Student</option>
                    <option value="vendor">Street Vendor / Small Business</option>
                    <option value="worker">Unorganized Worker</option>
                    <option value="salaried">Salaried / Employed</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Annual Family Income (₹)</Label>
                  <Input
                    type="number"
                    value={eligibilityForm.annualIncome}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, annualIncome: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Social Category</Label>
                  <select
                    value={eligibilityForm.socialCategory}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, socialCategory: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eligibilityForm.ownsLand}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, ownsLand: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Owns Agricultural Land</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eligibilityForm.hasDisability}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, hasDisability: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Person with Disability (Divyangjan)</span>
                </label>
              </div>

              <Button
                onClick={handleRunEligibilityCheck}
                disabled={isMatching}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-indigo-500/25"
              >
                {isMatching ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Evaluating Rules...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" /> Check Eligible Schemes
                  </>
                )}
              </Button>

              {/* Eligibility Results List */}
              {matchedSchemesResult && (
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Potential Matches ({matchedSchemesResult.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchedSchemesResult.map((res: any) => (
                      <div key={res.scheme.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Badge className={`${res.verdict === 'eligible' ? 'bg-emerald-500' : 'bg-amber-500'} text-white text-[10px] font-bold`}>
                              {res.verdict === 'eligible' ? 'Likely eligible' : 'Review eligibility'}
                            </Badge>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{res.scheme.category}</span>
                          </div>
                          <h4 className="font-bold text-sm leading-snug">{res.scheme.name}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{res.scheme.summary}</p>
                          {res.reasons?.[0] && <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2">{res.reasons[0]}</p>}
                          {res.unknowns?.length > 0 && <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Needs confirmation: {res.unknowns.join(', ')}</p>}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedScheme(res.scheme)}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            View Checklist
                          </button>
                          <Button
                            size="sm"
                            onClick={() => handleToggleTrackScheme(res.scheme.slug, res.scheme.id)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Track Scheme
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {matchedSchemesResult.length === 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                      No schemes matched every detail you entered. Try checking your income, occupation, or land status, then run the check again. You can also browse all schemes for options with different rules.
                    </div>
                  )}
                </div>
              )}
              {eligibilityError && (
                <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">{eligibilityError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: Document Requirements Vault Section */}
      <section id="doc-vault" className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <Badge className="mb-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Civic Vault
              </Badge>
                <h2 className="text-3xl font-bold tracking-tight">Get Your Documents Ready</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Use this checklist after finding a scheme or service. Every guide points to the official portal where you finish the application.
              </p>
            </div>

            <div className="w-full md:w-72">
              <Input
                type="text"
                placeholder="Search document guide..."
                value={docVaultSearch}
                onChange={(e) => setDocVaultSearch(e.target.value)}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocVault.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No document guide matches “{docVaultSearch}”. Try Aadhaar, PAN, ration card, or passport.
              </div>
            ) : filteredDocVault.map((item) => {
              const IconComp = item.icon
              return (
                <Card key={item.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-base font-bold leading-snug">{item.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Required Checklist:</div>
                    <ul className="space-y-1.5">
                      {item.docs.map((d, idx) => (
                        <li key={idx} className="flex items-start text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={item.portal}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                    >
                      Official Government Portal <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: Public Grievance Helper Section (CPGRAMS) */}
      <section id="grievance" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Citizen Rights Portal
            </div>
            <h2 className="text-3xl font-bold tracking-tight">CPGRAMS Public Grievance Helper</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Facing administrative delay, non-issuance of benefits, or officer inaction? Generate a formal complaint draft for CPGRAMS & State Grievance Portals.
            </p>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-rose-600 to-amber-600 text-white p-6 sm:p-8">
              <CardTitle className="text-xl sm:text-2xl font-bold flex items-center">
                <Scale className="w-6 h-6 mr-2" /> Public Grievance Draft Generator
              </CardTitle>
              <CardDescription className="text-rose-100 text-xs sm:text-sm">
                Complies with Central Public Grievance Redress and Monitoring System (CPGRAMS) guidelines
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-semibold">Target Department / Ministry</Label>
                  <select
                    value={grievanceForm.department}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, department: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Food & Civil Supplies">Food & Civil Supplies (Ration Card)</option>
                    <option value="Agriculture & Farmers Welfare">Agriculture & Farmers Welfare (PM-Kisan)</option>
                    <option value="Health & Family Welfare">Health & Family Welfare (Ayushman Card)</option>
                    <option value="Revenue & Land Records">Revenue & Land Records (Tehsildar / Income cert)</option>
                    <option value="Municipal Administration">Municipal Administration (Civic / Tax)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">State / Union Territory</Label>
                  <Input
                    type="text"
                    value={grievanceForm.state}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, state: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Grievance Subject</Label>
                <Input
                  type="text"
                  value={grievanceForm.subject}
                  onChange={(e) => setGrievanceForm({ ...grievanceForm, subject: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Description of Delay or Problem</Label>
                <textarea
                  rows={4}
                  value={grievanceForm.description}
                  onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <Button
                onClick={handleGenerateGrievanceDraft}
                className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-rose-500/20"
              >
                Generate Formal CPGRAMS Draft
              </Button>

              {generatedDraft && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Generated Official Letter Draft:</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedDraft)}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {generatedDraft}
                  </pre>
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-slate-500">Submit on official CPGRAMS portal:</span>
                    <a
                      href="https://pgportal.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center"
                    >
                      Open pgportal.gov.in <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 5: User Tracked Applications Dashboard */}
      {user && (
        <section id="my-schemes" className="py-16 bg-slate-100/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Badge className="mb-2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Personal Dashboard
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">My Saved & Tracked Schemes</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Track status, required document checklists, and application progress in one place.
              </p>
            </div>

            {trackedApps.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-semibold">No tracked schemes yet</h3>
                <p className="text-xs text-slate-500 mt-1">Click "Track" on any scheme card above to save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trackedApps.map((item: any) => (
                  <Card key={item.application.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-indigo-600 text-white text-[10px] uppercase">
                          {item.application.status}
                        </Badge>
                        <button
                          onClick={() => removeTrackMutation.mutate({ id: item.application.id })}
                          className="text-slate-400 hover:text-rose-500 text-xs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <CardTitle className="text-base font-bold leading-snug mt-2">{item.scheme.name}</CardTitle>
                      <CardDescription className="text-xs">{item.scheme.ministry}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Site:</div>
                        <a
                          href={item.scheme.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center truncate"
                        >
                          {item.scheme.officialUrl} <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                        </a>
                      </div>
                    </CardContent>

                    <CardFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedScheme(item.scheme)}
                        className="w-full text-xs"
                      >
                        View Full Checklist & Steps
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Scheme Detail Dialog Modal */}
      {selectedScheme && (
        <Dialog open={!!selectedScheme} onOpenChange={() => setSelectedScheme(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
            <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                  {selectedScheme.category}
                </Badge>
                <Badge className="bg-emerald-600 text-white uppercase text-[10px]">
                  {selectedScheme.level}
                </Badge>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight">
                {selectedScheme.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                {selectedScheme.ministry}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {/* Summary */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Scheme Overview</h4>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">{selectedScheme.summary}</p>
              </div>

              {/* Benefits */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Key Financial & Welfare Benefits</h4>
                <p className="leading-relaxed text-indigo-800 dark:text-indigo-300">{selectedScheme.benefits}</p>
              </div>

              {/* Required Documents */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-emerald-500" /> Required Documents Checklist
                </h4>
                <ul className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  {(typeof selectedScheme.documents === 'string' ? JSON.parse(selectedScheme.documents) : selectedScheme.documents).map((doc: string, idx: number) => (
                    <li key={idx} className="flex items-center text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Application Steps */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-indigo-500" /> Application Process Timeline
                </h4>
                <ol className="space-y-2.5">
                  {(typeof selectedScheme.steps === 'string' ? JSON.parse(selectedScheme.steps) : selectedScheme.steps).map((step: string, idx: number) => (
                    <li key={idx} className="flex items-start bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Official Link & Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <a
                  href={selectedScheme.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Official Portal <ExternalLink className="w-4 h-4 ml-1" />
                </a>

                <Button
                  onClick={() => {
                    handleToggleTrackScheme(selectedScheme.slug, selectedScheme.id)
                    setSelectedScheme(null)
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSchemeTracked(selectedScheme.id) ? 'Remove Tracking' : 'Track Scheme'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating Agentic AI & Speech Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-300 group border-2 border-white/20"
          >
            <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>
          </button>
        ) : (
          <div className="w-[90vw] sm:w-[420px] h-[560px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none flex items-center">
                    JanSathi Agentic AI <Sparkles className="w-3.5 h-3.5 ml-1 text-amber-300" />
                  </h3>
                  <span className="text-[10px] text-indigo-100">Scheme, document, and application guidance</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setChatLang(chatLang === 'en' ? 'hi' : 'en')}
                  className="text-[10px] font-bold px-2 py-1 rounded bg-white/20 hover:bg-white/30 uppercase flex items-center"
                >
                  <Globe className="w-3 h-3 mr-1" /> {chatLang}
                </button>
                <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/20 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {chatError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700" role="alert">
                  {chatError}
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700 whitespace-pre-wrap'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Agentic Step Chain Visualization */}
                  {msg.executionChain && msg.executionChain.length > 0 && (
                    <div className="ml-2 pl-3 border-l-2 border-indigo-400 space-y-1 my-1">
                      {msg.executionChain.map((step: any, sIdx: number) => (
                        <div key={sIdx} className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">[{step.agentName}]</span> {step.action}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none text-slate-500 animate-pulse flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                    <span>Checking the scheme guide...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Speech Translation Controls */}
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={startSpeechToText}
                  className="h-7 text-[10px] px-2.5"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3 h-3 mr-1 animate-pulse" /> Listening...
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3 mr-1 text-indigo-600" /> Speech Input
                    </>
                  )}
                </Button>

                {isSpeaking && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={stopSpeaking}
                    className="h-7 text-[10px] text-rose-500 hover:text-rose-600 px-2"
                  >
                    <VolumeX className="w-3 h-3 mr-1" /> Stop Voice
                  </Button>
                )}
              </div>

              <button
                onClick={() => handleSendMessage("Check my scheme eligibility")}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Auto Eligibility Match
              </button>
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Speak or type (e.g. PM Kisan, Ration Card docs...)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">JanSathi Agentic AI Public Services & Civic Portal</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 dark:text-slate-400">
            <a href="#schemes" className="hover:underline">Schemes</a>
            <a href="#eligibility" className="hover:underline">Eligibility</a>
            <a href="#doc-vault" className="hover:underline">Doc Vault</a>
            <a href="#grievance" className="hover:underline">CPGRAMS Helper</a>
            <a href="https://pgportal.gov.in" target="_blank" rel="noreferrer" className="hover:underline">CPGRAMS Official</a>
          </div>

          <p>© 2026 JanSathi Portal. Powered by BeautifulSoup4, Google Speech Translation & Agentic AI.</p>
        </div>
      </footer>
    </div>
  )
}
