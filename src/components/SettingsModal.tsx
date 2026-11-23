import React from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Gamepad2,
  Hand,
  Layers,
  Moon,
  Music,
  RotateCcw,
  Rocket,
  Settings,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ControlMode, SaveData, ThemeMode } from '../types/game';

interface SettingsModalProps {
  save: SaveData;
  musicOn: boolean;
  onChangeTheme: (mode: ThemeMode) => void;
  onChangeControlMode: (mode: ControlMode) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onResetTutorial?: () => void;
  onOpenExport?: () => void;
  onClose: () => void;
}

const CONTROL_OPTIONS: {
  id: ControlMode;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'buttons',
    label: 'Botões',
    desc: 'Comandos apenas nos botões da barra inferior.',
    icon: <Gamepad2 className="w-4 h-4" />,
  },
  {
    id: 'gestures',
    label: 'Gestos',
    desc: 'Segure/deslize para cima na arena para girar e toque para atacar.',
    icon: <Hand className="w-4 h-4" />,
  },
  {
    id: 'both',
    label: 'Ambos',
    desc: 'Botões e gestos na arena funcionam juntos.',
    icon: <Layers className="w-4 h-4" />,
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  save,
  musicOn,
  onChangeTheme,
  onChangeControlMode,
  onToggleMute,
  onToggleMusic,
  onResetTutorial,
  onOpenExport,
  onClose,
}) => {
  const isDarkContrast = save.themeMode === 'dark_contrast';
  const activeControl = save.controlMode || 'both';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 dark:bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="cartoon-outline-lg rounded-3xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#18121E] dark:text-[#F8FAFC] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#FEF3C7] dark:bg-[#05070B] border-b-[3px] border-[#18121E] dark:border-[#94A3B8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FBBF24] dark:bg-[#FDE047] border-[2.5px] border-[#18121E] flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-[#18121E]" />
            </div>
            <div>
              <h2 className="font-display text-xl leading-none text-[#18121E] dark:text-[#FDE047]">
                CONFIGURAÇÕES
              </h2>
              <p className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] mt-0.5">
                Controles, tema visual e áudio da arena
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ui-sys-btn w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            aria-label="Fechar configurações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Control Type Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm text-[#18121E] dark:text-[#FDE047]">
                Tipo de Controle
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border-2 border-[#18121E] bg-[#FBBF24] text-[#18121E]">
                {activeControl === 'buttons'
                  ? 'Botões'
                  : activeControl === 'gestures'
                  ? 'Gestos'
                  : 'Botões + Gestos'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {CONTROL_OPTIONS.map((opt) => {
                const selected = activeControl === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeControlMode(opt.id)}
                    className={`cartoon-btn rounded-xl px-3 py-2.5 text-left flex flex-col justify-between gap-1.5 ${
                      selected
                        ? 'bg-[#38BDF8] text-[#18121E]'
                        : 'bg-[#FFF8EB] dark:bg-[#0F172A] text-[#18121E] dark:text-[#F8FAFC] hover:bg-[#FEF3C7] dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="w-7 h-7 rounded-lg bg-[#FFF8EB] border-2 border-[#18121E] text-[#18121E] flex items-center justify-center shrink-0">
                        {opt.icon}
                      </span>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-[#10B981] border-2 border-[#18121E] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-display text-sm leading-tight uppercase">
                        {opt.label}
                      </div>
                      <p className="text-[10px] leading-snug font-semibold opacity-85 mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Mode Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm text-[#18121E] dark:text-[#FDE047]">
                Tema de Exibição
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E2E8F0] dark:bg-[#1E293B] text-[#334155] dark:text-[#38BDF8]">
                {isDarkContrast ? 'Alto Contraste Ativo' : 'Padrão Clássico'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChangeTheme('default')}
                className={`cartoon-btn rounded-2xl p-3 text-left transition-colors ${
                  !isDarkContrast
                    ? 'bg-[#FEF3C7] dark:bg-[#1E293B] ring-3 ring-[#F59E0B]'
                    : 'bg-[#FFF8EB] dark:bg-[#0F172A] hover:bg-[#FEF3C7]/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FBBF24] border-2 border-[#18121E] flex items-center justify-center">
                    <Sun className="w-4 h-4 text-[#18121E]" />
                  </div>
                  {!isDarkContrast && (
                    <span className="w-6 h-6 rounded-full bg-[#10B981] border-2 border-[#18121E] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="mt-2 font-display text-sm text-[#18121E] dark:text-[#F8FAFC]">
                  Tema Padrão
                </div>
                <p className="text-[11px] text-[#475569] dark:text-[#CBD5E1] mt-0.5 leading-snug">
                  Papel claro, cores quentes e contorno INK vibrante.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onChangeTheme('dark_contrast')}
                className={`cartoon-btn rounded-2xl p-3 text-left transition-colors ${
                  isDarkContrast
                    ? 'bg-[#0F172A] text-[#F8FAFC] ring-3 ring-[#38BDF8]'
                    : 'bg-[#18121E] text-[#F8FAFC] hover:bg-[#271F30]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#38BDF8] border-2 border-[#18121E] flex items-center justify-center">
                    <Moon className="w-4 h-4 text-[#18121E]" />
                  </div>
                  {isDarkContrast && (
                    <span className="w-6 h-6 rounded-full bg-[#10B981] border-2 border-[#05070B] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="mt-2 font-display text-sm text-[#FDE047]">
                  Dark Mode · Alto Contraste
                </div>
                <p className="text-[11px] text-[#E2E8F0] mt-0.5 leading-snug">
                  Fundo escuro com texto nítido para ambientes de pouca luz.
                </p>
              </button>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="space-y-2">
            <span className="font-display text-sm text-[#18121E] dark:text-[#FDE047]">
              Áudio da Arena
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onToggleMute}
                className="ui-sys-btn rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-xs font-bold">
                  {save.muted ? (
                    <VolumeX className="w-4 h-4 text-[#EF4444]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#10B981]" />
                  )}
                  <span>Efeitos Sonoros</span>
                </span>
                <span
                  className={`font-mono-nums text-[10px] font-extrabold px-2 py-0.5 rounded-md border-2 border-[#18121E] ${
                    save.muted
                      ? 'bg-[#EF4444] text-white'
                      : 'bg-[#10B981] text-white'
                  }`}
                >
                  {save.muted ? 'DESL.' : 'LIGADA'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleMusic}
                className="ui-sys-btn rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-xs font-bold">
                  <Music
                    className={`w-4 h-4 ${
                      musicOn && !save.muted ? 'text-[#0284C7] dark:text-[#38BDF8]' : 'text-[#94A3B8]'
                    }`}
                  />
                  <span>Música da Arena</span>
                </span>
                <span
                  className={`font-mono-nums text-[10px] font-extrabold px-2 py-0.5 rounded-md border-2 border-[#18121E] ${
                    musicOn && !save.muted
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#CBD5E1] text-[#18121E]'
                  }`}
                >
                  {musicOn ? 'LIGADA' : 'DESL.'}
                </span>
              </button>
            </div>
          </div>

          {/* Tutorial Reset */}
          {onResetTutorial && (
            <div className="cartoon-outline rounded-2xl bg-[#FEF3C7]/80 dark:bg-[#0F172A] p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-sm text-[#18121E] dark:text-[#F8FAFC]">
                  Tutorial do Primeiro Duelo
                </div>
                <p className="text-[11px] text-[#475569] dark:text-[#CBD5E1]">
                  {save.tutorialCompleted
                    ? 'Já concluído. Reative para rever na fase 1-1.'
                    : 'Ativo automaticamente no próximo duelo da fase 1-1.'}
                </p>
              </div>
              <button
                type="button"
                disabled={!save.tutorialCompleted}
                onClick={onResetTutorial}
                className={`cartoon-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                  save.tutorialCompleted
                    ? 'bg-[#38BDF8] text-[#18121E] hover:bg-[#0EA5E9]'
                    : 'bg-[#E2E8F0] dark:bg-[#1E293B] text-[#64748B] cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{save.tutorialCompleted ? 'Reativar' : 'Ativo'}</span>
              </button>
            </div>
          )}

          {onOpenExport && (
            <div className="cartoon-outline rounded-2xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#10B981] border-2 border-[#18121E] flex items-center justify-center shrink-0">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm text-[#18121E] dark:text-[#F8FAFC]">
                    Exportar Site &amp; Código (.ZIP)
                  </div>
                  <p className="text-[11px] text-[#334155] dark:text-[#CBD5E1]">
                    Baixe o site pronto para publicar ou o código-fonte completo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExport();
                }}
                className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shrink-0"
              >
                Abrir
              </button>
            </div>
          )}
        </div>

        {/* Footer CTA matching Visual UI System RED action button */}
        <div className="px-5 py-3 bg-[#FEF3C7] dark:bg-[#05070B] border-t-[3px] border-[#18121E] dark:border-[#94A3B8]">
          <button
            type="button"
            onClick={onClose}
            className="cartoon-btn w-full py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-display text-base tracking-wide"
          >
            GUARDAR ALTERAÇÕES
          </button>
        </div>
      </motion.div>
    </div>
  );
};
