import React from 'react';
import { motion } from 'motion/react';
import { Code2, Download, Globe, Rocket, X } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
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
        className="cartoon-outline-lg rounded-3xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#18121E] dark:text-[#F8FAFC] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-[#FEF3C7] dark:bg-[#05070B] border-b-[3px] border-[#18121E] dark:border-[#94A3B8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#10B981] border-[2.5px] border-[#18121E] flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl leading-none text-[#18121E] dark:text-[#FDE047]">
                EXPORTAR E PUBLICAR SITE
              </h2>
              <p className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] mt-0.5">
                Baixe o site pronto para publicar online ou o código-fonte completo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ui-sys-btn w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Option 1: Ready-to-publish static website */}
          <div className="cartoon-outline rounded-2xl bg-[#ECFDF5] dark:bg-[#064E3B]/35 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10B981] border-2 border-[#18121E] flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-display text-base text-[#18121E] dark:text-[#FDE047]">
                    1. Site Pronto para Publicar (.ZIP)
                  </div>
                  <p className="text-xs text-[#334155] dark:text-[#E2E8F0] leading-snug mt-0.5">
                    Contém o jogo completo já compilado (<span className="font-mono-nums font-bold">index.html</span> + scripts + artes) pronto para colocar em qualquer hospedagem gratuita (Netlify Drop, GitHub Pages, Vercel ou XAMPP).
                  </p>
                </div>
              </div>
            </div>

            <a
              href="/api/export/site.zip"
              download="super-carrollo-site.zip"
              className="cartoon-btn w-full py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-display text-sm tracking-wide flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>BAIXAR SITE PRONTO (.ZIP)</span>
            </a>
          </div>

          {/* Option 2: Full source code */}
          <div className="cartoon-outline rounded-2xl bg-[#EFF6FF] dark:bg-[#0F172A] p-4 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8] border-2 border-[#18121E] flex items-center justify-center shrink-0 mt-0.5">
                <Code2 className="w-5 h-5 text-[#18121E]" />
              </div>
              <div>
                <div className="font-display text-base text-[#18121E] dark:text-[#38BDF8]">
                  2. Código-Fonte Completo (.ZIP)
                </div>
                <p className="text-xs text-[#334155] dark:text-[#E2E8F0] leading-snug mt-0.5">
                  Todos os arquivos do projeto (<span className="font-mono-nums font-bold">src/</span>, <span className="font-mono-nums font-bold">index.html</span>, <span className="font-mono-nums font-bold">server.ts</span>, <span className="font-mono-nums font-bold">package.json</span>) + instruções para abrir no VS Code, rodar localmente ou entregar ao professor.
                </p>
              </div>
            </div>

            <a
              href="/api/export/source.zip"
              download="super-carrollo-codigo.zip"
              className="cartoon-btn w-full py-2.5 px-4 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#18121E] font-display text-sm tracking-wide flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>BAIXAR CÓDIGO-FONTE (.ZIP)</span>
            </a>
          </div>

          {/* Quick Publishing Guide */}
          <div className="cartoon-outline rounded-2xl bg-[#FEF3C7]/85 dark:bg-[#1E293B] p-3.5 space-y-1.5">
            <div className="font-display text-sm text-[#18121E] dark:text-[#FDE047]">
              Como publicar em 1 minuto (grátis):
            </div>
            <ol className="text-xs text-[#334155] dark:text-[#E2E8F0] space-y-1 list-decimal list-inside leading-relaxed">
              <li>
                Clique em <strong>Baixar Site Pronto (.ZIP)</strong> acima e extraia a pasta no seu computador.
              </li>
              <li>
                Acesse <strong>app.netlify.com/drop</strong> (ou crie um repositório no <strong>GitHub Pages</strong>).
              </li>
              <li>
                Arraste a pasta extraída <span className="font-mono-nums font-bold">super-carrollo-site</span> para o navegador — o site gera um link público na hora para enviar ao seu professor!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#FEF3C7] dark:bg-[#05070B] border-t-[3px] border-[#18121E] dark:border-[#94A3B8]">
          <button
            type="button"
            onClick={onClose}
            className="cartoon-btn w-full py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-display text-base tracking-wide"
          >
            FECHAR
          </button>
        </div>
      </motion.div>
    </div>
  );
};
