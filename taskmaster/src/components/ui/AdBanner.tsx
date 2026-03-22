import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type AdFormat = 'auto' | 'horizontal' | 'rectangle' | 'vertical';

interface AdBannerProps {
  slot: string;
  format?: AdFormat;
  className?: string;
}

/**
 * Google AdSense banner.
 * Set VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX in your .env file.
 * Each instance needs a unique `slot` ID from your AdSense dashboard.
 */
export default function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;

  useEffect(() => {
    if (!clientId || pushed.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet — safe to ignore
    }
  }, [clientId]);

  // No client ID configured — show placeholder in dev
  if (!clientId) {
    if (import.meta.env.DEV) {
      return (
        <div
          className={`flex items-center justify-center bg-slate-100 border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs select-none ${className}`}
          style={{ minHeight: 90 }}
        >
          <span>📢 Espacio publicitario — configura <code className="bg-slate-200 px-1 rounded">VITE_ADSENSE_CLIENT</code></span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
