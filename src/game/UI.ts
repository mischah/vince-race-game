import type  { Car } from './Car';

export class UI {
  private timerElement: HTMLElement | null;
  private lapCounterElement: HTMLElement | null;
  private rankingElements: { [key: string]: HTMLElement | null };
  private rankingContainer: HTMLElement | null;
  private currentRanking: string[] = []; // Speichert die aktuelle Reihenfolge der Autos
  private lastDistances: Map<string, number> = new Map(); // Speichert die letzte bekannte Distanz jedes Autos
  private positionConfidence: Map<string, number> = new Map(); // Speichert, wie stabil die Position jedes Autos ist
  private lastUpdateTime = 0; // Verhindert zu häufige Updates
  private updateInterval = 100; // Minimaler Abstand zwischen Updates in ms
  
  private gameStartTime: number = 0;
  private timerIntervalId: number | null = null;
  
  constructor() {
    this.timerElement = document.getElementById('timer');
    this.lapCounterElement = document.getElementById('lap-counter');
    this.rankingContainer = document.getElementById('ranking-list');
    this.rankingElements = {
      'Enzo': document.getElementById('rank-player'),
      'F50': document.getElementById('rank-ai1'),
      '360 Spider': document.getElementById('rank-ai2')
    };
    
    // Initialisiere die Anfangsrangfolge
    this.currentRanking = ['Enzo', 'F50', '360 Spider'];
    
    // Initialisiere die Konfidenzwerte
    this.positionConfidence.set('Enzo', 0);
    this.positionConfidence.set('F50', 0);
    this.positionConfidence.set('360 Spider', 0);
    
    // Wenn der Ranking-Container existiert, setze CSS für Animationen
    if (this.rankingContainer) {
      this.rankingContainer.style.position = 'relative';
      
      // Style für die Ranglisten-Items hinzufügen
      Object.values(this.rankingElements).forEach((element) => {
        if (element) {
          element.style.transition = 'transform 0.3s ease-out';
          element.style.position = 'relative';
        }
      });
    }
  }

  public startTimer(): void {
    this.gameStartTime = Date.now();
    
    // Starte den Timer, der jede 10 ms aktualisiert wird (für 1/100 Sekunde)
    this.timerIntervalId = window.setInterval(() => {
      this.updateTimer();
    }, 10);
  }

