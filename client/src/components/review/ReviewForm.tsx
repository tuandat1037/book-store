import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ReviewFormProps {
  bookId: number;
  bookTitle?: string;
  /** Gọi sau khi gửi thành công để trang cha tải lại danh sách đánh giá */
  onSubmitted?: () => void;
  /** Ẩn phần kiểm tra điều kiện, dùng khi trang cha đã biết chắc được phép đánh giá */
  forceOpen?: boolean;
  existingReview?: { rating: number; comment?: string } | null;
}

/**
 * Form gửi đánh giá (1-5 sao + nhận xét).
 * Chỉ hiện khi người dùng đã mua sách và đơn hàng đã hoàn thành.
 */
export const ReviewForm: React.FC<ReviewFormProps> = ({ bookId, bookTitle, onSubmitted, forceOpen, existingReview }) => {
  const { showToast } = useToast();
  const [checking, setChecking] = useState(!forceOpen);
  const [canReview, setCanReview] = useState(!!forceOpen);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setCanReview(true);
      setChecking(false);
      setHasReviewed(!!existingReview);
      setRating(existingReview?.rating ?? 5);
      setComment(existingReview?.comment || '');
      return;
    }

    let cancelled = false;
    setChecking(true);
    api.get(`/reviews/eligibility/${bookId}`)
      .then((res) => {
        if (cancelled) return;
        setCanReview(!!res.data.can_review);
        setHasReviewed(!!res.data.has_reviewed);
        setOrderCode(res.data.order?.order_code || null);
        if (res.data.review) {
          setRating(Number(res.data.review.rating) || 5);
          setComment(res.data.review.comment || '');
        }
      })
      .catch(() => { if (!cancelled) setCanReview(false); })
      .finally(() => { if (!cancelled) setChecking(false); });

    return () => { cancelled = true; };
  }, [bookId, forceOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      showToast('Vui lòng chọn số sao từ 1 đến 5', 'error');
      return;
    }
    if (comment.trim().length < 5) {
      showToast('Vui lòng nhập nội dung nhận xét (tối thiểu 5 ký tự)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/reviews', { book_id: bookId, rating, comment: comment.trim() });
      showToast(res.data.message || 'Cảm ơn bạn đã gửi đánh giá!', 'success');
      setHasReviewed(true);
      onSubmitted?.();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi gửi đánh giá', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Đang kiểm tra quyền đánh giá...</span>
      </div>
    );
  }

  // Chưa mua hoặc đơn chưa hoàn thành
  if (!canReview) {
    return (
      <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold text-gray-700">Bạn chưa thể đánh giá sách này</p>
          <p className="text-gray-500 leading-relaxed">
            Chỉ khách hàng <strong>đã mua</strong> và có <strong>đơn hàng giao thành công</strong> mới được gửi đánh giá
            {bookTitle ? ` cho "${bookTitle}"` : ''}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-4 sm:p-6 space-y-4 border border-gray-100">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-xs font-bold uppercase text-gray-800 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-kimdong-red" />
          <span>{hasReviewed ? 'Cập nhật đánh giá của bạn' : 'Viết đánh giá của bạn'}</span>
        </h4>
        <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-sm flex items-center gap-1 shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          Đã mua hàng{orderCode ? ` · ${orderCode}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600 font-medium">Đánh giá sao:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              title={`${star} sao`}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-5 h-5 ${
                  star <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-amber-500">{hoverRating || rating}/5</span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Chia sẻ nhận xét của bạn về nội dung, chất lượng in và trải nghiệm..."
        className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-kimdong-red outline-none bg-white"
        required
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-gray-400">Nhận xét tối thiểu 5 ký tự.</p>
        <button
          type="submit"
          disabled={submitting}
          className="bg-kimdong-red hover:bg-kimdong-darkred text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {submitting ? 'Đang gửi...' : hasReviewed ? 'Cập Nhật Đánh Giá' : 'Gửi Đánh Giá'}
        </button>
      </div>
    </form>
  );
};
