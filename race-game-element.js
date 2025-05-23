class Car {
  ctx;
  name;
  color;
  isPlayer;
  position = { x: 0, y: 0 };
  size = { width: 16, height: 28 };
  // Autos verkleinert von 20x35 auf 16x28
  speed = 0;
  maxSpeed = 5;
  acceleration = 0.1;
  deceleration = 0.05;
  friction = 0.02;
  angle = 0;
  // In Radians
  currentRotation = 0;
  distanceTraveled = 0;
  lapsCompleted = 0;
  checkpoints = [];
  isFinished = false;
  // KI-Parameter
  aiTargetPoints = [];
  currentAiPointIndex = 0;
  aiDifficulty = Math.random() * 0.2 + 0.7;
  // Zwischen 0.7 und 0.9 für Startvorteil Spieler
  aiSteerError = (Math.random() - 0.5) * 0.06;
  // Zufälliger Lenkfehler pro KI-Auto
  aiTargetOffset = {
    x: (Math.random() - 0.5) * 20,
    // Offset von -10 bis +10 px
    y: (Math.random() - 0.5) * 20
  };
  constructor(ctx, name, color, isPlayer) {
    this.ctx = ctx;
    this.name = name;
    this.color = color;
    this.isPlayer = isPlayer;
    for (let i = 0; i < 5; i++) {
      this.checkpoints.push(false);
    }
  }
  draw() {
    this.ctx.save();
    this.ctx.translate(this.position.x, this.position.y);
    this.ctx.rotate(this.angle);
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(-this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height);
    this.ctx.fillStyle = "yellow";
    this.ctx.fillRect(-this.size.width / 2 + 5, -this.size.height / 2, 5, 5);
    this.ctx.fillRect(this.size.width / 2 - 10, -this.size.height / 2, 5, 5);
    this.ctx.fillStyle = "lightblue";
    const windowWidth = this.size.width * 0.6;
    const windowHeight = this.size.height * 0.3;
    this.ctx.fillRect(-windowWidth / 2, -windowHeight / 2, windowWidth, windowHeight);
    this.ctx.restore();
  }
  update(collision) {
    if (this.isFinished) return;
    if (this.isPlayer) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
    }
    const moveX = Math.sin(this.angle) * this.speed;
    const moveY = -Math.cos(this.angle) * this.speed;
    const newPosition = {
      x: this.position.x + moveX,
      y: this.position.y + moveY
    };
    if (!collision.checkTrackCollision(newPosition, this.size, this.angle)) {
      this.position = newPosition;
      this.distanceTraveled += this.speed;
    } else {
      this.speed = Math.max(this.speed * 0.7, 1.2);
      if (typeof collision.getWallNormalAndType === "function") {
        const wallInfo = collision.getWallNormalAndType(this.position);
        if (wallInfo) {
          const { normal } = wallInfo;
          this.position.x += normal.x * 10;
          this.position.y += normal.y * 10;
        }
      }
      if (this.speed < 2.5) {
        this.speed = 2.5;
      }
    }
    this.speed *= 1 - this.friction;
    this.angle += this.currentRotation;
    if (Math.abs(this.speed) < 0.01) {
      this.speed = 0;
    }
  }
  setStartPosition(position) {
    this.position = { ...position };
    this.speed = 0;
    this.angle = 0;
  }
  accelerate() {
    if (this.isFinished) return;
    if (!this.isPlayer) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
    }
  }
  decelerate() {
    if (this.isFinished) return;
    if (!this.isPlayer) {
      this.speed = Math.max(-this.maxSpeed / 2, this.speed - this.deceleration);
    }
  }
  turnLeft() {
    if (this.isFinished) return;
    this.currentRotation = -0.035;
  }
  turnRight() {
    if (this.isFinished) return;
    this.currentRotation = 0.035;
  }
  resetSteering() {
    this.currentRotation = 0;
  }
  completeLap() {
    this.lapsCompleted++;
    if (this.lapsCompleted >= 3) {
      this.isFinished = true;
    }
    for (let i = 0; i < this.checkpoints.length; i++) {
      this.checkpoints[i] = false;
    }
  }
  passCheckpoint(checkpointIndex) {
    this.checkpoints[checkpointIndex] = true;
  }
  getLapsCompleted() {
    return this.lapsCompleted;
  }
  getDistanceTraveled() {
    return this.distanceTraveled;
  }
  getName() {
    return this.name;
  }
  getColor() {
    return this.color;
  }
  getPosition() {
    return { ...this.position };
  }
  getSize() {
    return { ...this.size };
  }
  getAngle() {
    return this.angle;
  }
  reset() {
    this.position = { x: 0, y: 0 };
    this.speed = 0;
    this.angle = 0;
    this.currentRotation = 0;
    this.lapsCompleted = 0;
    this.distanceTraveled = 0;
    this.isFinished = false;
    this.currentAiPointIndex = 0;
    for (let i = 0; i < this.checkpoints.length; i++) {
      this.checkpoints[i] = false;
    }
  }
  setAiTargetPoints(points) {
    this.aiTargetPoints = points;
  }
  updateAI() {
    if (this.isPlayer || this.isFinished || this.aiTargetPoints.length === 0) return;
    const gameInstance = globalThis.gameInstance;
    if (gameInstance && typeof gameInstance.isRunning === "function" && !gameInstance.isRunning()) return;
    let currentTarget = this.aiTargetPoints[this.currentAiPointIndex];
    currentTarget = {
      x: currentTarget.x + this.aiTargetOffset.x,
      y: currentTarget.y + this.aiTargetOffset.y
    };
    const dx = currentTarget.x - this.position.x;
    const dy = currentTarget.y - this.position.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
    let targetAngle = Math.atan2(dx, -dy);
    targetAngle += this.aiSteerError;
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const turnThreshold = 0.05;
    if (angleDiff > turnThreshold) {
      this.turnRight();
    } else if (angleDiff < -0.05) {
      this.turnLeft();
    } else {
      this.resetSteering();
    }
    this.acceleration = 0.07;
    if (this.speed < this.maxSpeed * this.aiDifficulty) {
      this.speed = Math.min(this.maxSpeed * this.aiDifficulty, this.speed + this.acceleration);
    }
    const switchDistance = 30;
    if (distanceToTarget < switchDistance) {
      this.currentAiPointIndex = (this.currentAiPointIndex + 1) % this.aiTargetPoints.length;
      this.aiTargetOffset = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20
      };
      this.aiSteerError = (Math.random() - 0.5) * 0.06;
    }
    if (this.speed < 0.5 && !this.isFinished) {
      this.speed = this.maxSpeed * 0.8;
      if (distanceToTarget > 100) {
        this.currentAiPointIndex = (this.currentAiPointIndex + 1) % this.aiTargetPoints.length;
      }
    }
  }
  setPositionAfterCollision(newPosition) {
    this.position = { ...newPosition };
  }
  reduceSpeedAfterCollision(factor) {
    this.speed *= factor;
  }
  /**
   * Gibt den Fortschritt des Autos auf der Strecke zurück (Index auf aiPath)
   */
  getTrackProgress(track) {
    return track.getProgressOnTrack(this.getPosition());
  }
}

