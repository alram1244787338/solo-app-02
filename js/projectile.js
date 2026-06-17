class ExplosionEffect {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.maxRadius = radius;
    this.currentRadius = 0;
    this.color = color;
    this.life = 1;
    this.alive = true;
  }

  update(deltaTime) {
    if (!this.alive) return;
    this.life -= deltaTime / 400;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.currentRadius = this.maxRadius * (1 - this.life);
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.globalAlpha = this.life * 0.7;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = this.life * 0.4;
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = this.life * 0.5;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class FrostEffect {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.maxRadius = radius;
    this.life = 1;
    this.alive = true;
  }

  update(deltaTime) {
    if (!this.alive) return;
    this.life -= deltaTime / 600;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.globalAlpha = this.life * 0.5;
    ctx.strokeStyle = '#AEE8F0';
    ctx.lineWidth = 2;
    const r = this.maxRadius * (1 - this.life * 0.3);
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const x1 = this.x + Math.cos(angle) * r * 0.3;
      const y1 = this.y + Math.sin(angle) * r * 0.3;
      const x2 = this.x + Math.cos(angle) * r;
      const y2 = this.y + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

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
    this.isCannon = splash > 0;
    this.isFrost = slow > 0;
    this.trail = [];
  }

  update(deltaTime, enemySpawner) {
    if (!this.alive) return;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();

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

  hit(enemySpawner, effects) {
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
    return this._createHitEffects();
  }

  _createHitEffects() {
    const effects = [];
    if (this.isCannon) {
      effects.push(new ExplosionEffect(this.targetX, this.targetY, this.splash, '#FF6600'));
    }
    if (this.isFrost) {
      effects.push(new FrostEffect(this.targetX, this.targetY, 30));
    }
    return effects;
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();

    if (this.trail.length > 1) {
      for (let i = 0; i < this.trail.length - 1; i++) {
        const alpha = (i / this.trail.length) * 0.4;
        const trailSize = this.size * (i / this.trail.length);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.trail[i].x, this.trail[i].y, trailSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (this.isCannon) {
      ctx.fillStyle = '#FF8800';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFCC00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size - 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.isFrost) {
      ctx.fillStyle = '#88DDFF';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size - 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

class ProjectileManager {
  constructor() {
    this.projectiles = [];
    this.effects = [];
  }

  add(projectile) {
    this.projectiles.push(projectile);
  }

  update(deltaTime, enemySpawner) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.alive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < proj.speed) {
        const hitEffects = proj.hit(enemySpawner);
        if (hitEffects && hitEffects.length) {
          this.effects.push(...hitEffects);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      proj.update(deltaTime, enemySpawner);
    }

    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].update(deltaTime);
      if (!this.effects[i].alive) {
        this.effects.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const effect of this.effects) {
      effect.draw(ctx);
    }
    for (const projectile of this.projectiles) {
      projectile.draw(ctx);
    }
  }
}
