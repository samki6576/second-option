'use client'

import { Navigation } from '@/components/navigation'
import { TiltCard } from '@/components/tilt-card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Users, Zap } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl w-full text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Virtual Try-On</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 text-balance">
            See Before You Buy
          </h1>

          <p className="text-xl text-foreground/70 mb-12 max-w-2xl mx-auto text-balance">
            Experience AI-powered virtual try-on with real-time product visualization. Get instant feedback from our community through live voting.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/try-on">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Start Try-On <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/rooms">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                Join Voting Room <Users className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* 3D Tilt Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <TiltCard>
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-2xl p-8 backdrop-blur-sm hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Instant Results</h3>
                <p className="text-foreground/60">
                  See how products look on you in real-time with advanced AI processing
                </p>
              </div>
            </TiltCard>

            <TiltCard>
              <div className="bg-gradient-to-br from-secondary/20 to-accent/20 border border-secondary/30 rounded-2xl p-8 backdrop-blur-sm hover:border-secondary/50 transition-colors">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Community Voting</h3>
                <p className="text-foreground/60">
                  Get honest feedback from real people and see what others think
                </p>
              </div>
            </TiltCard>

            <TiltCard>
              <div className="bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-8 backdrop-blur-sm hover:border-accent/50 transition-colors">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Share Results</h3>
                <p className="text-foreground/60">
                  Celebrate with confetti and share your favorite looks with friends
                </p>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>
    </main>
  )
}