class Track {
  ctx;
  startPositions = [];
  finishLine;
  trackBoundaries = [];
  // Spur-Wegpunkte für die KI
  aiPath = [];
  constructor(ctx) {
    this.ctx = ctx;
    this.finishLine = {
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 }
    };
  }
  loadTrack() {
    this.defineTrackBoundaries();
    this.defineAiPath();
  }
  draw() {
    this.ctx.fillStyle = "#4A6530";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawTrack();
    this.drawFinishLine();
  }
  drawTrack() {
    this.ctx.save();
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const rectWidth = canvasWidth * 0.8;
    const rectHeight = canvasHeight * 0.8;
    const trackWidth = Math.min(rectWidth, rectHeight) * 0.15;
    const outerLeft = centerX - rectWidth / 2;
    const outerRight = centerX + rectWidth / 2;
    const outerTop = centerY - rectHeight / 2;
    const outerBottom = centerY + rectHeight / 2;
    const innerLeft = outerLeft + trackWidth;
    const innerRight = outerRight - trackWidth;
    const innerTop = outerTop + trackWidth;
    const innerBottom = outerBottom - trackWidth;
    const outerCornerRadius = trackWidth * 2.2;
    const innerCornerRadius = outerCornerRadius - trackWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(outerLeft + outerCornerRadius, outerTop);
    this.ctx.lineTo(outerRight - outerCornerRadius, outerTop);
    this.ctx.arcTo(outerRight, outerTop, outerRight, outerTop + outerCornerRadius, outerCornerRadius);
    this.ctx.lineTo(outerRight, outerBottom - outerCornerRadius);
    this.ctx.arcTo(outerRight, outerBottom, outerRight - outerCornerRadius, outerBottom, outerCornerRadius);
    this.ctx.lineTo(outerLeft + outerCornerRadius, outerBottom);
    this.ctx.arcTo(outerLeft, outerBottom, outerLeft, outerBottom - outerCornerRadius, outerCornerRadius);
    this.ctx.lineTo(outerLeft, outerTop + outerCornerRadius);
    this.ctx.arcTo(outerLeft, outerTop, outerLeft + outerCornerRadius, outerTop, outerCornerRadius);
    this.ctx.closePath();
    this.ctx.fillStyle = "#333333";
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(innerLeft + innerCornerRadius, innerTop);
    this.ctx.lineTo(innerRight - innerCornerRadius, innerTop);
    this.ctx.arcTo(innerRight, innerTop, innerRight, innerTop + innerCornerRadius, innerCornerRadius);
    this.ctx.lineTo(innerRight, innerBottom - innerCornerRadius);
    this.ctx.arcTo(innerRight, innerBottom, innerRight - innerCornerRadius, innerBottom, innerCornerRadius);
    this.ctx.lineTo(innerLeft + innerCornerRadius, innerBottom);
    this.ctx.arcTo(innerLeft, innerBottom, innerLeft, innerBottom - innerCornerRadius, innerCornerRadius);
    this.ctx.lineTo(innerLeft, innerTop + innerCornerRadius);
    this.ctx.arcTo(innerLeft, innerTop, innerLeft + innerCornerRadius, innerTop, innerCornerRadius);
    this.ctx.closePath();
    this.ctx.fillStyle = "#4A6530";
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    this.ctx.restore();
  }
  drawFinishLine() {
    this.ctx.save();
    const { start, end } = this.finishLine;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const width = 20;
    const angle = Math.atan2(dy, dx);
    this.ctx.translate((start.x + end.x) / 2, (start.y + end.y) / 2);
    this.ctx.rotate(angle + Math.PI / 2);
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(-20 / 2, -length / 2, width, length);
    const squareSize = 10;
    const numSquaresX = Math.ceil(width / squareSize);
    const numSquaresY = Math.ceil(length / squareSize);
    for (let x = 0; x < numSquaresX; x++) {
      for (let y = 0; y < numSquaresY; y++) {
        if ((x + y) % 2 === 0) {
          this.ctx.fillStyle = "#FFFFFF";
          this.ctx.fillRect(
            -20 / 2 + x * squareSize,
            -length / 2 + y * squareSize,
            squareSize,
            squareSize
          );
        }
      }
    }
    this.ctx.restore();
  }
  defineTrackBoundaries() {
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const rectWidth = canvasWidth * 0.8;
    const rectHeight = canvasHeight * 0.8;
    const trackWidth = Math.min(rectWidth, rectHeight) * 0.15;
    const outerLeft = centerX - rectWidth / 2;
    const outerRight = centerX + rectWidth / 2;
    const outerTop = centerY - rectHeight / 2;
    const outerBottom = centerY + rectHeight / 2;
    const outerCornerRadius = trackWidth * 2.2;
    const innerCornerRadius = outerCornerRadius - trackWidth;
    const outerPoints = [];
    const innerPoints = [];
    const arcPoints = (centerX2, centerY2, radius, startAngle, endAngle, numPoints, array) => {
      for (let i = 0; i <= numPoints; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
        array.push({
          x: centerX2 + Math.cos(angle) * radius,
          y: centerY2 + Math.sin(angle) * radius
        });
      }
    };
    arcPoints(
      outerRight - outerCornerRadius,
      outerTop + outerCornerRadius,
      outerCornerRadius,
      -Math.PI / 2,
      0,
      10,
      outerPoints
    );
    outerPoints.push({ x: outerRight, y: outerTop + outerCornerRadius });
    outerPoints.push({ x: outerRight, y: outerBottom - outerCornerRadius });
    arcPoints(
      outerRight - outerCornerRadius,
      outerBottom - outerCornerRadius,
      outerCornerRadius,
      0,
      Math.PI / 2,
      10,
      outerPoints
    );
    outerPoints.push({ x: outerRight - outerCornerRadius, y: outerBottom });
    outerPoints.push({ x: outerLeft + outerCornerRadius, y: outerBottom });
    arcPoints(
      outerLeft + outerCornerRadius,
      outerBottom - outerCornerRadius,
      outerCornerRadius,
      Math.PI / 2,
      Math.PI,
      10,
      outerPoints
    );
    outerPoints.push({ x: outerLeft, y: outerBottom - outerCornerRadius });
    outerPoints.push({ x: outerLeft, y: outerTop + outerCornerRadius });
    arcPoints(
      outerLeft + outerCornerRadius,
      outerTop + outerCornerRadius,
      outerCornerRadius,
      Math.PI,
      Math.PI * 3 / 2,
      10,
      outerPoints
    );
    outerPoints.push({ x: outerLeft + outerCornerRadius, y: outerTop });
    outerPoints.push({ x: outerRight - outerCornerRadius, y: outerTop });
    arcPoints(
      outerRight - trackWidth - innerCornerRadius,
      outerTop + trackWidth + innerCornerRadius,
      innerCornerRadius,
      -Math.PI / 2,
      0,
      10,
      innerPoints
    );
    innerPoints.push({ x: outerRight - trackWidth, y: outerTop + trackWidth + innerCornerRadius });
    innerPoints.push({ x: outerRight - trackWidth, y: outerBottom - trackWidth - innerCornerRadius });
    arcPoints(
      outerRight - trackWidth - innerCornerRadius,
      outerBottom - trackWidth - innerCornerRadius,
      innerCornerRadius,
      0,
      Math.PI / 2,
      10,
      innerPoints
    );
    innerPoints.push({ x: outerRight - trackWidth - innerCornerRadius, y: outerBottom - trackWidth });
    innerPoints.push({ x: outerLeft + trackWidth + innerCornerRadius, y: outerBottom - trackWidth });
    arcPoints(
      outerLeft + trackWidth + innerCornerRadius,
      outerBottom - trackWidth - innerCornerRadius,
      innerCornerRadius,
      Math.PI / 2,
      Math.PI,
      10,
      innerPoints
    );
    innerPoints.push({ x: outerLeft + trackWidth, y: outerBottom - trackWidth - innerCornerRadius });
    innerPoints.push({ x: outerLeft + trackWidth, y: outerTop + trackWidth + innerCornerRadius });
    arcPoints(
      outerLeft + trackWidth + innerCornerRadius,
      outerTop + trackWidth + innerCornerRadius,
      innerCornerRadius,
      Math.PI,
      Math.PI * 3 / 2,
      10,
      innerPoints
    );
    innerPoints.push({ x: outerLeft + trackWidth + innerCornerRadius, y: outerTop + trackWidth });
    innerPoints.push({ x: outerRight - trackWidth - innerCornerRadius, y: outerTop + trackWidth });
    this.trackBoundaries = [outerPoints, innerPoints];
    const finishLineYOffset = 110;
    this.finishLine = {
      start: { x: outerRight - trackWidth + 2, y: centerY + finishLineYOffset },
      // +80 Pixel nach unten
      end: { x: outerRight - 2, y: centerY + finishLineYOffset }
      // +80 Pixel nach unten
    };
    const startY = centerY + 40 + finishLineYOffset;
    const carSpacing = (outerRight - (outerRight - trackWidth) - 4) / 5;
    this.startPositions = [
      { x: outerRight - trackWidth + carSpacing, y: startY },
      // links (KI)
      { x: outerRight - trackWidth + carSpacing * 2.5, y: startY },
      // mitte (Spieler)
      { x: outerRight - trackWidth + carSpacing * 4, y: startY }
      // rechts (KI)
    ];
  }
  defineAiPath() {
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const rectWidth = canvasWidth * 0.8;
    const rectHeight = canvasHeight * 0.8;
    const trackWidth = Math.min(rectWidth, rectHeight) * 0.15;
    const middleTrackWidth = trackWidth / 2;
    const outerLeft = centerX - rectWidth / 2;
    const outerRight = centerX + rectWidth / 2;
    const outerTop = centerY - rectHeight / 2;
    const outerBottom = centerY + rectHeight / 2;
    const midLeft = outerLeft + middleTrackWidth;
    const midRight = outerRight - middleTrackWidth;
    const midTop = outerTop + middleTrackWidth;
    const midBottom = outerBottom - middleTrackWidth;
    const midCornerRadius = trackWidth * 2.2 - middleTrackWidth;
    this.aiPath = [];
    const arcPoints = (centerX2, centerY2, radius, startAngle, endAngle, numPoints) => {
      for (let i = 0; i <= numPoints; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
        this.aiPath.push({
          x: centerX2 + Math.cos(angle) * radius,
          y: centerY2 + Math.sin(angle) * radius
        });
      }
    };
    const startX = outerRight - trackWidth + (outerRight - (outerRight - trackWidth)) / 2;
    this.aiPath.push({ x: startX, y: centerY });
    this.aiPath.push({ x: midRight, y: midTop + midCornerRadius });
    arcPoints(
      midRight - midCornerRadius,
      midTop + midCornerRadius,
      midCornerRadius,
      0,
      -Math.PI / 2,
      10
    );
    this.aiPath.push({ x: midRight - midCornerRadius, y: midTop });
    this.aiPath.push({ x: midLeft + midCornerRadius, y: midTop });
    arcPoints(
      midLeft + midCornerRadius,
      midTop + midCornerRadius,
      midCornerRadius,
      -Math.PI / 2,
      -Math.PI,
      10
    );
    this.aiPath.push({ x: midLeft, y: midTop + midCornerRadius });
    this.aiPath.push({ x: midLeft, y: midBottom - midCornerRadius });
    arcPoints(
      midLeft + midCornerRadius,
      midBottom - midCornerRadius,
      midCornerRadius,
      -Math.PI,
      -Math.PI * 3 / 2,
      10
    );
    this.aiPath.push({ x: midLeft + midCornerRadius, y: midBottom });
    this.aiPath.push({ x: midRight - midCornerRadius, y: midBottom });
    arcPoints(
      midRight - midCornerRadius,
      midBottom - midCornerRadius,
      midCornerRadius,
      Math.PI / 2,
      0,
      10
    );
    this.aiPath.push({ x: midRight, y: midBottom - midCornerRadius });
    this.aiPath.push({ x: startX, y: centerY });
  }
  getAiPath() {
    return this.aiPath;
  }
  getStartPosition(index) {
    if (index >= 0 && index < this.startPositions.length) {
      return this.startPositions[index];
    }
    return this.startPositions[0] || { x: 0, y: 0 };
  }
  checkTrackCollision(position, size, angle) {
    const points = this.getCarCornerPoints(position, size, angle);
    for (const point of points) {
      if (!this.isPointInTrack(point)) {
        return true;
      }
    }
    return false;
  }
  checkFinishLineCrossing(car) {
    const carPos = car.getPosition();
    const { start, end } = this.finishLine;
    const lineVecX = end.x - start.x;
    const lineVecY = end.y - start.y;
    const lineLength = Math.sqrt(lineVecX * lineVecX + lineVecY * lineVecY);
    const lineNormX = lineVecX / lineLength;
    const lineNormY = lineVecY / lineLength;
    const carVecX = carPos.x - start.x;
    const carVecY = carPos.y - start.y;
    const dotProduct = carVecX * lineNormX + carVecY * lineNormY;
    const isOnLine = dotProduct >= 0 && dotProduct <= lineLength;
    const projX = start.x + lineNormX * dotProduct;
    const projY = start.y + lineNormY * dotProduct;
    const distance = Math.sqrt(
      Math.pow(carPos.x - projX, 2) + Math.pow(carPos.y - projY, 2)
    );
    const movingUp = car.getAngle() <= Math.PI / 2 || car.getAngle() >= 3 * Math.PI / 2;
    return isOnLine && distance < 10 && movingUp;
  }
  /**
   * Gibt die Wandnormale und den Typ ('outer' | 'inner') für eine gegebene Position zurück.
   * Die Normale zeigt IMMER von der Wand in Richtung Strecke.
   */
  getWallNormalAndType(position) {
    if (!this.trackBoundaries.length) return null;
    const [outer, inner] = this.trackBoundaries;
    let minDistOuter = Infinity;
    let closestOuter = null;
    for (const p of outer) {
      const dx = position.x - p.x;
      const dy = position.y - p.y;
      const dist = dx * dx + dy * dy;
      if (dist < minDistOuter) {
        minDistOuter = dist;
        closestOuter = p;
      }
    }
    let minDistInner = Infinity;
    let closestInner = null;
    for (const p of inner) {
      const dx = position.x - p.x;
      const dy = position.y - p.y;
      const dist = dx * dx + dy * dy;
      if (dist < minDistInner) {
        minDistInner = dist;
        closestInner = p;
      }
    }
    if (minDistOuter < minDistInner) {
      const center = { x: this.ctx.canvas.width / 2, y: this.ctx.canvas.height / 2 };
      const nx = center.x - closestOuter.x;
      const ny = center.y - closestOuter.y;
      const len = Math.sqrt(nx * nx + ny * ny) || 1;
      return { normal: { x: nx / len, y: ny / len }, type: "outer" };
    } else {
      const center = { x: this.ctx.canvas.width / 2, y: this.ctx.canvas.height / 2 };
      const nx = closestInner.x - center.x;
      const ny = closestInner.y - center.y;
      const len = Math.sqrt(nx * nx + ny * ny) || 1;
      return { normal: { x: nx / len, y: ny / len }, type: "inner" };
    }
  }
  /**
   * Gibt den Fortschritt (Index) auf dem aiPath für eine gegebene Position zurück.
   * Je niedriger der Wert, desto weiter "hinten" auf der Strecke.
   */
  getProgressOnTrack(pos) {
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
    return minIdx;
  }
  isPointInTrack(point) {
    const [outerBoundary, innerBoundary] = this.trackBoundaries;
    if (!this.isPointInPolygon(point, outerBoundary)) {
      return false;
    }
    if (this.isPointInPolygon(point, innerBoundary)) {
      return false;
    }
    return true;
  }
  isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = yi > point.y !== yj > point.y && point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
  getCarCornerPoints(position, size, angle) {
    const points = [];
    const w = size.width / 2;
    const h = size.height / 2;
    const corners = [
      { x: -w, y: -h },
      { x: w, y: -h },
      { x: w, y: h },
      { x: -w, y: h }
    ];
    for (const corner of corners) {
      const rotatedX = corner.x * Math.cos(angle) - corner.y * Math.sin(angle);
      const rotatedY = corner.x * Math.sin(angle) + corner.y * Math.cos(angle);
      points.push({
        x: position.x + rotatedX,
        y: position.y + rotatedY
      });
    }
    points.push({ x: position.x, y: position.y });
    const midCorners = [
      { x: 0, y: -h },
      // Mitte oben
      { x: w, y: 0 },
      // Mitte rechts
      { x: 0, y: h },
      // Mitte unten
      { x: -w, y: 0 },
      // Mitte links
      // Füge einige Punkte mit geringerem Abstand hinzu, um "Durchdringen" zu vermeiden
      { x: w * 0.5, y: h * 0.5 },
      // Rechts unten (innen)
      { x: -w * 0.5, y: h * 0.5 },
      // Links unten (innen)
      { x: w * 0.5, y: -h * 0.5 },
      // Rechts oben (innen)
      { x: -w * 0.5, y: -h * 0.5 }
      // Links oben (innen)
    ];
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

class UI {
  root;
  timerElement;
  lapCounterElement;
  rankingElements;
  rankingContainer;
  currentRanking = [];
  // Speichert die aktuelle Reihenfolge der Autos
  lastDistances = /* @__PURE__ */ new Map();
  // Speichert die letzte bekannte Distanz jedes Autos
  positionConfidence = /* @__PURE__ */ new Map();
  // Speichert, wie stabil die Position jedes Autos ist
  lastUpdateTime = 0;
  // Verhindert zu häufige Updates
  updateInterval = 100;
  // Minimaler Abstand zwischen Updates in ms
  rankingFrozen = false;
  // Flag zum Einfrieren der Rangliste
  gameStartTime = 0;
  timerIntervalId = null;
  constructor(root = document) {
    this.root = root;
    this.timerElement = this.root.getElementById("timer");
    this.lapCounterElement = this.root.getElementById("lap-counter");
    this.rankingContainer = this.root.getElementById("ranking-list");
    this.rankingElements = {
      "Enzo": this.root.getElementById("rank-player"),
      "F50": this.root.getElementById("rank-ai1"),
      "360 Spider": this.root.getElementById("rank-ai2")
    };
    this.currentRanking = ["Enzo", "F50", "360 Spider"];
    this.positionConfidence.set("Enzo", 0);
    this.positionConfidence.set("F50", 0);
    this.positionConfidence.set("360 Spider", 0);
    if (this.rankingContainer) {
      this.rankingContainer.style.position = "relative";
      Object.values(this.rankingElements).forEach((element) => {
        if (element) {
          element.style.transition = "transform 0.3s ease-out";
          element.style.position = "relative";
        }
      });
    }
  }
  startTimer() {
    this.gameStartTime = Date.now();
    this.timerIntervalId = window.setInterval(() => {
      this.updateTimer();
    }, 10);
  }
  stopTimer() {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }
  updateTimer() {
    if (!this.timerElement) return;
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.gameStartTime;
    const minutes = Math.floor(elapsedTime / 6e4);
    const seconds = Math.floor(elapsedTime % 6e4 / 1e3);
    const milliseconds = Math.floor(elapsedTime % 1e3 / 10);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
    this.timerElement.textContent = formattedTime;
  }
  updateLapCounter(lap) {
    if (!this.lapCounterElement) return;
    this.lapCounterElement.textContent = `Runde: ${lap}/3`;
  }
  freezeRanking() {
    this.rankingFrozen = true;
  }
  updateRanking(cars) {
    const game = window.gameInstance;
    if (game && typeof game.getFinishOrder === "function") {
      const finishOrder = game.getFinishOrder();
      if (finishOrder && finishOrder.length > 0) {
        const finishedCars = finishOrder.map((name) => cars.find((car) => car.getName() === name)).filter(Boolean);
        const unfinishedCars = cars.filter((car) => !finishOrder.includes(car.getName()));
        const byLaps2 = this.groupByLaps(unfinishedCars);
        const finalSorted2 = [...finishedCars];
        Object.keys(byLaps2).sort((a, b) => parseInt(b) - parseInt(a)).forEach((lap) => {
          const carsInLap = byLaps2[lap];
          const sortedByDistance = this.sortByDistanceWithHysteresis(carsInLap);
          finalSorted2.push(...sortedByDistance);
        });
        this.updateRankingDOM(finalSorted2);
        this.currentRanking = finalSorted2.map((car) => car.getName());
        return;
      }
    }
    if (this.rankingFrozen) return;
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    const byLaps = this.groupByLaps(cars);
    const finalSorted = [];
    Object.keys(byLaps).sort((a, b) => parseInt(b) - parseInt(a)).forEach((lap) => {
      const carsInLap = byLaps[lap];
      const sortedByDistance = this.sortByDistanceWithHysteresis(carsInLap);
      finalSorted.push(...sortedByDistance);
    });
    const newRanking = finalSorted.map((car) => car.getName());
    if (JSON.stringify(this.currentRanking) !== JSON.stringify(newRanking) && this.isPositionChangeConfirmed(finalSorted)) {
      this.updateRankingDOM(finalSorted);
      this.currentRanking = newRanking;
      this.lastUpdateTime = now;
      finalSorted.forEach((car) => {
        this.lastDistances.set(car.getName(), car.getDistanceTraveled());
      });
    }
  }
  groupByLaps(cars) {
    const groups = {};
    cars.forEach((car) => {
      const laps = car.getLapsCompleted().toString();
      if (!groups[laps]) {
        groups[laps] = [];
      }
      groups[laps].push(car);
    });
    return groups;
  }
  sortByDistanceWithHysteresis(cars) {
    if (cars.length <= 1) return cars;
    const game = window.gameInstance;
    const track = game && typeof game.getTrack === "function" ? game.getTrack() : null;
    return [...cars].sort((a, b) => {
      if (track) {
        const progressA = a.getTrackProgress(track);
        const progressB = b.getTrackProgress(track);
        if (progressB !== progressA) return progressB - progressA;
      }
      return b.getDistanceTraveled() - a.getDistanceTraveled();
    });
  }
  isPositionChangeConfirmed(cars) {
    let confirmed = true;
    cars.forEach((car, newIndex) => {
      const name = car.getName();
      const oldIndex = this.currentRanking.indexOf(name);
      if (oldIndex !== newIndex) {
        let confidence = this.positionConfidence.get(name) || 0;
        const betterPosition = newIndex < oldIndex;
        const currentDistance = car.getDistanceTraveled();
        const lastDistance = this.lastDistances.get(name) || 0;
        const makingProgress = currentDistance > lastDistance + 0.5;
        if (car.getLapsCompleted() > 0 && Math.abs(currentDistance - lastDistance) > 100) {
          confidence = 3;
        } else if (Math.abs(currentDistance - lastDistance) > 15) {
          confidence += 2;
        } else if (betterPosition && makingProgress || !betterPosition && !makingProgress) {
          confidence += 1;
        } else {
          confidence = 0;
        }
        this.positionConfidence.set(name, confidence);
        if (confidence < 2) {
          confirmed = false;
        }
      } else {
        this.positionConfidence.set(name, 0);
      }
    });
    return confirmed;
  }
  updateRankingDOM(sortedCars) {
    if (!this.rankingContainer) return;
    while (this.rankingContainer.firstChild) {
      this.rankingContainer.removeChild(this.rankingContainer.firstChild);
    }
    sortedCars.forEach((car, index) => {
      const name = car.getName();
      const rankElement = this.rankingElements[name];
      if (rankElement) {
        rankElement.innerHTML = "";
        rankElement.textContent = `${index + 1}. ${name}`;
        const colorSpan = document.createElement("span");
        colorSpan.className = `car-color ${car.getColor()}`;
        rankElement.appendChild(colorSpan);
        this.rankingContainer?.appendChild(rankElement);
      }
    });
  }
  resetUI() {
    this.stopTimer();
    if (this.timerElement) {
      this.timerElement.textContent = "0:00.00";
    }
    if (this.lapCounterElement) {
      this.lapCounterElement.textContent = "Runde: 0/3";
    }
    if (this.rankingContainer) {
      while (this.rankingContainer.firstChild) {
        this.rankingContainer.removeChild(this.rankingContainer.firstChild);
      }
      let rankPlayerElement = this.root.getElementById("rank-player");
      let rankAi1Element = this.root.getElementById("rank-ai1");
      let rankAi2Element = this.root.getElementById("rank-ai2");
      if (!rankPlayerElement) {
        rankPlayerElement = document.createElement("div");
        rankPlayerElement.id = "rank-player";
        rankPlayerElement.className = "ranking-item";
        this.rankingElements["Enzo"] = rankPlayerElement;
      }
      if (!rankAi1Element) {
        rankAi1Element = document.createElement("div");
        rankAi1Element.id = "rank-ai1";
        rankAi1Element.className = "ranking-item";
        this.rankingElements["F50"] = rankAi1Element;
      }
      if (!rankAi2Element) {
        rankAi2Element = document.createElement("div");
        rankAi2Element.id = "rank-ai2";
        rankAi2Element.className = "ranking-item";
        this.rankingElements["360 Spider"] = rankAi2Element;
      }
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
    this.currentRanking = ["Enzo", "F50", "360 Spider"];
    this.lastDistances.clear();
    this.positionConfidence.clear();
    this.positionConfidence.set("Enzo", 0);
    this.positionConfidence.set("F50", 0);
    this.positionConfidence.set("360 Spider", 0);
    this.lastUpdateTime = 0;
    this.rankingFrozen = false;
  }
}

class InputHandler {
  game;
  keys = {};
  controlsActive = false;
  constructor(game) {
    this.game = game;
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }
  handleKeyDown(event) {
    if (!this.controlsActive) return;
    this.keys[event.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
    }
    this.updateControls();
  }
  handleKeyUp(event) {
    this.keys[event.key] = false;
    if (!this.controlsActive) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      this.game.getPlayerCar().resetSteering();
    }
  }
  updateControls() {
    const playerCar = this.game.getPlayerCar();
    if (this.keys["ArrowLeft"]) {
      playerCar.turnLeft();
    }
    if (this.keys["ArrowRight"]) {
      playerCar.turnRight();
    }
  }
  activateControls() {
    this.controlsActive = true;
  }
  deactivateControls() {
    this.controlsActive = false;
    Object.keys(this.keys).forEach((key) => {
      this.keys[key] = false;
    });
  }
  checkControls() {
    if (!this.controlsActive) return;
    this.updateControls();
  }
}

class Collision {
  track;
  constructor(track) {
    this.track = track;
  }
  checkTrackCollision(position, size, angle) {
    return this.track.checkTrackCollision(position, size, angle);
  }
  checkCarCollision(car1, car2) {
    const pos1 = car1.getPosition();
    const pos2 = car2.getPosition();
    const size1 = car1.getSize();
    const size2 = car2.getSize();
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (size1.width + size2.width + size1.height + size2.height) / 4;
    if (distance < minDistance) {
      this.resolveCarCollision(car1, car2);
      return true;
    }
    return false;
  }
  resolveCarCollision(car1, car2) {
    const pos1 = car1.getPosition();
    const pos2 = car2.getPosition();
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;
    const nx = dx / length;
    const ny = dy / length;
    const separation = 2;
    const car1NewPos = {
      x: pos1.x - nx * separation,
      y: pos1.y - ny * separation
    };
    const car2NewPos = {
      x: pos2.x + nx * separation,
      y: pos2.y + ny * separation
    };
    const car1Size = car1.getSize();
    const car2Size = car2.getSize();
    const car1Angle = car1.getAngle();
    const car2Angle = car2.getAngle();
    const car1TrackCollision = this.checkTrackCollision(car1NewPos, car1Size, car1Angle);
    const car2TrackCollision = this.checkTrackCollision(car2NewPos, car2Size, car2Angle);
    if (!car1TrackCollision) {
      car1.setPositionAfterCollision(car1NewPos);
    } else {
      const reducedSeparation = separation * 0.5;
      const reducedPos = {
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
      const reducedSeparation = separation * 0.5;
      const reducedPos = {
        x: pos2.x + nx * reducedSeparation,
        y: pos2.y + ny * reducedSeparation
      };
      if (!this.checkTrackCollision(reducedPos, car2Size, car2Angle)) {
        car2.setPositionAfterCollision(reducedPos);
      }
    }
    car1.reduceSpeedAfterCollision(0.7);
    car2.reduceSpeedAfterCollision(0.7);
  }
}

class AudioManager {
  sounds = {};
  constructor() {
    this.loadSounds();
  }
  loadSounds() {
    this.loadSound("beep-prepare", "/sounds/beep-prepare.mp3");
    this.loadSound("beep-go", "/sounds/beep-go.mp3");
  }
  loadSound(name, path) {
    const sound = new Audio(path);
    this.sounds[name] = sound;
  }
  playSound(name) {
    if (this.sounds[name]) {
      this.sounds[name].currentTime = 0;
      this.sounds[name].play().catch((error) => {
        console.error(`Error playing sound ${name}:`, error);
      });
    } else {
      console.warn(`Sound ${name} not found`);
    }
  }
  stopSound(name) {
    if (this.sounds[name]) {
      this.sounds[name].pause();
      this.sounds[name].currentTime = 0;
    }
  }
}

class Game {
  root;
  canvas;
  ctx;
  track;
  playerCar;
  aiCars = [];
  ui;
  inputHandler;
  collision;
  audioManager;
  isGameRunning = false;
  isGameStarted = false;
  animationFrameId = null;
  lapCountingEnabled = false;
  // Flag, um zu verfolgen, ob die Rundenzählung aktiviert ist
  lastPlayerLapState = false;
  lastAiLapStates = [false, false];
  finishOrder = [];
  constructor(root = globalThis.document) {
    this.root = root;
    this.canvas = this.root.getElementById("game-canvas");
    if (!this.canvas) throw new Error("Canvas element not found");
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");
    this.ctx = context;
    this.canvas.width = 600;
    this.canvas.height = 800;
    this.track = new Track(this.ctx);
    this.playerCar = new Car(this.ctx, "Enzo", "red", true);
    this.aiCars = [
      new Car(this.ctx, "F50", "black", false),
      new Car(this.ctx, "360 Spider", "orange", false)
    ];
    this.ui = new UI(this.root);
    this.inputHandler = new InputHandler(this);
    this.collision = new Collision(this.track);
    this.audioManager = new AudioManager();
    const trafficLight = this.root.getElementById("traffic-light");
    const countdown = this.root.getElementById("countdown");
    if (trafficLight) trafficLight.classList.add("hidden");
    if (countdown) countdown.classList.add("hidden");
  }
  initialize() {
    this.track.loadTrack();
    this.aiCars[0].setStartPosition(this.track.getStartPosition(0));
    this.playerCar.setStartPosition(this.track.getStartPosition(1));
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2));
    const startButton = this.root.getElementById("start-button");
    if (startButton) {
      startButton.addEventListener("click", () => this.startGame());
    }
    const resetButton = this.root.getElementById("reset-button");
    if (resetButton) {
      resetButton.addEventListener("click", () => this.resetGame());
    }
    this.gameLoop();
  }
  startGame() {
    if (this.isGameStarted) return;
    this.isGameStarted = true;
    this.lapCountingEnabled = false;
    this.aiCars[0].setStartPosition(this.track.getStartPosition(0));
    this.playerCar.setStartPosition(this.track.getStartPosition(1));
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2));
    const aiTargetPoints = this.track.getAiPath();
    this.aiCars.forEach((car) => {
      car.setAiTargetPoints(aiTargetPoints);
    });
    const startButton = this.root.getElementById("start-button");
    if (startButton) startButton.classList.add("hidden");
    const trafficLight = this.root.getElementById("traffic-light");
    const countdown = this.root.getElementById("countdown");
    if (trafficLight) trafficLight.classList.remove("hidden");
    if (countdown) countdown.classList.remove("hidden");
    let count = 3;
    const redLight = this.root.querySelector(".light.red");
    const yellowLight = this.root.querySelector(".light.yellow");
    const greenLight = this.root.querySelector(".light.green");
    if (redLight) redLight.classList.add("active");
    this.audioManager.playSound("beep-prepare");
    const countdownInterval = globalThis.setInterval(() => {
      count--;
      if (countdown) countdown.textContent = count.toString();
      if (count > 0) {
        this.audioManager.playSound("beep-prepare");
      }
      if (count === 2 && yellowLight) {
        yellowLight.classList.add("active");
      } else if (count === 1 && greenLight) {
        greenLight.classList.add("active");
      } else if (count === 0) {
        if (countdown) countdown.textContent = "Go!";
        this.audioManager.playSound("beep-go");
        globalThis.setTimeout(() => {
          if (trafficLight) trafficLight.classList.add("hidden");
          if (countdown) countdown.classList.add("hidden");
          const uiCenter = this.root.getElementById("ui-center");
          if (uiCenter) uiCenter.classList.remove("hidden");
          const resetBtn = this.root.getElementById("reset-button");
          if (resetBtn) resetBtn.classList.remove("hidden");
          this.isGameRunning = true;
          this.ui.startTimer();
          this.inputHandler.activateControls();
          globalThis.setTimeout(() => {
            this.lapCountingEnabled = true;
          }, 2e3);
        }, 1e3);
        globalThis.clearInterval(countdownInterval);
      }
    }, 1e3);
  }
  resetGame() {
    if (this.animationFrameId !== null) {
      globalThis.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isGameRunning = false;
    this.isGameStarted = false;
    this.lapCountingEnabled = false;
    this.finishOrder = [];
    this.ui.resetUI();
    const uiCenter = this.root.getElementById("ui-center");
    if (uiCenter) uiCenter.classList.add("hidden");
    const resetBtn = this.root.getElementById("reset-button");
    if (resetBtn) resetBtn.classList.add("hidden");
    const startButton = this.root.getElementById("start-button");
    if (startButton) startButton.classList.remove("hidden");
    const trafficLight = this.root.getElementById("traffic-light");
    const countdown = this.root.getElementById("countdown");
    if (trafficLight) {
      trafficLight.classList.add("hidden");
      const lights = trafficLight.querySelectorAll(".light");
      lights.forEach((light) => light.classList.remove("active"));
    }
    if (countdown) {
      countdown.classList.add("hidden");
      countdown.textContent = "3";
    }
    this.playerCar.reset();
    this.aiCars.forEach((car) => car.reset());
    this.aiCars[0].setStartPosition(this.track.getStartPosition(0));
    this.playerCar.setStartPosition(this.track.getStartPosition(1));
    this.aiCars[1].setStartPosition(this.track.getStartPosition(2));
    this.inputHandler.deactivateControls();
    this.gameLoop();
  }
  getAllCars() {
    return [this.playerCar, ...this.aiCars];
  }
  getPlayerCar() {
    return this.playerCar;
  }
  getTrack() {
    return this.track;
  }
  isRunning() {
    return this.isGameRunning;
  }
  getFinishOrder() {
    return this.finishOrder;
  }
  endGame() {
    this.isGameRunning = false;
    this.ui.stopTimer();
    this.ui.freezeRanking();
  }
  gameLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.track.draw();
    if (this.isGameRunning) {
      this.playerCar.update(this.collision);
      this.aiCars.forEach((car) => {
        car.update(this.collision);
        car.updateAI();
      });
      const allCars = this.getAllCars();
      for (let i = 0; i < allCars.length; i++) {
        for (let j = i + 1; j < allCars.length; j++) {
          this.collision.checkCarCollision(allCars[i], allCars[j]);
        }
      }
      this.checkLapProgress();
      this.ui.updateRanking(this.getAllCars());
      this.checkGameEnd();
    }
    this.playerCar.draw();
    this.aiCars.forEach((car) => car.draw());
    this.animationFrameId = globalThis.requestAnimationFrame(this.gameLoop.bind(this));
  }
  checkLapProgress() {
    if (!this.lapCountingEnabled) return;
    const playerCrossed = this.track.checkFinishLineCrossing(this.playerCar);
    if (playerCrossed && !this.lastPlayerLapState) {
      this.playerCar.completeLap();
      if (this.playerCar.getLapsCompleted() === 3 && !this.finishOrder.includes(this.playerCar.getName())) {
        this.finishOrder.push(this.playerCar.getName());
      }
      this.ui.updateLapCounter(this.playerCar.getLapsCompleted());
    }
    this.lastPlayerLapState = playerCrossed;
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
  checkGameEnd() {
    const totalLaps = 3;
    const allFinished = this.getAllCars().every((car) => car.getLapsCompleted() >= totalLaps);
    if (allFinished) {
      this.endGame();
    }
  }
}

