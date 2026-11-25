import type { CSSProperties } from 'react';

interface StudioStageBackdropProps {
  /** Current stage number from 1 to 15 */
  level: number;
  /** True right after revealing a correct answer for a celebratory golden boost */
  celebrating?: boolean;
}

const STUDIO_BG = '/src/assets/images/studio_backdrop_1795522141754.jpg';

interface TierPalette {
  baseBg: string;
  topGlow: string;
  sideGlowLeft: string;
  sideGlowRight: string;
  beamColor: string;
  beamOpacity: number;
  moteCount: number;
  moteColor: string;
  backdropOpacity: string;
}

function getTierPalette(level: number): TierPalette {
  // Stage 15: Grand Millionaire Royal Gold Finale
  if (level >= 15) {
    return {
      baseBg: '#110B04',
      topGlow:
        'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(255, 221, 128, 0.42) 0%, rgba(217, 164, 65, 0.22) 42%, transparent 75%)',
      sideGlowLeft:
        'radial-gradient(circle at 12% 72%, rgba(245, 184, 65, 0.28) 0%, transparent 58%)',
      sideGlowRight:
        'radial-gradient(circle at 88% 68%, rgba(255, 214, 102, 0.28) 0%, transparent 58%)',
      beamColor: 'rgba(255, 224, 138, 0.32)',
      beamOpacity: 0.95,
      moteCount: 16,
      moteColor: '#FFE599',
      backdropOpacity: 'opacity-30',
    };
  }

  // Stages 11-14: Luxury Champagne Gold & Deep Amber
  if (level >= 11) {
    return {
      baseBg: '#0C0D1D',
      topGlow:
        'radial-gradient(ellipse 75% 58% at 50% -4%, rgba(242, 201, 107, 0.32) 0%, rgba(180, 120, 28, 0.16) 45%, transparent 75%)',
      sideGlowLeft:
        'radial-gradient(circle at 15% 75%, rgba(217, 164, 65, 0.22) 0%, transparent 56%)',
      sideGlowRight:
        'radial-gradient(circle at 85% 70%, rgba(16, 185, 129, 0.14) 0%, transparent 56%)',
      beamColor: 'rgba(242, 201, 107, 0.24)',
      beamOpacity: 0.8,
      moteCount: 12,
      moteColor: '#F2C96B',
      backdropOpacity: 'opacity-25',
    };
  }

  // Stages 6-10: Royal Indigo & Warm Golden Highlights
  if (level >= 6) {
    return {
      baseBg: '#080D24',
      topGlow:
        'radial-gradient(ellipse 72% 55% at 50% -5%, rgba(129, 140, 248, 0.24) 0%, rgba(217, 164, 65, 0.16) 44%, transparent 74%)',
      sideGlowLeft:
        'radial-gradient(circle at 14% 78%, rgba(99, 102, 241, 0.20) 0%, transparent 55%)',
      sideGlowRight:
        'radial-gradient(circle at 86% 72%, rgba(217, 164, 65, 0.16) 0%, transparent 55%)',
      beamColor: 'rgba(165, 180, 252, 0.20)',
      beamOpacity: 0.62,
      moteCount: 8,
      moteColor: '#E5C67A',
      backdropOpacity: 'opacity-22',
    };
  }

  // Stages 1-5: Serene Sapphire Midnight Studio
  return {
    baseBg: '#060D1F',
    topGlow:
      'radial-gradient(ellipse 68% 52% at 50% -6%, rgba(56, 189, 248, 0.16) 0%, rgba(30, 64, 175, 0.14) 44%, transparent 72%)',
    sideGlowLeft:
      'radial-gradient(circle at 18% 80%, rgba(37, 99, 235, 0.14) 0%, transparent 55%)',
    sideGlowRight:
      'radial-gradient(circle at 82% 76%, rgba(217, 164, 65, 0.10) 0%, transparent 52%)',
    beamColor: 'rgba(96, 165, 250, 0.14)',
    beamOpacity: 0.42,
    moteCount: 4,
    moteColor: '#93C5FD',
    backdropOpacity: 'opacity-18',
  };
}

