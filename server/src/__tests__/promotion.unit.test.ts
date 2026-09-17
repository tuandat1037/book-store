import { describe, it, expect } from 'vitest';
import { evaluatePromotion } from '../controllers/promotionController.js';

/**
 * Unit test — server/src/controllers/promotionController.ts :: evaluatePromotion
 * Hàm thuần, không cần DB. Chạy: npm run test:unit --prefix server
 */
function promo(over: any = {}) {
  return {
    code: 'KIMDONG20',
    discount_type: 'PERCENTAGE',
    discount_value: 20,
    min_order_value: 0,
    max_discount: null,
    start_date: null,
    end_date: null,
    usage_limit: 0,
    times_used: 0,
    is_active: 1,
    ...over
  };
}

describe('evaluatePromotion', () => {
  it('TC-U-PRM-01: mã null -> ok=false', () => {
    const r = evaluatePromotion(null, 100000);
    expect(r.ok).toBe(false);
    expect(r.discount_amount).toBe(0);
    expect(r.message).toMatch(/không tồn tại/);
  });

  it('TC-U-PRM-02: is_active=0 -> ok=false', () => {
    const r = evaluatePromotion(promo({ is_active: 0 }), 100000);
    expect(r.ok).toBe(false);
    expect(r.discount_amount).toBe(0);
  });

  it('TC-U-PRM-03: giảm 20% của 100k = 20k', () => {
    const r = evaluatePromotion(promo(), 100000);
    expect(r.ok).toBe(true);
    expect(r.discount_amount).toBe(20000);
  });

  it('TC-U-PRM-04: đơn 0đ -> giảm 0', () => {
    expect(evaluatePromotion(promo(), 0).discount_amount).toBe(0);
  });

  it('TC-U-PRM-05: chạm trần max_discount 30k', () => {
    const r = evaluatePromotion(promo({ max_discount: 30000 }), 1000000);
    expect(r.discount_amount).toBe(30000);
  });

  it('TC-U-PRM-06: chưa chạm trần -> 20k', () => {
    expect(evaluatePromotion(promo({ max_discount: 30000 }), 100000).discount_amount).toBe(20000);
  });

  it('TC-U-PRM-07: FIXED 20k cho đơn 150k', () => {
    const r = evaluatePromotion(promo({ discount_type: 'FIXED_AMOUNT', discount_value: 20000 }), 150000);
    expect(r.discount_amount).toBe(20000);
  });

  it('TC-U-PRM-08: FIXED lớn hơn đơn -> capped bằng đơn', () => {
    const r = evaluatePromotion(promo({ discount_type: 'FIXED_AMOUNT', discount_value: 200000 }), 150000);
    expect(r.discount_amount).toBe(150000);
  });

  it('TC-U-PRM-09: đơn 149999 < min 150000 -> ok=false', () => {
    const r = evaluatePromotion(promo({ min_order_value: 150000 }), 149999);
    expect(r.ok).toBe(false);
    expect(r.discount_amount).toBe(0);
  });

  it('TC-U-PRM-10: đơn đúng 150000 -> ok=true', () => {
    expect(evaluatePromotion(promo({ min_order_value: 150000 }), 150000).ok).toBe(true);
  });

  it('TC-U-PRM-12: dùng đủ 100/100 lượt -> hết', () => {
    const r = evaluatePromotion(promo({ usage_limit: 100, times_used: 100 }), 100000);
    expect(r.ok).toBe(false);
  });

  it('TC-U-PRM-13: 99/100 lượt -> còn dùng được', () => {
    expect(evaluatePromotion(promo({ usage_limit: 100, times_used: 99 }), 100000).ok).toBe(true);
  });

  it('TC-U-PRM-14: usage_limit=0 = không giới hạn', () => {
    expect(evaluatePromotion(promo({ usage_limit: 0, times_used: 9999 }), 100000).ok).toBe(true);
  });

  it('TC-U-PRM-15: hết hạn hôm qua -> ok=false', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(evaluatePromotion(promo({ end_date: past }), 100000).ok).toBe(false);
  });

  it('TC-U-PRM-16: chưa tới ngày mai -> ok=false', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(evaluatePromotion(promo({ start_date: future }), 100000).ok).toBe(false);
  });

  it('TC-U-PRM-17: trong hạn -> ok=true', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(evaluatePromotion(promo({ start_date: past, end_date: future }), 100000).ok).toBe(true);
  });

  it('TC-U-PRM-19: đủ ĐK + trần 50k (20% của 500k = 100k -> 50k)', () => {
    const r = evaluatePromotion(
      promo({ min_order_value: 200000, max_discount: 50000, usage_limit: 10, times_used: 3 }),
      500000
    );
    expect(r.discount_amount).toBe(50000);
  });

  it('TC-U-PRM-20: kết quả luôn số nguyên', () => {
    const r = evaluatePromotion(promo({ discount_value: 33 }), 99999);
    expect(Number.isInteger(r.discount_amount)).toBe(true);
  });
});
