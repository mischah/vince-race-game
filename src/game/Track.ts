import type { Position, Size, CarInterface } from './types';

export class Track {
  private ctx: CanvasRenderingContext2D;
  private startPositions: Position[] = [];
  private finishLine: { start: Position, end: Position };
  private trackBoundaries: Position[][] = [];
  
  // Spur-Wegpunkte für die KI
  private aiPath: Position[] = [];
  
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    
    // Standard-Werte initialisieren, werden später überschrieben
    this.finishLine = {
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 }
    };
  }

  public loadTrack(): void {
    // Statt ein Bild zu laden, definieren wir direkt die Strecke
    this.defineTrackBoundaries();
    this.defineAiPath();
  }

  public draw(): void {
    // Zeichne den Hintergrund
    this.ctx.fillStyle = '#4A6530'; // Grüner Hintergrund für Gras
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Zeichne die Strecke
    this.drawTrack();
    
    // Zeichne die Start/Ziel-Linie
    this.drawFinishLine();
  }

  private drawTrack(): void {
    this.ctx.save();
    
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Rechteckige Strecke mit abgerundeten Ecken
    // Dimensionen des Rechtecks - Höhe auf 80% des Canvas erhöht
    const rectWidth = canvasWidth * 0.8;
    const rectHeight = canvasHeight * 0.8; // Von 0.7 auf 0.8 erhöht
    const trackWidth = Math.min(rectWidth, rectHeight) * 0.15; // Breite der Strecke zurück auf 0.15 gesetzt
    
    // Berechne die Ecken des äußeren und inneren Rechtecks
    const outerLeft = centerX - rectWidth / 2;
    const outerRight = centerX + rectWidth / 2;
    const outerTop = centerY - rectHeight / 2;
    const outerBottom = centerY + rectHeight / 2;
    
    const innerLeft = outerLeft + trackWidth;
    const innerRight = outerRight - trackWidth;
    const innerTop = outerTop + trackWidth;
    const innerBottom = outerBottom - trackWidth;
    
    // Radius für die abgerundeten Ecken (220% der Streckenbreite)
    const outerCornerRadius = trackWidth * 2.2; // 220% der Streckenbreite
    const innerCornerRadius = outerCornerRadius - trackWidth;
    
    // Zeichne äußeres Rechteck mit abgerundeten Ecken
    this.ctx.beginPath();
    this.ctx.moveTo(outerLeft + outerCornerRadius, outerTop); // Oben links anfangen
    this.ctx.lineTo(outerRight - outerCornerRadius, outerTop); // Nach oben rechts
    this.ctx.arcTo(outerRight, outerTop, outerRight, outerTop + outerCornerRadius, outerCornerRadius); // Ecke oben rechts
    this.ctx.lineTo(outerRight, outerBottom - outerCornerRadius); // Nach unten rechts
    this.ctx.arcTo(outerRight, outerBottom, outerRight - outerCornerRadius, outerBottom, outerCornerRadius); // Ecke unten rechts
    this.ctx.lineTo(outerLeft + outerCornerRadius, outerBottom); // Nach unten links
    this.ctx.arcTo(outerLeft, outerBottom, outerLeft, outerBottom - outerCornerRadius, outerCornerRadius); // Ecke unten links
    this.ctx.lineTo(outerLeft, outerTop + outerCornerRadius); // Nach oben links
    this.ctx.arcTo(outerLeft, outerTop, outerLeft + outerCornerRadius, outerTop, outerCornerRadius); // Ecke oben links
    this.ctx.closePath();
    
    // Fülle und umrande äußeres Rechteck
    this.ctx.fillStyle = '#333333'; // Dunkelgrau für Asphalt
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    
    // Zeichne inneres Rechteck mit abgerundeten Ecken
    this.ctx.beginPath();
    this.ctx.moveTo(innerLeft + innerCornerRadius, innerTop); // Oben links anfangen
    this.ctx.lineTo(innerRight - innerCornerRadius, innerTop); // Nach oben rechts
    this.ctx.arcTo(innerRight, innerTop, innerRight, innerTop + innerCornerRadius, innerCornerRadius); // Ecke oben rechts
    this.ctx.lineTo(innerRight, innerBottom - innerCornerRadius); // Nach unten rechts
    this.ctx.arcTo(innerRight, innerBottom, innerRight - innerCornerRadius, innerBottom, innerCornerRadius); // Ecke unten rechts
    this.ctx.lineTo(innerLeft + innerCornerRadius, innerBottom); // Nach unten links
    this.ctx.arcTo(innerLeft, innerBottom, innerLeft, innerBottom - innerCornerRadius, innerCornerRadius); // Ecke unten links
    this.ctx.lineTo(innerLeft, innerTop + innerCornerRadius); // Nach oben links
    this.ctx.arcTo(innerLeft, innerTop, innerLeft + innerCornerRadius, innerTop, innerCornerRadius); // Ecke oben links
    this.ctx.closePath();
    
    // Fülle und umrande inneres Rechteck
    this.ctx.fillStyle = '#4A6530'; // Grün für Gras
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  private drawFinishLine(): void {
    this.ctx.save();
    
    const { start, end } = this.finishLine;
    
    // Berechne die Breite und Länge der Ziellinie
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const width = 20; // Breite der Startlinie
    
    // Berechne den Winkel der Linie
    const angle = Math.atan2(dy, dx);
    
    // Verschiebe und rotiere den Kontext für die Ziellinie
    this.ctx.translate((start.x + end.x) / 2, (start.y + end.y) / 2);
    this.ctx.rotate(angle + Math.PI/2); // 90° Drehung damit das Muster horizontal verläuft
    
    // Ziehe die Ziellinie als horizontalen Balken
    this.ctx.fillStyle = '#000000'; // Hintergrundfarbe für die Startlinie
    this.ctx.fillRect(-width/2, -length/2, width, length);
    
    // Zeichne das schwarz-weiße Schachbrettmuster
    const squareSize = 10; // Größe jedes Quadrats
    const numSquaresX = Math.ceil(width / squareSize);
    const numSquaresY = Math.ceil(length / squareSize);
    
    for (let x = 0; x < numSquaresX; x++) {
      for (let y = 0; y < numSquaresY; y++) {
        // Nur bei geraden Summen von x+y weißes Quadrat zeichnen
        if ((x + y) % 2 === 0) {
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.fillRect(
            -width/2 + x * squareSize,
            -length/2 + y * squareSize,
            squareSize,
            squareSize
          );
        }
      }
    }
    
    this.ctx.restore();
  }

  private defineTrackBoundaries(): void {
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Rechteckige Strecke mit abgerundeten Ecken
    // Dimensionen des Rechtecks - Höhe auf 80% des Canvas erhöht
    const rectWidth = canvasWidth * 0.8;
    const rectHeight = canvasHeight * 0.8; // Von 0.7 auf 0.8 erhöht
    const trackWidth = Math.min(rectWidth, rectHeight) * 0.15; // Breite der Strecke zurück auf 0.15 gesetzt
    
    // Berechne die Ecken des äußeren Rechtecks
    const outerLeft = centerX - rectWidth / 2;
    const outerRight = centerX + rectWidth / 2;
    const outerTop = centerY - rectHeight / 2;
    const outerBottom = centerY + rectHeight / 2;
    
    // Radius für die abgerundeten Ecken (220% der Streckenbreite)
    const outerCornerRadius = trackWidth * 2.2; // 220% der Streckenbreite
    const innerCornerRadius = outerCornerRadius - trackWidth;
    
    // Generiere Punkte für die Kollisionserkennung
    const outerPoints: Position[] = [];
    const innerPoints: Position[] = [];
    
    // Hilfsfunktion für die Interpolation von Punkten auf einem Kreisbogen
    const arcPoints = (
      centerX: number, centerY: number, radius: number, 
      startAngle: number, endAngle: number, numPoints: number,
      array: Position[]
    ) => {
      for (let i = 0; i <= numPoints; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
        array.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
    };
    
    // Obere rechte Ecke (äußerer Rand)
    arcPoints(
      outerRight - outerCornerRadius, outerTop + outerCornerRadius, outerCornerRadius,
      -Math.PI/2, 0, 10, outerPoints
    );
    
    // Rechte Seite (äußerer Rand)
    outerPoints.push({ x: outerRight, y: outerTop + outerCornerRadius });
    outerPoints.push({ x: outerRight, y: outerBottom - outerCornerRadius });
    
    // Untere rechte Ecke (äußerer Rand)
    arcPoints(
      outerRight - outerCornerRadius, outerBottom - outerCornerRadius, outerCornerRadius,
      0, Math.PI/2, 10, outerPoints
    );
    
    // Untere Seite (äußerer Rand)
    outerPoints.push({ x: outerRight - outerCornerRadius, y: outerBottom });
    outerPoints.push({ x: outerLeft + outerCornerRadius, y: outerBottom });
    
    // Untere linke Ecke (äußerer Rand)
    arcPoints(
      outerLeft + outerCornerRadius, outerBottom - outerCornerRadius, outerCornerRadius,
      Math.PI/2, Math.PI, 10, outerPoints
    );
    
    // Linke Seite (äußerer Rand)
    outerPoints.push({ x: outerLeft, y: outerBottom - outerCornerRadius });
    outerPoints.push({ x: outerLeft, y: outerTop + outerCornerRadius });
    
    // Obere linke Ecke (äußerer Rand)
    arcPoints(
      outerLeft + outerCornerRadius, outerTop + outerCornerRadius, outerCornerRadius,
      Math.PI, Math.PI*3/2, 10, outerPoints
    );
    
    // Obere Seite (äußerer Rand)
    outerPoints.push({ x: outerLeft + outerCornerRadius, y: outerTop });
    outerPoints.push({ x: outerRight - outerCornerRadius, y: outerTop });
    
    // Innerer Rand (in umgekehrter Reihenfolge)
    // Obere rechte Ecke (innerer Rand)
    arcPoints(
      outerRight - trackWidth - innerCornerRadius, outerTop + trackWidth + innerCornerRadius, innerCornerRadius,
      -Math.PI/2, 0, 10, innerPoints
    );
    
    // Rechte Seite (innerer Rand)
    innerPoints.push({ x: outerRight - trackWidth, y: outerTop + trackWidth + innerCornerRadius });
    innerPoints.push({ x: outerRight - trackWidth, y: outerBottom - trackWidth - innerCornerRadius });
    
    // Untere rechte Ecke (innerer Rand)
    arcPoints(
      outerRight - trackWidth - innerCornerRadius, outerBottom - trackWidth - innerCornerRadius, innerCornerRadius,
      0, Math.PI/2, 10, innerPoints
    );
    
    // Untere Seite (innerer Rand)
    innerPoints.push({ x: outerRight - trackWidth - innerCornerRadius, y: outerBottom - trackWidth });
    innerPoints.push({ x: outerLeft + trackWidth + innerCornerRadius, y: outerBottom - trackWidth });
    
    // Untere linke Ecke (innerer Rand)
    arcPoints(
      outerLeft + trackWidth + innerCornerRadius, outerBottom - trackWidth - innerCornerRadius, innerCornerRadius,
      Math.PI/2, Math.PI, 10, innerPoints
    );
    
    // Linke Seite (innerer Rand)
    innerPoints.push({ x: outerLeft + trackWidth, y: outerBottom - trackWidth - innerCornerRadius });
    innerPoints.push({ x: outerLeft + trackWidth, y: outerTop + trackWidth + innerCornerRadius });
    
    // Obere linke Ecke (innerer Rand)
    arcPoints(
      outerLeft + trackWidth + innerCornerRadius, outerTop + trackWidth + innerCornerRadius, innerCornerRadius,
      Math.PI, Math.PI*3/2, 10, innerPoints
    );
    
    // Obere Seite (innerer Rand)
    innerPoints.push({ x: outerLeft + trackWidth + innerCornerRadius, y: outerTop + trackWidth });
    innerPoints.push({ x: outerRight - trackWidth - innerCornerRadius, y: outerTop + trackWidth });
    
    // Speichere die Punkte für die Kollisionserkennung
    this.trackBoundaries = [outerPoints, innerPoints];

    // Setze die Startlinie (rechte Seite, horizontal)
    // Die Ziellinie sollte senkrecht zur Fahrtrichtung verlaufen und
    // von der inneren bis zur äußeren Begrenzung gehen
    // Wir nehmen die rechte Gerade, also von innen nach außen auf der rechten Seite
    const finishLineYOffset = 110; // Verschiebung nach unten
    this.finishLine = {
      start: { x: outerRight - trackWidth + 2, y: centerY + finishLineYOffset }, // +80 Pixel nach unten
      end:   { x: outerRight - 2, y: centerY + finishLineYOffset }  // +80 Pixel nach unten
    };

    // Startpositionen der Autos: Spielerauto in die Mitte
    const startY = centerY + 40 + finishLineYOffset; // 40 Pixel unterhalb der neuen Startlinie
    const carSpacing = ((outerRight - (outerRight - trackWidth)) - 4) / 5;
    this.startPositions = [
      { x: outerRight - trackWidth + carSpacing, y: startY },      // links (KI)
      { x: outerRight - trackWidth + carSpacing * 2.5, y: startY }, // mitte (Spieler)
      { x: outerRight - trackWidth + carSpacing * 4, y: startY }   // rechts (KI)
    ];
  }

  private defineAiPath(): void {
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Rechteckige Strecke mit abgerundeten Ecken
    // Dimensionen des Rechtecks - Höhe auf 80% des Canvas erhöht
    const rectWidth = canvasWidth * 0.8;
    const rectHeight = canvasHeight * 0.8; // Von 0.7 auf 0.8 erhöht
    const trackWidth = Math.min(rectWidth, rectHeight) * 0.15; // Breite der Strecke zurück auf 0.15 gesetzt
    
    // Mittelpunkt der Strecke für KI-Pfade
    const middleTrackWidth = trackWidth / 2;
    
    // Berechne die Ecken des äußeren Rechtecks
    const outerLeft = centerX - rectWidth / 2;
    const outerRight = centerX + rectWidth / 2;
    const outerTop = centerY - rectHeight / 2;
    const outerBottom = centerY + rectHeight / 2;
    
    // Mittelpfad
    const midLeft = outerLeft + middleTrackWidth;
    const midRight = outerRight - middleTrackWidth;
    const midTop = outerTop + middleTrackWidth;
    const midBottom = outerBottom - middleTrackWidth; // Korrigiert: - statt +
    
    // Radius für die abgerundeten Ecken (220% der Streckenbreite)
    const midCornerRadius = trackWidth * 2.2 - middleTrackWidth; // Von 1.35 auf 2.2 erhöht (220%)
    
    this.aiPath = [];
    
    // Hilfsfunktion für die Interpolation von Punkten auf einem Kreisbogen
    const arcPoints = (
      centerX: number, centerY: number, radius: number,
      startAngle: number, endAngle: number, numPoints: number
    ) => {
      for (let i = 0; i <= numPoints; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
        this.aiPath.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
    };
    
    // Startpunkt setzen - jetzt auf der rechten Seite, gleiche X-Position wie die Autos
    const startX = outerRight - trackWidth + (outerRight - (outerRight - trackWidth)) / 2;
    this.aiPath.push({ x: startX, y: centerY });

    // Nach oben bis zur Kurve
    this.aiPath.push({ x: midRight, y: midTop + midCornerRadius });

    // Obere rechte Kurve
    arcPoints(
      midRight - midCornerRadius, 
      midTop + midCornerRadius, 
      midCornerRadius,
      0, 
      -Math.PI/2, 
      10
    );

    // Obere Seite nach links
    this.aiPath.push({ x: midRight - midCornerRadius, y: midTop });
    this.aiPath.push({ x: midLeft + midCornerRadius, y: midTop });

    // Obere linke Kurve
    arcPoints(
      midLeft + midCornerRadius, 
      midTop + midCornerRadius, 
      midCornerRadius,
      -Math.PI/2, 
      -Math.PI, 
      10
    );

    // Linke Seite nach unten
    this.aiPath.push({ x: midLeft, y: midTop + midCornerRadius });
    this.aiPath.push({ x: midLeft, y: midBottom - midCornerRadius });

    // Untere linke Kurve
    arcPoints(
      midLeft + midCornerRadius, 
      midBottom - midCornerRadius, 
      midCornerRadius,
      -Math.PI, 
      -Math.PI*3/2, 
      10
    );

    // Untere Seite nach rechts
    this.aiPath.push({ x: midLeft + midCornerRadius, y: midBottom });
    this.aiPath.push({ x: midRight - midCornerRadius, y: midBottom });

    // Untere rechte Kurve
    arcPoints(
      midRight - midCornerRadius, 
      midBottom - midCornerRadius, 
      midCornerRadius,
      Math.PI/2, 
      0, 
      10
    );

    // Rechte Seite nach oben zurück zum Start
    this.aiPath.push({ x: midRight, y: midBottom - midCornerRadius });
    this.aiPath.push({ x: startX, y: centerY });
  }

  public getAiPath(): Position[] {
    return this.aiPath;
  }

  public getStartPosition(index: number): Position {
    // Make sure index is within bounds of available start positions
    if (index >= 0 && index < this.startPositions.length) {
      return this.startPositions[index];
    }
    // Return default position if index is out of bounds
    return this.startPositions[0] || { x: 0, y: 0 };
  }

  public checkTrackCollision(position: Position, size: Size, angle: number): boolean {
    // Vereinfachte Kollisionserkennung mit Punkten um das Auto herum
    const points = this.getCarCornerPoints(position, size, angle);
    
    // Wir müssen zwei Bedingungen prüfen:
    // 1. Ist ein Punkt außerhalb der äußeren Begrenzung?
    // 2. Ist ein Punkt innerhalb der inneren Begrenzung?
    for (const point of points) {
      if (!this.isPointInTrack(point)) {
        return true; // Kollision gefunden
      }
    }
    
    return false; // Keine Kollision
  }

  public checkFinishLineCrossing(car: CarInterface): boolean {
    const carPos = car.getPosition();
    const { start, end } = this.finishLine;
    
    // Berechne Vektor der Ziellinie
    const lineVecX = end.x - start.x;
    const lineVecY = end.y - start.y;
    const lineLength = Math.sqrt(lineVecX * lineVecX + lineVecY * lineVecY);
    
    // Normalisierter Vektor der Ziellinie
    const lineNormX = lineVecX / lineLength;
    const lineNormY = lineVecY / lineLength;
    
    // Vektor vom Startpunkt der Linie zum Auto
    const carVecX = carPos.x - start.x;
    const carVecY = carPos.y - start.y;
    
    // Projektion des Auto-Vektors auf die Ziellinie
    const dotProduct = carVecX * lineNormX + carVecY * lineNormY;
    
    // Prüfe, ob die Projektion innerhalb der Linienlänge liegt
    const isOnLine = dotProduct >= 0 && dotProduct <= lineLength;
    
    // Berechne den Abstand des Autos zur Linie
    const projX = start.x + lineNormX * dotProduct;
    const projY = start.y + lineNormY * dotProduct;
    const distance = Math.sqrt(
      Math.pow(carPos.x - projX, 2) + Math.pow(carPos.y - projY, 2)
    );
    
    // Überprüfen der Bewegungsrichtung - Wir wollen, dass das Auto von unten nach oben fährt (gegen den Uhrzeigersinn)
    // (Das Spiel nutzt ein Koordinatensystem, bei dem die y-Achse nach unten zunimmt)
    // Erlaube angle nahe 0 oder nahe 2π (Auto fährt nach oben)
    const movingUp = car.getAngle() <= Math.PI / 2 || car.getAngle() >= (3 * Math.PI) / 2;
    
    // Auto überquert die Ziellinie, wenn:
    // 1. Es nahe genug an der Linie ist
    // 2. Es auf der Linie ist (zwischen Start- und Endpunkt)
    // 3. Es sich in der richtigen Richtung bewegt (von unten nach oben)
    return isOnLine && distance < 10 && movingUp;
  }

  /**
   * Gibt die Wandnormale und den Typ ('outer' | 'inner') für eine gegebene Position zurück.
   * Die Normale zeigt IMMER von der Wand in Richtung Strecke.
   */
  public getWallNormalAndType(position: Position): { normal: Position, type: 'outer' | 'inner' } | null {
    if (!this.trackBoundaries.length) return null;
    const [outer, inner] = this.trackBoundaries;
    // Finde den nächsten Punkt auf der äußeren und inneren Begrenzung
    let minDistOuter = Infinity;
    let closestOuter: Position | null = null;
    for (const p of outer) {
      const dx = position.x - p.x;
      const dy = position.y - p.y;
      const dist = dx*dx + dy*dy;
      if (dist < minDistOuter) {
        minDistOuter = dist;
        closestOuter = p;
      }
    }
    let minDistInner = Infinity;
    let closestInner: Position | null = null;
    for (const p of inner) {
      const dx = position.x - p.x;
      const dy = position.y - p.y;
      const dist = dx*dx + dy*dy;
      if (dist < minDistInner) {
        minDistInner = dist;
        closestInner = p;
      }
    }
    // Entscheide, ob näher an außen oder innen
    if (minDistOuter < minDistInner) {
      // Außenwand: Normale zeigt nach innen (zur Streckenmitte)
      const center = { x: this.ctx.canvas.width/2, y: this.ctx.canvas.height/2 };
      const nx = center.x - (closestOuter!.x);
      const ny = center.y - (closestOuter!.y);
      const len = Math.sqrt(nx*nx + ny*ny) || 1;
      return { normal: { x: nx/len, y: ny/len }, type: 'outer' };
    } else {
      // Innenwand: Normale zeigt nach außen (weg von der Streckenmitte)
      const center = { x: this.ctx.canvas.width/2, y: this.ctx.canvas.height/2 };
      const nx = (closestInner!.x) - center.x;
      const ny = (closestInner!.y) - center.y;
      const len = Math.sqrt(nx*nx + ny*ny) || 1;
      return { normal: { x: nx/len, y: ny/len }, type: 'inner' };
    }
  }

  /**
   * Gibt den Fortschritt (Index) auf dem aiPath für eine gegebene Position zurück.
   * Je niedriger der Wert, desto weiter "hinten" auf der Strecke.
   */
  public getProgressOnTrack(pos: Position): number {
    if (!this.aiPath.length) return 0;
    let minDist = Infinity;
    let minIdx = 0;
    for (let i = 0; i < this.aiPath.length; i++) {
      const dx = pos.x - this.aiPath[i].x;
      const dy = pos.y - this.aiPath[i].y;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }
    // Optional: als Prozentwert zurückgeben: minIdx / aiPath.length
    return minIdx;
  }

  private isPointInTrack(point: Position): boolean {
    // Hier nutzen wir die Punkt-in-Polygon-Prüfung mit unseren berechneten Randpunkten
    const [outerBoundary, innerBoundary] = this.trackBoundaries;

    // Prüfe, ob der Punkt innerhalb des äußeren Randes ist
    if (!this.isPointInPolygon(point, outerBoundary)) {
      return false; // Punkt ist außerhalb der Strecke
    }
    
    // Prüfe, ob der Punkt außerhalb des inneren Randes ist
    // (innerer Rand ist in umgekehrter Reihenfolge, daher Umkehrung der Logik)
    if (this.isPointInPolygon(point, innerBoundary)) {
      return false; // Punkt ist im Infield (inneres Gras)
    }
    
    return true; // Punkt ist auf der Strecke
  }

  private isPointInPolygon(point: Position, polygon: Position[]): boolean {
    // Ray-Casting-Algorithmus für Punkt-in-Polygon-Test
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  private getCarCornerPoints(position: Position, size: Size, angle: number): Position[] {
    // Berechne die Ecken des Autos basierend auf Position, Größe und Winkel
    const points: Position[] = [];
    const w = size.width / 2;
    const h = size.height / 2;
    
    // Ecken im lokalen Koordinatensystem
    const corners = [
      { x: -w, y: -h },
      { x: w, y: -h },
      { x: w, y: h },
      { x: -w, y: h }
    ];
    
    // Transformiere jeden Punkt basierend auf der Position und dem Winkel des Autos
    for (const corner of corners) {
      const rotatedX = corner.x * Math.cos(angle) - corner.y * Math.sin(angle);
      const rotatedY = corner.x * Math.sin(angle) + corner.y * Math.cos(angle);
      
      points.push({
        x: position.x + rotatedX,
        y: position.y + rotatedY
      });
    }
    
    // Füge einen Punkt in der Mitte für bessere Kollisionserkennung hinzu
    points.push({ x: position.x, y: position.y });
    
    // Füge zusätzliche Punkte für genauere Kollisionserkennung hinzu
    // Punkte zwischen den Ecken für bessere Erkennung bei schrägen Kollisionen
    const midCorners = [
      { x: 0, y: -h },    // Mitte oben
      { x: w, y: 0 },     // Mitte rechts
      { x: 0, y: h },     // Mitte unten
      { x: -w, y: 0 },    // Mitte links
      // Füge einige Punkte mit geringerem Abstand hinzu, um "Durchdringen" zu vermeiden
      { x: w*0.5, y: h*0.5 },  // Rechts unten (innen)
      { x: -w*0.5, y: h*0.5 }, // Links unten (innen)
      { x: w*0.5, y: -h*0.5 }, // Rechts oben (innen)
      { x: -w*0.5, y: -h*0.5 } // Links oben (innen)
    ];
    
    // Transformiere zusätzliche Punkte
    for (const midCorner of midCorners) {
      const rotatedX = midCorner.x * Math.cos(angle) - midCorner.y * Math.sin(angle);
      const rotatedY = midCorner.x * Math.sin(angle) + midCorner.y * Math.cos(angle);
      
      points.push({
        x: position.x + rotatedX,
        y: position.y + rotatedY
      });
    }
    
    return points;
  }
}