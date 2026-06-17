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
    description: '攻击快，伤害低'
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
    description: '攻击慢，范围伤害'
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
    description: '减速敌人'
  }
};

class Tower {
  constructor(type, col, row, gameMap) {
    this.type = type;
    this.col = col;
    this.row = row;
    this.gameMap = gameMap;
    this.config = TowerConfig[type];

    this.x = col * gameMap.tileSize + gameMap.tileSize / 2;
    this.y = row * gameMap.tileSize + gameMap.tileSize / 2;

    this.cooldown = 0;
    this.angle = 0;
    this.target = null;
  }

  update(deltaTime, enemySpawner, projectiles) {
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }

    this.target = enemySpawner.getClosestEnemyInRange(this.x, this.y, this.config.range);

    if (this.target) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

      if (this.cooldown <= 0) {
        this.fire(projectiles);
        this.cooldown = this.config.fireRate;
      }
    }
  }

  fire(projectiles) {
    const projectile = new Projectile(
      this.x,
      this.y,
      this.target,
      this.config.damage,
      this.config.projectileSpeed,
      this.config.projectileSize,
      this.config.projectileColor,
      this.config.splash,
      this.config.slow,
      this.config.slowDuration
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

    ctx.rotate(this.angle);

    ctx.fillStyle = this.config.color;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.config.color;
    ctx.fillRect(0, -size * 0.12, size * 0.5, size * 0.24);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawRange(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = this.config.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.config.range, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.config.range, 0, Math.PI * 2);
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
