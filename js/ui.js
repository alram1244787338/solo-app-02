class UI {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;

    this.sidebarWidth = 200;
    this.sidebarX = canvas.width - this.sidebarWidth;

    this.towerButtons = [
      { type: TowerTypes.RAPID, y: 80, width: 160, height: 70 },
      { type: TowerTypes.CANNON, y: 170, width: 160, height: 70 },
      { type: TowerTypes.FROST, y: 260, width: 160, height: 70 }
    ];

    this.waveButton = { x: this.sidebarX + 20, y: 500, width: 160, height: 50 };
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

  draw() {
    this._drawSidebar();
    this._drawStats();
    this._drawTowerButtons();
    this._drawWaveButton();
    this._drawSelectedTowerInfo();
  }

  _drawSidebar() {
    const ctx = this.ctx;
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(this.sidebarX, 0, this.sidebarWidth, this.canvas.height);

    ctx.fillStyle = '#1A252F';
    ctx.fillRect(this.sidebarX, 0, this.sidebarWidth, 50);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('塔防游戏', this.sidebarX + this.sidebarWidth / 2, 25);
  }

  _drawStats() {
    const ctx = this.ctx;
    const x = this.sidebarX + 20;

    ctx.fillStyle = '#ECF0F1';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText(`💰 金币: ${this.game.gold}`, x, 60);
    ctx.fillText(`❤️ 生命: ${this.game.lives}`, x, 82);
    ctx.fillText(`🏆 得分: ${this.game.score}`, x, 104);
    ctx.fillText(`🌊 波次: ${this.game.enemySpawner.wave}`, x, 126);
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
      ctx.arc(x + 25, btn.y + 25, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = canAfford ? '#FFFFFF' : '#7F8C8D';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(config.name, x + 50, btn.y + 10);

      ctx.font = '12px Arial';
      ctx.fillStyle = canAfford ? '#BDC3C7' : '#7F8C8D';
      ctx.fillText(config.description, x + 50, btn.y + 30);
      ctx.fillText(`💰 ${config.cost}`, x + 50, btn.y + 48);
    }
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

  _drawSelectedTowerInfo() {
    if (!this.game.selectedTower) return;

    const ctx = this.ctx;
    const tower = this.game.selectedTower;
    const config = tower.config;
    const x = this.sidebarX + 20;
    const y = 360;

    ctx.fillStyle = '#34495E';
    ctx.fillRect(x, y, 160, 120);

    ctx.strokeStyle = '#4A6785';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 160, 120);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.name, x + 10, y + 10);

    ctx.font = '12px Arial';
    ctx.fillStyle = '#BDC3C7';
    ctx.fillText(`伤害: ${config.damage}`, x + 10, y + 32);
    ctx.fillText(`射程: ${config.range}`, x + 10, y + 50);
    ctx.fillText(`攻速: ${(1000 / config.fireRate).toFixed(1)}/秒`, x + 10, y + 68);
    if (config.splash > 0) {
      ctx.fillText(`溅射: ${config.splash}`, x + 10, y + 86);
    }
    if (config.slow > 0) {
      ctx.fillText(`减速: ${config.slow * 100}%`, x + 10, y + 104);
    }
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
