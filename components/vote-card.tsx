'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Heart, MessageCircle } from 'lucide-react'

export interface VoteCardProps {
  id: string
  productName: string
  productColor: string
  votes: number
  comments: number
  userHasVoted?: boolean
  onVote: (voteId: string) => void
}

export function VoteCard({
  id,
  productName,
  productColor,
  votes,
  comments,
  userHasVoted = false,
  onVote,
}: VoteCardProps) {
  const [isVoted, setIsVoted] = useState(userHasVoted)
  const [voteCount, setVoteCount] = useState(votes)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleVote = () => {
    if (isVoted) return

    setIsAnimating(true)
    setIsVoted(true)
    setVoteCount(prev => prev + 1)
    onVote(id)

    setTimeout(() => setIsAnimating(false), 600)
  }

  return (
    <Card className="border-border overflow-hidden hover:border-primary/50 transition-colors group">
      <div className="p-6 space-y-4">
        <div className="w-20 h-20 rounded-lg mx-auto flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
          <div
            className="w-16 h-16 rounded-lg"
            style={{
              backgroundColor: productColor === 'Red' ? '#dc2626' :
                productColor === 'Berry' ? '#9333ea' :
                productColor === 'Nude' ? '#d4a574' :
                productColor === 'Medium' ? '#f4a460' :
                productColor === 'Coral' ? '#ff6b6b' :
                '#6b7280'
            }}
          />
        </div>

        <div className="text-center">
          <h3 className="font-semibold text-foreground">{productName}</h3>
          <p className="text-sm text-foreground/60">{productColor}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{voteCount}</p>
            <p className="text-xs text-foreground/60">Votes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">{comments}</p>
            <p className="text-xs text-foreground/60">Comments</p>
          </div>
        </div>

        <Button
          onClick={handleVote}
          disabled={isVoted}
          variant={isVoted ? 'secondary' : 'default'}
          className="w-full gap-2 group relative"
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              isVoted ? 'fill-current' : ''
            } ${isAnimating ? 'scale-125' : 'scale-100'}`}
          />
          {isVoted ? 'Voted!' : 'Vote'}
        </Button>

        <p className="text-xs text-foreground/50 text-center">
          {isVoted ? 'Thanks for voting!' : 'Help choose the best look'}
        </p>
      </div>
    </Card>
  )
}
