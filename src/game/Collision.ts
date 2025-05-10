import type { Position, Size } from './types';
import { Car } from './Car';
import { Track } from './Track';

export class Collision {
  private track: Track;
  
  constructor(track: Track) {
    this.track = track;
  }

  public checkTrackCollision(position: Position, size: Size, angle: number): boolean {
    return this.track.checkTrackCollision(position, size, angle);
  }

  public checkCarCollision(car1: Car, car2: Car): boolean {
    // Vereinfachte Kollisionserkennung zwischen zwei Autos
    const pos1 = car1.getPosition();
    const pos2 = car2.getPosition();
    const size1 = car1.getSize();
    const size2 = car2.getSize();
    
    // Berechne den Abstand zwischen den beiden Autos
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Berechne den minimalen Abstand, bei dem die Autos kollidieren
    // (vereinfacht als Durchschnitt der Breiten und Höhen)
    const minDistance = (size1.width + size2.width + size1.height + size2.height) / 4;
    
    // Wenn die Autos kollidieren
    if (distance < minDistance) {
      this.resolveCarCollision(car1, car2);
      return true;
    }
    
    return false;
  }

  private resolveCarCollision(car1: Car, car2: Car): void {
    // Verbesserte Kollisionsauflösung zwischen Autos
    
    const pos1 = car1.getPosition();
    const pos2 = car2.getPosition();
    
    // Bestimme die Richtung der Kollision
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    
    // Normalisiere den Richtungsvektor
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return; // Vermeidung einer Division durch Null
    
    const nx = dx / length;
    const ny = dy / length;
    
    // Verschiebe die Autos auseinander basierend auf der Kollisionsrichtung
    // Erhöhe die Separationsdistanz für eine stärkere Trennung
    const separation = 5.0; // Erhöht von 2.0 auf 5.0 für stärkere Trennung
    
    // Berechne neue Positionen für beide Autos
    const car1NewPos: Position = {
      x: pos1.x - nx * separation,
      y: pos1.y - ny * separation
    };
    
    const car2NewPos: Position = {
      x: pos2.x + nx * separation,
      y: pos2.y + ny * separation
    };
    
    // Überprüfe, ob die neuen Positionen zu Kollisionen mit der Strecke führen würden
    const car1Size = car1.getSize();
    const car2Size = car2.getSize();
    const car1Angle = car1.getAngle();
    const car2Angle = car2.getAngle();
    
    const car1TrackCollision = this.checkTrackCollision(car1NewPos, car1Size, car1Angle);
    const car2TrackCollision = this.checkTrackCollision(car2NewPos, car2Size, car2Angle);
    
    // Wende die neuen Positionen nur an, wenn sie nicht zu Streckenkollisionen führen
    if (!car1TrackCollision) {
      car1.setPositionAfterCollision(car1NewPos);
    } else {
      // Versuche eine geringere Verschiebung, wenn volle Verschiebung nicht möglich ist
      const reducedSeparation = separation * 0.5;
      const reducedPos: Position = {
        x: pos1.x - nx * reducedSeparation,
        y: pos1.y - ny * reducedSeparation
      };
      
      if (!this.checkTrackCollision(reducedPos, car1Size, car1Angle)) {
        car1.setPositionAfterCollision(reducedPos);
      }
    }
    
    if (!car2TrackCollision) {
      car2.setPositionAfterCollision(car2NewPos);
    } else {
      // Versuche eine geringere Verschiebung, wenn volle Verschiebung nicht möglich ist
      const reducedSeparation = separation * 0.5;
      const reducedPos: Position = {
        x: pos2.x + nx * reducedSeparation,
        y: pos2.y + ny * reducedSeparation
      };
      
      if (!this.checkTrackCollision(reducedPos, car2Size, car2Angle)) {
        car2.setPositionAfterCollision(reducedPos);
      }
    }
    
    // Reduziere die Geschwindigkeit beider Autos nach einer Kollision
    // Erhöhter Geschwindigkeitsreduktionsfaktor für stärkere Abbremsung
    car1.reduceSpeedAfterCollision(0.3); // Von 0.5 auf 0.3 geändert für stärkere Abbremsung
    car2.reduceSpeedAfterCollision(0.3);
  }
}