  public stopTimer(): void {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  public updateTimer(): void {
    if (!this.timerElement) return;
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.gameStartTime;
    
    // Berechne Minuten, Sekunden und Millisekunden
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const milliseconds = Math.floor((elapsedTime % 1000) / 10);
    
    // Formatiere die Zeit als MM:SS.mm
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    this.timerElement.textContent = formattedTime;
  }

  public updateLapCounter(lap: number): void {
    if (!this.lapCounterElement) return;
    
    // Aktualisiere den Rundenzähler mit dem aktuellen Rundenstand
    this.lapCounterElement.textContent = `Runde: ${lap}/3`;
  }

  public updateRanking(cars: Car[]): void {
    // Throttling - Verhindere zu häufige Updates
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    
    // Sortiere Autos zunächst nach Runden
    const byLaps = this.groupByLaps(cars);
    
    // Für jede Rundengruppe, sortiere nach Distanz
    const finalSorted: Car[] = [];
    Object.keys(byLaps).sort((a, b) => parseInt(b) - parseInt(a)).forEach(lap => {
      const carsInLap = byLaps[lap];
      const sortedByDistance = this.sortByDistanceWithHysteresis(carsInLap);
      finalSorted.push(...sortedByDistance);
    });
    
    // Extrahiere die Namen in der neuen Rangfolge
    const newRanking = finalSorted.map(car => car.getName());
    
    // Update nur wenn es eine konsistente, signifikante Änderung gab
    if (JSON.stringify(this.currentRanking) !== JSON.stringify(newRanking) &&
        this.isPositionChangeConfirmed(finalSorted)) {
      // Aktualisiere die Rangliste
      this.updateRankingDOM(finalSorted);
      this.currentRanking = newRanking;
      this.lastUpdateTime = now;
      
      // Speichere aktuelle Distanzen für zukünftigen Vergleich
      finalSorted.forEach(car => {
        this.lastDistances.set(car.getName(), car.getDistanceTraveled());
      });
    }
  }
  
  private groupByLaps(cars: Car[]): { [lap: string]: Car[] } {
    const groups: { [lap: string]: Car[] } = {};
    
    cars.forEach(car => {
      const laps = car.getLapsCompleted().toString();
      
      if (!groups[laps]) {
        groups[laps] = [];
      }
      
      groups[laps].push(car);
    });
    
    return groups;
  }
  
  private sortByDistanceWithHysteresis(cars: Car[]): Car[] {
    // Wenn weniger als 2 Autos, keine Sortierung nötig
    if (cars.length <= 1) return cars;
    
    // Sortiere zunächst nach Distanz
    return [...cars].sort((a, b) => {
      const distanceA = a.getDistanceTraveled();
      const distanceB = b.getDistanceTraveled();
      const nameA = a.getName();
      const nameB = b.getName();
      
      // Relative Position in der aktuellen Rangfolge
      const indexA = this.currentRanking.indexOf(nameA);
      const indexB = this.currentRanking.indexOf(nameB);
      const areConsecutive = Math.abs(indexA - indexB) === 1;
      
      // Distanzunterschied
      const distanceDiff = distanceB - distanceA;
      const THRESHOLD = 5; // Reduziert von 10 auf 5 für empfindlichere Erkennung
      
      if (areConsecutive) {
        // Für benachbarte Positionen prüfen wir eine Umkehr genauer
        if (indexA < indexB) {
          // A vor B in der aktuellen Liste (A soll überholt werden)
          return (distanceDiff > THRESHOLD) ? 1 : -1;
        } else {
          // B vor A in der aktuellen Liste (B soll überholt werden)
          return (distanceDiff < -THRESHOLD) ? -1 : 1;
        }
      }
      
      // Für nicht-benachbarte Positionen standard-Vergleich
      return distanceB - distanceA;
    });
  }
  
  private isPositionChangeConfirmed(cars: Car[]): boolean {
    let confirmed = true;
    
    // Überprüfe alle Autos, ob ihre Position stabil ist
    cars.forEach((car, newIndex) => {
      const name = car.getName();
      const oldIndex = this.currentRanking.indexOf(name);
      
      // Position hat sich geändert
      if (oldIndex !== newIndex) {
        // Holt den aktuellen Konfidenzwert oder 0 wenn noch nicht gesetzt
        let confidence = this.positionConfidence.get(name) || 0;
        
        // Überprüfe, ob die Position des Autos sich verbessert oder verschlechtert hat
        const betterPosition = newIndex < oldIndex;
        const currentDistance = car.getDistanceTraveled();
        const lastDistance = this.lastDistances.get(name) || 0;
        const makingProgress = currentDistance > lastDistance + 0.5; // Reduziert für höhere Empfindlichkeit
        
        // Wenn ein Auto eine neue Runde beginnt, erhöhe die Konfidenz sofort
        if (car.getLapsCompleted() > 0 && Math.abs(currentDistance - lastDistance) > 100) {
          confidence = 3; // Sofortige Bestätigung bei offensichtlicher Rundenänderung
        }
        // Wenn die Distanzänderung sehr deutlich ist, erhöhe die Konfidenz schneller
        else if (Math.abs(currentDistance - lastDistance) > 15) {
          confidence += 2;
        }
        // Normale Konfidenzerhöhung
        else if ((betterPosition && makingProgress) || (!betterPosition && !makingProgress)) {
          confidence += 1;
        } else {
          confidence = 0; // Zurücksetzen, wenn die Änderung nicht konsistent ist
        }
        
        this.positionConfidence.set(name, confidence);
        
        // Eine Positionsänderung wird erst bestätigt, wenn die Konfidenz hoch genug ist
        if (confidence < 2) { // Reduziert von 3 auf 2 für schnellere Updates
          confirmed = false;
        }
      } else {
        // Position unverändert, Konfidenz zurücksetzen
        this.positionConfidence.set(name, 0);
      }
    });
    
    return confirmed;
  }
  
  private updateRankingDOM(sortedCars: Car[]): void {
    if (!this.rankingContainer) return;
    
    // Entferne alle Elemente
    while (this.rankingContainer.firstChild) {
      this.rankingContainer.removeChild(this.rankingContainer.firstChild);
    }
    
    // Füge sie in der neuen Reihenfolge wieder hinzu
    sortedCars.forEach((car, index) => {
      const name = car.getName();
      const rankElement = this.rankingElements[name];
      
      if (rankElement) {
        // Setze den Inhalt zurück
        rankElement.innerHTML = '';
        
        // Füge den Text mit der neuen Position hinzu
        rankElement.textContent = `${index + 1}. ${name}`;
        
        // Füge den Farbblock für das Auto hinzu
        const colorSpan = document.createElement('span');
        colorSpan.className = `car-color ${car.getColor()}`;
        rankElement.appendChild(colorSpan);
        
        // Füge das Element zum Container hinzu
        this.rankingContainer?.appendChild(rankElement);
      }
    });
  }

  public resetUI(): void {
    // Stoppe und setze den Timer zurück
    this.stopTimer();
    
    if (this.timerElement) {
      this.timerElement.textContent = '0:00.00';
    }
    
    // Setze den Rundenzähler zurück
    if (this.lapCounterElement) {
      this.lapCounterElement.textContent = 'Runde: 0/3';
    }
    
    // Setze die Rangliste zurück
    if (this.rankingContainer) {
      // Entferne alle vorhandenen Elemente
      while (this.rankingContainer.firstChild) {
        this.rankingContainer.removeChild(this.rankingContainer.firstChild);
      }
      
      // Finde/Erstelle die Ranglistenelemente, falls sie nicht mehr existieren
      let rankPlayerElement = document.getElementById('rank-player');
      let rankAi1Element = document.getElementById('rank-ai1');
      let rankAi2Element = document.getElementById('rank-ai2');
      
      // Falls Elemente nicht existieren, neu erstellen
      if (!rankPlayerElement) {
        rankPlayerElement = document.createElement('div');
        rankPlayerElement.id = 'rank-player';
        rankPlayerElement.className = 'ranking-item';
        this.rankingElements['Enzo'] = rankPlayerElement;
      }
      
      if (!rankAi1Element) {
        rankAi1Element = document.createElement('div');
        rankAi1Element.id = 'rank-ai1';
        rankAi1Element.className = 'ranking-item';
        this.rankingElements['F50'] = rankAi1Element;
      }
      
      if (!rankAi2Element) {
        rankAi2Element = document.createElement('div');
        rankAi2Element.id = 'rank-ai2';
        rankAi2Element.className = 'ranking-item';
        this.rankingElements['360 Spider'] = rankAi2Element;
      }
      
      // Inhalte der Ranglistenelemente setzen
      if (rankPlayerElement) {
        rankPlayerElement.innerHTML = '1. Enzo <span class="car-color red"></span>';
        this.rankingContainer.appendChild(rankPlayerElement);
      }
      
      if (rankAi1Element) {
        rankAi1Element.innerHTML = '2. F50 <span class="car-color black"></span>';
        this.rankingContainer.appendChild(rankAi1Element);
      }
      
      if (rankAi2Element) {
        rankAi2Element.innerHTML = '3. 360 Spider <span class="car-color orange"></span>';
        this.rankingContainer.appendChild(rankAi2Element);
      }
    }
    
    // Setze die aktuelle Rangfolge zurück
    this.currentRanking = ['Enzo', 'F50', '360 Spider'];
    
    // Setze zusätzliche Tracking-Mechanismen zurück
    this.lastDistances.clear();
    this.positionConfidence.clear();
    this.positionConfidence.set('Enzo', 0);
    this.positionConfidence.set('F50', 0);
    this.positionConfidence.set('360 Spider', 0);
    
    // Setze den Zeitpunkt der letzten Aktualisierung zurück
    this.lastUpdateTime = 0;
  }
}