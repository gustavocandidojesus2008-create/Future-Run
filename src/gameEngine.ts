import type { AvatarId, RunResult } from './types';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'log' | 'crystal' | 'flying';
  passed: boolean;
}

interface Orb {
  x: number;
  y: number;
  collected: boolean;
  pulse: number;
  value: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface BgTree {
  x: number;
  y: number;
  size: number;
  color: string;
  layer: number;
  speed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkle: number;
  twinkleSpeed: number;
}

export interface GameConfig {
  avatar: AvatarId;
  onScoreUpdate: (xp: number, level: number) => void;
  onGameOver: (result: RunResult) => void;
  onLevelUp: (level: number) => void;
}

const AVATAR_COLORS: Record<AvatarId, { body: string; accent: string; glow: string }> = {
  'robo-pink': { body: '#ff2d9c', accent: '#ff6bb8', glow: 'rgba(255,45,156,0.6)' },
  'robo-cyan': { body: '#00c8ff', accent: '#5ce8ff', glow: 'rgba(0,200,255,0.6)' },
  'robo-gold': { body: '#ffd700', accent: '#ffe566', glow: 'rgba(255,215,0,0.6)' },
  'robo-violet': { body: '#b366ff', accent: '#cc99ff', glow: 'rgba(179,102,255,0.6)' },
  'robo-lime': { body: '#aaff00', accent: '#ccff66', glow: 'rgba(170,255,0,0.6)' },
};

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.4));
}

