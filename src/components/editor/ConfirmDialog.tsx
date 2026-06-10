type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  showClose?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  confirmVariant = 'primary',
  showClose = true,
  onConfirm,
  onCancel,
  onClose,
}: Props) {
  const handleClose = onClose ?? onCancel;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#0b1c30]/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col mx-4">
        <div className="p-6 border-b border-[#c2c9bb] flex justify-between items-start gap-4">
          <h2 className="font-['Hanken_Grotesk'] font-semibold text-lg text-[#0b1c30]">
            {title}
          </h2>
          {showClose && (
            <button
              onClick={handleClose}
              className="text-[#72796e] hover:text-[#0b1c30] transition-colors shrink-0 -mt-1 -mr-1"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          )}
        </div>

        <p className="px-6 py-4 text-sm text-[#42493e] leading-relaxed">{message}</p>

        <div className="p-4 bg-[#eff4ff] flex justify-end gap-2 border-t border-[#c2c9bb]">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-semibold text-sm text-[#42493e] hover:bg-[#e5eeff] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors active:scale-95 ${
              confirmVariant === 'danger'
                ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                : 'bg-[#f57c00] text-white hover:bg-[#e65100]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
