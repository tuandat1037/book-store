import { describe, it, expect } from 'vitest';
import { formatVND, formatDate, calculateDiscountPercent } from '../utils/format.js';

/**
 * Unit test — client/src/utils/format.ts
 * Hàm thuần, không cần DB/server. Chạy: npm run test:unit --prefix client
 */
describe('formatVND', () => {
  const NBSP = ' ';
  it('TC-U-FMT-01: 0 đồng', () => {
    expect(formatVND(0)).toBe(`0${NBSP}₫`);
  });
  it('TC-U-FMT-02: 25.000đ', () => {
    expect(formatVND(25000)).toBe(`25.000${NBSP}₫`);
  });
  it('TC-U-FMT-03: 1.250.000đ', () => {
    expect(formatVND(1250000)).toBe(`1.250.000${NBSP}₫`);
  });
  it('TC-U-FMT-05: số lẻ làm tròn, không thập phân', () => {
    expect(formatVND(25500.7)).toBe(`25.501${NBSP}₫`);
  });
  it('TC-U-FMT-06: số âm không sập', () => {
    expect(formatVND(-50000)).toBe(`-50.000${NBSP}₫`);
  });
});

describe('formatDate', () => {
  it('TC-U-FMT-07: chuỗi rỗng -> rỗng', () => {
    expect(formatDate('')).toBe('');
  });
  it('TC-U-FMT-09: chứa đúng ngày/tháng/năm', () => {
    const d = formatDate('2026-09-16T10:30:00.000Z');
    expect(d).toMatch(/16/);
    expect(d).toMatch(/09/);
    expect(d).toMatch(/2026/);
  });
});

describe('calculateDiscountPercent', () => {
  it('TC-U-FMT-10: không có salePrice -> 0%', () => {
    expect(calculateDiscountPercent(100000)).toBe(0);
  });
  it('TC-U-FMT-11: salePrice = giá gốc -> 0%', () => {
    expect(calculateDiscountPercent(100000, 100000)).toBe(0);
  });
  it('TC-U-FMT-12: salePrice cao hơn giá gốc -> 0%', () => {
    expect(calculateDiscountPercent(100000, 120000)).toBe(0);
  });
  it('TC-U-FMT-13: 100k -> 80k = 20%', () => {
    expect(calculateDiscountPercent(100000, 80000)).toBe(20);
  });
  it('TC-U-FMT-14: 100k -> 50k = 50%', () => {
    expect(calculateDiscountPercent(100000, 50000)).toBe(50);
  });
  it('TC-U-FMT-15: làm tròn 33%', () => {
    expect(calculateDiscountPercent(100000, 66666)).toBe(33);
  });
  it('TC-U-FMT-16: salePrice = 0 nghĩa là không KM -> 0%', () => {
    expect(calculateDiscountPercent(100000, 0)).toBe(0);
  });
});
