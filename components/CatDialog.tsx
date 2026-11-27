'use client';

import React from 'react';

interface CatDialogProps {
  open: boolean;
  title?: string;
  message: string;
  mode?: 'alert' | 'confirm';
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CatDialog({
  open,
  title = 'Mèo Cưng thông báo',
  message,
  mode = 'alert',
  confirmLabel = mode === 'confirm' ? 'Xác nhận' : 'Đã hiểu',
  cancelLabel = 'Hủy',
  loading = false,
  onConfirm,
  onClose,
}: CatDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-orange-100 p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff8f70] to-[#ff6b45] flex items-center justify-center shadow-md shadow-orange-200/80">
          <span className="text-3xl leading-none select-none" role="img" aria-label="Mèo Cưng">
            🐱
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-[#ff7f5c]">{title}</h3>
          <p className="text-sm font-medium text-[#e86843] leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          {mode === 'confirm' && (
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-[#ff7f5c] text-xs font-bold transition disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] text-white text-xs font-bold shadow-sm shadow-orange-200 transition disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
