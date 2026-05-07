/**
 * Mock API Utilities for Virtual Try-On Application
 * These utilities simulate Perfect Corp API integration for image processing
 */

export interface TryOnRequest {
  image: string // Base64 encoded image
  productId: string
  productName: string
  productType: 'lipstick' | 'foundation' | 'blush' | 'eyeshadow'
  productColor: string
}

export interface TryOnResult {
  originalImage: string
  processedImage: string
  confidence: number
  processingTime: number
  productApplied: {
    name: string
    color: string
    type: string
  }
}

export interface VotingRoom {
  id: string
  code: string
  createdAt: Date
  expiresAt: Date
  votes: VoteOption[]
  totalVotes: number
}

export interface VoteOption {
  id: string
  productId: string
  productName: string
  productColor: string
  votes: number
  userIds: string[] // Track users who voted
}

/**
 * Simulates Perfect Corp virtual try-on API call
 * In production, this would call the actual Perfect Corp API
 */
export async function processTryOn(request: TryOnRequest): Promise<TryOnResult> {
  const parsedImage = parseBase64Image(request.image)
  if (!parsedImage) {
    throw new Error('Invalid image payload')
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    originalImage: request.image,
    // Keep output contract stable without native image processing dependency.
    processedImage: request.image,
    confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
    processingTime: 1.5,
    productApplied: {
      name: request.productName,
      color: request.productColor,
      type: request.productType,
    },
  }
}

function parseBase64Image(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

/**
 * Creates a new voting room for a try-on result
 */
export function createVotingRoom(): VotingRoom {
  const code = generateRoomCode()
  const now = new Date()

  return {
    id: generateRoomId(),
    code,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
    votes: [],
    totalVotes: 0,
  }
}

/**
 * Generates a random room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates a unique room ID
 */
export function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generates a unique user ID for tracking votes
 */
export function generateUserId(): string {
  return `user_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Submits a vote for a product option
 * Includes anti-double-vote protection
 */
export function submitVote(
  room: VotingRoom,
  optionId: string,
  userId: string
): { success: boolean; message: string; updatedRoom?: VotingRoom } {
  const option = room.votes.find(v => v.id === optionId)

  if (!option) {
    return { success: false, message: 'Vote option not found' }
  }

  // Check if user already voted for this option
  if (option.userIds.includes(userId)) {
    return { success: false, message: 'You have already voted for this option' }
  }

  // Check if user voted for anything in this room
  const userHasVoted = room.votes.some(v => v.userIds.includes(userId))
  if (userHasVoted) {
    return { success: false, message: 'You can only vote once per room' }
  }

  // Add vote
  option.userIds.push(userId)
  option.votes += 1
  room.totalVotes += 1

  return {
    success: true,
    message: 'Vote submitted successfully',
    updatedRoom: room,
  }
}

/**
 * Gets voting statistics for a room
 */
export function getVotingStats(room: VotingRoom) {
  const sortedVotes = [...room.votes].sort((a, b) => b.votes - a.votes)
  const topVote = sortedVotes[0]

  return {
    totalVotes: room.totalVotes,
    topVote: topVote ? {
      name: topVote.productName,
      votes: topVote.votes,
      percentage: Math.round((topVote.votes / room.totalVotes) * 100),
    } : null,
    results: sortedVotes.map(v => ({
      id: v.id,
      name: v.productName,
      votes: v.votes,
      percentage: Math.round((v.votes / room.totalVotes) * 100),
    })),
  }
}

/**
 * Simulates image compression for sharing
 */
export async function compressImage(
  base64Image: string,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = base64Image

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(base64Image)
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const compressedImage = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedImage)
    }

    img.onerror = () => {
      resolve(base64Image)
    }
  })
}

/**
 * Generates a shareable URL for a try-on result
 */
export function generateShareUrl(roomCode: string, baseUrl: string = 'https://tryon.example.com'): string {
  return `${baseUrl}/rooms/${roomCode}`
}

/**
 * Validates room code format
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}

/**
 * Checks if a room has expired
 */
export function isRoomExpired(room: VotingRoom): boolean {
  return new Date() > room.expiresAt
}
