const EnemyTypes = {
  NORMAL: 'normal',
  FAST: 'fast',
  TANK: 'tank'
};

class Enemy {
  constructor(type, gameMap) {
    this.type = type;
    this.gameMap = gameMap;
    this.progress = 0;
    this.alive = true;
    this.reachedEnd = false;
    this.slowed = 0;
    this.slowTimer = 0;

    this._initStats();
    this._updatePosition();
  }

  _initStats() {
    switch (this.type) {
      case EnemyTypes.NORMAL:
        this.maxHp = 100;
        this.hp = 100;
        this.baseSpeed = 0.0008;
        this.reward = 10;
        this.size = 14;
        this.color = '#4A90D9';
        this.shape = 'circle';
        break;
      case EnemyTypes.FAST:
        this.maxHp = 60;
        this.hp = 60;
        this.baseSpeed = 0.0018;
        this.reward = 15;
        this.size = 10;
        this.color = '#50C878';
        this.shape = 'triangle';
        break;
      case EnemyTypes.TANK:
        this.maxHp = 300;
        this.hp = 300;
        this.baseSpeed = 0.0005;
        this.reward = 25;
        this.size = 18;
        this.color = '#D9534F';
        this.shape = 'square';
        break;
      default:
        this.maxHp = 100;
        this.hp = 100;
        this.baseSpeed = 0.0008;
        this.reward = 10;
        this.size = 14;
        this.color = '#4A90D9';
        this.shape = 'circle';
    }
  }

  _updatePosition() {
    const pos = this.gameMap.getPathPosition(this.progress);
    this.x = pos.x;
    this.y = pos.y;
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  applySlow(slowAmount, duration) {
    if (slowAmount > this.slowed) {
      this.slowed = slowAmount;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  update(deltaTime) {
    if (!this.alive || this.reachedEnd) return;

    if (this.slowTimer > 0) {
      this.slowTimer -= deltaTime;
      if (this.slowTimer <= 0) {
        this.slowed = 0;
      }
    }

    const currentSpeed = this.baseSpeed * (1 - this.slowed);
    this.progress += currentSpeed * deltaTime;

    if (this.progress >= 1) {
      this.progress = 1;
      this.reachedEnd = true;
    }

    this._updatePosition();
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = this.slowed > 0 ? '#9370DB' : this.color;

    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, this.size);
        ctx.lineTo(-this.size, this.size);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case 'square':
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.size, -this.size, this.size * 2, this.size * 2);
        break;
    }

    ctx.restore();

    const hpBarWidth = this.size * 2;
    const hpBarHeight = 4;
    const hpBarY = this.y - this.size - 10;

    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight);

    const hpPercent = this.hp / this.maxHp;
    let hpColor;
    if (hpPercent > 0.6) hpColor = '#4CAF50';
    else if (hpPercent > 0.3) hpColor = '#FFC107';
    else hpColor = '#F44336';

    ctx.fillStyle = hpColor;
    ctx.fillRect(this.x - hpBarWidth / 2, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
  }
}

class EnemySpawner {
  constructor(gameMap) {
    this.gameMap = gameMap;
    this.enemies = [];
    this.wave = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveActive = false;
    this.waveComplete = true;
  }

  startWave() {
    if (this.waveActive) return;

    this.wave++;
    this.waveActive = true;
    this.waveComplete = false;
    this.spawnQueue = this._generateWaveEnemies(this.wave);
    this.spawnTimer = 0;
  }

  _generateWaveEnemies(wave) {
    const enemies = [];
    const baseCount = 5 + Math.floor(wave * 1.5);

    for (let i = 0; i < baseCount; i++) {
      const rand = Math.random();
      let type;
      if (wave < 3) {
        type = EnemyTypes.NORMAL;
      } else if (wave < 5) {
        type = rand < 0.7 ? EnemyTypes.NORMAL : EnemyTypes.FAST;
      } else {
        if (rand < 0.5) type = EnemyTypes.NORMAL;
        else if (rand < 0.8) type = EnemyTypes.FAST;
        else type = EnemyTypes.TANK;
      }
      enemies.push(type);
    }

    return enemies;
  }

  update(deltaTime) {
    if (this.spawnQueue.length > 0) {
      this.spawnTimer += deltaTime;
      const spawnInterval = 800;
      if (this.spawnTimer >= spawnInterval) {
        const type = this.spawnQueue.shift();
        this.enemies.push(new Enemy(type, this.gameMap));
        this.spawnTimer = 0;
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].update(deltaTime);
      if (!this.enemies[i].alive || this.enemies[i].reachedEnd) {
        this.enemies.splice(i, 1);
      }
    }

    if (this.spawnQueue.length === 0 && this.enemies.length === 0 && this.waveActive) {
      this.waveActive = false;
      this.waveComplete = true;
    }
  }

  draw(ctx) {
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }
  }

  getEnemiesInRange(x, y, range) {
    return this.enemies.filter(enemy => {
      if (!enemy.alive) return false;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      return dx * dx + dy * dy <= range * range;
    });
  }

  getClosestEnemyInRange(x, y, range) {
    let closest = null;
    let closestProgress = -1;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy <= range * range) {
        if (enemy.progress > closestProgress) {
          closest = enemy;
          closestProgress = enemy.progress;
        }
      }
    }

    return closest;
  }
}
