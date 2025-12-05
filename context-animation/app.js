// ============================================
// 1. SpriteAnimator - 스프라이트 시트 애니메이션
// ============================================
class SpriteAnimator {
  constructor(image, frameWidth, frameHeight) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.animations = {};
    this.currentAnim = null;
    this.frameIndex = 0;
    this.elapsed = 0;
  }

  define(name, row, frameCount, frameDuration, loop = true) {
    this.animations[name] = { row, frameCount, frameDuration, loop };
  }

  play(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      this.frameIndex = 0;
      this.elapsed = 0;
    }
  }

  update(dt) {
    const anim = this.animations[this.currentAnim];
    if (!anim) return;

    this.elapsed += dt;
    if (this.elapsed >= anim.frameDuration) {
      this.elapsed = 0;
      this.frameIndex++;
      if (this.frameIndex >= anim.frameCount) {
        this.frameIndex = anim.loop ? 0 : anim.frameCount - 1;
      }
    }
  }

  draw(ctx, x, y, flipX = false) {
    const anim = this.animations[this.currentAnim];
    if (!anim) return;

    ctx.save();
    if (flipX) {
      ctx.translate(x + this.frameWidth, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }

    ctx.drawImage(
      this.image,
      this.frameIndex * this.frameWidth,
      anim.row * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      x,
      y,
      this.frameWidth,
      this.frameHeight
    );
    ctx.restore();
  }
}

// ============================================
// 2. 프로그래매틱 이펙트
// ============================================
class CircleWaveEffect {
  constructor(x, y, color, maxRadius, duration) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxRadius = maxRadius;
    this.duration = duration;
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
    return this.elapsed < this.duration;
  }

  draw(ctx) {
    const progress = this.elapsed / this.duration;
    const radius = this.maxRadius * progress;
    const alpha = 1 - progress;

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color.replace('1)', `${alpha})`);
    ctx.lineWidth = 3 * (1 - progress);
    ctx.stroke();
  }
}

class SlashEffect {
  constructor(x, y, angle, radius, arcSpan, duration) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.radius = radius;
    this.arcSpan = arcSpan;
    this.duration = duration;
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
    return this.elapsed < this.duration;
  }

  draw(ctx) {
    const progress = this.elapsed / this.duration;
    const alpha = 1 - progress;
    const startAngle = this.angle - this.arcSpan / 2;
    const currentArc = this.arcSpan * Math.min(progress * 2, 1);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (0.5 + progress * 0.5), startAngle, startAngle + currentArc);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 8 * (1 - progress);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

// ============================================
// 3. 파티클 시스템
// ============================================
class Particle {
  constructor(x, y, config) {
    this.x = x;
    this.y = y;
    this.vx = config.vx ?? (Math.random() - 0.5) * config.speed;
    this.vy = config.vy ?? (Math.random() - 0.5) * config.speed;
    this.life = config.life;
    this.maxLife = config.life;
    this.size = config.size;
    this.color = config.color;
    this.gravity = config.gravity || 0;
    this.friction = config.friction || 1;
  }

  update(dt) {
    this.vy += this.gravity * dt;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    const size = this.size * alpha;
    ctx.fillStyle = this.color.replace('1)', `${alpha})`);
    ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emitHit(x, y, color = 'rgba(255, 100, 100, 1)') {
    for (let i = 0; i < 8; i++) {
      this.particles.push(
        new Particle(x, y, {
          speed: 200,
          life: 0.3,
          size: 6,
          color,
          friction: 0.95,
        })
      );
    }
  }

  emitLevelUp(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = ((Math.PI * 2) / 20) * i;
      this.particles.push(
        new Particle(x, y, {
          vx: Math.cos(angle) * 150,
          vy: Math.sin(angle) * 150,
          life: 0.5,
          size: 8,
          color: 'rgba(255, 215, 0, 1)',
          friction: 0.92,
        })
      );
    }
  }

  emitTrail(x, y, color = 'rgba(100, 200, 255, 1)') {
    this.particles.push(
      new Particle(x, y, {
        speed: 50,
        life: 0.2,
        size: 4,
        color,
        friction: 0.9,
      })
    );
  }

  update(dt) {
    this.particles = this.particles.filter((p) => p.update(dt));
  }

  draw(ctx) {
    this.particles.forEach((p) => p.draw(ctx));
  }
}

// ============================================
// 4. 히트박스 시스템
// ============================================
class Hitbox {
  static circle(x, y, radius) {
    return { type: 'circle', x, y, radius };
  }

  static arc(x, y, radius, angle, span) {
    return { type: 'arc', x, y, radius, angle, span };
  }

  static rect(x, y, width, height, angle = 0) {
    return { type: 'rect', x, y, width, height, angle };
  }

  static check(a, b) {
    if (a.type === 'circle' && b.type === 'circle') {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < a.radius + b.radius;
    }

    if (a.type === 'circle' && b.type === 'arc') {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > a.radius + b.radius) return false;

      const angle = Math.atan2(dy, dx);
      let diff = angle - b.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return Math.abs(diff) < b.span / 2;
    }

