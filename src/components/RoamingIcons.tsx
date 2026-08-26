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
    '🍜': ['🍜', '🥟', '🥢', '🍲', '🍥', '🌶️', '😋', '🔥', '🐱', '💥'],
    '🍕': ['🍕', '🧀', '🍟', '🍔', '🥤', '🤤', '🔥', '✨'],
    '🍗': ['🍗', '🍺', '🍟', '🍻', '🤤', '🔥', '✨'],
    '🍺': ['🍺', '🍻', '🥂', '🍾', '🤪', '🥳', '🎉'],
    '💸': ['💸', '💵', '💰', '🪙', '🤑', '💳', '🏦', '👑', '🔥'],
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
    const count = 12;
    const initialItems: RoamingItem[] = [];

    // Screen center spawn with explosive outward velocities
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 5 + 3.5;
      const emoji = emojiSet[i % emojiSet.length];

      initialItems.push({
        id: i,
        emoji,
        x: cx + Math.cos(angle) * 30,
        y: cy + Math.sin(angle) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 20 + 36, // 36px ~ 56px
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 4,
        scale: 1,
      });
    }

    itemsRef.current = initialItems;
    setItems([...initialItems]);

    // Bouncing animation loop (DVD screensaver physics with floating friction)
    const updatePhysics = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      itemsRef.current.forEach((item) => {
        item.x += item.vx;
        item.y += item.vy;
        item.rot += item.vRot;

        // Bounce off left & right walls
        if (item.x - item.size / 2 <= 10) {
          item.x = 10 + item.size / 2;
          item.vx = Math.abs(item.vx);
          item.vRot = (Math.random() - 0.5) * 6;
        } else if (item.x + item.size / 2 >= w - 10) {
          item.x = w - 10 - item.size / 2;
          item.vx = -Math.abs(item.vx);
          item.vRot = (Math.random() - 0.5) * 6;
        }

        // Bounce off top & bottom walls
        if (item.y - item.size / 2 <= 10) {
          item.y = 10 + item.size / 2;
          item.vy = Math.abs(item.vy);
        } else if (item.y + item.size / 2 >= h - 10) {
          item.y = h - 10 - item.size / 2;
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

  // Interactive tap on roaming emoji
  const handleTapEmoji = (id: number) => {
    playPopSnippet();
    itemsRef.current = itemsRef.current.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          vRot: item.vRot * 3,
          scale: 1.5,
        };
      }
      return item;
    });
  };

  if (!active || items.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => handleTapEmoji(item.id)}
          className="absolute select-none pointer-events-auto cursor-pointer transition-transform active:scale-125 hover:brightness-125 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          style={{
            transform: `translate(${item.x - item.size / 2}px, ${item.y - item.size / 2}px) rotate(${item.rot}deg) scale(${item.scale})`,
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
