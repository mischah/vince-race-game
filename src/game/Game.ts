import { Car } from './Car';
import { Track } from './Track';
import { UI } from './UI';
import { InputHandler } from './InputHandler';
import { Collision } from './Collision';
import { AudioManager } from './Audio';

export class Game {
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
  private isCountdownActive = false;
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private lapCountingEnabled = false; // Flag, um zu verfolgen, ob die Rundenzählung aktiviert ist

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
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
    
    this.ui = new UI();
    this.inputHandler = new InputHandler(this);
    this.collision = new Collision(this.track);
    this.audioManager = new AudioManager();
    
    // Verstecke Ampel und Countdown initial
    const trafficLight = document.getElementById('traffic-light');
    const countdown = document.getElementById('countdown');
    if (trafficLight) trafficLight.classList.add('hidden');
    if (countdown) countdown.classList.add('hidden');
  }

  public initialize(): void {
    // Lade alle Assets und richte Event-Listener ein
    this.track.loadTrack();
    
    // Platziere die Autos schon vor dem Start-Button-Klick an der Startlinie
    this.playerCar.setStartPosition(this.track.getStartPosition(0));
    this.aiCars[0].setStartPosition(this.track.getStartPosition(1));
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2));
    
    // Start-Button-Event-Listener
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', () => this.startGame());
    }
    
    // Reset-Button-Event-Listener
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetGame());
    }
    
    // Starte den Spiel-Loop
    this.gameLoop(0);
  }

  public startGame(): void {
    if (this.isGameStarted) return;
    
    this.isGameStarted = true;
    this.isCountdownActive = true;
    this.lapCountingEnabled = false; // Deaktiviere die Rundenzählung zu Beginn
    
    // Platziere Autos direkt an der Startlinie, noch bevor der Countdown beginnt
    this.playerCar.setStartPosition(this.track.getStartPosition(0));
    this.aiCars[0].setStartPosition(this.track.getStartPosition(1));
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2));
    
    // Setze die KI-Wegpunkte für die AI-Autos schon jetzt
    const aiTargetPoints = this.track.getAiPath();
    this.aiCars.forEach(car => {
      car.setAiTargetPoints(aiTargetPoints);
    });
    
    // Verstecke den Start-Button
    const startButton = document.getElementById('start-button');
    if (startButton) startButton.classList.add('hidden');
    
    // Zeige Ampel und Countdown
    const trafficLight = document.getElementById('traffic-light');
    const countdown = document.getElementById('countdown');
    if (trafficLight) trafficLight.classList.remove('hidden');
    if (countdown) countdown.classList.remove('hidden');
    
    // Starte den Countdown
    let count = 3;
    const redLight = document.querySelector('.light.red');
    const yellowLight = document.querySelector('.light.yellow');
    const greenLight = document.querySelector('.light.green');
    
    if (redLight) redLight.classList.add('active');
    
    // Spiele den ersten Countdown-Sound
    this.audioManager.playSound('beep-prepare');
    
    const countdownInterval = setInterval(() => {
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
        
        setTimeout(() => {
          // Verstecke Ampel und Countdown
          if (trafficLight) trafficLight.classList.add('hidden');
          if (countdown) countdown.classList.add('hidden');
          
          // Starte das eigentliche Spiel
          this.isGameRunning = true;
          this.isCountdownActive = false;
          this.ui.startTimer();
          
          // Aktiviere die Input-Handler
          this.inputHandler.activateControls();
          
          // Aktiviere die Rundenzählung erst nach 2 Sekunden, wenn die Autos bereits losgefahren sind
          setTimeout(() => {
            this.lapCountingEnabled = true;
          }, 2000);
        }, 1000);
        
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  public resetGame(): void {
    // Stoppe den Game-Loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Setze Spielstatus zurück
    this.isGameRunning = false;
    this.isGameStarted = false;
    this.isCountdownActive = false;
    this.lapCountingEnabled = false;
    
    // Setze UI zurück
    this.ui.resetUI();
    
    // Zeige den Start-Button
    const startButton = document.getElementById('start-button');
    if (startButton) startButton.classList.remove('hidden');
    
    // Verstecke Ampel und Countdown
    const trafficLight = document.getElementById('traffic-light');
    const countdown = document.getElementById('countdown');
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
    
    // Platziere die Autos an der Startlinie nach dem Reset
    this.playerCar.setStartPosition(this.track.getStartPosition(0));
    this.aiCars[0].setStartPosition(this.track.getStartPosition(1));
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2));
    
    // Deaktiviere Input-Handler
    this.inputHandler.deactivateControls();
    
    // Starte den Game-Loop neu
    this.gameLoop(0);
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

  public endGame(): void {
    this.isGameRunning = false;
    this.ui.stopTimer();
  }

  private gameLoop(timestamp: number): void {
    // Berechne die Zeit seit dem letzten Frame
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
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
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  private checkLapProgress(): void {
    // Überprüfe Rundenfortschritt nur, wenn die Rundenzählung aktiviert ist
    if (!this.lapCountingEnabled) return;
    
    // Überprüfe, ob der Spieler die Ziellinie überquert hat
    if (this.track.checkFinishLineCrossing(this.playerCar)) {
      this.playerCar.completeLap();
      this.ui.updateLapCounter(this.playerCar.getLapsCompleted());
    }
    
    // Überprüfe, ob die KI-Autos die Ziellinie überquert haben
    this.aiCars.forEach(car => {
      if (this.track.checkFinishLineCrossing(car)) {
        car.completeLap();
      }
    });
  }

  private checkGameEnd(): void {
    const totalLaps = 3;
    const allFinished = this.getAllCars().every(car => car.getLapsCompleted() >= totalLaps);
    
    if (allFinished) {
      this.endGame();
    }
  }
}