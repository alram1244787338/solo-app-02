const TowerTypes = {
  RAPID: 'rapid',
  CANNON: 'cannon',
  FROST: 'frost'
};

const TowerConfig = {
  [TowerTypes.RAPID]: {
    name: '速射塔',
    cost: 50,
    damage: 8,
    range: 100,
    fireRate: 200,
    color: '#3498DB',
    projectileColor: '#5DADE2',
    projectileSpeed: 8,
    projectileSize: 3,
    splash: 0,
    slow: 0,
    slowDuration: 0,
    description: '攻击快，伤害低',
    upgradeCosts: [40, 80, 150],
    upgradeDamageMult: [1, 1.6, 2.4, 3.5],
    upgradeRangeMult: [1, 1.15, 1.3, 1.5]
  },
  [TowerTypes.CANNON]: {
    name: '炮塔',
    cost: 100,
    damage: 40,
    range: 120,
    fireRate: 1200,
    color: '#E67E22',
    projectileColor: '#D35400',
    projectileSpeed: 5,
    projectileSize: 6,
    splash: 40,
    slow: 0,
    slowDuration: 0,
    description: '攻击慢，范围伤害',
    upgradeCosts: [80, 150, 250],
    upgradeDamageMult: [1, 1.5, 2.2, 3.2],
    upgradeRangeMult: [1, 1.1, 1.25, 1.45],
    upgradeSplashMult: [1, 1.2, 1.5, 2.0]
  },
  [TowerTypes.FROST]: {
    name: '冰霜塔',
    cost: 75,
    damage: 5,
    range: 90,
    fireRate: 500,
    color: '#1ABC9C',
    projectileColor: '#48C9B0',
    projectileSpeed: 6,
    projectileSize: 4,
    splash: 0,
    slow: 0.4,
    slowDuration: 2000,
    description: '减速敌人',
    upgradeCosts: [60, 120, 200],
    upgradeDamageMult: [1, 1.4, 2.0, 3.0],
    upgradeRangeMult: [1, 1.15, 1.3, 1.5],
    upgradeSlowMult: [1, 1.25, 1.6, 2.0],
    upgradeSlowDurationMult: [1, 1.2, 1.5, 2.0]
  }
};

class Tower {
  constructor(type, col, row, gameMap) {
    this.type = type;
    this.col = col;
    this.row = row;
    this.gameMap = gameMap;
    this.baseConfig = TowerConfig[type];
    this.level = 0;

    this.x = col * gameMap.tileSize + gameMap.tileSize / 2;
    this.y = row * gameMap.tileSize + gameMap.tileSize / 2;

    this.cooldown = 0;
    this.angle = 0;
    this.target = null;

    this._recalcStats();
  }

  _recalcStats() {
    const cfg = this.baseConfig;
    const lvl = this.level;
    this.damage = Math.round(cfg.damage * cfg.upgradeDamageMult[lvl]);
    this.range = Math.round(cfg.range * cfg.upgradeRangeMult[lvl]);
    this.splash = cfg.splash > 0 ? Math.round(cfg.splash * (cfg.upgradeSplashMult ? cfg.upgradeSplashMult[lvl] : 1)) : 0;
    this.slow = cfg.slow > 0 ? Math.min(0.9, cfg.slow * (cfg.upgradeSlowMult ? cfg.upgradeSlowMult[lvl] : 1)) : 0;
    this.slowDuration = cfg.slowDuration > 0 ? Math.round(cfg.slowDuration * (cfg.upgradeSlowDurationMult ? cfg.upgradeSlowDurationMult[lvl] : 1)) : 0;
  }

  canUpgrade() {
    return this.level < this.baseConfig.upgradeCosts.length;
  }

  getUpgradeCost() {
    if (!this.canUpgrade()) return Infinity;
    return this.baseConfig.upgradeCosts[this.level];
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    this.level++;
    this._recalcStats();
    return true;
  }

  update(deltaTime, enemySpawner, projectiles) {
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }

    this.target = enemySpawner.getClosestEnemyInRange(this.x, this.y, this.range);

    if (this.target) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

      if (this.cooldown <= 0) {
        this.fire(projectiles);
        this.cooldown = this.baseConfig.fireRate;
      }
    }
  }

  fire(projectiles) {
    const projectile = new Projectile(
      this.x,
      this.y,
      this.target,
      this.damage,
      this.baseConfig.projectileSpeed,
      this.baseConfig.projectileSize + this.level,
      this.baseConfig.projectileColor,
      this.splash,
      this.slow,
      this.slowDuration
    );
    projectiles.push(projectile);
  }

  draw(ctx) {
    const size = this.gameMap.tileSize * 0.8;
    const halfSize = size / 2;

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = '#555';
    ctx.fillRect(-halfSize, -halfSize, size, size);

    if (this.level >= 2) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(-halfSize, -halfSize, size, size);
    }

    ctx.rotate(this.angle);

    const bodyRadius = size * 0.35 + this.level * 2;
    ctx.fillStyle = this.baseConfig.color;
    ctx.beginPath();
    ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.baseConfig.color;
    ctx.fillRect(0, -size * 0.12 - this.level, size * 0.5 + this.level * 3, size * 0.24 + this.level * 2);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    if (this.level > 0) {
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const stars = '★'.repeat(this.level);
      ctx.fillText(stars, this.x, this.y - halfSize - 6);
      ctx.restore();
    }
  }

  drawRange(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = this.baseConfig.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = this.baseConfig.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

class TowerManager {
  constructor(gameMap) {
    this.gameMap = gameMap;
    this.towers = [];
    this.occupiedTiles = new Set();
  }

  canPlaceTower(col, row) {
    if (!this.gameMap.isBuildable(col, row)) return false;
    if (this.occupiedTiles.has(`${col},${row}`)) return false;
    return true;
  }

  placeTower(type, col, row) {
    if (!this.canPlaceTower(col, row)) return null;

    const tower = new Tower(type, col, row, this.gameMap);
    this.towers.push(tower);
    this.occupiedTiles.add(`${col},${row}`);
    return tower;
  }

  getTowerAt(col, row) {
    return this.towers.find(t => t.col === col && t.row === row) || null;
  }

  update(deltaTime, enemySpawner, projectiles) {
    for (const tower of this.towers) {
      tower.update(deltaTime, enemySpawner, projectiles);
    }
  }

  draw(ctx, selectedTower = null) {
    if (selectedTower) {
      selectedTower.drawRange(ctx);
    }

    for (const tower of this.towers) {
      tower.draw(ctx);
    }
  }
}
