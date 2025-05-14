import type { Collision } from './Collision';
import type { Position, Size } from './types';

export class Car {
  private ctx: CanvasRenderingContext2D;
  private name: string;
  private color: string;
  private isPlayer: boolean;
  
  private position: Position = { x: 0, y: 0 };
  private size: Size = { width: 16, height: 28 }; // Autos verkleinert von 20x35 auf 16x28
  private speed = 0;
  private maxSpeed = 5;
  private acceleration = 0.1;
  private deceleration = 0.05;
  private friction = 0.02;
  private angle = 0; // In Radians
  private currentRotation = 0;
  private distanceTraveled = 0;
  
  private lapsCompleted = 0;
  private checkpoints: boolean[] = [];
  private isFinished = false;
  
  // KI-Parameter
  private aiTargetPoints: Position[] = [];
  private currentAiPointIndex = 0;
  private aiDifficulty = Math.random() * 0.2 + 0.7; // Zwischen 0.7 und 0.9 für Startvorteil Spieler
  private aiSteerError = (Math.random() - 0.5) * 0.06; // Zufälliger Lenkfehler pro KI-Auto
  private aiTargetOffset = {
    x: (Math.random() - 0.5) * 20, // Offset von -10 bis +10 px
    y: (Math.random() - 0.5) * 20
  };
  
  constructor(ctx: CanvasRenderingContext2D, name: string, color: string, isPlayer: boolean) {
    this.ctx = ctx;
    this.name = name;
    this.color = color;
    this.isPlayer = isPlayer;
    
    // Initialisiere Checkpoints
    for (let i = 0; i < 5; i++) {
      this.checkpoints.push(false);
    }
  }

  public draw(): void {
    this.ctx.save();
    
    // Verschiebe den Kontext zum Auto und rotiere entsprechend
    this.ctx.translate(this.position.x, this.position.y);
    this.ctx.rotate(this.angle);
    
    // Zeichne Auto-Körper
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(-this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height);
    
    // Zeichne Scheinwerfer
    this.ctx.fillStyle = 'yellow';
    this.ctx.fillRect(-this.size.width / 2 + 5, -this.size.height / 2, 5, 5);
    this.ctx.fillRect(this.size.width / 2 - 10, -this.size.height / 2, 5, 5);
    
    // Zeichne Fenster
    this.ctx.fillStyle = 'lightblue';
    const windowWidth = this.size.width * 0.6;
    const windowHeight = this.size.height * 0.3;
    this.ctx.fillRect(-windowWidth / 2, -windowHeight / 2, windowWidth, windowHeight);

    this.ctx.restore();
  }

  public update(collision: Collision): void {
    if (this.isFinished) return;

    // Automatische Beschleunigung für Spielerauto
    if (this.isPlayer) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
    }
    
    // Bewege das Auto entsprechend seiner Geschwindigkeit und Richtung
    const moveX = Math.sin(this.angle) * this.speed;
    const moveY = -Math.cos(this.angle) * this.speed;
    
    const newPosition = {
      x: this.position.x + moveX,
      y: this.position.y + moveY
    };
    
    // Prüfe auf Kollision mit Streckenbegrenzung
    if (!collision.checkTrackCollision(newPosition, this.size, this.angle)) {
      this.position = newPosition;
      this.distanceTraveled += this.speed;
    } else {
      // Arcade-Leitplanken-Logik:
      // 1. Geschwindigkeit drosseln, aber nicht stoppen
      this.speed = Math.max(this.speed * 0.7, 1.2); // sanft abbremsen, aber nicht auf 0
      // 2. Position leicht von der Wand wegschieben
      if (typeof (collision as any).getWallNormalAndType === 'function') {
        const wallInfo = (collision as any).getWallNormalAndType(this.position);
        if (wallInfo) {
          const { normal } = wallInfo;
          this.position.x += normal.x * 2.5; // sanft wegdrücken
          this.position.y += normal.y * 2.5;
        }
      }
      // 3. KEINE Änderung des Winkels durch die Wand!
      // 4. Steuerung bleibt immer aktiv
    }
    
    // Wende Reibung an (Auto wird langsamer, wenn keine Taste gedrückt wird)
    this.speed *= (1 - this.friction);
    
    // Wende die aktuell berechnete Rotation an mit Easing
    this.angle += this.currentRotation;
    
