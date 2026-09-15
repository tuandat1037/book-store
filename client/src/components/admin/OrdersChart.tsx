import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarRange, CalendarClock, ShoppingBag, TrendingUp, XCircle, Award, BarChart3, Info } from 'lucide-react';
import { formatVND } from '../../utils/format';

export interface ChartPoint {
  period: string;
  label: string;
  orders: number;
  cancelled: number;
  completed: number;
  revenue: number;
}

export interface OrdersChartData {
  daily: ChartPoint[];
  monthly: ChartPoint[];
  yearly: ChartPoint[];
  byStatus: Array<{ status: string; label: string; count: number }>;
  summary: {
    totalOrders30: number;
    totalRevenue30: number;
    cancelled30: number;
    avgOrdersPerDay: number;
    busiestDay: string;
    busiestDayOrders: number;
  };
}

type Mode = 'daily' | 'monthly' | 'yearly';
type Metric = 'orders' | 'revenue';

/** Rút gọn số tiền cho nhãn trục tung: 1.500.000 -> "1,5 tr" */
function compactVND(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')} tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

/** Chọn mốc nhãn trục hoành để không bị chồng chữ khi có 30 cột */
function labelStep(count: number): number {
  if (count <= 12) return 1;
  if (count <= 16) return 2;
  if (count <= 24) return 3;
  return 5;
}

const CHART_HEIGHT = 260;
const PAD = { top: 18, right: 14, bottom: 30, left: 48 };

export const OrdersChart: React.FC<{ data: OrdersChartData | null }> = ({ data }) => {
  const [mode, setMode] = useState<Mode>('daily');
  const [metric, setMetric] = useState<Metric>('revenue');
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);

  // Đo bề rộng thật của khung để vẽ SVG chính xác (không bị méo nét)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || 720);
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo(() => {
    if (!data) return [];
    if (mode === 'daily') return data.daily || [];
    if (mode === 'monthly') return data.monthly || [];
    return data.yearly || [];
  }, [data, mode]);

  const values = useMemo(
    () => points.map((p) => (metric === 'orders' ? Number(p.orders || 0) : Number(p.revenue || 0))),
    [points, metric]
  );

  const rawMax = Math.max(...values, 0);
  // Làm tròn trục tung lên mốc đẹp để nhãn dễ đọc
  const maxValue = useMemo(() => {
    if (rawMax <= 0) return metric === 'orders' ? 4 : 100000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const step = magnitude / 2;
    return Math.ceil(rawMax / step) * step;
  }, [rawMax, metric]);

  const innerW = Math.max(width - PAD.left - PAD.right, 10);
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(points.length, 1);
  const barW = Math.max(Math.min(slot * 0.62, 40), 2);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const step = labelStep(points.length);
  const hoveredPoint = hover !== null ? points[hover] : null;

  const fmtValue = (v: number) => (metric === 'orders' ? `${v} đơn` : formatVND(v));

  const totals = useMemo(() => {
    const totalOrders = points.reduce((s, p) => s + Number(p.orders || 0), 0);
    const totalRevenue = points.reduce((s, p) => s + Number(p.revenue || 0), 0);
    const totalCancelled = points.reduce((s, p) => s + Number(p.cancelled || 0), 0);
    const best = points.reduce<ChartPoint | null>(
      (acc, p) => (!acc || Number(p.orders) > Number(acc.orders) ? p : acc),
      null
    );
    return { totalOrders, totalRevenue, totalCancelled, best };
  }, [points]);

  const MODE_META: Record<Mode, { unit: string; range: string; best: string; prefix: string }> = {
    daily: { unit: 'ngày', range: '30 ngày gần nhất', best: 'Ngày cao nhất', prefix: 'Ngày' },
    monthly: { unit: 'tháng', range: '12 tháng gần nhất', best: 'Tháng cao nhất', prefix: 'Tháng' },
    yearly: { unit: 'năm', range: '5 năm gần nhất', best: 'Năm cao nhất', prefix: 'Năm' }
  };
  const meta = MODE_META[mode];
  const modeLabel = meta.unit;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-kimdong-red" />
          <div>
            <h2 className="text-sm font-extrabold uppercase text-gray-800">Biểu Đồ Doanh Thu</h2>
            <p className="text-[11px] text-gray-400">
              {meta.range} · theo {modeLabel} đặt hàng
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chọn ngày / tháng */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => { setMode('daily'); setHover(null); }}
              className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                mode === 'daily' ? 'bg-white text-kimdong-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Theo ngày</span>
            </button>
            <button
              onClick={() => { setMode('monthly'); setHover(null); }}
              className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                mode === 'monthly' ? 'bg-white text-kimdong-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Theo tháng</span>
            </button>
            <button
              onClick={() => { setMode('yearly'); setHover(null); }}
              className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                mode === 'yearly' ? 'bg-white text-kimdong-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Theo năm</span>
            </button>
          </div>

          {/* Chọn chỉ số */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => { setMetric('orders'); setHover(null); }}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                metric === 'orders' ? 'bg-white text-kimdong-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Số đơn
            </button>
            <button
              onClick={() => { setMetric('revenue'); setHover(null); }}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                metric === 'revenue' ? 'bg-white text-kimdong-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Doanh thu
            </button>
          </div>
        </div>
      </div>

      {/* Số liệu tổng hợp của kỳ đang xem */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng đơn ({modeLabel})</p>
            <p className="text-base font-black text-gray-900">{totals.totalOrders}</p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Doanh thu</p>
            <p className="text-base font-black text-gray-900 truncate">{formatVND(totals.totalRevenue)}</p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-kimdong-red flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Đơn đã hủy</p>
            <p className="text-base font-black text-gray-900">{totals.totalCancelled}</p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              {meta.best}
            </p>
            <p className="text-base font-black text-gray-900 truncate">
              {totals.best && Number(totals.best.orders) > 0 ? `${totals.best.label} · ${totals.best.orders} đơn` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Vùng biểu đồ */}
      <div className="p-4">
        {points.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center gap-1 text-gray-300">
            <BarChart3 className="w-8 h-8" />
            <p className="text-xs text-gray-400">Chưa có dữ liệu đơn hàng</p>
          </div>
        ) : (
          <div ref={wrapRef} className="relative select-none">
            <svg width={width} height={CHART_HEIGHT} className="overflow-visible">
              {/* Lưới ngang + nhãn trục tung */}
              {gridLines.map((g) => {
                const y = PAD.top + innerH - g * innerH;
                const val = maxValue * g;
                return (
                  <g key={g}>
                    <line
                      x1={PAD.left}
                      x2={PAD.left + innerW}
                      y1={y}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth={1}
                    />
                    <text
                      x={PAD.left - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-gray-400"
                      style={{ fontSize: 10, fontWeight: 600 }}
                    >
                      {metric === 'orders' ? Math.round(val) : compactVND(val)}
                    </text>
                  </g>
                );
              })}

              {/* Cột */}
              {points.map((p, i) => {
                const value = values[i];
                const ratio = maxValue > 0 ? value / maxValue : 0;
                const h = Math.max(ratio * innerH, value > 0 ? 3 : 0);
                const x = PAD.left + slot * i + (slot - barW) / 2;
                const y = PAD.top + innerH - h;
                const isHover = hover === i;
                const cancelled = Number(p.cancelled || 0);

                return (
                  <g key={p.period}>
                    {/* Vùng bắt sự kiện rộng hơn cột để dễ rê chuột */}
                    <rect
                      x={PAD.left + slot * i}
                      y={PAD.top}
                      width={slot}
                      height={innerH}
                      fill="transparent"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      style={{ cursor: 'pointer' }}
                    />
                    {value > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        rx={3}
                        fill={isHover ? '#b91c1c' : 'url(#barGradient)'}
                        className="transition-all duration-200"
                        pointerEvents="none"
                      />
                    )}
                    {/* Vạch đỏ nhỏ đánh dấu đơn bị hủy trong kỳ */}
                    {cancelled > 0 && (
                      <rect
                        x={x}
                        y={PAD.top + innerH - 3}
                        width={barW}
                        height={3}
                        rx={1.5}
                        fill="#f87171"
                        pointerEvents="none"
                      />
                    )}
                    {/* Nhãn trục hoành, thưa dần cho khỏi chồng chữ */}
                    {(i % step === 0 || i === points.length - 1) && (
                      <text
                        x={PAD.left + slot * i + slot / 2}
                        y={PAD.top + innerH + 16}
                        textAnchor="middle"
                        className={isHover ? 'fill-kimdong-red' : 'fill-gray-400'}
                        style={{ fontSize: 10, fontWeight: isHover ? 800 : 600 }}
                      >
                        {p.label}
                      </text>
                    )}
                  </g>
                );
              })}

              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
              </defs>
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute z-10 pointer-events-none bg-gray-900 text-white rounded-lg shadow-lg px-3 py-2 text-[11px] whitespace-nowrap"
                style={{
                  left: Math.min(Math.max(PAD.left + slot * (hover as number) + slot / 2, 70), Math.max(width - 70, 70)),
                  top: 4,
                  transform: 'translateX(-50%)'
                }}
              >
                <p className="font-extrabold text-white">
                  {meta.prefix} {hoveredPoint.label}
                </p>
                <p className="text-gray-300">
                  Số đơn: <strong className="text-white">{hoveredPoint.orders}</strong>
                  {Number(hoveredPoint.cancelled) > 0 && (
                    <span className="text-red-300"> ({hoveredPoint.cancelled} đã hủy)</span>
                  )}
                </p>
                <p className="text-gray-300">
                  Doanh thu: <strong className="text-white">{formatVND(hoveredPoint.revenue)}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chú thích */}
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-gradient-to-b from-red-600 to-rose-400" />
            {metric === 'orders' ? 'Số đơn hàng' : 'Doanh thu'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-red-400" />
            Có đơn bị hủy
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <Info className="w-3 h-3" />
            Doanh thu không tính đơn đã hủy
          </span>
        </div>
      </div>

      {/* Phân bố theo trạng thái */}
      {data && data.byStatus.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-[11px] font-extrabold text-gray-700 uppercase mb-2">Đơn hàng theo trạng thái</p>
          <div className="flex flex-wrap gap-2">
            {data.byStatus.map((s) => (
              <span
                key={s.status}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg"
              >
                {s.label}
                <strong className="text-gray-900">{s.count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
