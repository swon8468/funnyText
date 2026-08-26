export type BoxThemeId =
  | 'classic-red'
  | 'royal-gold'
  | 'cyber-neon'
  | 'sweet-pink'
  | 'midnight-dark'
  | 'emerald-mint';

export type SoundEffectId = 'boom' | 'fanfare' | 'tada' | 'drumroll';
export type VisualEffectId = 'confetti' | 'money' | 'hearts' | 'fireworks';

export interface GiftPayload {
  v: number;              // Version of schema
  t: string;              // Main secret text (e.g. "난 짬뽕")
  s?: string;             // Subtitle / Sender name (e.g. "from. 동기")
  b: BoxThemeId;          // Box theme
  e: string;              // Emoji (e.g. "🍜")
  snd: SoundEffectId;     // Sound effect
  fx: VisualEffectId;     // Particle visual effect
  ts?: number;            // Creation timestamp (optional)
}

export interface BoxThemeConfig {
  id: BoxThemeId;
  name: string;
  boxColor: string;
  boxHex: number;
  ribbonColor: string;
  ribbonHex: number;
  lidColor: string;
  lidHex: number;
  bgGradient: string;
  textColor: string;
  boardColor: string;
  boardHex: number;
}

export const BOX_THEMES: Record<BoxThemeId, BoxThemeConfig> = {
  'classic-red': {
    id: 'classic-red',
    name: '클래식 레드',
    boxColor: '#dc2626',
    boxHex: 0xdc2626,
    ribbonColor: '#fbbf24',
    ribbonHex: 0xfbbf24,
    lidColor: '#ef4444',
    lidHex: 0xef4444,
    bgGradient: 'from-[#1e0a14] via-[#12081c] to-[#0a0614]',
    textColor: '#ffffff',
    boardColor: '#b91c1c',
    boardHex: 0xb91c1c,
  },
  'royal-gold': {
    id: 'royal-gold',
    name: '로열 골드',
    boxColor: '#d97706',
    boxHex: 0xd97706,
    ribbonColor: '#991b1b',
    ribbonHex: 0x991b1b,
    lidColor: '#f59e0b',
    lidHex: 0xf59e0b,
    bgGradient: 'from-[#1c1305] via-[#170e08] to-[#0c0805]',
    textColor: '#ffffff',
    boardColor: '#78350f',
    boardHex: 0x78350f,
  },
  'cyber-neon': {
    id: 'cyber-neon',
    name: '사이버 네온',
    boxColor: '#7c3aed',
    boxHex: 0x7c3aed,
    ribbonColor: '#06b6d4',
    ribbonHex: 0x06b6d4,
    lidColor: '#9333ea',
    lidHex: 0x9333ea,
    bgGradient: 'from-[#13092e] via-[#090b24] to-[#070517]',
    textColor: '#ffffff',
    boardColor: '#581c87',
    boardHex: 0x581c87,
  },
  'sweet-pink': {
    id: 'sweet-pink',
    name: '스윗 핑크',
    boxColor: '#ec4899',
    boxHex: 0xec4899,
    ribbonColor: '#fef08a',
    ribbonHex: 0xfef08a,
    lidColor: '#f472b6',
    lidHex: 0xf472b6,
    bgGradient: 'from-[#240b19] via-[#1c0817] to-[#0e0410]',
    textColor: '#ffffff',
    boardColor: '#9d174d',
    boardHex: 0x9d174d,
  },
  'midnight-dark': {
    id: 'midnight-dark',
    name: '미드나잇 블랙',
    boxColor: '#1f2937',
    boxHex: 0x1f2937,
    ribbonColor: '#10b981',
    ribbonHex: 0x10b981,
    lidColor: '#374151',
    lidHex: 0x374151,
    bgGradient: 'from-[#070e17] via-[#080d14] to-[#04060a]',
    textColor: '#ffffff',
    boardColor: '#111827',
    boardHex: 0x111827,
  },
  'emerald-mint': {
    id: 'emerald-mint',
    name: '에메랄드 민트',
    boxColor: '#059669',
    boxHex: 0x059669,
    ribbonColor: '#fed7aa',
    ribbonHex: 0xfed7aa,
    lidColor: '#10b981',
    lidHex: 0x10b981,
    bgGradient: 'from-[#061c16] via-[#071714] to-[#040d0c]',
    textColor: '#ffffff',
    boardColor: '#064e3b',
    boardHex: 0x064e3b,
  },
};

export const PRESET_EMOJIS = [
  '🍜', '🍕', '🍗', '🍺', '💸', '🤫', '🤪', '🐱', '👑', '💥', '❤️', '🎁', '🎂', '🚀', '🔥', '👀'
];

export const FUNNY_TEMPLATES = [
  { title: '중국집 뭐먹을래?', text: '난 짬뽕', sub: '탕수육도 사줘', emoji: '🍜', theme: 'classic-red', sound: 'boom', fx: 'confetti' },
  { title: '빌려간 돈', text: '돈 갚아라', sub: '이자도 쳐서 줘', emoji: '💸', theme: 'royal-gold', sound: 'boom', fx: 'money' },
  { title: '중대 발표', text: '칼퇴합니다', sub: '연락하지 마세요', emoji: '🚀', theme: 'cyber-neon', sound: 'fanfare', fx: 'fireworks' },
  { title: '비밀 고백', text: '너 바보지', sub: 'ㅋㅋㅋ', emoji: '🤪', theme: 'sweet-pink', sound: 'tada', fx: 'confetti' },
  { title: '생일 축하', text: '생일 축하해!', sub: '내 선물이 곧 나야', emoji: '🎂', theme: 'sweet-pink', sound: 'fanfare', fx: 'hearts' },
  { title: '극비 정보', text: '쉿! 비밀이야', sub: '너한테만 말하는 건데', emoji: '🤫', theme: 'midnight-dark', sound: 'drumroll', fx: 'confetti' },
] as const;
