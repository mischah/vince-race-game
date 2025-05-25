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
    // Ladebalken-HTML einfügen
    this.shadow.innerHTML = `
      <div id="loading-bar-container">
        <div id="loading-bar-row">
          <div id="loading-bar" style="width: 0%"></div>
          <svg id="loading-finish" viewBox="0 0 18 26">
            <rect x="0" y="0" width="18" height="26" fill="#fff"/>
            <g>
              <rect x="0" y="0" width="4" height="4" fill="#000"/>
              <rect x="8" y="0" width="4" height="4" fill="#000"/>
              <rect x="4" y="4" width="4" height="4" fill="#000"/>
              <rect x="12" y="4" width="4" height="4" fill="#000"/>
              <rect x="0" y="8" width="4" height="4" fill="#000"/>
              <rect x="8" y="8" width="4" height="4" fill="#000"/>
              <rect x="4" y="12" width="4" height="4" fill="#000"/>
              <rect x="12" y="12" width="4" height="4" fill="#000"/>
              <rect x="0" y="16" width="4" height="4" fill="#000"/>
              <rect x="8" y="16" width="4" height="4" fill="#000"/>
              <rect x="4" y="20" width="4" height="4" fill="#000"/>
              <rect x="12" y="20" width="4" height="4" fill="#000"/>
            </g>
          </svg>
        </div>
        <canvas id="loading-car-canvas" width="40" height="60" style="position:absolute; left:0; top:54px; pointer-events:none;"></canvas>
      </div>
    ` + this.shadow.innerHTML;

    // Game-Container unsichtbar machen
    const observer = new MutationObserver(() => {
      const app = this.shadow.getElementById('app');
      if (app) {
        app.classList.add('hidden');
        observer.disconnect();
      }
    });
    observer.observe(this.shadow, { childList: true, subtree: true });

    // HTML-Struktur für das Spiel in den Shadow DOM einfügen
    this.shadow.innerHTML += `
      <link rel="stylesheet" href="${this.getStyleUrl()}">
      <div id="app">
        <div id="game-container">
          <div id="ui-top">
            <div id="headline">Race Game</div>
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

    globalThis.setTimeout(() => {
      // Ladebalken animieren
      const bar = this.shadow.getElementById('loading-bar') as HTMLElement;
      const carCanvas = this.shadow.getElementById('loading-car-canvas') as HTMLCanvasElement;
      const barRow = this.shadow.getElementById('loading-bar-row') as HTMLElement;
      if (bar && carCanvas && barRow) {
        let progress = 0;
        const barRowWidth = () => barRow.offsetWidth;
        const barMax = () => barRowWidth() - 18; // 18px für Ziellinie
        const carWidth = 28;
        const carHeight = 48;
        const animate = () => {
          progress += Math.random() * 12 + 8;
          if (progress > 100) progress = 100;
          bar.style.width = progress + '%';
          // Auto fährt UNTER dem Balken mit der Spitze an der aktuellen Balkenbreite
          const px = (barMax() * progress / 100) - carWidth / 2 + 9;
          carCanvas.style.left = `${Math.max(0, px)}px`;
          // Auto zeichnen (nach rechts ausgerichtet)
          const ctx = carCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, carCanvas.width, carCanvas.height);
            ctx.save();
            ctx.translate(carCanvas.width / 2, carCanvas.height / 2);
            ctx.rotate(Math.PI / 2); // Nach rechts ausrichten
            // Karosserie
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight);
            // Scheinwerfer
            ctx.fillStyle = 'yellow';
            ctx.fillRect(-carWidth / 2 + 4, -carHeight / 2, 6, 8);
            ctx.fillRect(carWidth / 2 - 10, -carHeight / 2, 6, 8);
            // Fenster
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(-carWidth / 2 + 5, -carHeight / 2 + 10, carWidth - 10, 12);
            // Räder
            ctx.fillStyle = '#222';
            ctx.fillRect(-carWidth / 2 - 4, -carHeight / 2 + 6, 8, 12);
            ctx.fillRect(carWidth / 2 - 4, -carHeight / 2 + 6, 8, 12);
            ctx.fillRect(-carWidth / 2 - 4, carHeight / 2 - 18, 8, 12);
            ctx.fillRect(carWidth / 2 - 4, carHeight / 2 - 18, 8, 12);
            ctx.restore();
          }
          if (progress < 100) {
            globalThis.setTimeout(animate, 180);
          } else {
            globalThis.setTimeout(() => {
              const cont = this.shadow.getElementById('loading-bar-container');
              if (cont) cont.classList.add('hide');
              // Spiel nach 500ms sichtbar machen
              globalThis.setTimeout(() => {
                const app = this.shadow.getElementById('app');
                if (app) app.classList.remove('hidden');
              }, 500);
            }, 400);
          }
        };
        animate();
      }

      this.gameInstance = new Game(this.shadow);
      const gameInstance = this.gameInstance;
      (globalThis as { gameInstance?: typeof gameInstance }).gameInstance = gameInstance;
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
