import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type SquadPhase = 'walking_in' | 'gathering' | 'raising_hands' | 'settled';

interface CartoonSquadProps {
  phase: SquadPhase;
  onPhaseComplete?: (phase: SquadPhase) => void;
  isCompact?: boolean;
}

// 10 Distinct Cartoon Character Definitions
export interface CharacterConfig {
  id: number;
  name: string;
  bodyColor: string;
  bellyColor: string;
  headwear: string;
  eyewear?: string;
  boomboxColor: string;
  speakerColor: string;
  boomboxPose: 'shoulder_left' | 'shoulder_right' | 'head_overhead' | 'hand_left' | 'hand_right' | 'hip';
  settledPlacement: {
    side: 'top-left' | 'top-right' | 'left-1' | 'left-2' | 'left-3' | 'right-1' | 'right-2' | 'right-3' | 'bottom-left' | 'bottom-right';
    x: number;
    y: number;
    rotate: number;
    scale: number;
  };
}

export const CHARACTERS: CharacterConfig[] = [
  {
    id: 1,
    name: 'DJ Purp',
    bodyColor: '#9333ea', // Purple
    bellyColor: '#c084fc',
    headwear: 'headphones',
    eyewear: 'shades',
    boomboxColor: '#ec4899',
    speakerColor: '#f43f5e',
    boomboxPose: 'shoulder_right',
    settledPlacement: { side: 'top-left', x: -280, y: -220, rotate: -8, scale: 0.95 }
  },
  {
    id: 2,
    name: 'Sparky',
    bodyColor: '#06b6d4', // Cyan
    bellyColor: '#67e8f9',
    headwear: 'cap',
    eyewear: 'star_glasses',
    boomboxColor: '#8b5cf6',
    speakerColor: '#a855f7',
    boomboxPose: 'hand_left',
    settledPlacement: { side: 'left-1', x: -330, y: -90, rotate: -5, scale: 0.9 }
  },
  {
    id: 3,
    name: 'Dino Beats',
    bodyColor: '#10b981', // Lime / Emerald
    bellyColor: '#6ee7b7',
    headwear: 'horns',
    eyewear: 'round_shades',
    boomboxColor: '#f59e0b',
    speakerColor: '#fbbf24',
    boomboxPose: 'head_overhead',
    settledPlacement: { side: 'left-2', x: -340, y: 50, rotate: -3, scale: 0.92 }
  },
  {
    id: 4,
    name: 'Panda Bass',
    bodyColor: '#3b82f6', // Electric Blue
    bellyColor: '#93c5fd',
    headwear: 'beanie',
    eyewear: 'shades',
    boomboxColor: '#10b981',
    speakerColor: '#34d399',
    boomboxPose: 'shoulder_left',
    settledPlacement: { side: 'left-3', x: -320, y: 190, rotate: -6, scale: 0.9 }
  },
  {
    id: 5,
    name: 'Boom Kitty',
    bodyColor: '#f97316', // Sunset Orange
    bellyColor: '#fdba74',
    headwear: 'cat_ears',
    eyewear: 'cool_eyes',
    boomboxColor: '#ef4444',
    speakerColor: '#f87171',
    boomboxPose: 'hand_right',
    settledPlacement: { side: 'bottom-left', x: -270, y: 310, rotate: 6, scale: 0.88 }
  },
  {
    id: 6,
    name: 'Fox Rhythm',
    bodyColor: '#ef4444', // Red-Orange
    bellyColor: '#fca5a5',
    headwear: 'snapback',
    eyewear: 'visor',
    boomboxColor: '#06b6d4',
    speakerColor: '#22d3ee',
    boomboxPose: 'hip',
    settledPlacement: { side: 'top-right', x: 280, y: -220, rotate: 8, scale: 0.95 }
  },
  {
    id: 7,
    name: 'Electro Bear',
    bodyColor: '#8b5cf6', // Violet
    bellyColor: '#ddd6fe',
    headwear: 'party_hat',
    eyewear: 'shades',
    boomboxColor: '#f43f5e',
    speakerColor: '#fb7185',
    boomboxPose: 'head_overhead',
    settledPlacement: { side: 'right-1', x: 330, y: -90, rotate: 5, scale: 0.9 }
  },
  {
    id: 8,
    name: 'Funky Ape',
    bodyColor: '#eab308', // Yellow Gold
    bellyColor: '#fef08a',
    headwear: 'headband',
    eyewear: 'round_shades',
    boomboxColor: '#ec4899',
    speakerColor: '#f472b6',
    boomboxPose: 'shoulder_right',
    settledPlacement: { side: 'right-2', x: 340, y: 50, rotate: 3, scale: 0.92 }
  },
  {
    id: 9,
    name: 'Synth Pup',
    bodyColor: '#14b8a6', // Teal
    bellyColor: '#99f6e4',
    headwear: 'bandana',
    eyewear: 'cool_eyes',
    boomboxColor: '#8b5cf6',
    speakerColor: '#a78bfa',
    boomboxPose: 'shoulder_left',
    settledPlacement: { side: 'right-3', x: 320, y: 190, rotate: 6, scale: 0.9 }
  },
  {
    id: 10,
    name: 'Sonic Koala',
    bodyColor: '#ec4899', // Hot Pink
    bellyColor: '#fbcfe8',
    headwear: 'headphones',
    eyewear: 'star_glasses',
    boomboxColor: '#eab308',
    speakerColor: '#fde047',
    boomboxPose: 'head_overhead',
    settledPlacement: { side: 'bottom-right', x: 270, y: 310, rotate: -6, scale: 0.88 }
  }
];

