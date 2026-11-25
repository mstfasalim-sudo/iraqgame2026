import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

/**
 * Geographically accurate SVG path of Iraq's official borders (projected from WGS-84 coordinates):
 * Includes Kurdistan Region (north), Penjwin & Halabja (northeast), Diyala/Wasit/Maysan (east),
 * Basra & Al-Faw Peninsula (southeast), Kuwait/Wadi al-Batin & Muthanna (south),
 * Najaf & Anbar western wedge (west), and Nineveh/Sinjar (northwest).
 */
const IRAQ_BORDER_PATH =
  'M 92.8 24.7 L 98.8 20 L 103.9 18 L 113.2 18.7 L 121.4 20.7 L 130.7 22.4 L 137.9 22.9 L 142.7 23.7 ' +
  'L 145.6 29.3 L 148.2 35.2 L 151.7 40.9 L 156.5 47.1 L 159.6 51.5 L 168.2 58.9 L 174 62.3 L 172.4 71.2 ' +
  'L 165.4 77.9 L 161.2 84.5 L 156.7 92.7 L 158.6 100 L 160.6 107.4 L 165.4 115.6 L 169.5 122.2 L 176.5 128.4 ' +
  'L 185.4 133.8 L 193.6 139.5 L 201.2 146.9 L 203.3 155 L 205.3 163.4 L 203.9 170.8 L 205.3 178.1 L 209.1 187 ' +
  'L 209.7 189.5 L 213.2 192.9 L 217.7 196.9 L 220.8 201.3 L 218.8 202.3 L 214.8 200.8 L 210.1 199.8 L 207.6 198.6 ' +
  'L 202.9 197.6 L 197.1 198.1 L 192.6 202.8 L 186.8 210.9 L 181.2 219 L 179.2 222 L 172.4 220 L 162.7 220 ' +
  'L 150.3 217.6 L 141.4 220.8 L 132.4 213.4 L 117.3 203.5 L 100.8 191.9 L 84.3 180.1 L 67.8 168.3 L 51.3 157.4 ' +
  'L 27.6 146.6 L 23.5 132.6 L 19.2 116.8 L 34.9 107.2 L 50.3 98.3 L 64.3 91.4 L 69.3 77.9 L 69.7 62.3 ' +
  'L 70.5 50 L 80.8 40.2 L 87 32 Z';

// Tigris River (دجلة): Faysh Khabur -> Mosul -> Tikrit -> Baghdad -> Kut -> Amarah -> Qurna -> Basra -> Al-Faw
const TIGRIS_PATH =
  'M 93.2 25.5 Q 104 38 109.5 46 Q 116 68 121 86 Q 127 104 134.2 118.3 Q 150 130 165 138.5 Q 181 146 191.5 155 Q 196 166 197.5 174.9 Q 202 182 206 187.5 L 218.5 200';

// Euphrates River (الفرات): Al-Qaim -> Haditha -> Ramadi -> Fallujah -> Hillah -> Najaf -> Samawah -> Nasiriyah -> Qurna
const EUPHRATES_PATH =
  'M 64.8 91.6 Q 82 94 94 98.5 Q 106 106 113.5 115.2 Q 120 118 124 120 Q 134 131 135.2 141 Q 135 151 144 159 Q 156 168 173 173.8 Q 186 175.5 197.5 174.9';