// Deterministic floating particle positions so layout never flickers between renders
const MOTE_SEEDS = [
  { left: '8%', top: '78%', size: 4, dur: '6.8s', delay: '0s' },
  { left: '16%', top: '86%', size: 3, dur: '8.1s', delay: '1.2s' },
  { left: '24%', top: '74%', size: 5, dur: '7.4s', delay: '2.6s' },
  { left: '33%', top: '88%', size: 3, dur: '6.5s', delay: '0.7s' },
  { left: '42%', top: '80%', size: 4, dur: '7.9s', delay: '3.1s' },
  { left: '51%', top: '85%', size: 5, dur: '6.2s', delay: '1.8s' },
  { left: '60%', top: '76%', size: 3, dur: '8.4s', delay: '0.4s' },
  { left: '69%', top: '87%', size: 4, dur: '7.1s', delay: '2.2s' },
  { left: '77%', top: '79%', size: 5, dur: '6.9s', delay: '3.5s' },
  { left: '85%', top: '84%', size: 3, dur: '7.6s', delay: '1.1s' },
  { left: '92%', top: '75%', size: 4, dur: '6.4s', delay: '2.9s' },
  { left: '12%', top: '64%', size: 3, dur: '8.6s', delay: '4.0s' },
  { left: '28%', top: '62%', size: 4, dur: '7.2s', delay: '3.8s' },
  { left: '56%', top: '66%', size: 4, dur: '6.6s', delay: '4.4s' },
  { left: '74%', top: '60%', size: 3, dur: '8.0s', delay: '2.0s' },
  { left: '89%', top: '64%', size: 5, dur: '6.1s', delay: '0.9s' },
] as const;

export function StudioStageBackdrop({
  level,
  celebrating = false,
}: StudioStageBackdropProps) {
  const palette = getTierPalette(level);
  const visibleMotes = MOTE_SEEDS.slice(0, palette.moteCount);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: palette.baseBg }}
      aria-hidden="true"
    >
      {/* Subtle Studio Architectural Texture */}
      <img
        src={STUDIO_BG}
        alt=""
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-opacity duration-1000 ${palette.backdropOpacity}`}
      />

      {/* Base Legibility Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060D1F]/70 via-[#060D1F]/82 to-[#060D1F]/95" />

      {/* Breathing Top Crown Spotlight */}
      <div
        className="absolute inset-0 studio-aura-breathe transition-all duration-1000"
        style={{ background: palette.topGlow }}
      />

      {/* Left & Right Ambient Stage Wash */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: palette.sideGlowLeft }}
      />
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: palette.sideGlowRight }}
      />

      {/* Twin Sweeping Broadcast Spotlights */}
      <div
        className="absolute -top-24 left-[18%] w-56 sm:w-72 h-[120vh] studio-beam-left transition-opacity duration-1000"
        style={{
          opacity: palette.beamOpacity,
          background: `linear-gradient(180deg, ${palette.beamColor} 0%, transparent 72%)`,
          clipPath: 'polygon(36% 0%, 64% 0%, 100% 100%, 0% 100%)',
        }}
      />
      <div
        className="absolute -top-24 right-[18%] w-56 sm:w-72 h-[120vh] studio-beam-right transition-opacity duration-1000"
        style={{
          opacity: palette.beamOpacity,
          background: `linear-gradient(180deg, ${palette.beamColor} 0%, transparent 72%)`,
          clipPath: 'polygon(36% 0%, 64% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Rising Luxury Golden Light Motes (Increase as Player Nears 1,000,000) */}
      {visibleMotes.map((mote, i) => (
        <span
          key={i}
          className="absolute rounded-full studio-mote"
          style={
            {
              left: mote.left,
              top: mote.top,
              width: `${mote.size}px`,
              height: `${mote.size}px`,
              backgroundColor: palette.moteColor,
              boxShadow: `0 0 ${mote.size * 3}px ${palette.moteColor}`,
              '--mote-dur': mote.dur,
              '--mote-delay': mote.delay,
            } as CSSProperties
          }
        />
      ))}

      {/* Celebratory Golden Flash Overlay on Correct Answer */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          celebrating ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 75% 60% at 50% 35%, rgba(255, 224, 138, 0.22) 0%, rgba(217, 164, 65, 0.08) 48%, transparent 75%)',
        }}
      />
    </div>
  );
}
