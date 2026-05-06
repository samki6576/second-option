'use client'

import { Button } from './ui/button'
import { Card } from './ui/card'
import { useState } from 'react'
import { Check } from 'lucide-react'

export interface Product {
  id: string
  name: string
  category: string
  color: string
  image: string
  type: 'lipstick' | 'foundation' | 'blush' | 'eyeshadow'
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Red Lipstick',
    category: 'Lipstick',
    color: 'Red',
    type: 'lipstick',
    image: 'https://via.placeholder.com/100?text=Red+Lipstick',
  },
  {
    id: '2',
    name: 'Berry Bliss',
    category: 'Lipstick',
    color: 'Berry',
    type: 'lipstick',
    image: 'https://via.placeholder.com/100?text=Berry',
  },
  {
    id: '3',
    name: 'Nude Perfection',
    category: 'Lipstick',
    color: 'Nude',
    type: 'lipstick',
    image: 'https://via.placeholder.com/100?text=Nude',
  },
  {
    id: '4',
    name: 'Glam Foundation',
    category: 'Foundation',
    color: 'Medium',
    type: 'foundation',
    image: 'https://via.placeholder.com/100?text=Foundation',
  },
  {
    id: '5',
    name: 'Coral Blush',
    category: 'Blush',
    color: 'Coral',
    type: 'blush',
    image: 'https://via.placeholder.com/100?text=Blush',
  },
  {
    id: '6',
    name: 'Smokey Eyes',
    category: 'Eyeshadow',
    color: 'Smokey',
    type: 'eyeshadow',
    image: 'https://via.placeholder.com/100?text=Eyeshadow',
  },
]

interface ProductSelectorProps {
  selectedProduct: Product | null
  onSelectProduct: (product: Product) => void
}

export function ProductSelector({ selectedProduct, onSelectProduct }: ProductSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [...new Set(PRODUCTS.map(p => p.category))]
  const filteredProducts = selectedCategory
    ? PRODUCTS.filter(p => p.category === selectedCategory)
    : PRODUCTS

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Select Product Category</label>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Products
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Choose Product</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card
              key={product.id}
              className={`p-3 cursor-pointer transition-all hover:border-primary ${
                selectedProduct?.id === product.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onSelectProduct(product)}
            >
              <div className="space-y-2">
                <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {/* Placeholder color circle */}
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{
                      backgroundColor: product.color === 'Red' ? '#dc2626' :
                        product.color === 'Berry' ? '#9333ea' :
                        product.color === 'Nude' ? '#d4a574' :
                        product.color === 'Medium' ? '#f4a460' :
                        product.color === 'Coral' ? '#ff6b6b' :
                        '#6b7280'
                    }}
                  />
                  {selectedProduct?.id === product.id && (
                    <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-foreground/60">{product.color}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
