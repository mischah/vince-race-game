import type { Car } from './Car';

export class UI {
  private root: Document | ShadowRoot;
  private timerElement: HTMLElement | null;
  private lapCounterElement: HTMLElement | null;
  private rankingElements: { [key: string]: HTMLElement | null } = {};
  private rankingContainer: HTMLElement | null;
  private currentRanking: string[] = []; // Speichert die aktuelle Reihenfolge der Autos
  private lastDistances: Map<string, number> = new Map(); // Speichert die letzte bekannte Distanz jedes Autos
  private positionConfidence: Map<string, number> = new Map(); // Speichert, wie stabil die Position jedes Autos ist
  private lastUpdateTime = 0; // Verhindert zu häufige Updates
  private updateInterval = 100; // Minimaler Abstand zwischen Updates in ms
  private rankingFrozen = false; // Flag zum Einfrieren der Rangliste

  private gameStartTime: number = 0;
  private timerIntervalId: number | null = null;

  private bestTimeKey = 'racegame_best_time';
  private bestTime: number | null = null;
  private bestTimeElement: HTMLElement | null = null;

  constructor(root: Document | ShadowRoot = globalThis.document) {
    this.root = root;
    this.timerElement = this.root.getElementById('timer');
    this.lapCounterElement = this.root.getElementById('lap-counter');
    this.rankingContainer = this.root.getElementById('ranking-list');
    
    // Initialize with default names, will be updated when cars are available
    this.initializeRankingElements(['Enzo', 'F50', '360 Spider']);

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

    // Bestzeit-Element erzeugen
    this.bestTimeElement = this.root.getElementById('best-time');
    if (!this.bestTimeElement) {
      // Erzeuge ein Element im Kontext von root, falls möglich, sonst fallback auf globalThis.document
      const createDiv = (this.root as Document).createElement
        ? (this.root as Document).createElement.bind(this.root)
        : globalThis.document.createElement.bind(globalThis.document);
      this.bestTimeElement = createDiv('div');
      this.bestTimeElement.id = 'best-time';
      this.bestTimeElement.style.fontSize = '0.9em';
      this.bestTimeElement.style.opacity = '0.8';
      this.bestTimeElement.style.marginBottom = '2px';
      this.bestTimeElement.style.fontFamily = 'monospace';
      this.bestTimeElement.style.textAlign = 'center';
      this.bestTimeElement.style.display = 'none';
      // Timer-Container oder Start-Button suchen
      const timerContainer = this.root.getElementById('timer-container');
      if (timerContainer) {
        timerContainer.parentElement?.insertBefore(this.bestTimeElement, timerContainer);
      } else {
        // Fallback: vor Start-Button
        const startBtn = this.root.getElementById('start-button');
        if (startBtn && startBtn.parentElement) {
          startBtn.parentElement.insertBefore(this.bestTimeElement, startBtn);
        }
      }
    }
    this.loadBestTime();
    this.showBestTime();
  }

  private initializeRankingElements(carNames: string[]) {
    this.rankingElements = {};
    const elementIds = ['rank-player', 'rank-ai1', 'rank-ai2'];
    
    carNames.forEach((name, index) => {
      const elementId = elementIds[index];
      if (elementId) {
        this.rankingElements[name] = this.root.getElementById(elementId);
      }
    });
  }

  public updateRankingElements(carNames: string[]) {
    this.initializeRankingElements(carNames);
    this.currentRanking = carNames;
    
    // Reset confidence for new names
    this.positionConfidence.clear();
    carNames.forEach(name => {
      this.positionConfidence.set(name, 0);
    });
  }

  private loadBestTime() {
    const val = globalThis.localStorage.getItem(this.bestTimeKey);
    this.bestTime = val ? parseInt(val, 10) : null;
  }

  private saveBestTime(ms: number) {
    this.bestTime = ms;
    globalThis.localStorage.setItem(this.bestTimeKey, String(ms));
  }

