'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Confetti } from '@/components/confetti'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Share2, Download, Home } from 'lucide-react'
import Link from 'next/link'

interface ResultData {
  winner: string
  winnerColor: string
  votes: number
  totalVotes: number
  percentage: number
  results: Array<{
    name: string
    votes: number
    percentage: number
  }>
}

export default function ResultsPage() {
  const [results] = useState<ResultData>({
    winner: 'Classic Red Lipstick',
    winnerColor: 'Red',
    votes: 32,
    totalVotes: 78,
    percentage: 41,
    results: [
      { name: 'Classic Red Lipstick', votes: 32, percentage: 41 },
      { name: 'Berry Bliss', votes: 28, percentage: 36 },
      { name: 'Nude Perfection', votes: 18, percentage: 23 },
    ],
  })

  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    // Auto-hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Confetti trigger={showConfetti} />
      <Navigation />

      <section className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-2xl w-full px-4">
          {/* Winner Card */}
          <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-accent/10 p-8 mb-12 text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-4 text-balance">
              {'🎉 Winner!'}
            </h1>

            <div className="mb-8">
              <div className="w-32 h-32 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-secondary/20 to-primary/20 border-2 border-secondary/30">
                <div
                  className="w-28 h-28 rounded-2xl"
                  style={{
                    backgroundColor: results.winnerColor === 'Red' ? '#dc2626' :
                      results.winnerColor === 'Berry' ? '#9333ea' :
                      results.winnerColor === 'Nude' ? '#d4a574' :
                      results.winnerColor === 'Medium' ? '#f4a460' :
                      results.winnerColor === 'Coral' ? '#ff6b6b' :
                      '#6b7280'
                  }}
                />
              </div>

              <h2 className="text-3xl font-bold text-foreground mb-2">
                {results.winner}
              </h2>
              <p className="text-lg text-secondary font-semibold">
                {results.votes} votes ({results.percentage}%)
              </p>
            </div>

            <div className="bg-background rounded-lg p-4 mb-8">
              <p className="text-foreground/60 text-sm mb-2">Final Results</p>
              <p className="text-2xl font-bold text-primary">
                {results.totalVotes} Total Votes
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1 gap-2">
                <Share2 className="w-4 h-4" />
                Share Result
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </Card>

          {/* Full Results */}
          <Card className="p-8 mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Vote Breakdown
            </h3>

            <div className="space-y-6">
              {results.results.map((result, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-foreground">
                      #{index + 1} {result.name}
                    </p>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {result.votes}
                      </p>
                      <p className="text-sm text-foreground/60">
                        {result.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-700"
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Statistics */}
          <Card className="border-accent/30 bg-accent/5 p-8 mb-12">
            <h3 className="text-xl font-bold text-foreground mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-4">
                <p className="text-foreground/60 text-sm mb-1">Engagement Rate</p>
                <p className="text-2xl font-bold text-primary">100%</p>
              </div>
              <div className="bg-background rounded-lg p-4">
                <p className="text-foreground/60 text-sm mb-1">Most Popular</p>
                <p className="text-2xl font-bold text-secondary">41%</p>
              </div>
              <div className="bg-background rounded-lg p-4">
                <p className="text-foreground/60 text-sm mb-1">Avg. Lead</p>
                <p className="text-2xl font-bold text-accent">5%</p>
              </div>
              <div className="bg-background rounded-lg p-4">
                <p className="text-foreground/60 text-sm mb-1">Duration</p>
                <p className="text-2xl font-bold text-primary">15m</p>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Ready for another try-on?
            </h3>
            <p className="text-foreground/60 mb-6">
              Create a new voting room and share your next virtual try-on with the community
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/try-on" className="flex-1">
                <Button size="lg" className="w-full">
                  Create New Try-On
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  )
}
