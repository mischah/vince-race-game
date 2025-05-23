# Race Game Web Component

A browser-based racing game implemented in TypeScript. Race with three Ferrari-style cars on a track with collision detection, lap counting, and a ranking system.

## Features

- 3-lap racing game with one player car and two AI opponents
- Traffic light start sequence with countdown
- Keyboard and touch controls
- Real-time ranking system
- Lap counting and timer
- Collision detection between cars and with track borders
- Race finish detection

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Start local development server with network access (for testing on mobile devices)
npm run dev:network

# Build for production
npm run build

# Preview production build locally
npm run preview

# Preview production build with network access
npm run preview:network
```

## Usage as Web Component

To use this racing game in your own projects, include the script and add the custom element to your HTML:

```html
<script type="module" src="race-game-element.js"></script>
<race-game></race-game>
```

## Game Controls

- **Arrow Up**: Accelerate
- **Arrow Down**: Brake
- **Arrow Left**: Steer left
- **Arrow Right**: Steer right
- **Touch Controls**: Available for mobile devices

## Demo

A live demo of the game is available at: https://mischah.github.io/race-game/

## License

MIT