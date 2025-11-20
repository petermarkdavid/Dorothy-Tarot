# Tarot Card Images

This directory contains SVG images for all 78 tarot cards in the Rider-Waite style.

## File Naming Convention

### Major Arcana
- `the-fool-upright.svg`
- `the-fool-reversed.svg`
- `the-magician-upright.svg`
- `the-magician-reversed.svg`
- etc.

### Minor Arcana
- `cups-1-upright.svg` (Ace of Cups)
- `cups-1-reversed.svg`
- `cups-2-upright.svg` (Two of Cups)
- `cups-2-reversed.svg`
- etc.

## Card Suits
- **Cups** - Blue gradient (🕊️)
- **Wands** - Red gradient (🔥)
- **Swords** - Gray gradient (⚔️)
- **Pentacles** - Orange gradient (💰)
- **Major Arcana** - Purple gradient

## Usage

These images are hosted on GitHub and can be accessed via:
```
https://raw.githubusercontent.com/peteranderton/Ask-Sian/main/images/cards/[filename]
```

## Regeneration

To regenerate all card images, run:
```bash
node generate-cards-simple.js
```

This will create both upright and reversed versions of all 78 tarot cards.
