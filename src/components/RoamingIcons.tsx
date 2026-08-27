import React, { useEffect, useRef, useState } from 'react';
import { playPopSnippet } from '../lib/audio';

interface RoamingIconsProps {
  active: boolean;
  mainEmoji: string;
}

interface RoamingItem {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vRot: number;
  scale: number;
}

// Generate matching thematic emoji sets
function getThematicEmojis(mainEmoji: string): string[] {
  const map: Record<string, string[]> = {
    '🍜': ['🍜', '🥟', '🥢', '🍲', '🍥', '🌶️', '😋', '🔥'],
    '🍕': ['🍕', '🧀', '🍟', '🍔', '🥤', '🤤', '🔥', '✨'],
    '🍗': ['🍗', '🍺', '🍟', '🍻', '🤤', '🔥', '✨'],
    '🍺': ['🍺', '🍻', '🥂', '🍾', '🤪', '🥳', '🎉'],
    '💸': ['💸', '💵', '💰', '🪙', '🤑', '💳', '🏦', '👑'],
    '🤫': ['🤫', '🤐', '👀', '🕵️', '🔒', '🗝️', '💥'],
    '🤪': ['🤪', '😜', '🤡', '🤣', '💀', '👻', '💥', '🎉'],
    '🐱': ['🐱', '🐾', '🐟', '🧶', '😻', '✨', '💖'],
    '👑': ['👑', '💎', '✨', '🏆', '⭐', '💫', '🦁'],
    '💥': ['💥', '💣', '🔥', '⚡', '🌟', '🧨', '💨'],
    '❤️': ['❤️', '💖', '💘', '💕', '🥰', '💓', '✨', '🔥'],
    '🎂': ['🎂', '🍰', '🎉', '🎁', '🥳', '🎈', '✨', '💖'],
    '🚀': ['🚀', '💨', '🌌', '⭐', '🔥', '🏃', '⚡', '🎉'],
  };

  return map[mainEmoji] || [mainEmoji, '✨', '🎉', '🔥', '💥', '⭐', '🎈', '💖'];
}

export const RoamingIcons: React.FC<RoamingIconsProps> = ({ active, mainEmoji }) => {
  const [items, setItems] = useState<RoamingItem[]>([]);
  const itemsRef = useRef<RoamingItem[]>([]);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setItems([]);
      itemsRef.current = [];
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }

    const emojiSet = getThematicEmojis(mainEmoji);
    const count = 8; // Optimal count to avoid screen clutter
    const initialItems: RoamingItem[] = [];

    const cx = window.innerWidth / 2;
    const cy = Math.max(160, window.innerHeight * 0.42);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 2.5 + 2.0;
      const emoji = emojiSet[i % emojiSet.length];

      initialItems.push({
        id: i,
        emoji,
        x: cx + Math.cos(angle) * 40,
        y: cy + Math.sin(angle) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 12 + 32, // 32px ~ 44px (neat and proportional)
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 3,
        scale: 1,
      });
    }

    itemsRef.current = initialItems;
    setItems([...initialItems]);

    // Bouncing animation loop restricted safely above bottom buttons
    const updatePhysics = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const topBound = 60;
      const bottomBound = h - 140; // Keep at least 140px clearance above bottom CTA buttons!

      itemsRef.current.forEach((item) => {
        item.x += item.vx;
        item.y += item.vy;
        item.rot += item.vRot;

        // Bounce off left & right
        if (item.x - item.size / 2 <= 8) {
          item.x = 8 + item.size / 2;
          item.vx = Math.abs(item.vx);
          item.vRot = (Math.random() - 0.5) * 4;
        } else if (item.x + item.size / 2 >= w - 8) {
          item.x = w - 8 - item.size / 2;
          item.vx = -Math.abs(item.vx);
          item.vRot = (Math.random() - 0.5) * 4;
        }

        // Bounce off top & bottom safe zone
        if (item.y - item.size / 2 <= topBound) {
          item.y = topBound + item.size / 2;
          item.vy = Math.abs(item.vy);
        } else if (item.y + item.size / 2 >= bottomBound) {
          item.y = bottomBound - item.size / 2;
          item.vy = -Math.abs(item.vy);
        }
      });

      setItems([...itemsRef.current]);
      animFrameId.current = requestAnimationFrame(updatePhysics);
    };

    animFrameId.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [active, mainEmoji]);

  const handleTapEmoji = (id: number) => {
    playPopSnippet();
    itemsRef.current = itemsRef.current.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          vRot: item.vRot * 2.5,
          scale: 1.4,
        };
      }
      return item;
    });
  };

  if (!active || items.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => handleTapEmoji(item.id)}
          className="absolute select-none pointer-events-auto cursor-pointer transition-transform active:scale-125 hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] opacity-90"
          style={{
            transform: `translate3d(${item.x - item.size / 2}px, ${item.y - item.size / 2}px, 0) rotate(${item.rot}deg) scale(${item.scale})`,
            fontSize: `${item.size}px`,
            willChange: 'transform',
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
};
