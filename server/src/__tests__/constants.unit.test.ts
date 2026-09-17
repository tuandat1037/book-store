import { describe, it, expect } from 'vitest';
import { getStockStatus, LOW_STOCK_THRESHOLD } from '../config/constants.js';

/**
 * Unit test — server/src/config/constants.ts
 * Chạy: npm run test:unit --prefix server
 */
describe('getStockStatus', () => {
  it('TC-U-STK-01: ngưỡng mặc định là 100', () => {
    expect(LOW_STOCK_THRESHOLD).toBe(100);
  });
  it('TC-U-STK-02: stock = 0 -> OUT_OF_STOCK', () => {
    expect(getStockStatus(0)).toBe('OUT_OF_STOCK');
  });
  it('TC-U-STK-03: stock = 1 -> LOW_STOCK', () => {
    expect(getStockStatus(1)).toBe('LOW_STOCK');
  });
  it('TC-U-STK-04: stock = 100 (tại ngưỡng) -> LOW_STOCK', () => {
    expect(getStockStatus(100)).toBe('LOW_STOCK');
  });
  it('TC-U-STK-05: stock = 101 -> IN_STOCK', () => {
    expect(getStockStatus(101)).toBe('IN_STOCK');
  });
  it('TC-U-STK-06: stock = 5000 -> IN_STOCK', () => {
    expect(getStockStatus(5000)).toBe('IN_STOCK');
  });
  it('TC-U-STK-07: số âm -> OUT_OF_STOCK', () => {
    expect(getStockStatus(-5)).toBe('OUT_OF_STOCK');
  });
  it('TC-U-STK-08: chuỗi số "50" -> LOW_STOCK', () => {
    expect(getStockStatus('50' as any)).toBe('LOW_STOCK');
  });
  it('TC-U-STK-09: rác "abc" -> OUT_OF_STOCK', () => {
    expect(getStockStatus('abc' as any)).toBe('OUT_OF_STOCK');
  });
  it('TC-U-STK-10: null -> OUT_OF_STOCK', () => {
    expect(getStockStatus(null as any)).toBe('OUT_OF_STOCK');
  });
  it('TC-U-STK-11: ngưỡng tùy chỉnh (5/10) -> LOW_STOCK', () => {
    expect(getStockStatus(5, 10)).toBe('LOW_STOCK');
  });
  it('TC-U-STK-12: ngưỡng tùy chỉnh (5/3) -> IN_STOCK', () => {
    expect(getStockStatus(5, 3)).toBe('IN_STOCK');
  });
});
