const EnemyPreviewInfo = {
  [EnemyTypes.NORMAL]: { name: '普通', color: '#4A90D9', shape: '●' },
  [EnemyTypes.FAST]: { name: '快速', color: '#50C878', shape: '▲' },
  [EnemyTypes.TANK]: { name: '坦克', color: '#D9534F', shape: '■' }
};

class UI {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;

    this.sidebarWidth = 200;
    this.sidebarX = canvas.width - this.sidebarWidth;

    this.towerButtons = [
      { type: TowerTypes.RAPID, y: 120, width: 160, height: 60 },
      { type: TowerTypes.CANNON, y: 195, width: 160, height: 60 },
      { type: TowerTypes.FROST, y: 270, width: 160, height: 60 }
    ];

    this.waveButton = { x: this.sidebarX + 20, y: 545, width: 160, height: 45 };

    this.upgradeButton = { x: this.sidebarX + 20, y: 490, width: 160, height: 40 };
  }

  isInSidebar(x) {
    return x >= this.sidebarX;
  }

  getClickedTowerButton(x, y) {
    for (const btn of this.towerButtons) {
      const btnX = this.sidebarX + 20;
      if (x >= btnX && x <= btnX + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        return btn.type;
      }
    }
    return null;
  }

  isWaveButtonClicked(x, y) {
    const btn = this.waveButton;
    return x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height;
  }

  isUpgradeButtonClicked(x, y) {
    if (!this.game.selectedTower) return false;
    const btn = this.upgradeButton;
    return x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height;
  }

  draw() {
    this._drawSidebar();
    this._drawStats();
    this._drawWavePreview();
    this._drawTowerButtons();
    this._drawSelectedTowerInfo();
    this._drawUpgradeButton();
    this._drawWaveButton();
  }

  _drawSidebar() {
    const ctx = this.ctx;
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(this.sidebarX, 0, this.sidebarWidth, this.canvas.height);

    ctx.fillStyle = '#1A252F';
    ctx.fillRect(this.sidebarX, 0, this.sidebarWidth, 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('塔防游戏', this.sidebarX + this.sidebarWidth / 2, 20);
  }

  _drawStats() {
    const ctx = this.ctx;
    const x = this.sidebarX + 20;

    ctx.fillStyle = '#ECF0F1';
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText(`💰 金币: ${this.game.gold}`, x, 50);
    ctx.fillText(`❤️ 生命: ${this.game.lives}`, x, 70);
    ctx.fillText(`🏆 得分: ${this.game.score}`, x, 90);
    ctx.fillText(`🌊 波次: ${this.game.enemySpawner.wave}`, x, 110);
  }

  _drawWavePreview() {
    const ctx = this.ctx;
    const spawner = this.game.enemySpawner;
    const x = this.sidebarX + 10;

    if (spawner.waveActive) return;

    const preview = spawner.nextWavePreview;
    if (!preview) return;

    ctx.fillStyle = '#1A252F';
    ctx.fillRect(x, 130, 180, 16);

    ctx.fillStyle = '#F39C12';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`下一波 (第${preview.wave}波) 预览:`, x + 5, 132);

    let offsetX = 5;
    ctx.font = '11px Arial';
    for (const group of preview.composition) {
      const info = EnemyPreviewInfo[group.type];
      ctx.fillStyle = info.color;
      ctx.fillText(`${info.shape}${info.name}x${group.count}`, x + offsetX, 148);
      offsetX += 60;
    }
  }

  _drawTowerButtons() {
    const ctx = this.ctx;

    for (const btn of this.towerButtons) {
      const config = TowerConfig[btn.type];
      const x = this.sidebarX + 20;
      const isSelected = this.game.selectedTowerType === btn.type;
      const canAfford = this.game.gold >= config.cost;

      ctx.fillStyle = isSelected ? '#3498DB' : (canAfford ? '#34495E' : '#1A252F');
      ctx.fillRect(x, btn.y, btn.width, btn.height);

      ctx.strokeStyle = isSelected ? '#5DADE2' : '#4A6785';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, btn.y, btn.width, btn.height);

      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(x + 22, btn.y + btn.height / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = canAfford ? '#FFFFFF' : '#7F8C8D';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(config.name, x + 42, btn.y + 8);

      ctx.font = '11px Arial';
      ctx.fillStyle = canAfford ? '#BDC3C7' : '#7F8C8D';
      ctx.fillText(`${config.description} 💰${config.cost}`, x + 42, btn.y + 28);
    }
  }

  _drawSelectedTowerInfo() {
    if (!this.game.selectedTower) return;

    const ctx = this.ctx;
    const tower = this.game.selectedTower;
    const baseCfg = tower.baseConfig;
    const x = this.sidebarX + 20;
    const y = 340;

    const boxHeight = tower.canUpgrade() ? 90 : 70;

    ctx.fillStyle = '#34495E';
    ctx.fillRect(x, y, 160, boxHeight);

    ctx.strokeStyle = '#4A6785';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 160, boxHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const levelStr = tower.level > 0 ? ` Lv.${tower.level}` : '';
    ctx.fillText(`${baseCfg.name}${levelStr}`, x + 10, y + 8);

    ctx.font = '11px Arial';
    ctx.fillStyle = '#BDC3C7';
    ctx.fillText(`伤害: ${tower.damage}`, x + 10, y + 28);
    ctx.fillText(`射程: ${tower.range}`, x + 10, y + 42);

    const fireRate = (1000 / baseCfg.fireRate).toFixed(1);
    ctx.fillText(`攻速: ${fireRate}/秒`, x + 85, y + 28);

    if (tower.splash > 0) {
      ctx.fillText(`溅射: ${tower.splash}`, x + 85, y + 42);
    }
    if (tower.slow > 0) {
      ctx.fillText(`减速: ${Math.round(tower.slow * 100)}%`, x + 85, y + 42);
    }

    if (tower.canUpgrade()) {
      const cost = tower.getUpgradeCost();
      const canAfford = this.game.gold >= cost;
      ctx.fillStyle = canAfford ? '#F39C12' : '#7F8C8D';
      ctx.font = '11px Arial';
      ctx.fillText(`↑ 升级需 💰${cost}`, x + 10, y + 60);

      const nextLvl = tower.level + 1;
      const nextDmg = Math.round(baseCfg.damage * baseCfg.upgradeDamageMult[nextLvl]);
      const nextRange = Math.round(baseCfg.range * baseCfg.upgradeRangeMult[nextLvl]);
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '10px Arial';
      ctx.fillText(`→ 伤害${nextDmg} 射程${nextRange}`, x + 10, y + 74);
    } else {
      ctx.fillStyle = '#F39C12';
      ctx.font = 'bold 11px Arial';
      ctx.fillText('✦ 已满级', x + 10, y + 56);
    }
  }

  _drawUpgradeButton() {
    if (!this.game.selectedTower) return;

    const tower = this.game.selectedTower;
    const ctx = this.ctx;
    const btn = this.upgradeButton;

    let text, bgColor, disabled = false;

    if (!tower.canUpgrade()) {
      text = '✦ 已满级';
      bgColor = '#7F8C8D';
      disabled = true;
    } else {
      const cost = tower.getUpgradeCost();
      const canAfford = this.game.gold >= cost;
      if (canAfford) {
        text = `↑ 升级 (💰${cost})`;
        bgColor = '#F39C12';
      } else {
        text = `金币不足 (需 💰${cost})`;
        bgColor = '#C0392B';
        disabled = true;
      }
    }

    if (this.game.upgradeFlashTimer > 0) {
      bgColor = '#E74C3C';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    ctx.strokeStyle = disabled ? '#555' : '#FFFFFF';
    ctx.lineWidth = disabled ? 1 : 2;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  _drawWaveButton() {
    const ctx = this.ctx;
    const btn = this.waveButton;
    const spawner = this.game.enemySpawner;

    let text, color;
    if (spawner.waveActive) {
      text = `战斗中... (${spawner.enemies.length + spawner.spawnQueue.length})`;
      color = '#E74C3C';
    } else {
      text = `开始第 ${spawner.wave + 1} 波`;
      color = '#27AE60';
    }

    ctx.fillStyle = color;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  drawGameOver() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', this.canvas.width / 2 - this.sidebarWidth / 2, this.canvas.height / 2 - 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText(`最终得分: ${this.game.score}`, this.canvas.width / 2 - this.sidebarWidth / 2, this.canvas.height / 2 + 10);
    ctx.fillText(`坚持波次: ${this.game.enemySpawner.wave}`, this.canvas.width / 2 - this.sidebarWidth / 2, this.canvas.height / 2 + 50);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#BDC3C7';
    ctx.fillText('点击任意位置重新开始', this.canvas.width / 2 - this.sidebarWidth / 2, this.canvas.height / 2 + 100);
  }
}
