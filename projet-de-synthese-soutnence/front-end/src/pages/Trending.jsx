import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Trending.css";
import { useLanguage } from "../context/LanguageContext";

const trendingPosts = [
  {
    id: 1,
    initials: "ي",
    avatarColor: "linear-gradient(135deg,#7c3aed,#5b21b6)",
    name: "يوسف المنصوري",
    badge: "✓ قانون العمل",
    emoji: "⚡",
    illustrationBg: "linear-gradient(135deg,#4c1d95,#7c3aed)",
    title: "فصل تعسفي؟ هاك حقوقك كاملة",
    desc: "3 أيام باش تودي شكاية، تعويض الفصل، ومسطرة المحكمة الاجتماعية — كل شي بالتفصيل.",
    tags: ["#قانون_العمل", "#الفصل"],
    likes: "12.1K",
    comments: "943",
    shares: "4.2K",
    saves: "6.8K",
  },
  {
    id: 2,
    initials: "ن",
    avatarColor: "linear-gradient(135deg,#db2777,#be185d)",
    name: "نور الهدى الإدريسي",
    badge: "✓ قانون الأسرة",
    emoji: "🏠",
    illustrationBg: "linear-gradient(135deg,#9d174d,#db2777)",
    title: "كراء بدون عقد — ما لي فيه",
    desc: "حقوقك كمستأجر حتى بدون عقد مكتوب. القانون 67.12 كيحميك أكثر مما كتظن.",
    tags: ["#الكراء", "#حقوق_المستأجر"],
    likes: "7.4K",
    comments: "521",
    shares: "2.9K",
    saves: "3.1K",
  },
];

function PostCard({ post, accentColor, bookBtnColor }) {
  const { t } = useLanguage();
  const [showBooking, setShowBooking] = useState(false);
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="t-post-card">
      <div className="t-post-inner">
        <div className="t-overlay-actions">
          <div className={`t-action-btn ${liked ? "active" : ""}`} onClick={() => setLiked(!liked)}>
            <div className="t-action-icon"><HeartIcon filled={liked} /></div>
            <span>{post.likes}</span>
          </div>
          <div className="t-action-btn">
            <div className="t-action-icon"><CommentIcon /></div>
            <span>{post.comments}</span>
          </div>
          <div className="t-action-btn">
            <div className="t-action-icon"><ShareIcon /></div>
            <span>{post.shares}</span>
          </div>
          <div className={`t-action-btn ${saved ? "active" : ""}`} onClick={() => setSaved(!saved)}>
            <div className="t-action-icon"><SaveIcon /></div>
            <span>{post.saves}</span>
          </div>
          <div className="t-action-btn" onClick={() => setShowBooking(true)}>
            <div className="t-action-icon t-book-btn"><CalendarIcon /></div>
            <span>{t('bookBtn')}</span>
          </div>
        </div>

        <div className="t-post-illustration" style={{ background: post.illustrationBg }}>
          {post.emoji}
        </div>

        <div className="t-post-content">
          <div className="t-post-header">
            <div className="t-avatar" style={{ background: post.avatarColor }}>{post.initials}</div>
            <div className="t-author-info">
              <div className="t-author-name">{post.name}</div>
              <div className="t-author-badge">{post.badge}</div>
            </div>
            <button className={`t-follow-btn ${following ? "following" : ""}`} onClick={() => setFollowing(!following)}>
              {following ? t('followStatusFollowed') : t('followStatusUnfollowed')}
            </button>
          </div>
          <div className="t-post-title">{post.title}</div>
          <div className="t-post-desc">{post.desc}</div>
          <div className="t-post-tags">
            {post.tags.map((t) => (
              <NavLink key={t} to={`/topic/${t.replace("#", "")}`} className="t-post-tag">{t}</NavLink>
            ))}
          </div>
        </div>

        {showBooking && <BookingModal name={post.name} onClose={() => setShowBooking(false)} />}
      </div>
    </div>
  );
}

function BookingModal({ name, onClose }) {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const times = ["09:00", "11:00", "14:00", "16:00", "17:00", "18:00"];
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { day: d.toLocaleDateString("ar-MA", { weekday: "long" }), date: d.getDate() };
  });
  return (
    <div className="t-booking-overlay">
      <div className="t-booking-modal">
        <button className="f-close-btn" onClick={onClose}>✕</button>
        <h2 className="t-booking-title">{t('bookConsultation') || 'حجز استشارة'} مع {name}</h2>
        <div className="t-booking-section">
          <p className="t-booking-label">{t('chooseDay')}</p>
          <div className="t-days-grid">
            {days.map((d, i) => (
              <div key={i} className={`t-day-card ${selectedDay === i ? "active" : ""}`} onClick={() => setSelectedDay(i)}>
                <span className="t-day-name">{d.day}</span>
                <span className="t-day-date">{d.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="t-booking-section">
          <p className="t-booking-label">{t('availableTime')}</p>
          <div className="t-times-grid">
            {times.map((t) => (
              <button key={t} className={`t-time-card ${selectedTime === t ? "active" : ""}`} onClick={() => setSelectedTime(t)}>{t}</button>
            ))}
          </div>
        </div>
        <button className="t-next-btn">{t('continueBooking')}</button>
      </div>
    </div>
  );
}

export default function Trending() {
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="t-page" dir={dir}>
      <div className="t-page-header">
        <span className="t-fire-badge">{t('trendingBadge')}</span>
        <h1 className="t-page-title">{t('trendingTitle')}</h1>
        <p className="t-page-sub">{t('trendingSub')}</p>
      </div>
      <div className="t-feed">
        {trendingPosts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  );
}

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
  </svg>
);
const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);