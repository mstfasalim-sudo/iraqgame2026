import { useState } from 'react';
import { Landmark } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackLabel,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#101D3D] via-[#0A142E] to-[#060D1F] text-[#D9A441]/70 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Landmark className="h-10 w-10 mb-2 opacity-70" aria-hidden="true" />
        {fallbackLabel && (
          <span className="text-sm font-medium text-[#F8F5EE]/70 px-4 text-center">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
