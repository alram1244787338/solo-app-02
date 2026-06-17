class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.gameMap = new GameMap(canvas);
    this.enemySpawner = new EnemySpawner(this.gameMap);
    this.towerManager = new TowerManager(this.gameMap);
    this.projectileManager = new ProjectileManager();
    this.ui = new UI(canvas, this);

    this.gold = 150;
    this.lives = 20;
    this.score = 0;

    this.selectedTowerType = null;
    this.selectedTower = null;
    this.hoverTile = null;

    this.gameOver = false;
    this.lastTime = 0;

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._onRightClick(e);
    });
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.gameOver) return;

    if (this.ui.isInSidebar(x)) {
      this.hoverTile = null;
      return;
    }

    const tile = this.gameMap.getTileAt(x, y);
    this.hoverTile = tile;
  }

  _onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.gameOver) {
      this._restart();
      return;
    }

    if (this.ui.isInSidebar(x)) {
      this._handleSidebarClick(x, y);
      return;
    }

    const tile = this.gameMap.getTileAt(x, y);

    if (this.selectedTowerType) {
      this._tryPlaceTower(tile.col, tile.row);
    } else {
      this._selectExistingTower(tile.col, tile.row);
    }
  }

  _onRightClick(e) {
    if (this.gameOver) return;
    this.selectedTowerType = null;
    this.selectedTower = null;
  }

  _handleSidebarClick(x, y) {
    if (this.ui.isUpgradeButtonClicked(x, y)) {
      this._tryUpgradeTower();
      return;
    }

    const towerType = this.ui.getClickedTowerButton(x, y);
    if (towerType) {
      const config = TowerConfig[towerType];
      if (this.gold >= config.cost) {
        this.selectedTowerType = towerType;
        this.selectedTower = null;
      }
      return;
    }

    if (this.ui.isWaveButtonClicked(x, y)) {
      if (!this.enemySpawner.waveActive) {
        this.enemySpawner.startWave();
      }
    }
  }

  _tryPlaceTower(col, row) {
    if (!this.selectedTowerType) return;

    const config = TowerConfig[this.selectedTowerType];
    if (this.gold < config.cost) return;

    const tower = this.towerManager.placeTower(this.selectedTowerType, col, row);
    if (tower) {
      this.gold -= config.cost;
      this.selectedTowerType = null;
      this.selectedTower = tower;
    }
  }

  _tryUpgradeTower() {
    if (!this.selectedTower) return;
    if (!this.selectedTower.canUpgrade()) return;

    const cost = this.selectedTower.getUpgradeCost();
    if (this.gold < cost) return;

    this.gold -= cost;
    this.selectedTower.upgrade();
  }

  _selectExistingTower(col, row) {
    this.selectedTower = this.towerManager.getTowerAt(col, row);
  }

  _restart() {
    this.gold = 150;
    this.lives = 20;
    this.score = 0;
    this.selectedTowerType = null;
    this.selectedTower = null;
    this.hoverTile = null;
    this.gameOver = false;

    this.enemySpawner = new EnemySpawner(this.gameMap);
    this.towerManager = new TowerManager(this.gameMap);
    this.projectileManager = new ProjectileManager();
    this.ui = new UI(this.canvas, this);
  }

  update(deltaTime) {
    if (this.gameOver) return;

    const previousEnemies = [...this.enemySpawner.enemies];

    this.enemySpawner.update(deltaTime);
    this.towerManager.update(deltaTime, this.enemySpawner, this.projectileManager.projectiles);
    this.projectileManager.update(deltaTime, this.enemySpawner);

    for (const enemy of previousEnemies) {
      if (enemy.alive && !this.enemySpawner.enemies.includes(enemy)) {
        this.gold += enemy.reward;
        this.score += enemy.reward * 2;
      }
    }

    for (const enemy of this.enemySpawner.enemies) {
      if (enemy.reachedEnd && enemy.alive) {
        enemy.alive = false;
        this.lives--;
        if (this.lives <= 0) {
          this.lives = 0;
          this.gameOver = true;
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.gameMap.draw();

    if (this.hoverTile && this.selectedTowerType) {
      const canBuild = this.towerManager.canPlaceTower(this.hoverTile.col, this.hoverTile.row);
      this.gameMap.drawBuildPreview(this.hoverTile.col, this.hoverTile.row, canBuild);

      if (canBuild) {
        const config = TowerConfig[this.selectedTowerType];
        const previewX = this.hoverTile.col * this.gameMap.tileSize + this.gameMap.tileSize / 2;
        const previewY = this.hoverTile.row * this.gameMap.tileSize + this.gameMap.tileSize / 2;

        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        this.ctx.fillStyle = config.color;
        this.ctx.beginPath();
        this.ctx.arc(previewX, previewY, config.range, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeStyle = config.color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(previewX, previewY, config.range, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
      }
    }

    this.towerManager.draw(this.ctx, this.selectedTower);
    this.enemySpawner.draw(this.ctx);
    this.projectileManager.draw(this.ctx);
    this.ui.draw();

    if (this.gameOver) {
      this.ui.drawGameOver();
    }
  }

  loop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }
}
