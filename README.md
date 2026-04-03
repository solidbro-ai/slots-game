# 🎰 Lucky Sevens Casino - Slots Game

A professional, Vegas-style slots game built with Node.js, Express, and MySQL.

![Lucky Sevens Casino](https://img.shields.io/badge/Casino-Lucky%20Sevens-gold)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue)

## Features

### Core Gameplay
- **5 Reels × 3 Rows** - Classic slot machine layout
- **50 Paylines** - Multiple ways to win
- **20 Regular Icons** - Various payout values
- **Adjustable Betting** - Control bet per line and active lines

### Special Features

#### 🎁 Free Spins
- Triggered by **3, 4, or 5** scatter symbols (icon_21)
- Awards **15, 20, or 25** free spins respectively
- **2x Multiplier** on all wins during free spins
- **Retrigger** possible during the feature
- Scatter can only appear **once per reel** (max 5 on screen)

#### 🔒 Hold & Spin
- Triggered by **6+** special symbols (icon_22)
- Initial **3 spins** awarded
- Spins **reset to 3** when new symbol lands
- Symbols **lock in place**
- **No limit** per reel (can stack)
- Fill all **15 positions** for the **GRAND JACKPOT!**

### Jackpots (Hold & Spin)
| Symbols | Jackpot | Multiplier |
|---------|---------|------------|
| 6-8 | Mini | 10x |
| 9-11 | Minor | 25x |
| 12-14 | Major | 100x |
| 15 (Full) | Grand | 1000x |

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MySQL 8.0+

### 2. Installation

```bash
# Clone or navigate to the project
cd slots-game

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials
```

### 3. Database Setup

```bash
# Create database and tables
mysql -u root -p < database.sql
```

Or manually in MySQL:
```sql
source database.sql
```

### 4. Generate Placeholder Icons (Optional)

```bash
npm run generate:icons
```

This creates colorful SVG placeholder icons for testing. Replace with your actual PNG icons in `/public/images/`.

### 5. Start the Server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Visit **http://localhost:3000** 🎰

## Project Structure

```
slots-game/
├── config/
│   ├── game.config.js     # Payout rates, features, betting limits
│   └── paylines.js        # 50 payline definitions
├── public/
│   ├── css/
│   │   └── style.css      # Vegas/casino theme
│   ├── js/
│   │   └── game.js        # Frontend game logic
│   ├── images/            # Your icon images go here
│   └── index.html         # Main game UI
├── scripts/
│   └── generate-placeholders.js
├── src/
│   ├── server.js          # Express API server
│   ├── database.js        # MySQL operations
│   └── game.js            # Core game logic
├── database.sql           # MySQL schema
├── .env.example           # Environment template
└── package.json
```

## Configuration

Edit `config/game.config.js` to customize:

### Payout Rate (RTP)
```javascript
payoutRate: 0.96, // 96% return to player
```

### Enable/Disable Features
```javascript
features: {
  freeSpins: { enabled: true },
  holdAndSpin: { enabled: true },
}
```

### Betting Limits
```javascript
betting: {
  minBetPerLine: 1,
  maxBetPerLine: 100,
  availableLines: [1, 5, 10, 15, 20, 25, 30, 40, 50],
}
```

### Symbol Payouts
```javascript
payouts: {
  1: [5, 15, 50],    // [3-of-a-kind, 4-of-a-kind, 5-of-a-kind]
  // ... more symbols
  20: [50, 200, 1000], // Premium symbol
}
```

## Icon Requirements

Place your icon images in `/public/images/`:

| File | Description |
|------|-------------|
| `icon_1.png` - `icon_20.png` | Regular symbols (various values) |
| `icon_21.png` | Free Spins scatter symbol |
| `icon_22.png` | Hold & Spin special symbol |

**Recommended size:** 200×200 pixels (PNG with transparency)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Game configuration |
| GET | `/api/user` | Current user info & credits |
| POST | `/api/user/credits` | Add credits (demo) |
| POST | `/api/spin` | Normal spin |
| POST | `/api/spin/free` | Free spin |
| POST | `/api/spin/holdandspin` | Hold & Spin spin |
| GET | `/api/history` | Spin history |
| GET | `/api/leaderboard` | Top players |

## Future Enhancements

The game is built with these future features in mind:

### Video Animations
```javascript
// config/game.config.js
animations: {
  enabled: true, // Set to true when videos are ready
  paths: {
    freeSpinsTrigger: '/animations/free_spins_trigger.mp4',
    bigWin: '/animations/big_win.mp4',
    jackpot: '/animations/jackpot.mp4',
  },
}
```

### Planned Features
- [ ] User authentication
- [ ] Video animation support
- [ ] Sound effects
- [ ] Progressive jackpots
- [ ] Tournament mode
- [ ] Mobile app

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Spin |

## License

ISC

---

🎲 **Play Responsibly** | Built with ❤️ and Node.js
