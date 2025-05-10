import { Car } from './Car';

export class UI {
  private timerElement: HTMLElement | null;
  private lapCounterElement: HTMLElement | null;
  private rankingElements: { [key: string]: HTMLElement | null };
  
  private gameStartTime: number = 0;
  private timerIntervalId: number | null = null;
  
  constructor() {
    this.timerElement = document.getElementById('timer');
    this.lapCounterElement = document.getElementById('lap-counter');
    this.rankingElements = {
      'Enzo': document.getElementById('rank-player'),
      'F50': document.getElementById('rank-ai1'),
      '360 Spider': document.getElementById('rank-ai2')
    };
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
    // Sortiere Autos nach zurückgelegter Distanz und Anzahl der vollendeten Runden
    const sortedCars = [...cars].sort((a, b) => {
      const lapsA = a.getLapsCompleted();
      const lapsB = b.getLapsCompleted();
      
      if (lapsA !== lapsB) {
        return lapsB - lapsA; // Mehr Runden = besser
      }
      
      return b.getDistanceTraveled() - a.getDistanceTraveled(); // Mehr Distanz = besser
    });
    
    // Aktualisiere die Ranglistenelemente im DOM
    sortedCars.forEach((car, index) => {
      const name = car.getName();
      const rankElement = this.rankingElements[name];
      
      if (rankElement) {
        // Aktualisiere den Text des Rangelements mit der neuen Position
        rankElement.textContent = `${index + 1}. ${name}`;
        
        // Füge den Farbblock für das Auto hinzu
        const colorSpan = document.createElement('span');
        colorSpan.className = `car-color ${car.getColor()}`;
        rankElement.appendChild(colorSpan);
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
    const rankingItems = document.querySelectorAll('.ranking-item');
    rankingItems.forEach((item) => {
      item.innerHTML = ''; // Lösche den Inhalt
    });
    
    const rankPlayerElement = document.getElementById('rank-player');
    const rankAi1Element = document.getElementById('rank-ai1');
    const rankAi2Element = document.getElementById('rank-ai2');
    
    if (rankPlayerElement) {
      rankPlayerElement.innerHTML = '1. Enzo <span class="car-color red"></span>';
    }
    if (rankAi1Element) {
      rankAi1Element.innerHTML = '2. F50 <span class="car-color black"></span>';
    }
    if (rankAi2Element) {
      rankAi2Element.innerHTML = '3. 360 Spider <span class="car-color orange"></span>';
    }
  }
}