class RaceGameElement extends HTMLElement {
  gameInstance = null;
  shadow;
  resizeObserver = null;
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadow.innerHTML = `
      <link rel="stylesheet" href="${this.getStyleUrl()}">
      <div id="app">
        <div id="game-container">
          <div id="ui-top">
            <div id="headline">Vince Rennen</div>
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
              <button id="start-button">Start</button>
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
      </div>
    `;
    globalThis.setTimeout(() => {
      this.gameInstance = new Game(this.shadow);
      globalThis.gameInstance = this.gameInstance;
      this.gameInstance.initialize();
      this.setupTouchControls();
      this.setupResizeHandling();
    }, 0);
  }
  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.gameInstance = null;
  }
  getStyleUrl() {
    return new URL("data:text/css;base64,OnJvb3QgewogIGZvbnQtZmFtaWx5OiBzeXN0ZW0tdWksIEF2ZW5pciwgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZjsKICBsaW5lLWhlaWdodDogMS41OwogIGZvbnQtd2VpZ2h0OiA0MDA7CiAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC44Nyk7CiAgYmFja2dyb3VuZC1jb2xvcjogIzI0MjQyNDsKICBmb250LXN5bnRoZXNpczogbm9uZTsKICB0ZXh0LXJlbmRlcmluZzogb3B0aW1pemVMZWdpYmlsaXR5OwogIC13ZWJraXQtZm9udC1zbW9vdGhpbmc6IGFudGlhbGlhc2VkOwogIC1tb3otb3N4LWZvbnQtc21vb3RoaW5nOiBncmF5c2NhbGU7Cn0KCmEgewogIGZvbnQtd2VpZ2h0OiA1MDA7CiAgY29sb3I6ICM2NDZjZmY7CiAgdGV4dC1kZWNvcmF0aW9uOiBpbmhlcml0Owp9CmE6aG92ZXIgewogIGNvbG9yOiAjNTM1YmYyOwp9Cgpib2R5IHsKICBtYXJnaW46IDA7CiAgZGlzcGxheTogZmxleDsKICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIG1pbi1oZWlnaHQ6IDEwMHZoOwogIGJhY2tncm91bmQtY29sb3I6ICMxMTE7Cn0KCmgxIHsKICBmb250LXNpemU6IDMuMmVtOwogIGxpbmUtaGVpZ2h0OiAxLjE7Cn0KCiNhcHAgewogIGRpc3BsYXk6IGZsZXg7CiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIG1heC13aWR0aDogMTI4MHB4OwogIG1hcmdpbjogMCBhdXRvOwogIHBhZGRpbmc6IDJyZW07CiAgdGV4dC1hbGlnbjogY2VudGVyOwp9CgojZ2FtZS1jb250YWluZXIgewogIGRpc3BsYXk6IGZsZXg7CiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIHBhZGRpbmc6IDIwcHg7Cn0KCiN1aS10b3AgewogIGRpc3BsYXk6IGZsZXg7CiAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDsKICB3aWR0aDogNjAwcHg7IC8qIGV4YWt0IHdpZSAjZ2FtZS1hcmVhICovCiAgbWFyZ2luLWJvdHRvbTogMTBweDsKICBwYWRkaW5nOiAxMHB4OwogIGJhY2tncm91bmQtY29sb3I6ICMyMjI7CiAgYm9yZGVyLXJhZGl1czogMTBweDsKICBib3gtc2l6aW5nOiBib3JkZXItYm94Owp9CgojdWktY2VudGVyIHsKICBkaXNwbGF5OiBmbGV4OwogIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICBnYXA6IDA7CiAgbWFyZ2luLWJvdHRvbTogMjBweDsKICB6LWluZGV4OiAxMDsKfQojdWktY2VudGVyIC5oaWRkZW4gewogIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsKfQoKI3RpbWVyLWNvbnRhaW5lciB7CiAgd2lkdGg6IDEwMHB4OwogIHRleHQtYWxpZ246IGNlbnRlcjsKICBkaXNwbGF5OiBmbGV4OwogIGp1c3RpZnktY29udGVudDogY2VudGVyOwp9CgojdGltZXIgewogIGZvbnQtc2l6ZTogMzJweDsKICBmb250LXdlaWdodDogYm9sZDsKICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTsKfQoKI2xhcC1jb3VudGVyIHsKICBmb250LXNpemU6IDIwcHg7CiAgdGV4dC1hbGlnbjogY2VudGVyOwogIG1hcmdpbi10b3A6IDVweDsKICBncmlkLWNvbHVtbjogMjsKfQoKI3JhbmtpbmcgewogIHdpZHRoOiAyMjBweDsgLyogT3B0aW9uYWw6IEZlc3RlIEJyZWl0ZSBmw7xyIGRhcyBSYW5raW5nLVBhbmVsICovCiAgcGFkZGluZzogMTBweDsKICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzOwogIGJvcmRlci1yYWRpdXM6IDEwcHg7CiAgYm94LXNpemluZzogYm9yZGVyLWJveDsKfQoKLnJhbmtpbmctdGl0bGUgewogIGZvbnQtd2VpZ2h0OiBib2xkOwogIG1hcmdpbi1ib3R0b206IDEwcHg7CiAgdGV4dC1hbGlnbjogY2VudGVyOwp9CgojcmFua2luZy1saXN0IHsKICBwb3NpdGlvbjogcmVsYXRpdmU7CiAgb3ZlcmZsb3c6IGhpZGRlbjsKfQoKLnJhbmtpbmctaXRlbSB7CiAgbWFyZ2luOiA1cHggMDsKICBkaXNwbGF5OiBmbGV4OwogIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIHBhZGRpbmc6IDVweDsKICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDQ0OwogIGJvcmRlci1yYWRpdXM6IDNweDsKICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC41cyBlYXNlLWluLW91dDsKfQoKLnJhbmtpbmctaXRlbS5tb3ZpbmcgewogIHotaW5kZXg6IDEwOwp9CgouY2FyLWNvbG9yIHsKICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7CiAgd2lkdGg6IDIwcHg7CiAgaGVpZ2h0OiAyMHB4OwogIGJvcmRlci1yYWRpdXM6IDNweDsKfQoKLmNhci1jb2xvci5yZWQgewogIGJhY2tncm91bmQtY29sb3I6ICNmZjAwMDA7Cn0KCi5jYXItY29sb3IuYmxhY2sgewogIGJhY2tncm91bmQtY29sb3I6ICMwMDAwMDA7CiAgYm9yZGVyOiAxcHggc29saWQgI2ZmZjsKfQoKLmNhci1jb2xvci5vcmFuZ2UgewogIGJhY2tncm91bmQtY29sb3I6ICNmZjhjMDA7Cn0KCiNyZXNldC1idXR0b24gewogIGJhY2tncm91bmQtY29sb3I6ICNlMGUwZTA7CiAgY29sb3I6ICMyMjI7CiAgZm9udC1zaXplOiAxZW07CiAgcGFkZGluZzogOHB4IDE4cHg7CiAgYm9yZGVyLXJhZGl1czogNXB4OwogIGJvcmRlcjogMXB4IHNvbGlkICNiYmI7CiAgYm94LXNoYWRvdzogMCAxcHggNHB4ICMwMDAyOwogIG1hcmdpbjogMTRweCBhdXRvIDAgYXV0bzsKICBtaW4td2lkdGg6IDcwcHg7Cn0KI3Jlc2V0LWJ1dHRvbjpob3ZlciB7CiAgYmFja2dyb3VuZC1jb2xvcjogI2NjY2NjYzsKICBjb2xvcjogIzExMTsKfQoKI3Jlc2V0LWJ1dHRvbi5oaWRkZW4gewogIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsKfQoKI2dhbWUtYXJlYSB7CiAgcG9zaXRpb246IHJlbGF0aXZlOwogIHdpZHRoOiA2MDBweDsKICBoZWlnaHQ6IDgwMHB4OwogIHRyYW5zZm9ybS1vcmlnaW46IHRvcCBsZWZ0Owp9CgojZ2FtZS1jYW52YXMgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICB0b3A6IDA7CiAgbGVmdDogMDsKICB3aWR0aDogMTAwJTsKICBoZWlnaHQ6IDEwMCU7CiAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDsKfQoKLyogUmVzcG9uc2l2ZSBzY2FsaW5nIGNvbnRhaW5lciAqLwpyYWNlLWdhbWUgewogIGRpc3BsYXk6IGJsb2NrOwogIHdpZHRoOiAxMDAlOwogIGhlaWdodDogYXV0bzsKICBhc3BlY3QtcmF0aW86IDYwMCAvIDgwMDsKICBtYXgtd2lkdGg6IDYwMHB4OwogIG1heC1oZWlnaHQ6IDgwMHB4OwogIG1hcmdpbjogMCBhdXRvOwogIG92ZXJmbG93OiBoaWRkZW47Cn0KCiNnYW1lLW92ZXJsYXkgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICB0b3A6IDA7CiAgbGVmdDogMDsKICB3aWR0aDogMTAwJTsKICBoZWlnaHQ6IDEwMCU7CiAgZGlzcGxheTogZmxleDsKICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOwogIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IC8qIHplbnRyaWVydCBhbGxlIEtpbmRlciB2ZXJ0aWthbCAqLwogIHBvaW50ZXItZXZlbnRzOiBub25lOwp9CiNnYW1lLW92ZXJsYXkgPiAqIHsKICBwb2ludGVyLWV2ZW50czogYXV0bzsKfQoKI3N0YXJ0LWJ1dHRvbiB7CiAgcG9zaXRpb246IHJlbGF0aXZlOwogIHotaW5kZXg6IDIwOwogIG1hcmdpbi1ib3R0b206IDIwcHg7CiAgbWFyZ2luLXRvcDogMDsKICBwYWRkaW5nOiAxNXB4IDMwcHg7CiAgZm9udC1zaXplOiAyNHB4OwogIGJhY2tncm91bmQtY29sb3I6ICM0Q0FGNTA7CiAgY29sb3I6IHdoaXRlOwogIGJvcmRlcjogbm9uZTsKICBib3JkZXItcmFkaXVzOiA1cHg7CiAgY3Vyc29yOiBwb2ludGVyOwogIGRpc3BsYXk6IGJsb2NrOwogIHBvaW50ZXItZXZlbnRzOiBhdXRvOwp9CiNzdGFydC1idXR0b246aG92ZXIgewogIGJhY2tncm91bmQtY29sb3I6ICM0NWEwNDk7Cn0KCiN0cmFmZmljLWxpZ2h0IHsKICBkaXNwbGF5OiBmbGV4OwogIGdhcDogMTBweDsKICBtYXJnaW4tYm90dG9tOiAxMHB4Owp9CgoubGlnaHQgewogIHdpZHRoOiAzMHB4OwogIGhlaWdodDogMzBweDsKICBib3JkZXItcmFkaXVzOiA1MCU7CiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMzsKfQoKLmxpZ2h0LnJlZC5hY3RpdmUgewogIGJhY2tncm91bmQtY29sb3I6ICNmZjAwMDA7CiAgYm94LXNoYWRvdzogMCAwIDE1cHggI2ZmMDAwMDsKfQoKLmxpZ2h0LnllbGxvdy5hY3RpdmUgewogIGJhY2tncm91bmQtY29sb3I6ICNmZmZmMDA7CiAgYm94LXNoYWRvdzogMCAwIDE1cHggI2ZmZmYwMDsKfQoKLmxpZ2h0LmdyZWVuLmFjdGl2ZSB7CiAgYmFja2dyb3VuZC1jb2xvcjogIzAwZmYwMDsKICBib3gtc2hhZG93OiAwIDAgMTVweCAjMDBmZjAwOwp9CgojY291bnRkb3duIHsKICBmb250LXNpemU6IDM2cHg7CiAgZm9udC13ZWlnaHQ6IGJvbGQ7CiAgY29sb3I6ICNmZmY7CiAgdGV4dC1zaGFkb3c6IDAgMCAxMHB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KTsKfQoKLmhpZGRlbiB7CiAgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50Owp9CgojaGVhZGxpbmUgewogIGZsZXg6IDE7CiAgZGlzcGxheTogZmxleDsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIGZvbnQtc2l6ZTogMi42ZW07CiAgZm9udC13ZWlnaHQ6IGJvbGQ7CiAgY29sb3I6ICNmZmY7CiAgbGV0dGVyLXNwYWNpbmc6IDJweDsKICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7CiAgcGFkZGluZy1sZWZ0OiAxMHB4Owp9CgoubG9nbyB7CiAgaGVpZ2h0OiA2ZW07CiAgcGFkZGluZzogMS41ZW07CiAgd2lsbC1jaGFuZ2U6IGZpbHRlcjsKICB0cmFuc2l0aW9uOiBmaWx0ZXIgMzAwbXM7Cn0KLmxvZ286aG92ZXIgewogIGZpbHRlcjogZHJvcC1zaGFkb3coMCAwIDJlbSAjNjQ2Y2ZmYWEpOwp9Ci5sb2dvLnZhbmlsbGE6aG92ZXIgewogIGZpbHRlcjogZHJvcC1zaGFkb3coMCAwIDJlbSAjMzE3OGM2YWEpOwp9CgouY2FyZCB7CiAgcGFkZGluZzogMmVtOwp9CgoucmVhZC10aGUtZG9jcyB7CiAgY29sb3I6ICM4ODg7Cn0KCmJ1dHRvbiB7CiAgYm9yZGVyLXJhZGl1czogOHB4OwogIGJvcmRlcjogMXB4IHNvbGlkIHRyYW5zcGFyZW50OwogIHBhZGRpbmc6IDAuNmVtIDEuMmVtOwogIGZvbnQtc2l6ZTogMWVtOwogIGZvbnQtd2VpZ2h0OiA1MDA7CiAgZm9udC1mYW1pbHk6IGluaGVyaXQ7CiAgYmFja2dyb3VuZC1jb2xvcjogIzFhMWExYTsKICBjdXJzb3I6IHBvaW50ZXI7CiAgdHJhbnNpdGlvbjogYm9yZGVyLWNvbG9yIDAuMjVzOwp9CmJ1dHRvbjpob3ZlciB7CiAgYm9yZGVyLWNvbG9yOiAjNjQ2Y2ZmOwp9CmJ1dHRvbjpmb2N1cywKYnV0dG9uOmZvY3VzLXZpc2libGUgewogIG91dGxpbmU6IDRweCBhdXRvIC13ZWJraXQtZm9jdXMtcmluZy1jb2xvcjsKfQoKQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHsKICA6cm9vdCB7CiAgICBjb2xvcjogIzIxMzU0NzsKICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7CiAgfQogIGE6aG92ZXIgewogICAgY29sb3I6ICM3NDdiZmY7CiAgfQogIGJ1dHRvbiB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjlmOWY5OwogIH0KfQoKQG1lZGlhIChtYXgtd2lkdGg6IDcwMHB4KSB7CiAgcmFjZS1nYW1lIHsKICAgIG1heC13aWR0aDogMTAwJTsKICAgIHdpZHRoOiAxMDAlOwogICAgYXNwZWN0LXJhdGlvOiA2MDAgLyA4MDA7CiAgfQogICNnYW1lLWFyZWEgewogICAgd2lkdGg6IDYwMHB4OwogICAgaGVpZ2h0OiA4MDBweDsKICAgIHRyYW5zZm9ybTogc2NhbGUodmFyKC0tZ2FtZS1zY2FsZSwgMSkpOwogIH0KICAjZ2FtZS1jYW52YXMgewogICAgd2lkdGg6IDEwMCUgIWltcG9ydGFudDsKICAgIGhlaWdodDogMTAwJSAhaW1wb3J0YW50OwogIH0KICAjdWktdG9wIHsKICAgIHdpZHRoOiAxMDB2dzsKICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgICBhbGlnbi1pdGVtczogc3RyZXRjaDsKICAgIGJvcmRlci1yYWRpdXM6IDAgMCAxMHB4IDEwcHg7CiAgICBtYXJnaW4tYm90dG9tOiAwOwogICAgcGFkZGluZzogOHB4IDAgMCAwOwogIH0KICAjaGVhZGxpbmUgewogICAgZm9udC1zaXplOiAxLjVlbTsKICAgIHBhZGRpbmctbGVmdDogOHB4OwogICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgfQogICNyYW5raW5nIHsKICAgIHdpZHRoOiAxMDAlOwogICAgYm9yZGVyLXJhZGl1czogMCAwIDEwcHggMTBweDsKICAgIG1hcmdpbi10b3A6IDhweDsKICB9CiAgI3Jlc2V0LWJ1dHRvbiB7CiAgICBsZWZ0OiAxMHB4OwogICAgYm90dG9tOiAxMHB4OwogICAgcGFkZGluZzogMTJweCAyMHB4OwogICAgZm9udC1zaXplOiAxLjJlbTsKICB9CiAgI3VpLWNlbnRlciB7CiAgICBtYXJnaW4tYm90dG9tOiAxMHB4OwogIH0KICAjdGltZXItY29udGFpbmVyIHsKICAgIHdpZHRoOiA4MHZ3OwogICAgbWF4LXdpZHRoOiAyMDBweDsKICB9CiAgI3RpbWVyIHsKICAgIGZvbnQtc2l6ZTogMmVtOwogIH0KICAjbGFwLWNvdW50ZXIgewogICAgZm9udC1zaXplOiAxLjFlbTsKICB9Cn0KCi8qIFRvdWNoLVN0ZXVlcnVuZyBCdXR0b25zICovCiN0b3VjaC1jb250cm9scyB7CiAgcG9zaXRpb246IGFic29sdXRlOwogIGxlZnQ6IDA7CiAgcmlnaHQ6IDA7CiAgYm90dG9tOiAwOwogIHdpZHRoOiAxMDAlOwogIGRpc3BsYXk6IG5vbmU7CiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOwogIHBvaW50ZXItZXZlbnRzOiBub25lOwogIHotaW5kZXg6IDMwOwogIHBhZGRpbmc6IDAgMCAxOHB4IDA7Cn0KCkBtZWRpYSAobWF4LXdpZHRoOiA3MDBweCksIChwb2ludGVyOiBjb2Fyc2UpIHsKICAjdG91Y2gtY29udHJvbHMgewogICAgZGlzcGxheTogZmxleDsKICB9Cn0KCiNidG4tbGVmdCwgI2J0bi1yaWdodCB7CiAgcG9pbnRlci1ldmVudHM6IGF1dG87CiAgd2lkdGg6IDYwcHg7CiAgaGVpZ2h0OiA2MHB4OwogIGJvcmRlci1yYWRpdXM6IDUwJTsKICBiYWNrZ3JvdW5kOiAjMzMzYTsKICBjb2xvcjogI2ZmZjsKICBmb250LXNpemU6IDJlbTsKICBib3JkZXI6IDJweCBzb2xpZCAjZmZmOwogIGRpc3BsYXk6IGZsZXg7CiAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsKICBib3gtc2hhZG93OiAwIDJweCA4cHggIzAwMDU7CiAgdXNlci1zZWxlY3Q6IG5vbmU7CiAgdG91Y2gtYWN0aW9uOiBtYW5pcHVsYXRpb247CiAgbWFyZ2luOiAwIDE4cHg7Cn0KI2J0bi1sZWZ0IHsganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0OyB9CiNidG4tcmlnaHQgeyBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kOyB9CiNidG4tbGVmdDphY3RpdmUsICNidG4tcmlnaHQ6YWN0aXZlIHsKICBiYWNrZ3JvdW5kOiAjNGNhZjUwOwogIGNvbG9yOiAjZmZmOwp9CgovKiBTdHlsZXMgZm9yIGlmcmFtZSBlbWJlZGRpbmcgKi8KOmhvc3QgewogIGRpc3BsYXk6IGJsb2NrOwogIHdpZHRoOiAxMDAlOwogIGhlaWdodDogYXV0bzsKICBhc3BlY3QtcmF0aW86IDYwMCAvIDgwMDsKICBtYXJnaW46IDAgYXV0bzsKfQoKLyogVGhpcyBtYWtlcyB0aGUgZ2FtZSBtYWludGFpbiBpdHMgYXNwZWN0IHJhdGlvIHdoZW4gZW1iZWRkZWQgaW4gaWZyYW1lcyB3aXRoIGZpeGVkIGhlaWdodCAqLwpAbWVkaWEgKG1heC1oZWlnaHQ6IDgwMHB4KSB7CiAgOmhvc3QgewogICAgaGVpZ2h0OiAxMDAlOwogICAgd2lkdGg6IGF1dG87CiAgfQogIAogICNnYW1lLWNvbnRhaW5lciB7CiAgICB0cmFuc2Zvcm0tb3JpZ2luOiBjZW50ZXIgY2VudGVyOwogICAgcG9zaXRpb246IGFic29sdXRlOwogICAgdG9wOiA1MCU7CiAgICBsZWZ0OiA1MCU7CiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKSBzY2FsZSh2YXIoLS1jYWxjdWxhdGVkLXNjYWxlKSk7CiAgfQp9Cg==", import.meta.url).toString();
  }
  setupTouchControls() {
    const btnLeft = this.shadow.getElementById("btn-left");
    const btnRight = this.shadow.getElementById("btn-right");
    const playerCar = () => this.gameInstance?.getPlayerCar();
    function startAction(action) {
      if (!playerCar()) return;
      if (action === "left") playerCar().turnLeft();
      if (action === "right") playerCar().turnRight();
    }
    function stopAction(action) {
      if (!playerCar()) return;
      if (action === "left" || action === "right") playerCar().resetSteering();
    }
    [
      { btn: btnLeft, action: "left" },
      { btn: btnRight, action: "right" }
    ].forEach(({ btn, action }) => {
      if (!btn) return;
      btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        startAction(action);
      });
      btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        stopAction(action);
      });
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        startAction(action);
      });
      btn.addEventListener("mouseup", (e) => {
        e.preventDefault();
        stopAction(action);
      });
      btn.addEventListener("mouseleave", (e) => {
        e.preventDefault();
        stopAction(action);
      });
    });
  }
  setupResizeHandling() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    const gameArea = this.shadow.getElementById("game-area");
    const canvas = this.shadow.getElementById("game-canvas");
    if (!gameArea || !canvas) return;
    this.adjustGameScale();
    this.resizeObserver = new ResizeObserver(() => {
      this.adjustGameScale();
    });
    this.resizeObserver.observe(this);
    globalThis.addEventListener("resize", () => this.adjustGameScale());
  }
  adjustGameScale() {
    const gameContainer = this.shadow.getElementById("game-container");
    const gameArea = this.shadow.getElementById("game-area");
    const canvas = this.shadow.getElementById("game-canvas");
    const uiTop = this.shadow.getElementById("ui-top");
    if (!gameContainer || !gameArea || !canvas || !uiTop) return;
    const originalWidth = 600;
    const originalHeight = 800;
    const aspectRatio = originalWidth / originalHeight;
    const containerWidth = this.clientWidth;
    const containerHeight = this.clientHeight;
    let newWidth, newHeight, scale;
    if (containerWidth / containerHeight > aspectRatio) {
      newHeight = containerHeight;
      newWidth = newHeight * aspectRatio;
      scale = newHeight / originalHeight;
    } else {
      newWidth = containerWidth;
      newHeight = newWidth / aspectRatio;
      scale = newWidth / originalWidth;
    }
    gameContainer.style.transform = `scale(${scale})`;
    gameContainer.style.transformOrigin = "center top";
    gameContainer.style.width = `${originalWidth}px`;
    gameContainer.style.height = `${originalHeight + uiTop.offsetHeight}px`;
    this.style.display = "block";
    this.style.width = `${newWidth}px`;
    this.style.height = `${newHeight + uiTop.offsetHeight * scale}px`;
    this.style.overflow = "hidden";
  }
}
globalThis.customElements.define("race-game", RaceGameElement);

export { RaceGameElement };
