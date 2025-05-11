import './style.css';
import { Game } from './game/Game';

document.addEventListener('DOMContentLoaded', () => {
  // Erstelle und starte das Spiel, sobald das DOM vollständig geladen ist
  const game = new Game();
  (window as any).gameInstance = game;
  game.initialize();
});