    return false;
  }

  // 히트박스 시각화 (디버그용)
  static draw(ctx, hitbox, color = 'rgba(255, 0, 0, 0.3)') {
    ctx.save();

    if (hitbox.type === 'circle') {
      ctx.beginPath();
      ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    if (hitbox.type === 'arc') {
      ctx.beginPath();
      ctx.moveTo(hitbox.x, hitbox.y);
      ctx.arc(hitbox.x, hitbox.y, hitbox.radius, hitbox.angle - hitbox.span / 2, hitbox.angle + hitbox.span / 2);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================
// 5. 스프라이트 시트 생성기 (테스트용)
// ============================================
function createTestSpriteSheet(frameWidth, frameHeight, rows, cols) {
  const canvas = document.createElement('canvas');
  canvas.width = frameWidth * cols;
  canvas.height = frameHeight * rows;
  const ctx = canvas.getContext('2d');

  const colors = ['#4CAF50', '#2196F3', '#FF5722', '#9C27B0'];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * frameWidth + frameWidth / 2;
      const y = row * frameHeight + frameHeight / 2;
      const phase = col / cols;

      ctx.fillStyle = colors[row % colors.length];
      ctx.beginPath();

      // 각 행마다 다른 애니메이션 형태
      if (row === 0) {
        // Idle: 크기 변화
        const scale = 0.7 + Math.sin(phase * Math.PI * 2) * 0.15;
        ctx.arc(x, y, frameWidth * 0.3 * scale, 0, Math.PI * 2);
      } else if (row === 1) {
        // Walk: 위아래 움직임 + 다리
        const bounce = Math.sin(phase * Math.PI * 2) * 3;
        ctx.arc(x, y - 5 + bounce, frameWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // 다리
        ctx.fillRect(x - 8, y + 8, 4, 10 + Math.sin(phase * Math.PI * 4) * 3);
        ctx.fillRect(x + 4, y + 8, 4, 10 - Math.sin(phase * Math.PI * 4) * 3);
      } else if (row === 2) {
        // Attack: 회전 + 무기
        ctx.arc(x, y, frameWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const weaponAngle = -Math.PI / 2 + phase * Math.PI;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(weaponAngle) * 25, y + Math.sin(weaponAngle) * 25);
        ctx.stroke();
      } else {
        // Hit: 깜빡임
        ctx.globalAlpha = col % 2 === 0 ? 1 : 0.3;
        ctx.arc(x, y, frameWidth * 0.3, 0, Math.PI * 2);
      }

      ctx.fill();
    }
  }

  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

// ============================================
// 6. 테스트용 플레이어
// ============================================
class TestPlayer {
  constructor(x, y, animator) {
    this.x = x;
    this.y = y;
    this.animator = animator;
    this.speed = 150;
    this.facing = 0; // 각도 (라디안)
    this.facingRight = true;
    this.state = 'idle';
    this.attackCooldown = 0;
  }

  update(dt, keys, mouseX, mouseY) {
    // 이동
    let dx = 0,
      dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.x += (dx / len) * this.speed * dt;
      this.y += (dy / len) * this.speed * dt;
      this.state = 'walk';
      if (dx !== 0) this.facingRight = dx > 0;
    } else {
      this.state = 'idle';
    }

    // 마우스 방향
    this.facing = Math.atan2(mouseY - this.y, mouseX - this.x);

    // 공격 쿨다운
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
      this.state = 'attack';
    }

    // 애니메이션 상태 변경
    this.animator.play(this.state);
    this.animator.update(dt);
  }

  attack() {
    if (this.attackCooldown <= 0) {
      this.attackCooldown = 0.3;
      return true;
    }
    return false;
  }

  draw(ctx) {
    this.animator.draw(ctx, this.x - 24, this.y - 24, !this.facingRight);
  }

  getHitbox() {
    return Hitbox.circle(this.x, this.y, 20);
  }

  getAttackHitbox() {
    return Hitbox.arc(this.x, this.y, 80, this.facing, Math.PI / 2);
  }
}

// ============================================
// 7. 테스트용 적
// ============================================
class TestEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.color = 'rgba(255, 80, 80, 1)';
    this.hit = false;
    this.hitTimer = 0;
  }

  update(dt) {
    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      this.hit = this.hitTimer > 0;
    }
  }

  takeDamage() {
    this.hit = true;
    this.hitTimer = 0.15;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.hit ? '#fff' : this.color;
    ctx.fill();
    ctx.strokeStyle = '#a00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  getHitbox() {
    return Hitbox.circle(this.x, this.y, this.radius);
  }
}

// ============================================
// 8. 메인 테스트 앱
// ============================================
let canvas, ctx;
let player;
let enemies = [];
let effects = [];
let particleSystem;
let keys = {};
let mouse = { x: 0, y: 0 };
let lastTime = 0;
let testMode = 1;
let showHitbox = true;

const TEST_MODES = {
  1: 'Sprite Animation (WASD 이동)',
  2: 'Circle Wave (클릭)',
  3: 'Slash Effect (클릭)',
  4: 'Particle System (클릭)',
  5: 'Hitbox Test (클릭 공격)',
  6: 'All Combined',
};

