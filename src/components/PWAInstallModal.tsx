import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_ea7312de.png"
              alt="School of Cricket Academy (SCA)"
              className="w-12 h-12 rounded-full object-cover shadow-xs border border-amber-400/60 bg-white shrink-0"
            />
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">School of Cricket Academy</h3>
              <p className="text-xs text-slate-500">SCA Gummudipoondi • Android &amp; iPhone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          {isInstalled ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
              <span>SCA Cricket Academy is already installed on your device!</span>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                To install on your <strong className="text-slate-900">iPhone or iPad</strong> Safari:
              </p>
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">1. Tap the Share button</span>
                    <p className="text-slate-500">At the bottom bar of Safari</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">2. Select &quot;Add to Home Screen&quot;</span>
                    <p className="text-slate-500">Scroll down the share sheet and tap</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">3. Tap &quot;Add&quot;</span>
                    <p className="text-slate-500">Launch fullscreen with instant offline assets</p>
                  </div>
                </div>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Install as a standalone app on your Android device for instant coaching access, high performance, and full screen experience.
              </p>
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-sm shadow-xs transition min-h-[44px]"
              >
                <Download className="w-4 h-4 text-amber-400" />
                {installing ? 'Installing...' : 'Install Now to Home Screen'}
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Add this application to your phone home screen using your browser&apos;s menu:
              </p>
              <p className="text-slate-500">
                • Chrome (Android): Tap the three-dot menu (⋮) and select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[44px]"
        >
          Done
        </button>
      </div>
    </div>
  );
};