export class FutureRunGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private colors: { body: string; accent: string; glow: string };

  private rafId: number | null = null;
  private lastTime = 0;
  private running = false;
  private paused = false;

  // Game state
  private xp = 0;
  private level = 1;
  private speed = 5;
  private baseSpeed = 5;
  private distance = 0;
  private startTime = 0;
  private elapsedTime = 0;
  private orbsCollected = 0;
  private jumps = 0;
  private maxSpeed = 0;
  private lastLevelUpLevel = 1;
  private levelUpFlash = 0;
  private gameOverFlag = false;
  private shakeAmount = 0;

  // Player
  private playerY = 0;
  private playerVY = 0;
  private playerX = 0;
  private isJumping = false;
  private isDucking = false;
  private canDoubleJump = false;
  private groundY = 0;
  private playerWidth = 44;
  private playerHeight = 52;
  private runFrame = 0;
  private runTimer = 0;

  // Entities
  private obstacles: Obstacle[] = [];
  private orbs: Orb[] = [];
  private particles: Particle[] = [];
  private trees: BgTree[] = [];
  private stars: Star[] = [];

  // Spawning
  private nextObstacleDist = 400;
  private nextOrbDist = 200;
  private distanceSinceObstacle = 0;
  private distanceSinceOrb = 0;

  // Ground segments for visual effect
  private groundOffset = 0;

  // Dimensions
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    this.colors = AVATAR_COLORS[config.avatar];
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.groundY = this.height * 0.78;
    this.playerX = this.width * 0.2;
    this.playerY = this.groundY;
    this.initBackground();
  }

  private initBackground() {
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.groundY * 0.7,
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.05 + 0.02,
      });
    }

    this.trees = [];
    for (let i = 0; i < 20; i++) {
      const layer = Math.floor(Math.random() * 3);
      this.trees.push({
        x: Math.random() * this.width,
        y: this.groundY - Math.random() * 20,
        size: (layer === 0 ? 120 : layer === 1 ? 80 : 50) + Math.random() * 30,
        color: layer === 0 ? '#1a0a20' : layer === 1 ? '#2a1030' : '#3a1540',
        layer,
        speed: layer === 0 ? 0.5 : layer === 1 ? 1.2 : 2,
      });
    }
  }

  start() {
    this.xp = 0;
    this.level = 1;
    this.speed = this.baseSpeed;
    this.distance = 0;
    this.startTime = performance.now();
    this.elapsedTime = 0;
    this.orbsCollected = 0;
    this.jumps = 0;
    this.maxSpeed = 0;
    this.lastLevelUpLevel = 1;
    this.levelUpFlash = 0;
    this.gameOverFlag = false;
    this.shakeAmount = 0;
    this.obstacles = [];
    this.orbs = [];
    this.particles = [];
    this.playerY = this.groundY;
    this.playerVY = 0;
    this.isJumping = false;
    this.isDucking = false;
    this.canDoubleJump = false;
    this.nextObstacleDist = 400;
    this.nextOrbDist = 200;
    this.distanceSinceObstacle = 0;
    this.distanceSinceOrb = 0;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.config.onScoreUpdate(0, 1);
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stop();
  }

  jump() {
    if (!this.running || this.paused || this.gameOverFlag) return;
    if (!this.isJumping) {
      this.playerVY = -15;
      this.isJumping = true;
      this.canDoubleJump = true;
      this.jumps++;
      this.spawnJumpParticles();
    } else if (this.canDoubleJump) {
      this.playerVY = -13;
      this.canDoubleJump = false;
      this.jumps++;
      this.spawnJumpParticles();
    }
  }

  duck(active: boolean) {
    this.isDucking = active;
  }

  private spawnJumpParticles() {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.playerX + this.playerWidth / 2,
        y: this.playerY,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 1,
        life: 30,
        maxLife: 30,
        color: this.colors.accent,
        size: Math.random() * 3 + 1,
      });
    }
  }

  private spawnOrbParticles(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        life: 25,
        maxLife: 25,
        color: i % 2 === 0 ? '#ff2d9c' : '#00c8ff',
        size: Math.random() * 4 + 2,
      });
    }
  }

  private spawnObstacle(): Obstacle {
    const types: Obstacle['type'][] = ['log', 'crystal', 'flying'];
    const type = types[Math.floor(Math.random() * types.length)];
    const minGap = Math.max(250, 500 - this.level * 15);
    this.nextObstacleDist = minGap + Math.random() * 200;

    if (type === 'log') {
      return { x: this.width + 50, y: this.groundY - 30, width: 50 + Math.random() * 30, height: 25, type, passed: false };
    } else if (type === 'crystal') {
      return { x: this.width + 50, y: this.groundY - 50, width: 30, height: 50, type, passed: false };
    } else {
      return { x: this.width + 50, y: this.groundY - 90, width: 40, height: 30, type, passed: false };
    }
  }

  private spawnOrb(): Orb {
    this.nextOrbDist = 150 + Math.random() * 250;
    const heights = [this.groundY - 40, this.groundY - 80, this.groundY - 120];
    return {
      x: this.width + 50,
      y: heights[Math.floor(Math.random() * heights.length)],
      collected: false,
      pulse: 0,
      value: 10,
    };
  }

  private checkCollision(): boolean {
    const px = this.playerX;
    const py = this.playerY - this.playerHeight;
    const pw = this.playerWidth;
    const ph = this.isDucking ? this.playerHeight * 0.6 : this.playerHeight;

    for (const obs of this.obstacles) {
      const ox = obs.x;
      const oy = obs.y;
      const ow = obs.width;
      const oh = obs.height;

      if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
        return true;
      }
    }
    return false;
  }

  private update(dt: number) {
    if (!this.running || this.paused || this.gameOverFlag) return;

    this.elapsedTime = (performance.now() - this.startTime) / 1000;
    this.speed = this.baseSpeed + this.level * 0.8;
    this.maxSpeed = Math.max(this.maxSpeed, this.speed);

    const moveAmount = this.speed * dt * 60;
    this.distance += moveAmount;
    this.groundOffset = (this.groundOffset + moveAmount) % 40;
    this.distanceSinceObstacle += moveAmount;
    this.distanceSinceOrb += moveAmount;

    // XP from distance
    this.xp += Math.floor(moveAmount * 0.1);

    // Level up check
    const newLevel = this.getCurrentLevel();
    if (newLevel > this.level) {
      this.level = newLevel;
      this.levelUpFlash = 60;
      this.config.onLevelUp(newLevel);
    }
    this.config.onScoreUpdate(this.xp, this.level);

    // Physics
    this.playerVY += 0.8;
    this.playerY += this.playerVY;
    if (this.playerY >= this.groundY) {
      this.playerY = this.groundY;
      this.playerVY = 0;
      this.isJumping = false;
      this.canDoubleJump = false;
    }

    // Run animation
    this.runTimer += dt;
    if (this.runTimer > 0.1) {
      this.runFrame = (this.runFrame + 1) % 4;
      this.runTimer = 0;
    }

    // Spawn obstacles
    if (this.distanceSinceObstacle >= this.nextObstacleDist) {
      this.obstacles.push(this.spawnObstacle());
      this.distanceSinceObstacle = 0;
    }

    // Spawn orbs
    if (this.distanceSinceOrb >= this.nextOrbDist) {
      this.orbs.push(this.spawnOrb());
      this.distanceSinceOrb = 0;
    }

    // Move and cull obstacles
    for (const obs of this.obstacles) {
      obs.x -= moveAmount;
    }
    this.obstacles = this.obstacles.filter(o => o.x + o.width > -50);

    // Move and cull orbs
    for (const orb of this.orbs) {
      orb.x -= moveAmount;
      orb.pulse += dt * 5;
    }
    this.orbs = this.orbs.filter(o => o.x > -50 && !o.collected);

    // Collect orbs
    const px = this.playerX;
    const py = this.playerY - this.playerHeight / 2;
    for (const orb of this.orbs) {
      if (orb.collected) continue;
      const dx = orb.x - (px + this.playerWidth / 2);
      const dy = orb.y - py;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        orb.collected = true;
        this.xp += orb.value;
        this.orbsCollected++;
        this.spawnOrbParticles(orb.x, orb.y);
      }
    }

    // Move trees (parallax)
    for (const tree of this.trees) {
      tree.x -= tree.speed * (this.speed / this.baseSpeed) * dt * 60;
      if (tree.x + tree.size < -50) {
        tree.x = this.width + Math.random() * 100;
        tree.y = this.groundY - Math.random() * 20;
      }
    }

    // Twinkle stars
    for (const star of this.stars) {
      star.twinkle += star.twinkleSpeed;
    }

    // Particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    // Level up flash
    if (this.levelUpFlash > 0) this.levelUpFlash--;
    if (this.shakeAmount > 0) this.shakeAmount *= 0.9;

    // Collision
    if (this.checkCollision()) {
      this.endGame();
    }
  }

  private getCurrentLevel(): number {
    let lvl = 1;
    while (this.xp >= xpForLevel(lvl + 1)) {
      lvl++;
    }
    return lvl;
  }

  private endGame() {
    this.gameOverFlag = true;
    this.shakeAmount = 15;
    // Explosion particles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x: this.playerX + this.playerWidth / 2,
        y: this.playerY - this.playerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 40,
        maxLife: 40,
        color: i % 2 === 0 ? this.colors.body : '#ff4444',
        size: Math.random() * 5 + 2,
      });
    }

    setTimeout(() => {
      this.running = false;
      this.config.onGameOver({
        xp: this.xp,
        level: this.level,
        duration: Math.floor(this.elapsedTime),
        orbsCollected: this.orbsCollected,
        jumps: this.jumps,
        maxSpeed: Math.floor(this.maxSpeed),
      });
    }, 800);
  }

  private draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    if (this.shakeAmount > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeAmount,
        (Math.random() - 0.5) * this.shakeAmount
      );
    }

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#0a0a14');
    skyGrad.addColorStop(0.4, '#1a0820');
    skyGrad.addColorStop(0.7, '#2a1030');
    skyGrad.addColorStop(1, '#3a1545');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, this.groundY);

    // Stars
    for (const star of this.stars) {
      const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
      ctx.fillStyle = `rgba(255, 200, 230, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(255, 100, 180, 0.5)';
    ctx.fillStyle = 'rgba(255, 180, 210, 0.8)';
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.2, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Trees - far to near
    const sortedTrees = [...this.trees].sort((a, b) => a.layer - b.layer);
    for (const tree of sortedTrees) {
      this.drawTree(tree);
    }

    // Ground
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, h);
    groundGrad.addColorStop(0, '#1a0a25');
    groundGrad.addColorStop(0.3, '#0f0515');
    groundGrad.addColorStop(1, '#080208');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, w, h - this.groundY);

    // Ground neon line
    ctx.strokeStyle = this.colors.body;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.colors.glow;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(w, this.groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ground grid lines
    ctx.strokeStyle = 'rgba(255, 20, 147, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w / 40 + 2; i++) {
      const x = i * 40 - this.groundOffset;
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x - 100, h);
      ctx.stroke();
    }
    // Horizontal grid lines
    for (let i = 1; i < 5; i++) {
      const y = this.groundY + (h - this.groundY) * (i / 5);
      ctx.strokeStyle = `rgba(0, 200, 255, ${0.1 - i * 0.015})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Orbs
    for (const orb of this.orbs) {
      if (orb.collected) continue;
      const pulse = 1 + Math.sin(orb.pulse) * 0.2;
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';

      // Outer glow
      ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 15 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Core
      const orbGrad = ctx.createRadialGradient(orb.x - 3, orb.y - 3, 0, orb.x, orb.y, 10);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.3, '#5ce8ff');
      orbGrad.addColorStop(1, '#00a3d9');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 10 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(orb.x - 3, orb.y - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Obstacles
    for (const obs of this.obstacles) {
      this.drawObstacle(obs);
    }

    // Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Player
    if (!this.gameOverFlag) {
      this.drawPlayer();
    }

    // Level up flash
    if (this.levelUpFlash > 0) {
      const alpha = (this.levelUpFlash / 60) * 0.3;
      ctx.fillStyle = `rgba(255, 20, 147, ${alpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  private drawTree(tree: BgTree) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.6 + tree.layer * 0.15;

    // Trunk
    ctx.fillStyle = '#0a0510';
    ctx.fillRect(tree.x + tree.size * 0.4, tree.y, tree.size * 0.1, tree.size * 0.3);

    // Crown layers (glowing tree)
    ctx.shadowBlur = tree.layer === 0 ? 5 : 15;
    ctx.shadowColor = 'rgba(255, 20, 147, 0.3)';
    ctx.fillStyle = tree.color;
    ctx.beginPath();
    ctx.moveTo(tree.x + tree.size * 0.45, tree.y - tree.size * 0.5);
    ctx.lineTo(tree.x, tree.y);
    ctx.lineTo(tree.x + tree.size * 0.9, tree.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(tree.x + tree.size * 0.45, tree.y - tree.size * 0.8);
    ctx.lineTo(tree.x + tree.size * 0.1, tree.y - tree.size * 0.3);
    ctx.lineTo(tree.x + tree.size * 0.8, tree.y - tree.size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawObstacle(obs: Obstacle) {
    const ctx = this.ctx;
    ctx.save();

    if (obs.type === 'log') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 20, 147, 0.4)';
      ctx.fillStyle = '#2a1030';
      ctx.strokeStyle = '#ff2d9c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
      ctx.fill();
      ctx.stroke();
      // Glow lines
      ctx.strokeStyle = 'rgba(255, 45, 156, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(obs.x + 5, obs.y + obs.height * 0.5);
      ctx.lineTo(obs.x + obs.width - 5, obs.y + obs.height * 0.5);
      ctx.stroke();
    } else if (obs.type === 'crystal') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(0, 200, 255, 0.6)';
      ctx.fillStyle = '#1a2030';
      ctx.strokeStyle = '#00c8ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width / 2, obs.y);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height * 0.3);
      ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height);
      ctx.lineTo(obs.x + obs.width * 0.2, obs.y + obs.height);
      ctx.lineTo(obs.x, obs.y + obs.height * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Inner glow
      ctx.fillStyle = 'rgba(0, 200, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width / 2, obs.y + 5);
      ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height * 0.4);
      ctx.lineTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.9);
      ctx.closePath();
      ctx.fill();
    } else {
      // Flying drone
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(255, 100, 100, 0.5)';
      ctx.fillStyle = '#2a1015';
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Red eye
      ctx.fillStyle = '#ff0000';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff0000';
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPlayer() {
    const ctx = this.ctx;
    const x = this.playerX;
    const y = this.playerY - this.playerHeight;
    const w = this.playerWidth;
    const h = this.playerHeight;
    const c = this.colors;

    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = c.glow;

    // Run bob
    const bob = this.isJumping ? 0 : Math.sin(this.runFrame * Math.PI / 2) * 2;

    // Antenna
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 5);
    ctx.lineTo(x + w / 2, y + 3);
    ctx.stroke();
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 7, 3, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const headGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    headGrad.addColorStop(0, c.accent);
    headGrad.addColorStop(1, c.body);
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 3 + bob, w - 8, 22, 6);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#0a0a14';
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 9 + bob, 8, 6, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w - 18, y + 9 + bob, 8, 6, 2);
    ctx.fill();
    // Eye glow
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(x + 13, y + 12 + bob, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 15, y + 12 + bob, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 26 + bob, w - 4, h - 32, 6);
    ctx.fill();
    ctx.stroke();

    // Chest light
    ctx.fillStyle = c.accent;
    ctx.shadowBlur = 10;
    ctx.shadowColor = c.glow;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 40 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 40 + bob, 2, 0, Math.PI * 2);
    ctx.fill();

    // Legs (animated)
    ctx.shadowBlur = 0;
    ctx.fillStyle = c.body;
    if (this.isJumping) {
      ctx.beginPath();
      ctx.roundRect(x + 8, y + h - 8, 8, 8, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(x + w - 16, y + h - 8, 8, 8, 3);
      ctx.fill();
    } else {
      const legOffset = this.runFrame < 2 ? 2 : -2;
      ctx.beginPath();
      ctx.roundRect(x + 8, y + h - 6, 8, 6 + legOffset, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(x + w - 16, y + h - 6, 8, 6 - legOffset, 3);
      ctx.fill();
    }

    ctx.restore();
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (!this.paused) {
      this.update(dt);
    }
    this.draw();

    if (this.running) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };
}
