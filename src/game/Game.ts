import { Car } from './Car';
import { Track } from './Track';
import { UI } from './UI';
import { InputHandler } from './InputHandler';
import { Collision } from './Collision';
import { AudioManager } from './Audio';

export class Game {
  private root: Document | ShadowRoot;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private track: Track;
  private playerCar: Car;
  private aiCars: Car[] = [];
  private ui: UI;
  private inputHandler: InputHandler;
  private collision: Collision;
  private audioManager: AudioManager;
  private isGameRunning = false;
  private isGameStarted = false;
  private animationFrameId: number | null = null;
  private lapCountingEnabled = false; // Flag, um zu verfolgen, ob die Rundenzählung aktiviert ist
  private lastPlayerLapState = false;
  private lastAiLapStates: boolean[] = [false, false];
  private finishOrder: string[] = [];
  private availableColors: string[] = [];

  constructor(root: Document | ShadowRoot = globalThis.document) {
    this.root = root;
    this.canvas = this.root.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas element not found');
    
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;
    
    // Einstellung der Canvas-Dimensionen
    this.canvas.width = 600;
    this.canvas.height = 800;
    
    this.track = new Track(this.ctx);
    this.playerCar = new Car(this.ctx, 'Enzo', 'red', true);
    this.aiCars = [
      new Car(this.ctx, 'F50', 'black', false),
      new Car(this.ctx, '360 Spider', 'orange', false)
    ];
    
    this.ui = new UI(this.root);
    this.inputHandler = new InputHandler(this);
    this.collision = new Collision(this.track);
    this.audioManager = new AudioManager();
    
    // Initialize available colors
    this.initializeColors();
    
    // Verstecke Ampel und Countdown initial
    const trafficLight = this.root.getElementById('traffic-light');
    const countdown = this.root.getElementById('countdown');
    if (trafficLight) trafficLight.classList.add('hidden');
    if (countdown) countdown.classList.add('hidden');
  }

