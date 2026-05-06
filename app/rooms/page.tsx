'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowRight, Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface Room {
  id: string
  code: string
  votes: number
  viewers: number
  createdAt: string
}

export default function RoomsPage() {
  const [searchCode, setSearchCode] = useState('')
  const [rooms] = useState<Room[]>([
    {
      id: '1',
      code: 'ABC123',
      votes: 56,
      viewers: 12,
      createdAt: '2 minutes ago',
    },
    {
      id: '2',
      code: 'XYZ789',
      votes: 34,
      viewers: 8,
      createdAt: '15 minutes ago',
    },
    {
      id: '3',
      code: 'DEF456',
      votes: 92,
      viewers: 23,
      createdAt: '45 minutes ago',
    },
    {
      id: '4',
      code: 'GHI012',
      votes: 18,
      viewers: 4,
      createdAt: '1 hour ago',
    },
  ])

  const filteredRooms = rooms.filter(room =>
    room.code.toLowerCase().includes(searchCode.toLowerCase())
  )

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <section className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
              Voting Rooms
            </h1>
            <p className="text-foreground/70">
              Join an active voting room or create your own
            </p>
          </div>

          {/* Create New Room */}
          <Card className="border-primary/30 bg-primary/5 p-6 mb-12">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Create New Voting Room
                </h3>
                <p className="text-sm text-foreground/70">
                  Share your virtual try-on and get instant feedback from the community
                </p>
              </div>
              <Link href="/try-on">
                <Button size="lg" className="gap-2 whitespace-nowrap">
                  <Plus className="w-4 h-4" />
                  Create Room
                </Button>
              </Link>
            </div>
          </Card>

          {/* Search Rooms */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
              <Input
                placeholder="Search room code..."
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Room List */}
          <div className="space-y-4">
            {filteredRooms.length > 0 ? (
              filteredRooms.map(room => (
                <Card
                  key={room.id}
                  className="p-6 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 bg-primary/20 rounded-lg">
                          <p className="font-mono font-bold text-primary text-lg">
                            {room.code}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60">
                        Created {room.createdAt}
                      </p>
                    </div>

                    <div className="flex gap-6 sm:gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {room.votes}
                        </p>
                        <p className="text-xs text-foreground/60">Votes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-secondary">
                          {room.viewers}
                        </p>
                        <p className="text-xs text-foreground/60">Viewers</p>
                      </div>
                    </div>

                    <Link href={`/rooms/${room.code}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 group-hover:border-primary"
                      >
                        Join <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-foreground/60 mb-4">
                  No voting rooms found with code "{searchCode}"
                </p>
                <Link href="/try-on">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Room
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
