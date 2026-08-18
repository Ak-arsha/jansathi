import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, FileText, Search, ArrowRight, Sparkles, Landmark, Building2, HeartPulse, GraduationCap, LogOut, UserCheck } from "lucide-react"
import { Link } from "react-router"
import { useAuth } from "@/hooks/useAuth"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const { user, logout } = useAuth()

  const services = [
    {
      title: "Scheme Eligibility Check",
      desc: "Instantly check eligible government welfare schemes for you and your family.",
      icon: Search,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    {
      title: "Document Assistant",
      desc: "Get step-by-step guidance on required documents, application procedures, and forms.",
      icon: FileText,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "AI Grievance Helper",
      desc: "Draft and submit public grievances directly to concerned administrative departments.",
      icon: Bot,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
    },
    {
      title: "Public Health & Insurance",
      desc: "Explore healthcare schemes, Ayushman card status, and medical benefit applications.",
      icon: HeartPulse,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    },
    {
      title: "Education & Scholarships",
      desc: "Find student scholarships, skill development programs, and education loan guidance.",
      icon: GraduationCap,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    {
      title: "Civic & Local Governance",
      desc: "Property tax assistance, municipal certificates, birth/death registration guides.",
      icon: Building2,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                JanSathi
              </span>
              <Badge variant="outline" className="ml-2 border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300">
                AI Portal
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Avatar className="w-9 h-9 border border-indigo-200">
                  <AvatarImage src={user.avatar || ""} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">{user.name?.slice(0, 2).toUpperCase() || "US"}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-500">@{user.unionId}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-slate-500 hover:text-rose-600">
                  <LogOut className="w-4 h-4 mr-1" /> Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Empowering Citizens with Next-Gen Government AI
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Your Trusted AI Guide for <br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Public Services & Welfare Schemes
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Discover government schemes, verify required documents, track welfare applications, and interact seamlessly with municipal services in your language.
          </p>

          {/* Quick Search Input */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative flex items-center shadow-lg shadow-indigo-500/5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
              <Search className="w-5 h-5 text-slate-400 ml-3 mr-2" />
              <input
                type="text"
                placeholder="Search schemes e.g. 'Scholarship for college', 'Ayushman card', 'PM Kisan'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-0 text-sm sm:text-base placeholder-slate-400"
              />
              <Link to="/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5">
                  Search
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">100+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Central & State Schemes</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Instant</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Eligibility Check</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">24/7</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">AI Citizen Assistance</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Secure & Confidential</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40">
              Features & Services
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">Everything You Need for Government Services</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              Simplified access to citizen services, AI guidance, and automated assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item, idx) => {
              const Icon = item.icon
              return (
                <Card key={idx} className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {item.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">JanSathi Public Services Portal</span>
          </div>
          <p>© 2026 JanSathi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