export function SplashScreen({
  onFinish,
  durationMs = 3000,
}: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeStart = Math.max(0, durationMs - 380);
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, fadeStart);

    const doneTimer = window.setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: fadingOut ? 0 : 1 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      aria-label="شاشة الترحيب بتطبيق المليون العراقي"
      className="fixed inset-0 z-50 bg-[#060D1F] studio-spotlight flex flex-col items-center justify-center px-6 text-center select-none overflow-hidden"
    >
      <div className="relative flex flex-col items-center max-w-md w-full">
        {/* Accurate Map of Iraq with Elegant Glow & Pulse */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-5">
          {/* Soft Breathing Golden Aura */}
          <motion.div
            aria-hidden="true"
            initial={{ scale: 0.85, opacity: 0.2 }}
            animate={{ scale: [0.88, 1.18, 0.88], opacity: [0.22, 0.55, 0.22] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(242,201,107,0.34)_0%,rgba(217,164,65,0.12)_50%,transparent_72%)]"
          />

          {/* Subtle Concentric Halo Ring */}
          <motion.div
            aria-hidden="true"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-5 rounded-full border border-[#D9A441]/25"
          />

          <motion.svg
            viewBox="0 0 240 240"
            className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 drop-shadow-[0_0_26px_rgba(242,201,107,0.52)]"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{
              scale: [0.97, 1.03, 0.97],
              opacity: 1,
            }}
            transition={{
              opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              scale: {
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="iraqGoldGradient"
                x1="15%"
                y1="10%"
                x2="85%"
                y2="92%"
              >
                <stop offset="0%" stopColor="#FFE6A3" />
                <stop offset="48%" stopColor="#D9A441" />
                <stop offset="100%" stopColor="#9A6B19" />
              </linearGradient>

              <linearGradient
                id="iraqRiverStroke"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FFF9E6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#F2C96B" stopOpacity="0.7" />
              </linearGradient>

              <filter id="iraqSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Luminous Outer Border Glow */}
            <path
              d={IRAQ_BORDER_PATH}
              fill="none"
              stroke="#F2C96B"
              strokeOpacity="0.45"
              strokeWidth="6"
              strokeLinejoin="round"
              filter="url(#iraqSoftGlow)"
            />

            {/* Main Accurate Map of Iraq */}
            <path
              d={IRAQ_BORDER_PATH}
              fill="url(#iraqGoldGradient)"
              fillOpacity="0.93"
              stroke="#FFF4CC"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* Animated Golden Contour Shimmer */}
            <motion.path
              d={IRAQ_BORDER_PATH}
              fill="none"
              stroke="#FFFDF2"
              strokeWidth="2.4"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.9 }}
              animate={{ pathLength: 1, opacity: [0.9, 0.55, 0.2] }}
              transition={{ duration: 1.9, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Tigris & Euphrates Rivers (دجلة والفرات) */}
            <motion.path
              d={TIGRIS_PATH}
              fill="none"
              stroke="url(#iraqRiverStroke)"
              strokeWidth="2.2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 1.4, delay: 0.25, ease: 'easeOut' }}
            />
            <motion.path
              d={EUPHRATES_PATH}
              fill="none"
              stroke="url(#iraqRiverStroke)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ duration: 1.4, delay: 0.35, ease: 'easeOut' }}
            />

            {/* Baghdad Heart Beacon */}
            <motion.circle
              cx="134.2"
              cy="118.3"
              r="7.5"
              fill="#FFF9E6"
              initial={{ scale: 0.4, opacity: 0.6 }}
              animate={{ scale: [0.5, 1.5, 0.5], opacity: [0.55, 0, 0.55] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              style={{ transformOrigin: '134.2px 118.3px' }}
            />
            <circle cx="134.2" cy="118.3" r="3.4" fill="#060D1F" />
            <circle cx="134.2" cy="118.3" r="1.8" fill="#FFF9E6" />
          </motion.svg>
        </div>

        {/* App Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl sm:text-5xl font-bold text-[#F2C96B] tracking-normal"
        >
          المليون العراقي
        </motion.h1>

        {/* Short Welcoming Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 text-base sm:text-lg text-[#F8F5EE]/80 font-medium [text-wrap:balance]"
        >
          أهلاً بك في مسابقة الأمثال وتراث العراق
        </motion.p>

        {/* Subtle 3-Second Progress Line */}
        <div className="mt-7 w-40 h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: durationMs / 1000, ease: 'linear' }}
            style={{ transformOrigin: 'right center' }}
            className="h-full w-full bg-[#D9A441] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
