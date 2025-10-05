# Tower Defense Game MVP

A minimal Tower Defense game prototype for Telegram WebApp, built with Phaser.js and following ECS-like architecture.

## Features

- **Telegram WebApp Integration**: Full support for Telegram themes, haptic feedback, and cloud storage
- **Vector Graphics**: WebGL-based rendering with procedural graphics
- **Landscape Orientation**: Optimized for mobile devices with landscape lock
- **Modular Architecture**: ECS-like structure with Phaser components
- **Dynamic Theming**: Automatic adaptation to Telegram theme changes

## Tech Stack

- **Frontend**: Phaser.js v3.85+ (WebGL rendering)
- **Language**: JavaScript/TypeScript with ESM modules
- **Build Tool**: Vite with HTTPS support
- **Telegram**: @telegram-apps/sdk
- **Hosting**: Vercel/Netlify ready

## Project Structure

```
src/
├── main.js                 # Game initialization and configuration
├── scenes/
│   ├── MenuScene.js        # Start screen with "Start Game" button
│   ├── GameScene.js        # Main gameplay (placeholder)
│   └── RewardScene.js      # Rewards and achievements (placeholder)
└── services/
    └── TelegramService.js  # Telegram WebApp integration
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

This starts the development server with HTTPS (required for Telegram WebApp testing).

### Build for Production

```bash
npm run build
```

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## Architecture

### ECS-like Structure

The game follows an Entity-Component-System pattern using Phaser:

- **Entities**: Game objects (sprites, graphics)
- **Components**: Phaser components for behavior
- **Systems**: Scene-based logic and rendering

### Telegram Integration

The `TelegramService` handles:

- Theme parameter adaptation
- Haptic feedback
- Cloud storage
- Main button management
- Orientation locking

### Scenes

- **MenuScene**: Start screen with animated "Start Game" button
- **GameScene**: Main gameplay (to be implemented)
- **RewardScene**: Rewards system (to be implemented)

## Configuration

The game is configured for:

- **WebGL rendering** for optimal performance
- **Landscape orientation lock** for mobile compatibility
- **Dynamic resolution** scaling for crisp text
- **Telegram theme integration** for seamless UX

## Next Steps

1. Implement tower defense mechanics in GameScene
2. Add blockchain integration (TON wallet)
3. Create reward system
4. Add multiplayer support
5. Deploy to Vercel/Netlify

## License

MIT License - see LICENSE file for details.
