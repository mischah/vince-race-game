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
              <div id="game-buttons">
                <button id="menu-button">Menü</button>
                <button id="start-button">Start</button>
              </div>
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
        <div id="menu-modal" class="hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="modal-title">Spieler-Einstellungen</h2>
              <button class="close-button">&times;</button>
            </div>
            <div class="form-group">
              <label for="player-name">Spieler-Name:</label>
              <input type="text" id="player-name" placeholder="Geben Sie Ihren Namen ein" maxlength="20">
            </div>
            <div class="form-group">
              <label for="car-color">Auto-Farbe wählen:</label>
              <div class="color-grid" id="color-grid">
                <!-- Color options will be populated dynamically -->
              </div>
            </div>
            <div class="modal-buttons">
              <button class="modal-button secondary" id="modal-cancel">Abbrechen</button>
              <button class="modal-button primary" id="modal-save">Übernehmen</button>
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
      this.setupMenuModal();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ui = (this.gameInstance as any)?.ui;
      if (ui && typeof ui.showBestTime === 'function') {
        ui.showBestTime();
        // Immer anzeigen, auch vor Spielstart
        if (ui.bestTimeElement) ui.bestTimeElement.style.display = '';
      }
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

  private setupMenuModal() {
    // Import colors from config
    import('./config').then(({ CAR_COLORS }) => {
      this.populateColorGrid(CAR_COLORS);
    });

    // Menu button event listener
    const menuButton = this.shadow.getElementById('menu-button');
    const modal = this.shadow.getElementById('menu-modal');
    const closeButton = this.shadow.querySelector('.close-button');
    const cancelButton = this.shadow.getElementById('modal-cancel');
    const saveButton = this.shadow.getElementById('modal-save');
    const playerNameInput = this.shadow.getElementById('player-name') as HTMLInputElement;

    // Load saved settings
    const savedName = localStorage.getItem('race-game-player-name') || '';
    const savedColor = localStorage.getItem('race-game-player-color') || 'red';
    
    if (playerNameInput) {
      playerNameInput.value = savedName;
    }

    // Show modal
    if (menuButton && modal) {
      menuButton.addEventListener('click', () => {
        modal.classList.remove('hidden');
        this.selectColor(savedColor);
        if (playerNameInput) {
          playerNameInput.focus();
        }
      });
    }

    // Hide modal
    const hideModal = () => {
      if (modal) modal.classList.add('hidden');
    };

    if (closeButton) closeButton.addEventListener('click', hideModal);
    if (cancelButton) cancelButton.addEventListener('click', hideModal);

    // Click outside modal to close
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
      });
    }

    // Save settings
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const playerName = playerNameInput?.value.trim() || 'Spieler';
        const selectedColor = this.shadow.querySelector('.color-option.selected')?.getAttribute('data-color') || 'red';
        
        // Save to localStorage
        localStorage.setItem('race-game-player-name', playerName);
        localStorage.setItem('race-game-player-color', selectedColor);
        
        // Update game with new settings
        if (this.gameInstance) {
          this.gameInstance.updatePlayerSettings(playerName, selectedColor);
        }
        
        hideModal();
      });
    }
  }

  private populateColorGrid(colors: typeof import('./config').CAR_COLORS) {
    const colorGrid = this.shadow.getElementById('color-grid');
    if (!colorGrid) return;

    colorGrid.innerHTML = '';
    
    colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';
      colorOption.setAttribute('data-color', color.value);
      
      const colorPreview = document.createElement('div');
      colorPreview.className = `color-preview car-color ${color.cssClass}`;
      
      const colorName = document.createElement('div');
      colorName.className = 'color-name';
      colorName.textContent = color.name;
      
      colorOption.appendChild(colorPreview);
      colorOption.appendChild(colorName);
      
      colorOption.addEventListener('click', () => {
        this.selectColor(color.value);
      });
      
      colorGrid.appendChild(colorOption);
    });
  }

  private selectColor(colorValue: string) {
    const colorOptions = this.shadow.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      if (option.getAttribute('data-color') === colorValue) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
  }
}

// Registrierung des Custom Elements
customElements.define('race-game', RaceGameElement);
