import { useMemo, useState } from 'react';
import { Play, Search } from 'lucide-react';
import { PROVERBS_QUESTIONS } from '../data/questions';
import { DifficultyTier, ProverbRegion } from '../types/game';
import { AdBannerSlot } from './AdBannerSlot';

interface ProverbsArchiveProps {
  onPlayProverbs: () => void;
}

const DIFFICULTY_LABELS: Record<DifficultyTier, string> = {
  1: 'متداول',
  2: 'أصيل',
  3: 'تراثي نادر',
};

const REGIONS: readonly ('all' | ProverbRegion)[] = [
  'all',
  'بغدادي',
  'جنوبي',
  'موصلي وشمالي',
  'فرات أوسط وغربي',
  'عراقي عام',
];

export function ProverbsArchive({ onPlayProverbs }: ProverbsArchiveProps) {
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | DifficultyTier>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | ProverbRegion>('all');

  const proverbs = useMemo(
    () => PROVERBS_QUESTIONS.filter((q) => Boolean(q.proverbText)),
    []
  );

  const filtered = useMemo(() => {
    const clean = query.trim();
    return proverbs.filter((item) => {
      const matchesTier = tierFilter === 'all' || item.difficulty === tierFilter;
      const matchesRegion =
        regionFilter === 'all' || item.region === regionFilter;
      const matchesQuery =
        !clean ||
        (item.proverbText && item.proverbText.includes(clean)) ||
        item.explanation.includes(clean);
      return matchesTier && matchesRegion && matchesQuery;
    });
  }, [proverbs, query, tierFilter, regionFilter]);

  return (
    <section
      className="max-w-7xl mx-auto px-6 py-10 space-y-8"
      aria-labelledby="archive-heading"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-white/10">
        <div className="max-w-2xl">
          <div className="text-sm text-[#D9A441] flex items-center gap-2 mb-1.5">
            <span>ديوان الحكمة الشعبية</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{proverbs.length} مثلاً عراقياً</span>
          </div>
          <h1
            id="archive-heading"
            className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5EE] [text-wrap:balance]"
          >
            ديوان الأمثال العراقية الشامل
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#F8F5EE]/70 leading-relaxed">
            ابحث في أمثال بغداد والجنوب والموصل والفرات الأوسط مع معانيها ومواضع ضربها، ثم اختبر ذاكرتك مباشرة.
          </p>
        </div>

        <button
          type="button"
          onClick={onPlayProverbs}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          <span>ابدأ تحدي الأمثال الآن</span>
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="h-4 w-4 text-[#F8F5EE]/45 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن مثل أو كلمة أو معنى..."
            className="w-full bg-[#0D1938] border border-white/15 rounded-lg pr-10 pl-4 py-2.5 text-sm text-[#F8F5EE] placeholder:text-[#F8F5EE]/45 focus:outline-none focus:border-[#D9A441]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-1 p-1 bg-[#0D1938] border border-white/10 rounded-lg"
            role="group"
            aria-label="تصفية مستوى الأمثال"
          >
            {(
              [
                { key: 'all', label: 'كل المستويات' },
                { key: 1, label: 'متداول' },
                { key: 2, label: 'أصيل' },
                { key: 3, label: 'تراثي' },
              ] as const
            ).map((tab) => {
              const active = tierFilter === tab.key;
              return (
                <button
                  key={String(tab.key)}
                  type="button"
                  onClick={() => setTierFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#D9A441] text-[#060D1F] font-semibold'
                      : 'text-[#F8F5EE]/70 hover:text-[#F8F5EE]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Region Filter Strip */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="تصفية حسب المنطقة العراقية"
      >
        {REGIONS.map((region) => {
          const active = regionFilter === region;
          return (
            <button
              key={region}
              type="button"
              onClick={() => setRegionFilter(region)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white/15 text-[#F2C96B] font-semibold'
                  : 'text-[#F8F5EE]/65 hover:text-[#F8F5EE] hover:bg-white/5'
              }`}
            >
              {region === 'all' ? 'جميع المحافظات' : region}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="text-xs text-[#F8F5EE]/55 tabular-nums">
        يُعرض {filtered.length} من أصل {proverbs.length} مثلاً عراقياً
      </div>

      {/* Monetizable In-Feed Ad Slot */}
      <AdBannerSlot placement="proverbs" />

      {filtered.length === 0 ? (
        <div className="text-center py-14 border border-white/10 rounded-xl bg-[#0B1530]/60 text-[#F8F5EE]/65 text-sm">
          لم يتم العثور على أمثال مطابقة لعبارة البحث أو التصفية الحالية.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          {filtered.map((item, idx) => (
            <article
              key={item.id}
              className="py-5 border-b border-white/10 flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="text-xs text-[#F8F5EE]/50 flex items-center gap-2 mb-2 tabular-nums">
                  <span>{String(idx + 1).padStart(2, '0')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#D9A441]/90">
                    {DIFFICULTY_LABELS[item.difficulty]}
                  </span>
                  {item.region && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{item.region}</span>
                    </>
                  )}
                </div>
                <h2 className="font-display text-xl font-bold text-[#F8F5EE] leading-snug">
                  «{item.proverbText}»
                </h2>
              </div>
              <p className="text-sm text-[#F8F5EE]/70 leading-relaxed">
                {item.explanation}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
