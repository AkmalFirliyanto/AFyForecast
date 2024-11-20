import { allTarotCards } from '@/data/tarot'

export interface TarotCard {
    id: string
    name: {
      id: string
      en: string
    }
    image: string
    meaning: {
      upright: {
        id: string
        en: string
      }
      reversed: {
        id: string
        en: string
      }
    }
    element: {
      id: string
      en: string
    }
    keywords: {
      id: string[]
      en: string[]
    }
    type: string
    position?: 'upright' | 'reversed'
  
}

export function shuffleCards(count: number = 3): TarotCard[] {
  // Buat salinan array kartu
  const cards = [...allTarotCards]
  
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]]
  }
  
  // Ambil jumlah kartu yang diinginkan dan tentukan posisinya
  return cards.slice(0, count).map(card => ({
    ...card,
    position: Math.random() > 0.5 ? 'upright' : 'reversed'
  }))
} 