  private formatMs(ms: number, showMillis = true): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (showMillis) {
      const milliseconds = Math.floor((ms % 1000) / 10);
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  public showBestTime() {
    if (this.bestTimeElement && this.bestTime !== null) {
      // Bestzeit immer wie die aktuelle Zeit runden (mit Hundertstel)
      this.bestTimeElement.textContent = `Bestzeit: ${this.formatMs(this.bestTime, true)}`;
      this.bestTimeElement.style.display = '';
    } else if (this.bestTimeElement) {
      this.bestTimeElement.style.display = 'none';
    }
  }

  public hideBestTime() {
    if (this.bestTimeElement) this.bestTimeElement.style.display = 'none';
  }

  public getBestTime(): number | null {
    return this.bestTime;
  }

  public showBestTimeAboveStart() {
    if (this.bestTimeElement && this.bestTime !== null) {
      this.bestTimeElement.textContent = `Bestzeit: ${this.formatMs(this.bestTime)}`;
      this.bestTimeElement.style.display = '';
    }
  }

  public startTimer(): void {
    this.gameStartTime = Date.now();

    // Starte den Timer, der jede 10 ms aktualisiert wird (für 1/100 Sekunde)
    this.timerIntervalId = globalThis.setInterval(() => {
      this.updateTimer();
    }, 10);
  }

  public stopTimer(isGameEnd = false): void {
    if (this.timerIntervalId !== null) {
      globalThis.clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    // Bestzeit speichern, wenn nötig und das Spiel regulär beendet wurde
    if (isGameEnd) {
      const elapsed = Date.now() - this.gameStartTime;
      if (this.timerElement && this.timerElement.textContent && this.timerElement.textContent !== '0:00.00') {
        if (this.bestTime === null || elapsed < this.bestTime) {
          this.saveBestTime(elapsed);
          this.showBestTime();
        }
      }
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

  public freezeRanking(): void {
    this.rankingFrozen = true;
  }

  public updateRanking(cars: Car[]): void {
    // Wenn eine feste Einlaufreihenfolge existiert, zeige diese an
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const game = (globalThis as { gameInstance?: any }).gameInstance;
    if (game && typeof game.getFinishOrder === 'function') {
      const finishOrder: string[] = game.getFinishOrder();
      if (finishOrder && finishOrder.length > 0) {
        // Sortiere die Autos nach finishOrder, Rest nach aktueller Logik
        const finishedCars = finishOrder.map(name => cars.find(car => car.getName() === name)).filter(Boolean) as Car[];
        const unfinishedCars = cars.filter(car => !finishOrder.includes(car.getName()));
        // Unfertige Autos nach aktueller Logik sortieren
        const byLaps = this.groupByLaps(unfinishedCars);
        const finalSorted: Car[] = [...finishedCars];
        Object.keys(byLaps).sort((a, b) => parseInt(b) - parseInt(a)).forEach(lap => {
          const carsInLap = byLaps[lap];
          const sortedByDistance = this.sortByDistanceWithHysteresis(carsInLap);
          finalSorted.push(...sortedByDistance);
        });
        this.updateRankingDOM(finalSorted);
        this.currentRanking = finalSorted.map(car => car.getName());
        return;
      }
    }
    if (this.rankingFrozen) return;

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
    if (cars.length <= 1) return cars;
    // Sortiere nach Streckenfortschritt (aiPath), nicht nach distanceTraveled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const game = (globalThis as { gameInstance?: any }).gameInstance;
    const track = game && typeof game.getTrack === 'function' ? game.getTrack() : null;
    return [...cars].sort((a, b) => {
      if (track) {
        const progressA = a.getTrackProgress(track);
        const progressB = b.getTrackProgress(track);
        // Höherer Fortschritt = weiter vorne
        if (progressB !== progressA) return progressB - progressA;
      }
      // Fallback: nach distanceTraveled
      return b.getDistanceTraveled() - a.getDistanceTraveled();
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
        const createSpan = (this.root as Document).createElement
          ? (this.root as Document).createElement.bind(this.root)
          : globalThis.document.createElement.bind(globalThis.document);
        const colorSpan = createSpan('span');
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
      let rankPlayerElement = this.root.getElementById('rank-player');
      let rankAi1Element = this.root.getElementById('rank-ai1');
      let rankAi2Element = this.root.getElementById('rank-ai2');

      // Falls Elemente nicht existieren, neu erstellen
      const createDiv = (this.root as Document).createElement
        ? (this.root as Document).createElement.bind(this.root)
        : globalThis.document.createElement.bind(globalThis.document);
      if (!rankPlayerElement) {
        rankPlayerElement = createDiv('div');
        rankPlayerElement.id = 'rank-player';
        rankPlayerElement.className = 'ranking-item';
        this.rankingElements['Enzo'] = rankPlayerElement;
      }

      if (!rankAi1Element) {
        rankAi1Element = createDiv('div');
        rankAi1Element.id = 'rank-ai1';
        rankAi1Element.className = 'ranking-item';
        this.rankingElements['F50'] = rankAi1Element;
      }

      if (!rankAi2Element) {
        rankAi2Element = createDiv('div');
        rankAi2Element.id = 'rank-ai2';
        rankAi2Element.className = 'ranking-item';
        this.rankingElements['360 Spider'] = rankAi2Element;
      }

      // Populate ranking with current car information
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gameInstance = (globalThis as { gameInstance?: any }).gameInstance;
      if (gameInstance && typeof gameInstance.getAllCars === 'function') {
        const cars = gameInstance.getAllCars();
        const elements = [rankPlayerElement, rankAi1Element, rankAi2Element];
        
        // Clear old mappings
        this.rankingElements = {};
        
        cars.forEach((car: any, index: number) => {
          const element = elements[index];
          if (element) {
            element.innerHTML = `${index + 1}. ${car.getName()} <span class="car-color ${car.getColor()}"></span>`;
            this.rankingContainer?.appendChild(element);
            // Update the ranking elements mapping with current car names
            this.rankingElements[car.getName()] = element;
          }
        });
      } else {
        // Fallback to default
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
    }

    // Get current car names for ranking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let carNames = ['Enzo', 'F50', '360 Spider'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameInstance = (globalThis as { gameInstance?: any }).gameInstance;
    if (gameInstance && typeof gameInstance.getAllCars === 'function') {
      const cars = gameInstance.getAllCars();
      carNames = cars.map((car: any) => car.getName());
    }
    
    // Setze die aktuelle Rangfolge zurück
    this.currentRanking = carNames;

    // Setze zusätzliche Tracking-Mechanismen zurück
    this.lastDistances.clear();
    this.positionConfidence.clear();
    this.positionConfidence.set('Enzo', 0);
    this.positionConfidence.set('F50', 0);
    this.positionConfidence.set('360 Spider', 0);

    // Setze den Zeitpunkt der letzten Aktualisierung zurück
    this.lastUpdateTime = 0;

    this.rankingFrozen = false;

    this.showBestTime();
  }
}