function init() {
  canvas = document.querySelector('canvas');
  ctx = canvas.getContext('2d');

  // 테스트용 스프라이트 시트 생성
  const spriteSheet = createTestSpriteSheet(48, 48, 4, 6);

  spriteSheet.onload = () => {
    // 애니메이터 설정
    const animator = new SpriteAnimator(spriteSheet, 48, 48);
    animator.define('idle', 0, 6, 0.15);
    animator.define('walk', 1, 6, 0.1);
    animator.define('attack', 2, 6, 0.05, false);
    animator.define('hit', 3, 6, 0.05, false);

    // 플레이어 생성
    player = new TestPlayer(canvas.width / 2, canvas.height / 2, animator);

    // 파티클 시스템
    particleSystem = new ParticleSystem();

    // 테스트용 적 생성
    spawnEnemies();

    // 이벤트 리스너
    setupEventListeners();

    // 게임 루프 시작
    requestAnimationFrame(gameLoop);
  };

  // 이미지가 이미 로드된 경우
  if (spriteSheet.complete) {
    spriteSheet.onload();
  }
}

function spawnEnemies() {
  enemies = [];
  for (let i = 0; i < 5; i++) {
    enemies.push(new TestEnemy(100 + Math.random() * (canvas.width - 200), 100 + Math.random() * (canvas.height - 200)));
  }
}

function setupEventListeners() {
  // 키보드
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // 숫자키로 테스트 모드 변경
    const num = parseInt(e.key);
    if (num >= 1 && num <= 6) {
      testMode = num;
      spawnEnemies();
    }

    // H: 히트박스 표시 토글
    if (e.key.toLowerCase() === 'h') {
      showHitbox = !showHitbox;
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // 마우스
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    handleClick(x, y);
  });
}

function handleClick(x, y) {
  switch (testMode) {
    case 2: // Circle Wave
      effects.push(new CircleWaveEffect(x, y, 'rgba(100, 200, 255, 1)', 100, 0.5));
      effects.push(new CircleWaveEffect(x, y, 'rgba(255, 100, 100, 1)', 150, 0.7));
      break;

    case 3: // Slash
      const angle = Math.atan2(y - player.y, x - player.x);
      effects.push(new SlashEffect(player.x, player.y, angle, 80, Math.PI / 2, 0.2));
      break;

    case 4: // Particles
      particleSystem.emitHit(x, y);
      setTimeout(() => particleSystem.emitLevelUp(x, y), 200);
      break;

    case 5: // Hitbox Test
    case 6: // All Combined
      if (player.attack()) {
        effects.push(new SlashEffect(player.x, player.y, player.facing, 80, Math.PI / 2, 0.2));

        const attackBox = player.getAttackHitbox();
        enemies.forEach((enemy) => {
          if (Hitbox.check(enemy.getHitbox(), attackBox)) {
            enemy.takeDamage();
            particleSystem.emitHit(enemy.x, enemy.y);
          }
        });
      }
      break;
  }
}

function update(dt) {
  // 플레이어 업데이트
  if (player) {
    player.update(dt, keys, mouse.x, mouse.y);

    // 경계 제한
    player.x = Math.max(24, Math.min(canvas.width - 24, player.x));
    player.y = Math.max(24, Math.min(canvas.height - 24, player.y));

    // 이동 중 트레일 (모드 6)
    if (testMode === 6 && (keys['w'] || keys['a'] || keys['s'] || keys['d'])) {
      particleSystem.emitTrail(player.x, player.y + 15);
    }
  }

  // 적 업데이트
  enemies.forEach((e) => e.update(dt));

  // 이펙트 업데이트
  effects = effects.filter((e) => e.update(dt));

  // 파티클 업데이트
  particleSystem.update(dt);
}

function draw() {
  // 배경
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 그리드 (참조용)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 적 그리기
  enemies.forEach((e) => {
    e.draw(ctx);
    if (showHitbox) {
      Hitbox.draw(ctx, e.getHitbox(), 'rgba(255, 0, 0, 0.2)');
    }
  });

  // 플레이어 그리기
  if (player) {
    player.draw(ctx);

    if (showHitbox) {
      Hitbox.draw(ctx, player.getHitbox(), 'rgba(0, 255, 0, 0.2)');

      // 공격 범위 미리보기 (모드 5, 6)
      if (testMode >= 5) {
        Hitbox.draw(ctx, player.getAttackHitbox(), 'rgba(255, 255, 0, 0.1)');
      }
    }
  }

  // 이펙트 그리기
  effects.forEach((e) => e.draw(ctx));

  // 파티클 그리기
  particleSystem.draw(ctx);

  // UI
  drawUI();
}

function drawUI() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, 60);

  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(`모드 ${testMode}: ${TEST_MODES[testMode]}`, 10, 20);
  ctx.fillText('1-6: 모드 변경 | H: 히트박스 토글 | WASD: 이동 | 클릭: 액션', 10, 40);

  // 파티클 카운트
  ctx.fillStyle = '#888';
  ctx.fillText(`Particles: ${particleSystem.particles.length} | Effects: ${effects.length}`, 10, 55);
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
