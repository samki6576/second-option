import { NextRequest, NextResponse } from 'next/server'

interface Vote {
  roomId: string
  userId: string
  optionId: string
  timestamp: Date
}

// In-memory storage for votes (in production, use a database)
const votes: Map<string, Vote[]> = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, userId, optionId } = body

    if (!roomId || !userId || !optionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get existing votes for this room
    const roomVotes = votes.get(roomId) || []

    // Check if user already voted
    const userVoted = roomVotes.some(v => v.userId === userId)
    if (userVoted) {
      return NextResponse.json(
        { error: 'You have already voted in this room' },
        { status: 400 }
      )
    }

    // Add new vote
    const vote: Vote = {
      roomId,
      userId,
      optionId,
      timestamp: new Date(),
    }

    roomVotes.push(vote)
    votes.set(roomId, roomVotes)

    // Calculate results
    const results = calculateResults(roomVotes)

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        roomId,
        results,
      },
    })
  } catch (error) {
    console.error('Voting error:', error)
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    const roomVotes = votes.get(roomId) || []
    const results = calculateResults(roomVotes)

    return NextResponse.json({
      success: true,
      data: {
        roomId,
        totalVotes: roomVotes.length,
        results,
      },
    })
  } catch (error) {
    console.error('Vote retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve votes' },
      { status: 500 }
    )
  }
}

function calculateResults(roomVotes: Vote[]) {
  const voteCounts = new Map<string, number>()

  roomVotes.forEach(vote => {
    voteCounts.set(
      vote.optionId,
      (voteCounts.get(vote.optionId) || 0) + 1
    )
  })

  const total = roomVotes.length
  const results = Array.from(voteCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([optionId, count]) => ({
      optionId,
      votes: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))

  return results
}
