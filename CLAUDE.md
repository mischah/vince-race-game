# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based racing game implemented in TypeScript. The game features a player car and two AI opponents racing on a track with collision detection, lap counting, and a ranking system. The game is built as a web component using Shadow DOM and can be embedded in any webpage.

## Development Commands

```bash
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

## GitHub Pages Deployment

The project is set up with GitHub Actions to automatically deploy to GitHub Pages whenever changes are pushed to the main branch. The deployment workflow:

1. Builds the project using `npm run build`
2. Deploys the contents of the `dist` directory to GitHub Pages
3. Makes the game available at https://mischah.github.io/race-game/

The GitHub Actions workflow file is located at `.github/workflows/deploy-gh-pages.yml`.

## Code Architecture

The codebase is organized around the following key files and components:

### Main Components

- `src/RaceGameElement.ts` - The web component wrapper (`<race-game>`) that creates the Shadow DOM and initializes the game
- `src/game/Game.ts` - The main game controller that orchestrates all game components and logic
- `src/main.ts` - Entry point for the standalone web page version

### Game Engine Components

- `src/game/Car.ts` - Car logic for both player and AI vehicles, including steering, acceleration, and collision response
- `src/game/Track.ts` - Track rendering, start positions, finish line detection, and AI waypoints
- `src/game/Collision.ts` - Collision detection between cars and track walls, plus car-to-car collisions
- `src/game/InputHandler.ts` - Keyboard and touch input processing
- `src/game/UI.ts` - UI management including timer, lap counter, and live ranking
- `src/game/Audio.ts` - Sound effects management

### Configuration

- `src/config.ts` - Global configuration settings, including debug mode toggle for AI waypoints visualization
- `vite.config.ts` - Build configuration, set up to output as ES module for the web component

## Game Mechanics

1. **Game Loop**
   - The main loop in `Game.ts` handles rendering, physics, and game state updates
   - Cars and track are rendered on a Canvas 2D context

2. **Car Physics**
   - Cars have realistic steering and acceleration with easing functions
   - Collision response includes speed reduction and pushback

3. **AI System**
   - AI cars follow waypoints defined in the track
   - Each AI car has slightly different characteristics to create varied behavior

4. **Race Logic**
   - Start sequence with traffic light countdown
   - 3-lap race with finish detection
   - Live ranking based on progress around the track

5. **User Interface**
   - Racing timer
   - Lap counter
   - Real-time ranking display
   - Touch controls for mobile devices

## Debug Mode

To enable the debug mode (visualizing AI target points):
1. Set `DEBUG = true` in `src/config.ts`
2. Rebuild the project

## Output

When built, the project produces:
- `race-game-element.js` - Web component for embedding in other websites
- Other static assets (images, sounds, etc.)

The game can be used either as a standard web page or embedded as a web component with the tag `<race-game></race-game>`.