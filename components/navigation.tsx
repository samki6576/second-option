'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground hidden sm:inline">TryOn AI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/try-on"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              Try-On
            </Link>
            <Link
              href="/rooms"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Voting Room
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