// Single Cartoon Character SVG with Boombox
export const CartoonCharacter: React.FC<{
  char: CharacterConfig;
  phase: SquadPhase;
  handsUp?: boolean;
}> = ({ char, phase, handsUp }) => {
  const isHandsRaised = handsUp || phase === 'raising_hands';

  return (
    <div className="relative select-none flex flex-col items-center">
      {/* Musical notes / bass waves floating above when dancing */}
      <motion.div
        animate={{
          y: [-2, -10, -2],
          opacity: [0.6, 1, 0.6],
          rotate: [-5, 5, -5]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-6 text-sm pointer-events-none drop-shadow"
      >
        {char.id % 2 === 0 ? '🎵' : '🎶'}
      </motion.div>

      {/* Main Character Body SVG */}
      <svg
        width="90"
        height="115"
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <filter id={`glow-${char.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={char.bodyColor} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="124" rx="28" ry="6" fill="#020617" opacity="0.4" />

        {/* Feet / Sneakers */}
        <motion.g
          animate={
            phase === 'walking_in'
              ? { y: [0, -3, 0] }
              : { y: [0, -1.5, 0] }
          }
          transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut', delay: char.id * 0.05 }}
        >
          {/* Left Shoe */}
          <rect x="26" y="112" width="18" height="10" rx="5" fill="#f8fafc" />
          <path d="M26 117h18" stroke={char.boomboxColor} strokeWidth="2.5" />
          {/* Right Shoe */}
          <rect x="56" y="112" width="18" height="10" rx="5" fill="#f8fafc" />
          <path d="M56 117h18" stroke={char.boomboxColor} strokeWidth="2.5" />
        </motion.g>

        {/* Legs */}
        <rect x="31" y="98" width="8" height="16" rx="4" fill={char.bodyColor} />
        <rect x="61" y="98" width="8" height="16" rx="4" fill={char.bodyColor} />

        {/* Torso */}
        <rect x="25" y="48" width="50" height="56" rx="24" fill={char.bodyColor} />
        {/* Belly patch */}
        <ellipse cx="50" cy="78" rx="16" ry="20" fill={char.bellyColor} />

        {/* Head */}
        <circle cx="50" cy="40" r="28" fill={char.bodyColor} filter={`url(#glow-${char.id})`} />

        {/* Cute Ears according to character */}
        {char.headwear === 'cat_ears' && (
          <>
            <polygon points="26,22 36,10 42,24" fill={char.bodyColor} />
            <polygon points="29,21 36,13 40,22" fill={char.bellyColor} />
            <polygon points="74,22 64,10 58,24" fill={char.bodyColor} />
            <polygon points="71,21 64,13 60,22" fill={char.bellyColor} />
          </>
        )}
        {char.headwear === 'horns' && (
          <>
            <path d="M28 20 C24 10, 32 4, 34 16" fill="#facc15" />
            <path d="M72 20 C76 10, 68 4, 66 16" fill="#facc15" />
          </>
        )}

        {/* Party Headwear */}
        {char.headwear === 'headphones' && (
          <g>
            <path d="M22 38 C22 18, 78 18, 78 38" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" fill="none" />
            <rect x="18" y="30" width="8" height="18" rx="4" fill={char.boomboxColor} />
            <rect x="74" y="30" width="8" height="18" rx="4" fill={char.boomboxColor} />
          </g>
        )}
        {char.headwear === 'cap' && (
          <g>
            <path d="M24 30 C24 18, 76 18, 76 30 Z" fill="#ef4444" />
            <rect x="18" y="28" width="30" height="5" rx="2.5" fill="#f87171" />
          </g>
        )}
        {char.headwear === 'party_hat' && (
          <g>
            <polygon points="50,6 36,26 64,26" fill="#fbbf24" />
            <circle cx="50" cy="6" r="3" fill="#f43f5e" />
            <line x1="40" y1="20" x2="60" y2="15" stroke="#ef4444" strokeWidth="2" />
          </g>
        )}
        {char.headwear === 'beanie' && (
          <path d="M26 32 C26 14, 74 14, 74 32 Z" fill="#0ea5e9" />
        )}

        {/* Eyes / Shades */}
        {char.eyewear === 'shades' ? (
          <g>
            <rect x="30" y="34" width="17" height="11" rx="3" fill="#0f172a" />
            <rect x="53" y="34" width="17" height="11" rx="3" fill="#0f172a" />
            <line x1="47" y1="39" x2="53" y2="39" stroke="#0f172a" strokeWidth="3" />
            <line x1="33" y1="36" x2="43" y2="36" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
          </g>
        ) : char.eyewear === 'star_glasses' ? (
          <g>
            <polygon points="38,32 40,37 46,37 41,41 43,46 38,43 33,46 35,41 30,37 36,37" fill="#fbbf24" />
            <polygon points="62,32 64,37 70,37 65,41 67,46 62,43 57,46 59,41 54,37 60,37" fill="#fbbf24" />
            <line x1="46" y1="39" x2="54" y2="39" stroke="#fbbf24" strokeWidth="2.5" />
          </g>
        ) : (
          <g>
            <circle cx="39" cy="38" r="4.5" fill="#0f172a" />
            <circle cx="61" cy="38" r="4.5" fill="#0f172a" />
            <circle cx="40.5" cy="36.5" r="1.5" fill="#ffffff" />
            <circle cx="62.5" cy="36.5" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Cheerful Smile */}
        <path d="M42 48 Q50 56 58 48" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Rosy Cheeks */}
        <circle cx="31" cy="46" r="3" fill="#f43f5e" opacity="0.5" />
        <circle cx="69" cy="46" r="3" fill="#f43f5e" opacity="0.5" />

        {/* Arms and Hands */}
        {isHandsRaised ? (
          // Hands Raised Enthusiastically in Celebration!
          <g>
            <motion.path
              d="M26 62 Q14 42 16 20"
              stroke={char.bodyColor}
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <circle cx="16" cy="18" r="6" fill={char.bellyColor} />

            <motion.path
              d="M74 62 Q86 42 84 20"
              stroke={char.bodyColor}
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: [4, -4, 4] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <circle cx="84" cy="18" r="6" fill={char.bellyColor} />
          </g>
        ) : (
          // Normal dancing arms
          <g>
            <path d="M26 60 Q15 68 18 80" stroke={char.bodyColor} strokeWidth="8" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="80" r="5" fill={char.bellyColor} />
            <path d="M74 60 Q85 68 82 80" stroke={char.bodyColor} strokeWidth="8" strokeLinecap="round" fill="none" />
            <circle cx="82" cy="80" r="5" fill={char.bellyColor} />
          </g>
        )}

        {/* MINI SOUNDBOX / BOOMBOX (Carried by character) */}
        {char.boomboxPose === 'head_overhead' || isHandsRaised ? (
          // Lifted Overhead with pulsing speakers
          <g transform="translate(25, 0)">
            <rect x="0" y="0" width="50" height="26" rx="5" fill={char.boomboxColor} stroke="#0f172a" strokeWidth="2" />
            <path d="M14 0 L14 -6 L36 -6 L36 0" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Speakers */}
            <circle cx="12" cy="13" r="8" fill="#1e293b" />
            <circle cx="12" cy="13" r="5" fill={char.speakerColor} className="animate-ping" style={{ transformOrigin: '12px 13px' }} />
            <circle cx="38" cy="13" r="8" fill="#1e293b" />
            <circle cx="38" cy="13" r="5" fill={char.speakerColor} className="animate-ping" style={{ transformOrigin: '38px 13px' }} />
            {/* Center cassette/equalizer */}
            <rect x="22" y="8" width="6" height="10" rx="1.5" fill="#0f172a" />
          </g>
        ) : char.boomboxPose === 'shoulder_right' ? (
          // On Right Shoulder
          <g transform="translate(56, 42) rotate(12)">
            <rect x="0" y="0" width="40" height="22" rx="4" fill={char.boomboxColor} stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="10" cy="11" r="6" fill="#1e293b" />
            <circle cx="10" cy="11" r="3.5" fill={char.speakerColor} />
            <circle cx="30" cy="11" r="6" fill="#1e293b" />
            <circle cx="30" cy="11" r="3.5" fill={char.speakerColor} />
          </g>
        ) : char.boomboxPose === 'shoulder_left' ? (
          // On Left Shoulder
          <g transform="translate(4, 42) rotate(-12)">
            <rect x="0" y="0" width="40" height="22" rx="4" fill={char.boomboxColor} stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="10" cy="11" r="6" fill="#1e293b" />
            <circle cx="10" cy="11" r="3.5" fill={char.speakerColor} />
            <circle cx="30" cy="11" r="6" fill="#1e293b" />
            <circle cx="30" cy="11" r="3.5" fill={char.speakerColor} />
          </g>
        ) : (
          // In Hand at Side
          <g transform="translate(62, 70)">
            <rect x="0" y="0" width="36" height="20" rx="3.5" fill={char.boomboxColor} stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="9" cy="10" r="5" fill="#1e293b" />
            <circle cx="9" cy="10" r="3" fill={char.speakerColor} />
            <circle cx="27" cy="10" r="5" fill="#1e293b" />
            <circle cx="27" cy="10" r="3" fill={char.speakerColor} />
          </g>
        )}
      </svg>

      {/* Name tag on hover */}
      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded-full border border-slate-700/50 mt-1 shadow">
        {char.name}
      </span>
    </div>
  );
};

export const CartoonSquad: React.FC<CartoonSquadProps> = ({
  phase,
  onPhaseComplete,
  isCompact = false
}) => {
  // Sound pulses and bass drop visualizer
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
      {CHARACTERS.map((char, index) => {
        // Animation variants depending on current phase
        let targetX = 0;
        let targetY = 0;
        let targetRotate = 0;
        let targetScale = 1;
        let targetOpacity = 1;

        if (phase === 'walking_in') {
          // Entering from the far left of the screen one after another
          targetX = -650 - index * 60;
          targetY = (index % 3 - 1) * 45;
          targetRotate = (index % 2 === 0 ? 8 : -8);
          targetScale = 0.85;
        } else if (phase === 'gathering') {
          // Clustered tightly in the center, greeting & high-fiving!
          const angle = (index / 10) * Math.PI * 2;
          targetX = Math.cos(angle) * 110;
          targetY = Math.sin(angle) * 75;
          targetRotate = Math.sin(index) * 10;
          targetScale = 1.05;
        } else if (phase === 'raising_hands') {
          // High cheer: Hands up in the air!
          const angle = (index / 10) * Math.PI * 2;
          targetX = Math.cos(angle) * 135;
          targetY = Math.sin(angle) * 90 - 25; // Raised higher
          targetRotate = Math.sin(index) * 15;
          targetScale = 1.15;
        } else if (phase === 'settled') {
          // Standing proudly around the login / signup box
          if (isCompact) {
            // Mobile / smaller screens: closer
            targetX = char.settledPlacement.x * 0.72;
            targetY = char.settledPlacement.y * 0.75;
          } else {
            targetX = char.settledPlacement.x;
            targetY = char.settledPlacement.y;
          }
          targetRotate = char.settledPlacement.rotate;
          targetScale = char.settledPlacement.scale;
        }

        return (
          <motion.div
            key={char.id}
            initial={{
              x: -700 - index * 50,
              y: 0,
              scale: 0.8,
              opacity: 0
            }}
            animate={{
              x: targetX,
              y: targetY,
              rotate: targetRotate,
              scale: targetScale,
              opacity: targetOpacity
            }}
            transition={{
              type: 'spring',
              stiffness: phase === 'walking_in' ? 70 : 120,
              damping: 14,
              delay: phase === 'walking_in' ? index * 0.08 : index * 0.04
            }}
            className="absolute pointer-events-auto cursor-pointer transition-transform hover:scale-110 active:scale-95"
            title={`${char.name} - Boombox Master`}
          >
            <motion.div
              animate={
                phase === 'settled'
                  ? {
                      y: [0, -6, 0],
                      rotate: [targetRotate - 2, targetRotate + 2, targetRotate - 2]
                    }
                  : {}
              }
              transition={{
                duration: 1.8 + (index % 4) * 0.3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <CartoonCharacter
                char={char}
                phase={phase}
                handsUp={phase === 'raising_hands'}
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Floating Bass Equalizer Bars on gathering and raising hands */}
      <AnimatePresence>
        {(phase === 'gathering' || phase === 'raising_hands') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute flex items-center gap-1.5 z-10 bottom-24 bg-purple-950/70 border border-purple-500/40 px-4 py-1.5 rounded-full backdrop-blur-md shadow-xl"
          >
            <span className="text-xs font-bold text-purple-300">🎉 BASS SQUAD PARTY TIME! 🔊</span>
            <div className="flex items-end gap-1 h-4">
              {[4, 12, 8, 16, 6, 14, 10].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, h, 4] }}
                  transition={{ duration: 0.4 + i * 0.1, repeat: Infinity }}
                  className="w-1 bg-gradient-to-t from-pink-500 to-yellow-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