  public initialize(): void {
    // Lade alle Assets und richte Event-Listener ein
    this.track.loadTrack();
    
    // Apply saved settings after colors are initialized
    this.initializeColors().then(() => {
      // Update UI with current car names and colors
      const allCars = this.getAllCars();
      const carNames = allCars.map(car => car.getName());
      this.ui.updateRankingElements(carNames);
      this.ui.resetUI();
    });
    
    // Platziere die Autos schon vor dem Start-Button-Klick an der Startlinie
    this.aiCars[0].setStartPosition(this.track.getStartPosition(0)); // links (schwarz)
    this.playerCar.setStartPosition(this.track.getStartPosition(1)); // mitte (rot)
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2)); // rechts (orange)
    
    // Start-Button-Event-Listener
    const startButton = this.root.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', () => this.startGame());
    }
    
    // Reset-Button-Event-Listener
    const resetButton = this.root.getElementById('reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetGame());
    }
    
    // Starte den Spiel-Loop
    this.gameLoop();
  }

  public startGame(): void {
    if (this.isGameStarted) return;
    this.ui.showBestTime(); // Bestzeit immer anzeigen, auch nach Reset
    
    this.isGameStarted = true;
    this.lapCountingEnabled = false; // Deaktiviere die Rundenzählung zu Beginn
    
    // Platziere Autos direkt an der Startlinie, noch bevor der Countdown beginnt
    this.aiCars[0].setStartPosition(this.track.getStartPosition(0));
    this.playerCar.setStartPosition(this.track.getStartPosition(1));
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2));
    
    // Setze die KI-Wegpunkte für die AI-Autos schon jetzt
    const aiTargetPoints = this.track.getAiPath();
    this.aiCars.forEach(car => {
      car.setAiTargetPoints(aiTargetPoints);
    });
    
    // Verstecke den Start-Button und Menu-Button
    const startButton = this.root.getElementById('start-button');
    const menuButton = this.root.getElementById('menu-button');
    if (startButton) startButton.classList.add('hidden');
    if (menuButton) menuButton.classList.add('hidden');
    
    // Zeige Ampel und Countdown
    const trafficLight = this.root.getElementById('traffic-light');
    const countdown = this.root.getElementById('countdown');
    if (trafficLight) trafficLight.classList.remove('hidden');
    if (countdown) countdown.classList.remove('hidden');
    
    // Starte den Countdown
    let count = 3;
    const redLight = this.root.querySelector('.light.red');
    const yellowLight = this.root.querySelector('.light.yellow');
    const greenLight = this.root.querySelector('.light.green');
    
    if (redLight) redLight.classList.add('active');
    
    // Spiele den ersten Countdown-Sound
    this.audioManager.playSound('beep-prepare');
    
    const countdownInterval = globalThis.setInterval(() => {
      count--;
      
      if (countdown) countdown.textContent = count.toString();
      
      // Spiele den Countdown-Sound bei jedem Schritt
      if (count > 0) {
        this.audioManager.playSound('beep-prepare');
      }
      
      if (count === 2 && yellowLight) {
        yellowLight.classList.add('active');
      } else if (count === 1 && greenLight) {
        greenLight.classList.add('active');
      } else if (count === 0) {
        if (countdown) countdown.textContent = 'Go!';
        
        // Spiele den Start-Sound
        this.audioManager.playSound('beep-go');
        
        globalThis.setTimeout(() => {
          // Verstecke Ampel und Countdown
          if (trafficLight) trafficLight.classList.add('hidden');
          if (countdown) countdown.classList.add('hidden');
          // Zeige Timer und Rundenzähler im Overlay
          const uiCenter = this.root.getElementById('ui-center');
          if (uiCenter) uiCenter.classList.remove('hidden');
          // Zeige Reset-Button
          const resetBtn = this.root.getElementById('reset-button');
          if (resetBtn) resetBtn.classList.remove('hidden');
          // Starte das eigentliche Spiel
          this.isGameRunning = true;
          this.ui.startTimer();
          
          // Aktiviere die Input-Handler
          this.inputHandler.activateControls();
          
          // Aktiviere die Rundenzählung erst nach 2 Sekunden, wenn die Autos bereits losgefahren sind
          globalThis.setTimeout(() => {
            this.lapCountingEnabled = true;
          }, 2000);
        }, 1000);
        
        globalThis.clearInterval(countdownInterval);
      }
    }, 1000);
  }

  public resetGame(): void {
    // Stoppe den Game-Loop
    if (this.animationFrameId !== null) {
      globalThis.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Setze Spielstatus zurück
    this.isGameRunning = false;
    this.isGameStarted = false;
    this.lapCountingEnabled = false;
    this.finishOrder = [];
    
    // Setze UI zurück
    this.ui.resetUI();
    this.ui.stopTimer(false); // false = kein reguläres Spielende
    this.ui.showBestTime(); // Bestzeit nach Reset anzeigen
    // Blende Timer und Rundenzähler im Overlay aus
    const uiCenter = this.root.getElementById('ui-center');
    if (uiCenter) uiCenter.classList.add('hidden');
    // Blende Reset-Button aus
    const resetBtn = this.root.getElementById('reset-button');
    if (resetBtn) resetBtn.classList.add('hidden');
    
    // Zeige den Start-Button und Menu-Button
    const startButton = this.root.getElementById('start-button');
    const menuButton = this.root.getElementById('menu-button');
    if (startButton) startButton.classList.remove('hidden');
    if (menuButton) menuButton.classList.remove('hidden');
    
    // Verstecke Ampel und Countdown
    const trafficLight = this.root.getElementById('traffic-light');
    const countdown = this.root.getElementById('countdown');
    if (trafficLight) {
      trafficLight.classList.add('hidden');
      // Entferne aktive Lichter
      const lights = trafficLight.querySelectorAll('.light');
      lights.forEach(light => light.classList.remove('active'));
    }
    if (countdown) {
      countdown.classList.add('hidden');
      countdown.textContent = '3';
    }
    
    // Setze Autos zurück
    this.playerCar.reset();
    this.aiCars.forEach(car => car.reset());
    // Rauchwolken aller Autos entfernen (falls Autos ausgeblendet werden)
    this.playerCar.clearSmoke();
    this.aiCars.forEach(car => car.clearSmoke());
    
    // Platziere die Autos an der Startlinie nach dem Reset
    this.aiCars[0].setStartPosition(this.track.getStartPosition(0));
    this.playerCar.setStartPosition(this.track.getStartPosition(1));
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2));
    
    // Deaktiviere Input-Handler
    this.inputHandler.deactivateControls();
    
    // Starte den Game-Loop neu
    this.gameLoop();
  }

  public getAllCars(): Car[] {
    return [this.playerCar, ...this.aiCars];
  }

  public getPlayerCar(): Car {
    return this.playerCar;
  }

  public getTrack(): Track {
    return this.track;
  }

  public isRunning(): boolean {
    return this.isGameRunning;
  }

  public getFinishOrder(): string[] {
    return this.finishOrder;
  }

  public endGame(): void {
    this.isGameRunning = false;
    this.ui.stopTimer(true); // true = Spiel regulär beendet
    this.ui.freezeRanking();
    this.ui.showBestTime(); // Bestzeit nach Spielende anzeigen
    // Rauchwolken aller Autos entfernen
    this.playerCar.clearSmoke();
    this.aiCars.forEach(car => car.clearSmoke());
  }

  private gameLoop(): void {
    // Lösche den Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Zeichne den Track
    this.track.draw();
    
    if (this.isGameRunning) {
      // Aktualisiere und zeichne Spieler-Auto
      this.playerCar.update(this.collision);
      
      // Aktualisiere und zeichne KI-Autos
      this.aiCars.forEach(car => {
        car.update(this.collision);
        
        // KI-Steuerung hier implementieren
        car.updateAI();
      });
      
      // Prüfe alle Kollisionen zwischen den Autos
      const allCars = this.getAllCars();
      for (let i = 0; i < allCars.length; i++) {
        for (let j = i + 1; j < allCars.length; j++) {
          this.collision.checkCarCollision(allCars[i], allCars[j]);
        }
      }
      
      // Überprüfe Rundenfortschritt und aktualisiere UI
      this.checkLapProgress();
      this.ui.updateRanking(this.getAllCars());
      
      // Überprüfe Spielende
      this.checkGameEnd();
    }
    
    // Zeichne alle Autos
    this.playerCar.draw();
    this.aiCars.forEach(car => car.draw());
    
    // Fortsetzen der Animation
    this.animationFrameId = globalThis.requestAnimationFrame(this.gameLoop.bind(this));
  }

  private checkLapProgress(): void {
    if (!this.lapCountingEnabled) return;
    // Spielerauto: Runde nur zählen, wenn Ziellinie von "außen nach innen" überquert wird
    const playerCrossed = this.track.checkFinishLineCrossing(this.playerCar);
    if (playerCrossed && !this.lastPlayerLapState) {
      this.playerCar.completeLap();
      if (this.playerCar.getLapsCompleted() === 3 && !this.finishOrder.includes(this.playerCar.getName())) {
        this.finishOrder.push(this.playerCar.getName());
      }
      this.ui.updateLapCounter(this.playerCar.getLapsCompleted());
    }
    this.lastPlayerLapState = playerCrossed;
    // KI-Autos
    this.aiCars.forEach((car, idx) => {
      const crossed = this.track.checkFinishLineCrossing(car);
      if (crossed && !this.lastAiLapStates[idx]) {
        car.completeLap();
        if (car.getLapsCompleted() === 3 && !this.finishOrder.includes(car.getName())) {
          this.finishOrder.push(car.getName());
        }
      }
      this.lastAiLapStates[idx] = crossed;
    });
  }

  private checkGameEnd(): void {
    const totalLaps = 3;
    if (this.playerCar.getLapsCompleted() >= totalLaps) {
      this.endGame();
    }
  }

  private async initializeColors(): Promise<void> {
    try {
      const { CAR_COLORS } = await import('../config');
      this.availableColors = CAR_COLORS.map(color => color.value);
      
      // Load saved settings and apply them
      const savedName = localStorage.getItem('race-game-player-name');
      const savedColor = localStorage.getItem('race-game-player-color');
      
      if (savedName) {
        this.playerCar.setName(savedName);
      }
      
      if (savedColor && this.availableColors.includes(savedColor)) {
        this.playerCar.setColor(savedColor);
      }
      
      // Assign random colors to AI cars
      this.assignRandomAIColors();
    } catch (error) {
      console.warn('Could not load car colors from config:', error);
    }
  }

  private assignRandomAIColors(): void {
    const playerColor = this.playerCar.getColor();
    const availableForAI = this.availableColors.filter(color => color !== playerColor);
    
    // Shuffle the available colors
    const shuffled = [...availableForAI].sort(() => Math.random() - 0.5);
    
    // Assign colors to AI cars
    this.aiCars.forEach((car, index) => {
      if (index < shuffled.length) {
        car.setColor(shuffled[index]);
      }
    });
  }

  public updatePlayerSettings(name: string, color: string): void {
    // Update player car
    this.playerCar.setName(name);
    this.playerCar.setColor(color);
    
    // Reassign AI colors to avoid conflicts
    this.assignRandomAIColors();
    
    // Update UI ranking elements with new car names
    const allCars = this.getAllCars();
    const carNames = allCars.map(car => car.getName());
    this.ui.updateRankingElements(carNames);
    
    // Update UI to reflect the changes
    this.ui.resetUI();
  }
}