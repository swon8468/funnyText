import confetti from 'canvas-confetti';
import type { VisualEffectId } from '../types';

export function triggerVisualEffect(effectId: VisualEffectId): void {
  switch (effectId) {
    case 'confetti':
      shootMegaConfettiStorm();
      break;
    case 'money':
      shootMegaMoneyRain();
      break;
    case 'hearts':
      shootMegaHeartsExplosion();
      break;
    case 'fireworks':
      shootMegaFireworksShow();
      break;
    default:
      shootMegaConfettiStorm();
  }
}

/**
 * Insane 5-Wave Mega Confetti Storm
 */
function shootMegaConfettiStorm(): void {
  // Wave 1: Immediate massive center explosion
  confetti({
    particleCount: 150,
    spread: 120,
    origin: { y: 0.55 },
    startVelocity: 45,
    colors: ['#ff0055', '#ff5500', '#ffcc00', '#00ff66', '#00ccff', '#aa00ff', '#ffffff'],
    scalar: 1.2,
  });

  // Wave 2: Left & Right high-velocity cross cannons
  setTimeout(() => {
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: -0.05, y: 0.65 },
      startVelocity: 55,
      colors: ['#ffd700', '#ff1493', '#00ffff', '#7b68ee'],
    });
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 1.05, y: 0.65 },
      startVelocity: 55,
      colors: ['#ffd700', '#ff1493', '#00ffff', '#7b68ee'],
    });
  }, 120);

  // Wave 3: Center fountain burst
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 160,
      origin: { y: 0.5 },
      startVelocity: 35,
      decay: 0.92,
      gravity: 0.9,
    });
  }, 280);

  // Wave 4: Continuous falling confetti shower
  const duration = 2200;
  const end = Date.now() + duration;
  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    if (Date.now() > end) return clearInterval(interval);
    confetti({
      particleCount: 15,
      angle: 90,
      spread: 120,
      origin: { x: Math.random(), y: -0.1 },
      gravity: 1.2,
      drift: (Math.random() - 0.5) * 1.5,
    });
  }, 100);
}

/**
 * Over-the-top Money & Cash Tornado
 */
function shootMegaMoneyRain(): void {
  const scalar = 2.8;
  const money = confetti.shapeFromText({ text: '💸', scalar });
  const cash = confetti.shapeFromText({ text: '💵', scalar });
  const bag = confetti.shapeFromText({ text: '💰', scalar });
  const gold = confetti.shapeFromText({ text: '🪙', scalar });
  const rich = confetti.shapeFromText({ text: '🤑', scalar });

  // Initial giant money explosion
  confetti({
    shapes: [money, cash, bag, gold, rich],
    scalar,
    particleCount: 60,
    spread: 110,
    origin: { y: 0.55 },
    startVelocity: 42,
    ticks: 180,
    gravity: 0.8,
  });

  // Left & Right money cannons
  setTimeout(() => {
    confetti({
      shapes: [money, cash, bag],
      scalar: 3.2,
      particleCount: 40,
      angle: 55,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      startVelocity: 50,
    });
    confetti({
      shapes: [money, cash, bag],
      scalar: 3.2,
      particleCount: 40,
      angle: 125,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      startVelocity: 50,
    });
  }, 180);

  // Continuous rain of cash
  const duration = 2500;
  const end = Date.now() + duration;
  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    if (Date.now() > end) return clearInterval(interval);
    confetti({
      shapes: [money, cash, gold],
      scalar: 2.5,
      particleCount: 8,
      origin: { x: Math.random() * 0.9 + 0.05, y: -0.1 },
      gravity: 0.9,
      startVelocity: 15,
    });
  }, 120);
}

/**
 * Super dramatic Heart & Passion Overload
 */
function shootMegaHeartsExplosion(): void {
  const scalar = 2.8;
  const h1 = confetti.shapeFromText({ text: '❤️', scalar });
  const h2 = confetti.shapeFromText({ text: '💖', scalar });
  const h3 = confetti.shapeFromText({ text: '🔥', scalar });
  const h4 = confetti.shapeFromText({ text: '💘', scalar });
  const h5 = confetti.shapeFromText({ text: '🥰', scalar });
  const h6 = confetti.shapeFromText({ text: '💥', scalar });

  // Stage 1: Mega Heart Burst
  confetti({
    shapes: [h1, h2, h3, h4, h5, h6],
    scalar,
    particleCount: 70,
    spread: 120,
    origin: { y: 0.55 },
    startVelocity: 40,
    ticks: 180,
    gravity: 0.7,
  });

  // Stage 2: Pink & Red particle glow shower
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 140,
      origin: { y: 0.5 },
      colors: ['#ff1493', '#ff69b4', '#ff0055', '#ff4500', '#ffd700'],
      startVelocity: 35,
    });
  }, 200);

  // Stage 3: Lingering floating hearts
  const duration = 2500;
  const end = Date.now() + duration;
  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    if (Date.now() > end) return clearInterval(interval);
    confetti({
      shapes: [h1, h2, h5],
      scalar: 2.2,
      particleCount: 6,
      origin: { x: Math.random() * 0.8 + 0.1, y: -0.1 },
      gravity: 0.6,
      startVelocity: 10,
    });
  }, 140);
}

/**
 * Multi-launch Grand Finale Fireworks Spectacle
 */
function shootMegaFireworksShow(): void {
  const duration = 3000;
  const animationEnd = Date.now() + duration;

  // Immediate center mega blast
  confetti({
    particleCount: 120,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    startVelocity: 45,
    colors: ['#ffffff', '#ff0055', '#ffff00', '#00ffff'],
  });

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    // 2 random explosion points simultaneously
    for (let i = 0; i < 2; i++) {
      confetti({
        particleCount: 40,
        spread: 360,
        ticks: 90,
        origin: {
          x: Math.random() * 0.8 + 0.1,
          y: Math.random() * 0.5 + 0.2,
        },
        colors: [
          '#ff0044', '#00ffcc', '#ffbb00', '#cc00ff', '#0088ff', '#ffffff', '#ff00ff'
        ],
        startVelocity: 32,
        scalar: 1.1,
      });
    }
  }, 220);
}
