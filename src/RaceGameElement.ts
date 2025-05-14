// src/RaceGameElement.ts
import { Game } from './game/Game';
import './style.css';

export class RaceGameElement extends HTMLElement {
  private gameInstance: Game | null = null;
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // HTML-Struktur für das Spiel in den Shadow DOM einfügen
    this.shadow.innerHTML = `
      <link rel="stylesheet" href="${this.getStyleUrl()}">
      <div id="app">
        <div id="game-container">
          <div id="ui-top">
            <div id="headline">Vince Rennen</div>
            <div id="ranking">
              <div class="ranking-title">Rangliste</div>
              <div id="ranking-list">
                <div class="ranking-item" id="rank-player">1. Enzo <span class="car-color red"></span></div>
                <div class="ranking-item" id="rank-ai1">2. F50 <span class="car-color black"></span></div>
                <div class="ranking-item" id="rank-ai2">3. 360 Spider <span class="car-color orange"></span></div>
              </div>
            </div>
          </div>
          <div id="game-area">
            <canvas id="game-canvas"></canvas>
            <div id="game-overlay">
              <div id="ui-center" class="hidden">
                <div id="timer-container">
                  <div id="timer">0:00</div>
                </div>
                <div id="lap-counter">Runde: 0/3</div>
                <button id="reset-button" class="hidden">Reset</button>
              </div>
              <button id="start-button">Start</button>
              <div id="traffic-light">
                <div class="light red"></div>
                <div class="light yellow"></div>
                <div class="light green"></div>
              </div>
              <div id="countdown">3</div>
              <div id="touch-controls">
                <button class="touch-btn" id="btn-left">&#8592;</button>
                <button class="touch-btn" id="btn-right">&#8594;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    // Initialisiere das Spiel im Shadow DOM
    setTimeout(() => {
      this.gameInstance = new Game(this.shadow);
      (window as any).gameInstance = this.gameInstance;
      this.gameInstance.initialize();
      this.setupTouchControls();
    }, 0);
  }

  disconnectedCallback() {
    // Aufräumen, falls nötig
    this.gameInstance = null;
  }

  private getStyleUrl(): string {
    // Liefert den Pfad zum CSS, ggf. anpassen für Bundling
    return new URL('./style.css', import.meta.url).toString();
  }

  private setupTouchControls() {
    const btnLeft = this.shadow.getElementById('btn-left');
    const btnRight = this.shadow.getElementById('btn-right');
    // Es gibt keine btn-accel/btn-brake, da das Spiel automatisch beschleunigt
    const playerCar = () => this.gameInstance?.getPlayerCar();
    function startAction(action: string) {
      if (!playerCar()) return;
      if (action === 'left') playerCar()!.turnLeft();
      if (action === 'right') playerCar()!.turnRight();
    }
    function stopAction(action: string) {
      if (!playerCar()) return;
      if (action === 'left' || action === 'right') playerCar()!.resetSteering();
    }
    [
      { btn: btnLeft, action: 'left' },
      { btn: btnRight, action: 'right' }
    ].forEach(({ btn, action }) => {
      if (!btn) return;
      btn.addEventListener('touchstart', e => { e.preventDefault(); startAction(action); });
      btn.addEventListener('touchend', e => { e.preventDefault(); stopAction(action); });
      btn.addEventListener('mousedown', e => { e.preventDefault(); startAction(action); });
      btn.addEventListener('mouseup', e => { e.preventDefault(); stopAction(action); });
      btn.addEventListener('mouseleave', e => { e.preventDefault(); stopAction(action); });
    });
  }
}

// Registrierung des Custom Elements
customElements.define('race-game', RaceGameElement);