    // Begrenze den Geschwindigkeitswert, um numerische Probleme zu vermeiden
    if (Math.abs(this.speed) < 0.01) {
      this.speed = 0;
    }
  }

  public setStartPosition(position: Position): void {
    this.position = { ...position };
    this.speed = 0;
    this.angle = 0; // Auto schaut nach oben (Standard für Start)
  }

  public accelerate(): void {
    // Automatische Beschleunigung, daher leer für Spielerauto
    if (this.isFinished) return;
    if (!this.isPlayer) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
    }
  }

  public decelerate(): void {
    // Deaktiviert für Spielerauto
    if (this.isFinished) return;
    if (!this.isPlayer) {
      this.speed = Math.max(-this.maxSpeed / 2, this.speed - this.deceleration);
    }
  }

  public turnLeft(): void {
    if (this.isFinished) return;
    // Arcade-Lenkung: Feste, aber subtilere Drehung
    this.currentRotation = -0.035; // Weniger als vorher (z.B. 0.035 rad pro Frame)
  }

  public turnRight(): void {
    if (this.isFinished) return;
    // Arcade-Lenkung: Feste, aber subtilere Drehung
    this.currentRotation = 0.035;
  }

  public resetSteering(): void {
    // Arcade-Lenkung: Sofortiges Stoppen der Drehung
    this.currentRotation = 0;
  }

  public completeLap(): void {
    this.lapsCompleted++;
    
    // Setze isFinished erst auf true, wenn 3 Runden absolviert wurden
    if (this.lapsCompleted >= 3) {
      this.isFinished = true;
    }
    
    // Zurücksetzen der Checkpoints für die nächste Runde
    for (let i = 0; i < this.checkpoints.length; i++) {
      this.checkpoints[i] = false;
    }
  }

  public passCheckpoint(checkpointIndex: number): void {
    this.checkpoints[checkpointIndex] = true;
  }

  public getLapsCompleted(): number {
    return this.lapsCompleted;
  }

  public getDistanceTraveled(): number {
    return this.distanceTraveled;
  }

  public getName(): string {
    return this.name;
  }

  public getColor(): string {
    return this.color;
  }

  public getPosition(): Position {
    return { ...this.position };
  }

  public getSize(): Size {
    return { ...this.size };
  }

  public getAngle(): number {
    return this.angle;
  }

  public reset(): void {
    this.position = { x: 0, y: 0 };
    this.speed = 0;
    this.angle = 0;
    this.currentRotation = 0;
    this.lapsCompleted = 0;
    this.distanceTraveled = 0;
    this.isFinished = false;
    
    // KI-spezifische Parameter zurücksetzen
    this.currentAiPointIndex = 0;
    
    // Zurücksetzen der Checkpoints
    for (let i = 0; i < this.checkpoints.length; i++) {
      this.checkpoints[i] = false;
    }
  }

  public setAiTargetPoints(points: Position[]): void {
    this.aiTargetPoints = points;
  }

  public updateAI(): void {
    if (this.isPlayer || this.isFinished || this.aiTargetPoints.length === 0) return;
    // Starte erst, wenn das Rennen läuft
    const gameInstance = (globalThis as unknown as { gameInstance?: unknown }).gameInstance;
    if (gameInstance && typeof (gameInstance as { isRunning?: () => boolean }).isRunning === 'function' && !(gameInstance as { isRunning: () => boolean }).isRunning()) return;
    
    // KI-Steuerung für die Autos
    let currentTarget = this.aiTargetPoints[this.currentAiPointIndex];
    
    // Füge Zufalls-Offset zum Zielpunkt hinzu
    currentTarget = {
      x: currentTarget.x + this.aiTargetOffset.x,
      y: currentTarget.y + this.aiTargetOffset.y
    };
    
    // Berechne Richtung zum Zielpunkt
    const dx = currentTarget.x - this.position.x;
    const dy = currentTarget.y - this.position.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
    let targetAngle = Math.atan2(dx, -dy);
    
    // Füge Lenkfehler hinzu
    targetAngle += this.aiSteerError;
    
    // Berechne Differenz zwischen aktuellem Winkel und Zielwinkel
    let angleDiff = targetAngle - this.angle;
    
    // Normalisiere die Winkeldifferenz auf [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Lenken basierend auf der Winkeldifferenz - aggressivere Lenkung für besseres Folgen
    const turnThreshold = 0.05;
    if (angleDiff > turnThreshold) {
      this.turnRight();
    } else if (angleDiff < -turnThreshold) {
      this.turnLeft();
    } else {
      this.resetSteering();
    }
    
    // KI-Beschleunigungslogik - sanfter als Spielerauto
    this.acceleration = 0.07;
    if (this.speed < this.maxSpeed * this.aiDifficulty) {
      this.speed = Math.min(this.maxSpeed * this.aiDifficulty, this.speed + this.acceleration);
    }
    
    // Wechsle zum nächsten Punkt, wenn wir nahe genug sind - anpassbare Distanz
    const switchDistance = 30; // Kleinere Distanz für präzisere Navigation
    if (distanceToTarget < switchDistance) {
      this.currentAiPointIndex = (this.currentAiPointIndex + 1) % this.aiTargetPoints.length;
      this.aiTargetOffset = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20
      };
      this.aiSteerError = (Math.random() - 0.5) * 0.06;
    }
    
    // Kollisionsschutz: Wenn die KI-Autos zu langsam werden oder stecken bleiben
    if (this.speed < 0.5 && !this.isFinished) {
      // Stärkerer Impuls wenn sie fast stehen
      this.speed = this.maxSpeed * 0.8;
      
      // Hilft bei Kollisionen mit der Startlinie
      if (distanceToTarget > 100) {
        // Wenn wir weit vom Zielpunkt entfernt sind, springe zum nächsten Punkt
        this.currentAiPointIndex = (this.currentAiPointIndex + 1) % this.aiTargetPoints.length;
      }
    }
    
    // DEBUG: Zeichne den aktuellen Zielpunkt
    this.ctx.save();
    this.ctx.fillStyle = 'blue';
    this.ctx.beginPath();
    this.ctx.arc(currentTarget.x, currentTarget.y, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Zeichne eine Linie vom Auto zum Zielpunkt
    this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.position.x, this.position.y);
    this.ctx.lineTo(currentTarget.x, currentTarget.y);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  public setPositionAfterCollision(newPosition: Position): void {
    // Setze die Position nach einer Kollision
    // Wir fügen hier keine Kollisionsprüfung ein, da das bereits im Collision Handler passiert
    this.position = { ...newPosition };
  }

  public reduceSpeedAfterCollision(factor: number): void {
    // Reduziere die Geschwindigkeit nach einer Kollision
    this.speed *= factor;
  }

  /**
   * Gibt den Fortschritt des Autos auf der Strecke zurück (Index auf aiPath)
   */
  public getTrackProgress(track: { getProgressOnTrack(pos: Position): number }): number {
    return track.getProgressOnTrack(this.getPosition());
  }
}