import './style.css';
import { Game } from './game/Game';

document.addEventListener('DOMContentLoaded', () => {
  // Erstelle und starte das Spiel, sobald das DOM vollständig geladen ist
  const game = new Game();
  (window as any).gameInstance = game;
  game.initialize();

  // Touch-Steuerung für mobile Geräte
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnAccel = document.getElementById('btn-accel');
  const btnBrake = document.getElementById('btn-brake');
  const playerCar = () => game.getPlayerCar();

  function startAction(action: string) {
    if (action === 'left') playerCar().turnLeft();
    if (action === 'right') playerCar().turnRight();
    if (action === 'accel') playerCar().accelerate();
    if (action === 'brake') playerCar().decelerate();
  }
  function stopAction(action: string) {
    if (action === 'left' || action === 'right') playerCar().resetSteering();
  }
  [
    { btn: btnLeft, action: 'left' },
    { btn: btnRight, action: 'right' },
    { btn: btnAccel, action: 'accel' },
    { btn: btnBrake, action: 'brake' }
  ].forEach(({ btn, action }) => {
    if (!btn) return;
    btn.addEventListener('touchstart', e => { e.preventDefault(); startAction(action); });
    btn.addEventListener('touchend', e => { e.preventDefault(); stopAction(action); });
    btn.addEventListener('mousedown', e => { e.preventDefault(); startAction(action); });
    btn.addEventListener('mouseup', e => { e.preventDefault(); stopAction(action); });
    btn.addEventListener('mouseleave', e => { e.preventDefault(); stopAction(action); });
  });
});
