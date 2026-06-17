class GameMap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = 40;
    this.cols = Math.floor(canvas.width / this.tileSize);
    this.rows = Math.floor(canvas.height / this.tileSize);

    this.pathPoints = [
      { x: 0, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 6 },
      { x: 10, y: 6 },
      { x: 10, y: 2 },
      { x: 16, y: 2 },
      { x: 16, y: 8 },
      { x: 6, y: 8 },
      { x: 6, y: 12 },
      { x: 14, y: 12 },
      { x: 14, y: 10 },
      { x: 19, y: 10 }
    ];

    this.pathTiles = this._buildPathTiles();
    this.buildableTiles = this._buildBuildableTiles();
  }

  _buildPathTiles() {
    const tiles = new Set();
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const start = this.pathPoints[i];
      const end = this.pathPoints[i + 1];
      const dx = Math.sign(end.x - start.x);
      const dy = Math.sign(end.y - start.y);
      let x = start.x;
      let y = start.y;
      while (x !== end.x || y !== end.y) {
        tiles.add(`${x},${y}`);
        if (x !== end.x) x += dx;
        else if (y !== end.y) y += dy;
      }
      tiles.add(`${end.x},${end.y}`);
    }
    return tiles;
  }

  _buildBuildableTiles() {
    const tiles = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.pathTiles.has(`${x},${y}`)) {
          tiles.push({ x, y });
        }
      }
    }
    return tiles;
  }

  isPathTile(col, row) {
    return this.pathTiles.has(`${col},${row}`);
  }

  isBuildable(col, row) {
    return !this.pathTiles.has(`${col},${row}`) && col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  getPathPosition(progress) {
    const totalSegments = this.pathPoints.length - 1;
    const segmentProgress = progress * totalSegments;
    const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
    const t = segmentProgress - segmentIndex;

    const start = this.pathPoints[segmentIndex];
    const end = this.pathPoints[segmentIndex + 1];

    const x = (start.x + (end.x - start.x) * t) * this.tileSize + this.tileSize / 2;
    const y = (start.y + (end.y - start.y) * t) * this.tileSize + this.tileSize / 2;

    return { x, y };
  }

  getTotalPathLength() {
    let length = 0;
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const start = this.pathPoints[i];
      const end = this.pathPoints[i + 1];
      length += Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
    }
    return length * this.tileSize;
  }

  getTileAt(x, y) {
    return {
      col: Math.floor(x / this.tileSize),
      row: Math.floor(y / this.tileSize)
    };
  }

  draw() {
    const ctx = this.ctx;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.pathTiles.has(`${x},${y}`)) {
          ctx.fillStyle = '#8B7355';
        } else {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#2D5A27' : '#3A7233';
        }
        ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }
    }

    ctx.strokeStyle = '#5A4A3A';
    ctx.lineWidth = 2;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.pathTiles.has(`${x},${y}`)) {
          ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
      }
    }

    const start = this.pathPoints[0];
    const end = this.pathPoints[this.pathPoints.length - 1];

    ctx.fillStyle = '#00FF00';
    ctx.fillRect(start.x * this.tileSize + 5, start.y * this.tileSize + 5, this.tileSize - 10, this.tileSize - 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('起', start.x * this.tileSize + this.tileSize / 2, start.y * this.tileSize + this.tileSize / 2);

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(end.x * this.tileSize + 5, end.y * this.tileSize + 5, this.tileSize - 10, this.tileSize - 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('终', end.x * this.tileSize + this.tileSize / 2, end.y * this.tileSize + this.tileSize / 2);
  }

  drawBuildPreview(col, row, valid) {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = valid ? '#00FF00' : '#FF0000';
    ctx.fillRect(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize);
    ctx.globalAlpha = 1;
  }
}
