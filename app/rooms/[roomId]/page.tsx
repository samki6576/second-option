'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { VoteCard } from '@/components/vote-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Copy, Share2, Users } from 'lucide-react'

interface RoomPageProps {
  params: {
    roomId: string
  }
}

interface VoteOption {
  id: string
  productName: string
  productColor: string
  votes: number
  comments: number
}

export default function RoomPage({ params }: RoomPageProps) {
  const roomId = params.roomId
  const [userVote, setUserVote] = useState<string | null>(null)
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([
    {
      id: '1',
      productName: 'Classic Red Lipstick',
      productColor: 'Red',
      votes: 24,
      comments: 8,
    },
    {
      id: '2',
      productName: 'Berry Bliss',
      productColor: 'Berry',
      votes: 18,
      comments: 5,
    },
    {
      id: '3',
      productName: 'Nude Perfection',
      productColor: 'Nude',
      votes: 12,
      comments: 3,
    },
  ])
  const [copied, setCopied] = useState(false)

  const handleVote = (voteId: string) => {
    if (userVote === null) {
      setUserVote(voteId)
      setVoteOptions(prev =>
        prev.map(option =>
          option.id === voteId ? { ...option, votes: option.votes + 1 } : option
        )
      )
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalVotes = voteOptions.reduce((sum, option) => sum + option.votes, 0)

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <section className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
              Voting Room
            </h1>
            <p className="text-foreground/70">
              Help choose the best virtual try-on look
            </p>
          </div>

          {/* Room Info Card */}
          <Card className="border-primary/30 bg-primary/5 p-6 mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Room Code</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-background rounded-lg px-3 py-2 font-mono font-semibold text-primary text-lg">
                    {roomId}
                  </div>
                  <Button
                    onClick={copyRoomCode}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-foreground/70 mb-1">Total Votes</p>
                <p className="text-3xl font-bold text-secondary">{totalVotes}</p>
              </div>

              <div>
                <p className="text-sm text-foreground/70 mb-1">Your Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${userVote ? 'bg-accent' : 'bg-muted'}`} />
                  <p className="font-medium text-foreground">
                    {userVote ? 'Voted' : 'Not voted'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-primary/20">
              <Button className="gap-2 flex-1" disabled={!!userVote}>
                <Share2 className="w-4 h-4" />
                Share Room
              </Button>
              <Button variant="outline" className="gap-2 flex-1" disabled={!userVote}>
                <Users className="w-4 h-4" />
                View Results
              </Button>
            </div>
          </Card>

          {/* Voting Cards */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Vote for Your Favorite Look
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voteOptions.map(option => (
                <VoteCard
                  key={option.id}
                  {...option}
                  userHasVoted={userVote === option.id}
                  onVote={handleVote}
                />
              ))}
            </div>
          </div>

          {/* Results Summary */}
          {userVote && (
            <Card className="border-accent/30 bg-accent/5 p-6 mt-12">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Current Results
              </h3>
              <div className="space-y-4">
                {voteOptions
                  .sort((a, b) => b.votes - a.votes)
                  .map(option => {
                    const percentage = Math.round((option.votes / totalVotes) * 100)
                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-foreground">
                            {option.productName}
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {option.votes} votes ({percentage}%)
                          </p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </Card>
          )}
        </div>
      </section>
    </main>
  )
}
