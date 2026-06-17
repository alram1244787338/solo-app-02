const TestFramework = {
  results: [],
  currentSuite: '',

  describe(name, fn) {
    this.currentSuite = name;
    fn();
  },

  test(name, fn) {
    try {
      fn();
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: true
      });
    } catch (e) {
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: false,
        error: e.message
      });
    }
  },

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message} 期望 ${expected}，实际 ${actual}`);
    }
  },

  assertCloseTo(actual, expected, tolerance = 0.001, message = '') {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`${message} 期望接近 ${expected}，实际 ${actual}`);
    }
  },

  assertTrue(value, message = '') {
    if (!value) {
      throw new Error(`${message} 期望 true，实际 ${value}`);
    }
  },

  assertFalse(value, message = '') {
    if (value) {
      throw new Error(`${message} 期望 false，实际 ${value}`);
    }
  },

  assertDefined(value, message = '') {
    if (value === undefined || value === null) {
      throw new Error(`${message} 期望已定义，实际 ${value}`);
    }
  },

  assertGreaterThan(a, b, message = '') {
    if (!(a > b)) {
      throw new Error(`${message} 期望 ${a} > ${b}`);
    }
  },

  assertLessThan(a, b, message = '') {
    if (!(a < b)) {
      throw new Error(`${message} 期望 ${a} < ${b}`);
    }
  },

  getSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    return { passed, failed, total, results: this.results };
  },

  reset() {
    this.results = [];
    this.currentSuite = '';
  }
};

function runAllTests() {
  TestFramework.reset();

  function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 600;
    return canvas;
  }

  function createGameMap() {
    return new GameMap(createCanvas());
  }

  const baseGameMap = createGameMap();

  function createMockGame() {
    return new Game(createCanvas());
  }

  function createTower(type, level = 0) {
    const gameMap = createGameMap();
    const tower = new Tower(type, 5, 5, gameMap);
    for (let i = 0; i < level; i++) {
      tower.upgrade();
    }
    return tower;
  }

  function createEnemy(type, progress = 0, gameMap = null) {
    const enemy = new Enemy(type, gameMap || createGameMap());
    enemy.progress = progress;
    enemy._updatePosition();
    return enemy;
  }

  TestFramework.describe('塔升级逻辑', () => {
    TestFramework.test('速射塔初始属性正确', () => {
      const tower = createTower(TowerTypes.RAPID, 0);
      TestFramework.assertEqual(tower.level, 0, '等级');
      TestFramework.assertEqual(tower.damage, 8, '伤害');
      TestFramework.assertEqual(tower.range, 100, '范围');
      TestFramework.assertEqual(tower.splash, 0, '溅射');
      TestFramework.assertEqual(tower.slow, 0, '减速');
    });

    TestFramework.test('速射塔升级后数值正确', () => {
      const tower = createTower(TowerTypes.RAPID, 1);
      TestFramework.assertEqual(tower.level, 1, '等级');
      TestFramework.assertEqual(tower.damage, Math.round(8 * 1.6), '伤害');
      TestFramework.assertEqual(tower.range, Math.round(100 * 1.15), '范围');
      TestFramework.assertEqual(tower.getUpgradeCost(), 80, '下一级费用');
    });

    TestFramework.test('速射塔满级属性正确', () => {
      const tower = createTower(TowerTypes.RAPID, 3);
      TestFramework.assertEqual(tower.level, 3, '等级');
      TestFramework.assertEqual(tower.damage, Math.round(8 * 3.5), '伤害');
      TestFramework.assertEqual(tower.range, Math.round(100 * 1.5), '范围');
      TestFramework.assertFalse(tower.canUpgrade(), '不能继续升级');
      TestFramework.assertEqual(tower.getUpgradeCost(), Infinity, '升级费用');
    });

    TestFramework.test('炮塔升级后溅射范围增加', () => {
      const towerL0 = createTower(TowerTypes.CANNON, 0);
      const towerL3 = createTower(TowerTypes.CANNON, 3);
      TestFramework.assertEqual(towerL0.splash, 40, '0级溅射');
      TestFramework.assertEqual(towerL3.splash, Math.round(40 * 2.0), '3级溅射');
      TestFramework.assertGreaterThan(towerL3.splash, towerL0.splash, '溅射范围增加');
    });

    TestFramework.test('冰霜塔升级后减速效果增强', () => {
      const towerL0 = createTower(TowerTypes.FROST, 0);
      const towerL3 = createTower(TowerTypes.FROST, 3);
      TestFramework.assertEqual(towerL0.slow, 0.4, '0级减速');
      TestFramework.assertEqual(towerL3.slow, Math.min(0.9, 0.4 * 2.0), '3级减速');
      TestFramework.assertEqual(towerL0.slowDuration, 2000, '0级减速时长');
      TestFramework.assertEqual(towerL3.slowDuration, Math.round(2000 * 2.0), '3级减速时长');
    });

    TestFramework.test('满级后 upgrade 返回 false', () => {
      const tower = createTower(TowerTypes.RAPID, 3);
      const result = tower.upgrade();
      TestFramework.assertFalse(result, '返回 false');
      TestFramework.assertEqual(tower.level, 3, '等级不变');
    });

    TestFramework.test('升级后属性重新计算', () => {
      const tower = createTower(TowerTypes.RAPID, 0);
      const damageBefore = tower.damage;
      tower.upgrade();
      TestFramework.assertGreaterThan(tower.damage, damageBefore, '伤害增加');
    });
  });

  TestFramework.describe('怪物 Grace Period', () => {
    TestFramework.test('敌人有 600ms grace period', () => {
      const enemy = createEnemy(EnemyTypes.NORMAL, 0.5);
      TestFramework.assertEqual(enemy.finalGracePeriod, 600, 'grace period 时长');
    });

    TestFramework.test('到达终点后 600ms 内仍然活着', () => {
      const game = createMockGame();
      const enemy = createEnemy(EnemyTypes.NORMAL, 0.9999, game.gameMap);
      game.enemySpawner.enemies.push(enemy);

      game.update(100);
      TestFramework.assertTrue(enemy.reachedEnd, '已到达终点');
      game.update(300);
      TestFramework.assertTrue(enemy.alive, 'grace period 内仍然活着');
      TestFramework.assertCloseTo(enemy.reachedEndTimer, 300, 1, '计时器计时');
      TestFramework.assertEqual(game.lives, 20, '不扣命');
    });

    TestFramework.test('到达终点后超过 600ms 扣命', () => {
      const game = createMockGame();
      const enemy = createEnemy(EnemyTypes.NORMAL, 0.9999, game.gameMap);
      game.enemySpawner.enemies.push(enemy);

      game.update(100);
      game.update(300);
      game.update(300);
      game.update(50);

      TestFramework.assertFalse(enemy.alive, 'grace period 过后死亡');
      TestFramework.assertEqual(game.lives, 19, '扣一命');
    });

    TestFramework.test('grace period 内塔能打到敌人', () => {
      const game = createMockGame();
      game.gold = 1000;
      const tower = game.towerManager.placeTower(TowerTypes.RAPID, 18, 9);
      tower.cooldown = 0;

      const enemy = createEnemy(EnemyTypes.NORMAL, 0.9999, game.gameMap);
      enemy.hp = 10;
      game.enemySpawner.enemies.push(enemy);

      const dist = Math.sqrt((enemy.x - tower.x) ** 2 + (enemy.y - tower.y) ** 2);
      TestFramework.assertTrue(dist <= tower.range, '敌人在攻击范围内');

      const target = game.enemySpawner.getClosestEnemyInRange(tower.x, tower.y, tower.range);
      TestFramework.assertDefined(target, '能找到目标');
    });

    TestFramework.test('grace period 内被击杀不扣命', () => {
      const game = createMockGame();
      game.gold = 1000;
      const tower = game.towerManager.placeTower(TowerTypes.RAPID, 18, 9);
      tower.cooldown = 0;

      const enemy = createEnemy(EnemyTypes.NORMAL, 0.9999, game.gameMap);
      enemy.hp = 10;
      game.enemySpawner.enemies.push(enemy);

      game.update(50);
      tower.cooldown = 0;
      for (let i = 0; i < 8; i++) {
        game.update(50);
        tower.cooldown = 0;
      }

      TestFramework.assertFalse(enemy.alive, '敌人被击杀');
      TestFramework.assertLessThan(enemy.reachedEndTimer, enemy.finalGracePeriod, '在 grace period 内');
      TestFramework.assertEqual(game.lives, 20, '不扣命');
    });

    TestFramework.test('到达终点后敌人不移动', () => {
      const game = createMockGame();
      const enemy = createEnemy(EnemyTypes.NORMAL, 0.9999, game.gameMap);
      enemy.update(100);
      TestFramework.assertTrue(enemy.reachedEnd, '已到达终点');

      const posBefore = { x: enemy.x, y: enemy.y };
      enemy.update(500);
      const posAfter = { x: enemy.x, y: enemy.y };

      TestFramework.assertCloseTo(posBefore.x, posAfter.x, 0.1, 'x 坐标不变');
      TestFramework.assertCloseTo(posBefore.y, posAfter.y, 0.1, 'y 坐标不变');
      TestFramework.assertEqual(enemy.progress, 1, 'progress 保持 1');
    });
  });

  TestFramework.describe('金币和得分计算', () => {
    TestFramework.test('初始金币和得分正确', () => {
      const game = createMockGame();
      TestFramework.assertEqual(game.gold, 150, '初始金币');
      TestFramework.assertEqual(game.score, 0, '初始得分');
      TestFramework.assertEqual(game.lives, 20, '初始生命');
    });

    TestFramework.test('击杀普通怪得金币和得分', () => {
      const game = createMockGame();
      game.gold = 1000;
      const tower = game.towerManager.placeTower(TowerTypes.RAPID, 17, 5);
      tower.cooldown = 0;

      const enemy = createEnemy(EnemyTypes.NORMAL, 0.5, game.gameMap);
      enemy.hp = 5;
      enemy.baseSpeed = 0;
      game.enemySpawner.enemies.push(enemy);

      const proj = new Projectile(
        tower.x, tower.y, enemy, tower.damage,
        100, 3, '#fff', 0, 0, 0
      );
      proj.targetX = enemy.x;
      proj.targetY = enemy.y;
      proj.x = enemy.x - 5;
      proj.y = enemy.y;
      game.projectileManager.projectiles.push(proj);

      for (let i = 0; i < 5; i++) {
        game.update(50);
      }

      TestFramework.assertFalse(enemy.alive, '敌人被击杀');
      TestFramework.assertFalse(enemy.reachedEnd, '没到终点');
      TestFramework.assertEqual(game.gold, 1000 + 10, '金币增加');
      TestFramework.assertEqual(game.score, 0 + 20, '得分增加');
    });

    TestFramework.test('击杀快速怪得金币和得分', () => {
      const game = createMockGame();
      game.gold = 1000;
      const tower = game.towerManager.placeTower(TowerTypes.RAPID, 17, 5);
      tower.cooldown = 0;

      const enemy = createEnemy(EnemyTypes.FAST, 0.5, game.gameMap);
      enemy.hp = 5;
      enemy.baseSpeed = 0;
      game.enemySpawner.enemies.push(enemy);

      const proj = new Projectile(
        tower.x, tower.y, enemy, tower.damage,
        100, 3, '#fff', 0, 0, 0
      );
      proj.targetX = enemy.x;
      proj.targetY = enemy.y;
      proj.x = enemy.x - 5;
      proj.y = enemy.y;
      game.projectileManager.projectiles.push(proj);

      for (let i = 0; i < 5; i++) {
        game.update(50);
      }

      TestFramework.assertFalse(enemy.alive, '敌人被击杀');
      TestFramework.assertFalse(enemy.reachedEnd, '没到终点');
      TestFramework.assertEqual(game.gold, 1000 + 15, '金币增加');
      TestFramework.assertEqual(game.score, 0 + 30, '得分增加');
    });

    TestFramework.test('击杀坦克怪得金币和得分', () => {
      const game = createMockGame();
      game.gold = 1000;
      const tower = game.towerManager.placeTower(TowerTypes.RAPID, 17, 5);
      tower.cooldown = 0;

      const enemy = createEnemy(EnemyTypes.TANK, 0.5, game.gameMap);
      enemy.hp = 5;
      enemy.baseSpeed = 0;
      game.enemySpawner.enemies.push(enemy);

      const proj = new Projectile(
        tower.x, tower.y, enemy, tower.damage,
        100, 3, '#fff', 0, 0, 0
      );
      proj.targetX = enemy.x;
      proj.targetY = enemy.y;
      proj.x = enemy.x - 5;
      proj.y = enemy.y;
      game.projectileManager.projectiles.push(proj);

      for (let i = 0; i < 5; i++) {
        game.update(50);
      }

      TestFramework.assertFalse(enemy.alive, '敌人被击杀');
      TestFramework.assertFalse(enemy.reachedEnd, '没到终点');
      TestFramework.assertEqual(game.gold, 1000 + 25, '金币增加');
      TestFramework.assertEqual(game.score, 0 + 50, '得分增加');
    });

    TestFramework.test('建造速射塔扣费正确', () => {
      const game = createMockGame();
      game.gold = 100;
      game.selectedTowerType = TowerTypes.RAPID;
      game._tryPlaceTower(1, 0);

      TestFramework.assertEqual(game.gold, 50, '扣费 50');
      TestFramework.assertDefined(game.towerManager.getTowerAt(1, 0), '塔已放置');
    });

    TestFramework.test('建造炮塔扣费正确', () => {
      const game = createMockGame();
      game.gold = 200;
      game.selectedTowerType = TowerTypes.CANNON;
      game._tryPlaceTower(1, 0);

      TestFramework.assertEqual(game.gold, 100, '扣费 100');
    });

    TestFramework.test('金币不够时不能建造', () => {
      const game = createMockGame();
      game.gold = 10;
      game.selectedTowerType = TowerTypes.RAPID;
      game._tryPlaceTower(1, 0);

      TestFramework.assertEqual(game.gold, 10, '金币不变');
      TestFramework.assertEqual(game.towerManager.towers.length, 0, '没有建造');
    });

    TestFramework.test('升级扣费正确', () => {
      const game = createMockGame();
      game.gold = 1000;
      game.selectedTowerType = TowerTypes.RAPID;
      game._tryPlaceTower(1, 0);
      const tower = game.selectedTower;

      game._tryUpgradeTower();
      TestFramework.assertEqual(game.gold, 1000 - 50 - 40, '升级到1级扣费 40');
      TestFramework.assertEqual(tower.level, 1, '等级 1');

      game._tryUpgradeTower();
      TestFramework.assertEqual(game.gold, 1000 - 50 - 40 - 80, '升级到2级扣费 80');
      TestFramework.assertEqual(tower.level, 2, '等级 2');

      game._tryUpgradeTower();
      TestFramework.assertEqual(game.gold, 1000 - 50 - 40 - 80 - 150, '升级到3级扣费 150');
      TestFramework.assertEqual(tower.level, 3, '等级 3');
    });

    TestFramework.test('金币不够时不能升级', () => {
      const game = createMockGame();
      game.gold = 60;
      const tower = game.towerManager.placeTower(TowerTypes.RAPID, 1, 0);
      game.selectedTower = tower;

      game.gold = 10;
      game._tryUpgradeTower();

      TestFramework.assertEqual(game.gold, 10, '金币不变');
      TestFramework.assertEqual(tower.level, 0, '等级不变');
      TestFramework.assertEqual(game.upgradeFlashTimer, 300, '触发闪烁');
    });

    TestFramework.test('到达终点扣命但不给金币', () => {
      const game = createMockGame();
      const enemy = createEnemy(EnemyTypes.NORMAL, 0.9999, game.gameMap);
      game.enemySpawner.enemies.push(enemy);

      for (let i = 0; i < 20; i++) {
        game.update(50);
      }

      TestFramework.assertEqual(game.lives, 19, '扣一命');
      TestFramework.assertEqual(game.gold, 150, '不给金币');
      TestFramework.assertEqual(game.score, 0, '不给得分');
    });

    TestFramework.test('grace period 内被击杀不扣命', () => {
      const game = createMockGame();
      game.gold = 1000;
      const tower = game.towerManager.placeTower(TowerTypes.RAPID, 18, 9);
      tower.cooldown = 0;

      const enemy = createEnemy(EnemyTypes.NORMAL, 0.9999, game.gameMap);
      enemy.hp = 10;
      game.enemySpawner.enemies.push(enemy);

      game.update(50);
      tower.cooldown = 0;
      for (let i = 0; i < 8; i++) {
        game.update(50);
        tower.cooldown = 0;
      }

      TestFramework.assertFalse(enemy.alive, '敌人死亡');
      TestFramework.assertEqual(game.lives, 20, '不扣命');
    });
  });

  TestFramework.describe('波次预告数据', () => {
    TestFramework.test('预告数据结构正确', () => {
      const game = createMockGame();
      const preview = game.enemySpawner.nextWavePreview;

      TestFramework.assertDefined(preview.wave, '有 wave 字段');
      TestFramework.assertDefined(preview.composition, '有 composition 字段');
      TestFramework.assertTrue(Array.isArray(preview.composition), 'composition 是数组');
    });

    TestFramework.test('第1波只有普通怪', () => {
      const game = createMockGame();
      const preview = game.enemySpawner._generateWavePreview(1);

      TestFramework.assertEqual(preview.wave, 1, '波次正确');
      TestFramework.assertEqual(preview.composition.length, 1, '只有一种怪');
      TestFramework.assertEqual(preview.composition[0].type, EnemyTypes.NORMAL, '是普通怪');
      TestFramework.assertGreaterThan(preview.composition[0].count, 0, '数量大于0');
    });

    TestFramework.test('第2波只有普通怪', () => {
      const game = createMockGame();
      const preview = game.enemySpawner._generateWavePreview(2);

      TestFramework.assertEqual(preview.composition.length, 1, '只有一种怪');
      TestFramework.assertEqual(preview.composition[0].type, EnemyTypes.NORMAL, '是普通怪');
    });

    TestFramework.test('第5波有三种怪', () => {
      const game = createMockGame();

      const originalRandom = Math.random;
      const randomVals = [0.1, 0.6, 0.9];
      let idx = 0;
      Math.random = () => randomVals[idx++ % randomVals.length];

      try {
        const preview = game.enemySpawner._generateWavePreview(5);

        TestFramework.assertEqual(preview.wave, 5, '波次正确');
        TestFramework.assertEqual(preview.composition.length, 3, '有三种怪');

        const types = preview.composition.map(c => c.type);
        TestFramework.assertTrue(types.includes(EnemyTypes.NORMAL), '有普通怪');
        TestFramework.assertTrue(types.includes(EnemyTypes.FAST), '有快速怪');
        TestFramework.assertTrue(types.includes(EnemyTypes.TANK), '有坦克怪');
      } finally {
        Math.random = originalRandom;
      }
    });

    TestFramework.test('每一项都有 type 和 count', () => {
      const game = createMockGame();
      const preview = game.enemySpawner._generateWavePreview(10);

      for (const item of preview.composition) {
        TestFramework.assertDefined(item.type, '有 type 字段');
        TestFramework.assertDefined(item.count, '有 count 字段');
        TestFramework.assertGreaterThan(item.count, 0, 'count > 0');
      }
    });

    TestFramework.test('波次越高怪越多', () => {
      const game = createMockGame();
      const preview1 = game.enemySpawner._generateWavePreview(1);
      const preview10 = game.enemySpawner._generateWavePreview(10);

      const count1 = preview1.composition.reduce((sum, c) => sum + c.count, 0);
      const count10 = preview10.composition.reduce((sum, c) => sum + c.count, 0);

      TestFramework.assertGreaterThan(count10, count1, '高波次怪更多');
    });

    TestFramework.test('开始新波次后更新预告', () => {
      const game = createMockGame();
      const previewBefore = game.enemySpawner.nextWavePreview;

      game.enemySpawner.startWave();
      const previewAfter = game.enemySpawner.nextWavePreview;

      TestFramework.assertEqual(previewBefore.wave, 1, '之前预告第1波');
      TestFramework.assertEqual(previewAfter.wave, 2, '之后预告第2波');
    });

    TestFramework.test('预告数量与实际生成数量一致', () => {
      const game = createMockGame();

      const originalRandom = Math.random;
      const randomSequence = [0.1, 0.6, 0.3, 0.8, 0.2, 0.9, 0.4, 0.7, 0.1, 0.5, 0.3, 0.8];
      let randomIndex = 0;
      Math.random = () => randomSequence[randomIndex++ % randomSequence.length];

      try {
        const preview = game.enemySpawner._generateWavePreview(5);
        randomIndex = 0;
        const enemies = game.enemySpawner._generateWaveEnemies(5);

        const previewTotal = preview.composition.reduce((sum, c) => sum + c.count, 0);
        TestFramework.assertEqual(previewTotal, enemies.length, '预告总数 = 实际总数');

        const normalPreview = preview.composition.find(c => c.type === EnemyTypes.NORMAL)?.count || 0;
        const fastPreview = preview.composition.find(c => c.type === EnemyTypes.FAST)?.count || 0;
        const tankPreview = preview.composition.find(c => c.type === EnemyTypes.TANK)?.count || 0;

        const normalActual = enemies.filter(e => e === EnemyTypes.NORMAL).length;
        const fastActual = enemies.filter(e => e === EnemyTypes.FAST).length;
        const tankActual = enemies.filter(e => e === EnemyTypes.TANK).length;

        TestFramework.assertEqual(normalPreview, normalActual, '普通怪数量');
        TestFramework.assertEqual(fastPreview, fastActual, '快速怪数量');
        TestFramework.assertEqual(tankPreview, tankActual, '坦克怪数量');
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  return TestFramework.getSummary();
}
