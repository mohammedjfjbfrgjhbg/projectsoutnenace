import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Following.css";
import { useLanguage } from "../context/LanguageContext";

const followingPosts = [
  {
    id: 1,
    initials: "م",
    avatarColor: "linear-gradient(135deg,#0369a1,#0284c7)",
    name: "محمد أمين الطاهر",
    badge: "✓ محامي مدني",
    emoji: "📋",
    illustrationBg: "linear-gradient(135deg,#0c4a6e,#0369a1)",
    title: "جديد: تغييرات قانون الإيجار لعام 2025",
    desc: "شرح كامل للتعديلات الجديدة على قانون الكراء — مدة الإشعار، الزيادة القانونية، وحقوق الطرفين.",
    tags: ["#الكراء", "#2025"],
    likes: "3.2K",
    comments: "287",
    shares: "1.1K",
    saves: "2.4K",
  },
  {
    id: 2,
    initials: "ه",
    avatarColor: "linear-gradient(135deg,#0891b2,#0e7490)",
    name: "هند الشرقاوي",
    badge: "✓ قانون الأسرة",
    emoji: "👨‍👩‍👧",
    illustrationBg: "linear-gradient(135deg,#164e63,#0891b2)",
    title: "الحضانة والنفقة — كل ما يهمك",
    desc: "أحكام مدونة الأسرة المحدثة: الحضانة المشتركة، حساب النفقة، وما يحكم به القضاء فعلياً في 2025.",
    tags: ["#الحضانة", "#مدونة_الأسرة"],
    likes: "5.8K",
    comments: "634",
    shares: "2.0K",
    saves: "4.1K",
  },
];

function PostCard({ post }) {
  const { t } = useLanguage();
  const [showBooking, setShowBooking] = useState(false);
  const [following, setFollowing] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="f-post-card">
      <div className="f-post-inner">
        <div className="f-overlay-actions">
          <div className={`f-action-btn ${liked ? "active" : ""}`} onClick={() => setLiked(!liked)}>
            <div className="f-action-icon"><HeartIcon filled={liked} /></div>
            <span>{post.likes}</span>
          </div>
          <div className="f-action-btn">
            <div className="f-action-icon"><CommentIcon /></div>
            <span>{post.comments}</span>
          </div>
          <div className="f-action-btn">
            <div className="f-action-icon"><ShareIcon /></div>
            <span>{post.shares}</span>
          </div>
          <div className={`f-action-btn ${saved ? "active" : ""}`} onClick={() => setSaved(!saved)}>
            <div className="f-action-icon"><SaveIcon /></div>
            <span>{post.saves}</span>
          </div>
          <div className="f-action-btn" onClick={() => setShowBooking(true)}>
            <div className="f-action-icon f-book-btn"><CalendarIcon /></div>
            <span>{t('bookBtn')}</span>
          </div>
        </div>

        <div className="f-post-illustration" style={{ background: post.illustrationBg }}>
          {post.emoji}
        </div>

        <div className="f-post-content">
          <div className="f-post-header">
            <div className="f-avatar" style={{ background: post.avatarColor }}>{post.initials}</div>
            <div className="f-author-info">
              <div className="f-author-name">{post.name}</div>
              <div className="f-author-badge">{post.badge}</div>
            </div>
            <button className={`f-follow-btn ${following ? "following" : ""}`} onClick={() => setFollowing(!following)}>
              {following ? t('followStatusFollowed') : t('followStatusUnfollowed')}
            </button>
          </div>
          <div className="f-post-title">{post.title}</div>
          <div className="f-post-desc">{post.desc}</div>
          <div className="f-post-tags">
            {post.tags.map((t) => (
              <NavLink key={t} to={`/topic/${t.replace("#", "")}`} className="f-post-tag">{t}</NavLink>
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
    <div className="f-booking-overlay">
      <div className="f-booking-modal">
        <button className="f-close-btn" onClick={onClose}>✕</button>
        <h2 className="f-booking-title">{t('bookConsultation') || 'حجز استشارة'} مع {name}</h2>
        <div className="f-booking-section">
          <p className="f-booking-label">{t('chooseDay')}</p>
          <div className="f-days-grid">
            {days.map((d, i) => (
              <div key={i} className={`f-day-card ${selectedDay === i ? "active" : ""}`} onClick={() => setSelectedDay(i)}>
                <span className="f-day-name">{d.day}</span>
                <span className="f-day-date">{d.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="f-booking-section">
          <p className="f-booking-label">{t('availableTime')}</p>
          <div className="f-times-grid">
            {times.map((t) => (
              <button key={t} className={`f-time-card ${selectedTime === t ? "active" : ""}`} onClick={() => setSelectedTime(t)}>{t}</button>
            ))}
          </div>
        </div>
        <button className="f-next-btn">{t('continueBooking')}</button>
      </div>
    </div>
  );
}

export default function Following() {
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="f-page" dir={dir}>
      <div className="f-page-header">
        <span className="f-badge">👥 {t('followingTab')}</span>
        <h1 className="f-page-title">{t('followedLawyers')}</h1>
        <p className="f-page-sub">{t('lastPostsFromFollowed')}</p>
      </div>
      <div className="f-feed">
        {followingPosts.map((p) => <PostCard key={p.id} post={p} />)}
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