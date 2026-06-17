class Projectile {
  constructor(x, y, target, damage, speed, size, color, splash = 0, slow = 0, slowDuration = 0) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.targetX = target.x;
    this.targetY = target.y;
    this.damage = damage;
    this.speed = speed;
    this.size = size;
    this.color = color;
    this.splash = splash;
    this.slow = slow;
    this.slowDuration = slowDuration;
    this.alive = true;
  }

  update(deltaTime, enemySpawner) {
    if (!this.alive) return;

    if (this.target && this.target.alive) {
      this.targetX = this.target.x;
      this.targetY = this.target.y;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.hit(enemySpawner);
      return;
    }

    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
  }

  hit(enemySpawner) {
    if (this.splash > 0) {
      const enemies = enemySpawner.getEnemiesInRange(this.targetX, this.targetY, this.splash);
      for (const enemy of enemies) {
        enemy.takeDamage(this.damage);
        if (this.slow > 0) {
          enemy.applySlow(this.slow, this.slowDuration);
        }
      }
    } else if (this.target && this.target.alive) {
      this.target.takeDamage(this.damage);
      if (this.slow > 0) {
        this.target.applySlow(this.slow, this.slowDuration);
      }
    }

    this.alive = false;
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  add(projectile) {
    this.projectiles.push(projectile);
  }

  update(deltaTime, enemySpawner) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.projectiles[i].update(deltaTime, enemySpawner);
      if (!this.projectiles[i].alive) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const projectile of this.projectiles) {
      projectile.draw(ctx);
    }
  }
}
