import { useEffect } from 'react';

type Props = {
  message: string;
  variant?: 'success' | 'error';
  durationMs?: number;
  onDismiss: () => void;
};

export default function Toast({
  message,
  variant = 'success',
  durationMs = 2000,
  onDismiss,
}: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[120] pointer-events-none">
      <div
        className={`px-5 py-3 rounded-xl shadow-lg font-semibold text-sm text-white flex items-center gap-2 ${
          variant === 'error' ? 'bg-[#ef4444]' : 'bg-[#2d5a27]'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {variant === 'error' ? 'error' : 'check_circle'}
        </span>
        {message}
      </div>
    </div>
  );
}
