import "./style.css";
import { Application, Container, DisplayObject, Graphics } from "pixi.js";

const createCircle = ({
  x,
  y,
  color = 0x000000,
}: {
  x: number;
  y: number;
  color?: number;
}): Graphics => {
  const circle = new Graphics();
  circle.beginFill(color).drawCircle(0, 0, 5).endFill();
  circle.position.set(x, y);
  return circle;
};

const createRectangle = ({
  x,
  y,
  color = 0x00ff00,
}: {
  x: number;
  y: number;
  color?: number;
}): Graphics => {
  const rectangle = new Graphics();
  rectangle.beginFill(color).drawRect(0, 0, 50, 50).endFill().pivot.set(25, 25);
  rectangle.position.set(x, y);
  return rectangle;
};

const app = new Application({
  view: document.getElementById("app") as HTMLCanvasElement,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  backgroundColor: 0x6495ed,
  width: 1280,
  height: 720,
});

app.stage.interactive = true;
app.stage.hitArea = app.renderer.screen;

class Enemy {
  private readonly maxHealth: number;
  private health: number;
  public readonly container: Container;
  private readonly angle: number;

  constructor({
    health,
    maxHealth,
    container,
    angle,
  }: {
    health: number;
    maxHealth: number;
    container: Container;
    angle: number;
  }) {
    this.maxHealth = maxHealth;
    this.health = health;
    this.container = container;
    this.angle = angle;
  }

  hit(damage: number): boolean {
    this.health = this.health - damage;
    this.drawHealth(this.calculateHealth());
    return this.health === 0;
  }

  update(delta: number): void {
    this.container.position.set(
      this.container.position.x + Math.cos(this.angle) * delta * 1,
      this.container.position.y + Math.sin(this.angle) * delta * 1
    );
  }

  private drawHealth(ratio: number): void {
    const healthBar = this.container.getChildByName("healthBar");
    healthBar.scale = { x: ratio, y: 1 };
  }

  private calculateHealth(): number {
    return this.health > 0 ? this.health / this.maxHealth : 0;
  }

  get graphics(): DisplayObject {
    return this.container.getChildByName("block");
  }
}

class Enemies {
  enemies: Enemy[];
  private readonly app: Application;

  constructor(app: Application) {
    this.enemies = [];
    this.app = app;
  }

  spawnRandomEnemy(): void {
    const angle = Math.floor(Math.random() * 360);
    const radians = angle * (Math.PI / 180);
    console.log(angle);
    console.log(radians);

    const x = 1280 / 2 + (1280 / 2) * Math.cos(radians);
    const y = 720 / 2 + (1280 / 2) * Math.sin(radians);

    const enemy = new Enemy({
      health: 100,
      maxHealth: 100,
      container: createEnemy({ x: x, y: y }),
      angle: Math.atan2(tower.position.y - y, tower.position.x - x),
    });

    this.addEnemy(enemy);
  }

  addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
    this.app.stage.addChild(enemy.container);
  }

  removeEnemy(enemy: Enemy): void {
    this.enemies = this.enemies.filter((enemyx) => enemy !== enemyx);
    this.app.stage.removeChild(enemy.container);
  }

  update(delta: number): void {
    this.enemies.forEach((enemy) => enemy.update(delta));
  }
}
const enemies = new Enemies(app);

const createEnemy = ({ x, y }: { x: number; y: number }): Container => {
  const container = new Container();

  const rect = new Graphics();
  rect.beginFill(0x0000ff).drawRect(0, 10, 50, 50).endFill();
  rect.name = "block";

  const healthBarBase = new Graphics();
  healthBarBase.beginFill(0xff0000).drawRect(0, 0, 50, 5);

  const healthBar = new Graphics();
  healthBar.beginFill(0x00ff00).drawRect(0, 0, 50, 5);
  healthBar.name = "healthBar";

  container.addChild(rect, healthBarBase, healthBar);
  container.position.set(x, y);
  container.pivot.set(container.width / 2, container.height / 2);
  return container;
};

