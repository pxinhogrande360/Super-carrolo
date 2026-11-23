import React, { useEffect, useMemo } from 'react';
import { Newspaper, X, Sparkles, TrendingUp, MapPin } from 'lucide-react';
import { generateCityNewspaper } from '../data/newspaperData';
import { SaveData } from '../types/game';

interface CityNewspaperTickerProps {
  save: SaveData;
  onOpen: () => void;
}

export const CityNewspaperTicker: React.FC<CityNewspaperTickerProps> = ({
  save,
  onOpen,
}) => {
  const edition = useMemo(() => generateCityNewspaper(save), [save]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full max-w-2xl cartoon-outline rounded-xl bg-[#F6EBD2]/95 dark:bg-[#0B1120]/95 hover:bg-[#FDE68A] dark:hover:bg-[#162033] text-[#111827] dark:text-[#F8FAFC] px-3 py-1.5 flex items-center justify-between gap-2.5 text-left transition-colors"
      title="Clique para abrir a edição completa do Jornal da Cidade"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111827] dark:bg-[#FDE047] text-[#FDE68A] dark:text-[#111827] font-display text-[10px] tracking-wider shrink-0">
          <Newspaper className="w-3 h-3" />
          <span>{edition.shortBannerTag}</span>
        </span>
        <span className="font-mono-nums text-[10px] font-extrabold text-[#7C2D12] dark:text-[#94A3B8] shrink-0 hidden sm:inline">
          ED.{edition.editionNumber}
        </span>
        <span className="text-xs font-bold truncate group-hover:underline decoration-2">
          {edition.shortBannerHeadline}
        </span>
      </div>

      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-[#EF4444] text-white border border-[#111827] shrink-0 whitespace-nowrap">
        Ler Jornal
      </span>
    </button>
  );
};

interface CityNewspaperModalProps {
  save: SaveData;
  onClose: () => void;
}

export const CityNewspaperModal: React.FC<CityNewspaperModalProps> = ({
  save,
  onClose,
}) => {
  const edition = useMemo(() => generateCityNewspaper(save), [save]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 dark:bg-black/85 flex items-center justify-center p-3 sm:p-5">
      <div className="cartoon-outline-lg rounded-2xl bg-[#F4E8CD] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Retro Broadsheet Masthead */}
        <div className="border-b-[3px] border-[#111827] dark:border-[#94A3B8] bg-[#EAD9B5] dark:bg-[#0F172A] px-4 sm:px-6 pt-3 pb-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#111827] dark:bg-[#FDE047] text-[#FDE68A] dark:text-[#111827] border-2 border-[#111827] flex items-center justify-center shrink-0">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#7C2D12] dark:text-[#FDE047]">
                  Jornal da Cidade · Edição Retrô
                </div>
                <h2 className="font-display text-2xl sm:text-3xl leading-none tracking-wide text-[#111827] dark:text-[#F8FAFC]">
                  O CORREIO DE CARROLLO
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="cartoon-btn w-9 h-9 rounded-xl bg-[#FFF8EB] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] flex items-center justify-center shrink-0"
              aria-label="Fechar jornal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 pt-1.5 border-t-2 border-b border-[#111827]/40 dark:border-[#334155] flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-[#334155] dark:text-[#CBD5E1]">
            <span className="font-mono-nums">{edition.dateLabel}</span>
            <span>Preço: 1 Rolha Usada · Tiragem Livre</span>
            <span>Níveis Concluídos: {save.completedLevels.length}/30</span>
          </div>
        </div>

        {/* Scrollable Newsprint Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Lead Breaking News Feature */}
          <article className="rounded-xl border-[2.5px] border-[#111827] dark:border-[#FDE047] bg-[#FFF8EB] dark:bg-[#111B33] p-4 shadow-[0_3px_0_#111827] dark:shadow-[0_3px_0_#000000]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white font-display text-[11px] tracking-wider border border-[#111827]">
                {edition.leadStory.kicker}
              </span>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {edition.leadStory.biomeLabel}
                </span>
                <span>·</span>
                <span className="font-mono-nums">{edition.leadStory.timeAgo}</span>
              </div>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl leading-[1.05] text-[#111827] dark:text-[#FDE047] mt-1">
              {edition.leadStory.headline}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-[#475569] dark:text-[#E2E8F0] mt-1.5 leading-snug">
              {edition.leadStory.subhead}
            </p>
            <div className="my-2.5 border-t border-dashed border-[#111827]/35 dark:border-[#334155]" />
            <p className="text-xs sm:text-[13px] text-[#1E293B] dark:text-[#CBD5E1] leading-relaxed">
              {edition.leadStory.body}
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[#7C2D12] dark:text-[#38BDF8]">
              <span>{edition.leadStory.byline}</span>
              {edition.leadStory.badge && (
                <span className="px-2 py-0.5 rounded bg-[#FDE68A] dark:bg-[#1E293B] text-[#111827] dark:text-[#FDE047] border border-[#111827] dark:border-[#94A3B8]">
                  {edition.leadStory.badge}
                </span>
              )}
            </div>
          </article>

          {/* Retro Market Ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {edition.marketQuotes.map((q) => (
              <div
                key={q.label}
                className="rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] bg-[#EAD9B5]/80 dark:bg-[#0F172A] px-3 py-2 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                    {q.label}
                  </div>
                  <div className="font-mono-nums font-extrabold text-sm text-[#111827] dark:text-[#F8FAFC]">
                    {q.value}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#059669] dark:text-[#34D399]">
                  <TrendingUp className="w-3 h-3" />
                  {q.trend}
                </span>
              </div>
            ))}
          </div>

          {/* 2-Column Secondary Clippings */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#7C2D12] dark:text-[#FDE047]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Últimas Crônicas & Fofocas da Praça</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {edition.secondaryStories.map((story) => (
                <article
                  key={story.id}
                  className="rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] bg-[#FFF8EB]/90 dark:bg-[#0F172A] p-3 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold uppercase tracking-wider text-[#B45309] dark:text-[#38BDF8]">
                      <span>{story.kicker}</span>
                      <span className="font-mono-nums text-[#64748B] dark:text-[#94A3B8]">
                        {story.timeAgo}
                      </span>
                    </div>
                    <h4 className="font-display text-base leading-tight mt-1 text-[#111827] dark:text-[#F8FAFC]">
                      {story.headline}
                    </h4>
                    <p className="text-[11px] text-[#334155] dark:text-[#CBD5E1] mt-1 leading-snug">
                      {story.body}
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-dashed border-[#111827]/25 dark:border-[#334155] flex items-center justify-between text-[9px] font-bold text-[#64748B] dark:text-[#94A3B8]">
                    <span>{story.byline}</span>
                    <span>{story.biomeLabel}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
