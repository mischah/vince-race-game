import { Game } from './Game';

export class InputHandler {
  private game: Game;
  private keys: { [key: string]: boolean } = {};
  private controlsActive = false;
  
  constructor(game: Game) {
    this.game = game;
    
    // Event-Listener für Tastatur-Events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.controlsActive) return;
    
    this.keys[event.key] = true;
    
    // Verhindere Standard-Scroll-Verhalten bei Pfeiltasten
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
    
    this.updateControls();
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys[event.key] = false;
    
    if (!this.controlsActive) return;
    
    // Wenn die Lenkungstasten losgelassen werden, setze das Lenkrad zurück
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.game.getPlayerCar().resetSteering();
    }
  }

  private updateControls(): void {
    const playerCar = this.game.getPlayerCar();
    // Nur noch Lenkung für das Spielerauto
    if (this.keys['ArrowLeft']) {
      playerCar.turnLeft();
    }
    if (this.keys['ArrowRight']) {
      playerCar.turnRight();
    }
    // KI-Autos werden wie gehabt behandelt (falls nötig)
  }

  public activateControls(): void {
    this.controlsActive = true;
  }

  public deactivateControls(): void {
    this.controlsActive = false;
    
    // Setze alle Tasten zurück
    Object.keys(this.keys).forEach(key => {
      this.keys[key] = false;
    });
  }

  public checkControls(): void {
    if (!this.controlsActive) return;
    
    // Überprüfe und aktualisiere die Steuerung in jedem Frame
    this.updateControls();
  }
}