const tower = createRectangle({
  x: app.screen.width / 2,
  y: app.screen.height / 2,
  color: 0xff9999,
});

class Bullet {
  public readonly graphics: Graphics;
  public readonly angle: number;
  public readonly damage: number;

  constructor({ graphics, angle }: { graphics: Graphics; angle: number }) {
    this.graphics = graphics;
    this.angle = angle;
    this.damage = 20;
  }

  updatePosition(delta: number) {
    this.graphics.position.set(
      this.graphics.position.x + Math.cos(this.angle) * delta * 5,
      this.graphics.position.y + Math.sin(this.angle) * delta * 5
    );
  }
}

class Bullets {
  bullets: Bullet[];
  private readonly app: Application;

  constructor(app: Application) {
    this.bullets = [];
    this.app = app;
  }

  addBullet(bullet: Bullet): void {
    this.bullets.push(bullet);
    this.app.stage.addChild(bullet.graphics);
  }

  calculateEnemyHits(enemies: Enemies): void {
    this.bullets.forEach((bullet) => {
      const bounds2 = bullet.graphics.getBounds();

      enemies.enemies.find((enemy) => {
        const bounds1 = enemy.graphics.getBounds();

        const collision =
          bounds1.x < bounds2.x + bounds2.width &&
          bounds1.x + bounds1.width > bounds2.x &&
          bounds1.y < bounds2.y + bounds2.height &&
          bounds1.y + bounds1.height > bounds2.y;

        if (collision) {
          this.removeBullet(bullet);
          const dead = enemy.hit(bullet.damage);
          if (dead) {
            enemies.removeEnemy(enemy);
          }
        }
      });
    });
  }

  calculateOutOfBounds(): void {
    this.bullets.forEach((bullet) => {
      const outOfBounds =
        bullet.graphics.position.x < 0 ||
        bullet.graphics.position.x > this.app.screen.width ||
        bullet.graphics.position.y < 0 ||
        bullet.graphics.position.y > this.app.screen.height;

      if (outOfBounds) {
        this.removeBullet(bullet);
      }
    });
  }

  update(delta: number): void {
    this.bullets.forEach((bullet) => bullet.updatePosition(delta));
  }

  private removeBullet(bullet: Bullet): void {
    this.bullets = this.bullets.filter((bulletx) => bullet !== bulletx);
    this.app.stage.removeChild(bullet.graphics);
  }
}

const bullets = new Bullets(app);

app.stage.addChild(tower);

class Game {
  private readonly bullets: Bullets;
  private readonly enemies: Enemies;
  private lastSpawn: number;
  private readonly app: Application;

  constructor({
    bullets,
    enemies,
    app,
  }: {
    bullets: Bullets;
    enemies: Enemies;
    app: Application;
  }) {
    this.bullets = bullets;
    this.enemies = enemies;
    this.app = app;
    this.lastSpawn = new Date().getTime();
  }

  update(delta: number): void {
    if (new Date().getTime() - this.lastSpawn > 2000) {
      this.enemies.spawnRandomEnemy();
      this.lastSpawn = new Date().getTime();
    }
    this.enemies.update(delta);
    this.bullets.update(delta);
    this.bullets.calculateEnemyHits(this.enemies);
    this.bullets.calculateOutOfBounds();
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "a") {
    enemies.spawnRandomEnemy();
  }
});

app.stage.on("mousedown", (event) => {
  bullets.addBullet(
    new Bullet({
      graphics: createCircle({
        x: tower.position.x,
        y: tower.position.y,
      }),
      angle: Math.atan2(
        event.data.global.y - tower.position.y,
        event.data.global.x - tower.position.x
      ),
    })
  );
});

const game = new Game({ bullets, enemies, app });

app.ticker.add((delta: number) => {
  game.update(delta);
});
