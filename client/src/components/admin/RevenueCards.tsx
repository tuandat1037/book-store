import React from 'react';
import { CalendarDays, CalendarRange, CalendarClock, TrendingUp, TrendingDown, Minus, Wallet } from 'lucide-react';
import { formatVND } from '../../utils/format';

export interface RevenueSummary {
  today: number;
  yesterday: number;
  todayGrowth: number | null;
  thisMonth: number;
  lastMonth: number;
  monthGrowth: number | null;
  thisYear: number;
  lastYear: number;
  yearGrowth: number | null;
  avgPerDayThisMonth: number;
  avgPerDayThisYear: number;
  labels: { today: string; month: string; year: string };
}

/** "2026-09" -> "tháng 09/2026" */
function monthText(key: string) {
  const [y, m] = (key || '').split('-');
  return `tháng ${m}/${y}`;
}

/** "2026-09-16" -> "16/09/2026" */
function dayText(key: string) {
  const [y, m, d] = (key || '').split('-');
  return `${d}/${m}/${y}`;
}

interface Row {
  key: 'today' | 'month' | 'year';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: number;
  previousLabel: string;
  growth: number | null;
  avg?: string;
  accent: string;
  iconBg: string;
}

/**
 * Ba thẻ doanh thu theo ngày / tháng / năm, kèm mức tăng trưởng so với kỳ trước.
 * Kỳ trước không có doanh thu thì hiện "Chưa có dữ liệu so sánh" thay vì bịa %.
 */
export const RevenueCards: React.FC<{ data: RevenueSummary | null }> = ({ data }) => {
  if (!data) return null;

  const rows: Row[] = [
    {
      key: 'today',
      icon: <CalendarDays className="w-4 h-4" />,
      title: 'Doanh Thu Hôm Nay',
      subtitle: `Ngày ${dayText(data.labels.today)}`,
      value: data.today,
      previousLabel: `Hôm qua: ${formatVND(data.yesterday)}`,
      growth: data.todayGrowth,
      accent: 'text-kimdong-red',
      iconBg: 'bg-red-50 text-kimdong-red'
    },
    {
      key: 'month',
      icon: <CalendarRange className="w-4 h-4" />,
      title: 'Doanh Thu Tháng Này',
      subtitle: monthText(data.labels.month),
      value: data.thisMonth,
      previousLabel: `Tháng trước: ${formatVND(data.lastMonth)}`,
      growth: data.monthGrowth,
      avg: `TB ${formatVND(data.avgPerDayThisMonth)}/ngày`,
      accent: 'text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      key: 'year',
      icon: <CalendarClock className="w-4 h-4" />,
      title: 'Doanh Thu Năm Nay',
      subtitle: `Năm ${data.labels.year}`,
      value: data.thisYear,
      previousLabel: `Năm trước: ${formatVND(data.lastYear)}`,
      growth: data.yearGrowth,
      avg: `TB ${formatVND(data.avgPerDayThisYear)}/ngày`,
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600'
    }
  ];

  const Growth: React.FC<{ value: number | null }> = ({ value }) => {
    if (value === null) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400">
          <Minus className="w-3 h-3" />
          Chưa có dữ liệu so sánh
        </span>
      );
    }
    const up = value >= 0;
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {up ? '+' : ''}{value}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {rows.map((r) => (
        <div
          key={r.key}
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">{r.title}</span>
            <p className={`text-lg font-black mt-1 truncate ${r.accent}`}>{formatVND(r.value)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{r.subtitle}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Growth value={r.growth} />
              <span className="text-[10px] text-gray-400">{r.previousLabel}</span>
            </div>
            {r.avg && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-sm mt-1.5">
                <Wallet className="w-3 h-3" />
                {r.avg}
              </span>
            )}
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${r.iconBg}`}>
            {r.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
