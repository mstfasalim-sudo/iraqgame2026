import {
  Coffee,
  Crown,
  Landmark,
  Shield,
  TreePalm,
  Waves,
} from 'lucide-react';
import { AvatarEmblemId } from '../types/game';

interface EmblemBadgeProps {
  emblem: AvatarEmblemId;
  size?: 'sm' | 'md' | 'lg';
}

export function EmblemBadge({ emblem, size = 'md' }: EmblemBadgeProps) {
  const containerSize =
    size === 'sm'
      ? 'w-9 h-9 rounded-lg'
      : size === 'lg'
        ? 'w-14 h-14 rounded-xl'
        : 'w-11 h-11 rounded-xl';

  const iconSize =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';

  const renderIcon = () => {
    switch (emblem) {
      case 'palm':
        return <TreePalm className={iconSize} aria-hidden="true" />;
      case 'ziggurat':
        return <Landmark className={iconSize} aria-hidden="true" />;
      case 'ishtar':
        return <Shield className={iconSize} aria-hidden="true" />;
      case 'dallah':
        return <Coffee className={iconSize} aria-hidden="true" />;
      case 'tigris':
        return <Waves className={iconSize} aria-hidden="true" />;
      case 'lion':
        return <Crown className={iconSize} aria-hidden="true" />;
    }
  };

  return (
    <div
      className={`${containerSize} bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#F2C96B] flex items-center justify-center shrink-0`}
    >
      {renderIcon()}
    </div>
  );
}
