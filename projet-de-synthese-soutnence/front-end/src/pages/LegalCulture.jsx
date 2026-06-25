import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./LegalCulture.css";
import { useLanguage } from "../context/LanguageContext";

/* ───── HELPERS ───── */
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
};

/* ───── DATA ───── */
const postsForYou = [
  {
    id: 1,
    initials: "ع",
    avatarColor: "linear-gradient(135deg,#16a34a,#15803d)",
    name: "عمر الحسيني",
    badge: "✓ قانون الأعمال",
    emoji: "🏢",
    gradient: "linear-gradient(160deg,#052e16 0%,#14532d 45%,#166534 100%)",
    title: "كيفاش تأسس شركة في المغرب في 2025؟",
    desc: "5 خطوات عملية لتسجيل شركتك SARL من الصفر – الوثائق والتكاليف الحقيقية",
    tags: ["#SARL", "#المقاولات"],
    likes: 4800, comments: 312, shares: 891, saves: 1200,
  },
  {
    id: 2,
    initials: "ف",
    avatarColor: "linear-gradient(135deg,#7c3aed,#5b21b6)",
    name: "فاطمة الزهراء بنعلي",
    badge: "✓ قانون الأسرة",
    emoji: "⚖️",
    gradient: "linear-gradient(160deg,#1e1b4b 0%,#3730a3 45%,#4f46e5 100%)",
    title: "حقوق الزوجة عند الطلاق – ما اللي كتعرفوش",
    desc: "مدونة الأسرة 2025: النفقة، الحضانة، السكن – كل واحدة بالتفصيل مع الأرقام الحقيقية",
    tags: ["#الطلاق", "#مدونة_الأسرة"],
    likes: 9200, comments: 1100, shares: 3400, saves: 5700,
  }
];

const postsFollowing = [
  {
    id: 3,
    initials: "ي",
    avatarColor: "linear-gradient(135deg,#0369a1,#0c4a6e)",
    name: "يوسف المنصوري",
    badge: "✓ قانون العمل",
    emoji: "⚡",
    gradient: "linear-gradient(160deg,#0c1a2e 0%,#0369a1 55%,#0284c7 100%)",
    title: "فصلوني من العمل – واش عندي حق نشكي؟",
    desc: "الفصل التعسفي بالقانون المغربي: الشروط، مدة الإشعار، والتعويضات التي يحق لك أخذها.",
    tags: ["#قانون_العمل", "#الفصل"],
    likes: 12100, comments: 943, shares: 4200, saves: 6800,
  }
];

const postsTrending = [
  {
    id: 4,
    initials: "س",
    avatarColor: "linear-gradient(135deg,#b45309,#9a3412)",
    name: "سعيد مراد",
    badge: "✓ القانون العقاري",
    emoji: "🏠",
    gradient: "linear-gradient(160deg,#2a1205 0%,#78350f 45%,#9a3412 100%)",
    title: "مخاطر شراء بقعة أرضية بدون تحفيظ",
    desc: "كيفاش تحمي راسك من النصب فاش تبغي تشري بقعة أرضية، أهمية المحافظة العقارية.",
    tags: ["#العقار", "#التحفيظ"],
    likes: 25400, comments: 3200, shares: 8900, saves: 14500,
  },
  {
    id: 5,
    initials: "م",
    avatarColor: "linear-gradient(135deg,#047857,#064e3b)",
    name: "مريم العلمي",
    badge: "✓ القانون الرقمي",
    emoji: "💻",
    gradient: "linear-gradient(160deg,#022c22 0%,#065f46 45%,#047857 100%)",
    title: "التشهير في مواقع التواصل الاجتماعي",
    desc: "العقوبات القانونية في المغرب على السب والقذف والتشهير عبر الإنترنت.",
    tags: ["#القانون_الرقمي", "#التشهير"],
    likes: 18900, comments: 2100, shares: 5400, saves: 9800,
  }
];

/* ───── ICONS ───── */
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
const ShareIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const SaveIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const LinkIconSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);
const WhatsappIconSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);
const FacebookIconSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);
const LinkedinIconSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);
const SendIconSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

/* ───── MODALS ───── */
function BookingModal({ name, onClose }) {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const times = ["09:00", "11:00", "14:00", "16:00", "17:00", "18:00", "19:00"];
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { day: d.toLocaleDateString("ar-MA", { weekday: "long" }), date: d.getDate() };
  });
  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal-content" onClick={e => e.stopPropagation()}>
        <button className="rc-close-btn" onClick={onClose}>✕</button>
        <h2 className="rc-modal-title">{t('bookConsultation') || 'حجز استشارة'} مع {name}</h2>
        <div className="rc-booking-section">
          <p className="rc-booking-label">{t('chooseDay')}</p>
          <div className="rc-days-grid">
            {days.map((d, i) => (
              <div key={i} className={`rc-day-card ${selectedDay === i ? "active" : ""}`} onClick={() => setSelectedDay(i)}>
                <span className="rc-day-name">{d.day}</span>
                <span className="rc-day-date">{d.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rc-booking-section">
          <p className="rc-booking-label">{t('availableTime')}</p>
          <div className="rc-times-grid">
            {times.map((t) => (
              <button key={t} className={`rc-time-card ${selectedTime === t ? "active" : ""}`} onClick={() => setSelectedTime(t)}>{t}</button>
            ))}
          </div>
        </div>
        <button className="rc-next-btn">{t('continueBooking')}</button>
      </div>
    </div>
  );
}

function CommentsModal({ onClose }) {
  const { t } = useLanguage();
  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal-content rc-drawer" onClick={e => e.stopPropagation()}>
        <button className="rc-close-btn" onClick={onClose}>✕</button>
        <h2 className="rc-modal-title">{t('commentsTitle')}</h2>
        
        <div className="rc-comments-list">
          <div className="rc-comment-item">
            <div className="rc-comment-avatar">س</div>
            <div className="rc-comment-body">
              <div className="rc-comment-author">سعيد رشيد</div>
              شكرا بزاف على هاد المعلومات القيمة، بغيت نسولك واش هادشي كينطابق على SARL AU؟
            </div>
          </div>
          <div className="rc-comment-item">
            <div className="rc-comment-avatar">م</div>
            <div className="rc-comment-body">
              <div className="rc-comment-author">مريم الشاوي</div>
              شرح مبسط ومفهوم، تبارك الله عليك!
            </div>
          </div>
          <div className="rc-comment-item">
            <div className="rc-comment-avatar">A</div>
            <div className="rc-comment-body">
              <div className="rc-comment-author">Amine Tech</div>
              واش تقدر تدير لينا فيديو على الضرائب ديالت المقاول الذاتي؟
            </div>
          </div>
        </div>

        <div className="rc-comment-input-wrap">
          <input type="text" className="rc-comment-input" placeholder="أضف تعليقاً..." />
          <button className="rc-comment-send"><SendIconSVG /></button>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ onClose, showToast }) {
  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '320px' }}>
        <button className="rc-close-btn" onClick={onClose}>✕</button>
        <h2 className="rc-modal-title">مشاركة الفيديو</h2>
        
        <div className="rc-share-options">
          <button className="rc-share-btn" onClick={() => { showToast("تم نسخ الرابط بنجاح"); onClose(); }}>
            <div className="rc-share-icon-wrap"><LinkIconSVG /></div>
            نسخ الرابط
          </button>
          <button className="rc-share-btn">
            <div className="rc-share-icon-wrap" style={{ color: '#25D366' }}><WhatsappIconSVG /></div>
            واتساب
          </button>
          <button className="rc-share-btn">
            <div className="rc-share-icon-wrap" style={{ color: '#1877F2' }}><FacebookIconSVG /></div>
            فيسبوك
          </button>
          <button className="rc-share-btn">
            <div className="rc-share-icon-wrap" style={{ color: '#0A66C2' }}><LinkedinIconSVG /></div>
            لينكدإن
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── REEL CARD ───── */
function ReelCard({ post, showToast }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  
  const [likesCount, setLikesCount] = useState(post.likes);
  const [savesCount, setSavesCount] = useState(post.saves);
  const [likePop, setLikePop] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  
  const [showBooking, setShowBooking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  const navigate = useNavigate();

  const handleVideoClick = () => {
    setIsPlaying(!isPlaying);
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 500); // fade out icon
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (!liked) {
      setLikesCount(likesCount + 1);
      setLikePop(true);
      setTimeout(() => setLikePop(false), 500);
      showToast("تم الإعجاب بالفيديو ❤️");
    } else {
      setLikesCount(likesCount - 1);
    }
    setLiked(!liked);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (!saved) {
      setSavesCount(savesCount + 1);
      showToast(t('savedSuccess') || "تم الحفظ في لوحتي 📌");
    } else {
      setSavesCount(savesCount - 1);
    }
    setSaved(!saved);
  };

  const handleFollow = (e) => {
    e.stopPropagation();
    if (!following) {
      showToast((t('followedSuccess') || "تمت متابعة {name} ✅").replace('{name}', post.name));
    }
    setFollowing(!following);
  };

  // Intersection observer to auto-pause when out of view
  const reelRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsPlaying(true);
          } else {
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 } // 60% of video must be visible to play
    );
    if (reelRef.current) observer.observe(reelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="rc-reel-wrap" ref={reelRef}>
      {/* ── Video Player ── */}
      <div className="rc-player" style={{ background: post.gradient }} onClick={handleVideoClick}>
        
        {/* Play/Pause Overlay Icon */}
        {showPlayIcon && (
          <div className="rc-play-overlay">
            {isPlaying ? <PlayIcon /> : <PauseIcon />}
          </div>
        )}

        {/* Discover Pill */}
        <div className="rc-discover-pill" onClick={(e) => { e.stopPropagation(); navigate("/discover"); }}>
          <span className="rc-discover-dot">🔍</span> {t('discover')}
        </div>

        {/* Central Illustration */}
        <div className="rc-illustration">{post.emoji}</div>

        {/* Progress Bar */}
        <div className="rc-progress-bar">
          <div className={`rc-progress-fill ${isPlaying ? 'playing' : ''}`} />
        </div>

        {/* Bottom Overlay */}
        <div className="rc-bottom-overlay">
          <div className="rc-creator-row">
            <div className="rc-avatar" style={{ background: post.avatarColor }}>{post.initials}</div>
            <div className="rc-creator-info">
              <span className="rc-creator-name">{post.name}</span>
              <span className="rc-creator-badge">{post.badge}</span>
            </div>
            <button className={`rc-follow-btn ${following ? "following" : ""}`} onClick={handleFollow}>
              {following ? t('followStatusFollowed') : t('followStatusUnfollowed')}
            </button>
          </div>

          <div className="rc-post-title">{post.title}</div>
          <div className="rc-post-desc">{post.desc}</div>

          <div className="rc-tags">
            {post.tags.map((t) => (
              <NavLink key={t} to={`/topic/${t.replace("#", "")}`} className="rc-tag" onClick={(e) => e.stopPropagation()}>
                {t}
              </NavLink>
            ))}
          </div>
        </div>

        {/* ── Side Actions (Now inside player) ── */}
        <div className="rc-side-actions">
          <div className={`rc-action ${liked ? "active" : ""}`} onClick={handleLike}>
            <div className={`rc-action-icon ${likePop ? 'pop-anim' : ''}`}>
              <HeartIcon filled={liked} />
            </div>
            <span>{formatNumber(likesCount)}</span>
          </div>
          <div className="rc-action" onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
            <div className="rc-action-icon"><CommentIcon /></div>
            <span>{formatNumber(post.comments)}</span>
          </div>
          <div className="rc-action" onClick={(e) => { e.stopPropagation(); setShowShare(true); }}>
            <div className="rc-action-icon"><ShareIconSvg /></div>
            <span>{formatNumber(post.shares)}</span>
          </div>
          <div className={`rc-action ${saved ? "active" : ""}`} onClick={handleSave}>
            <div className="rc-action-icon"><SaveIcon filled={saved} /></div>
            <span>{formatNumber(savesCount)}</span>
          </div>
          <div className="rc-action rc-action-book" onClick={(e) => { e.stopPropagation(); setShowBooking(true); }}>
            <div className="rc-action-icon"><CalendarIcon /></div>
            <span>{t('bookBtn')}</span>
          </div>
        </div>

      </div>

      {showBooking && <BookingModal name={post.name} onClose={() => setShowBooking(false)} />}
      {showComments && <CommentsModal onClose={() => setShowComments(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} showToast={showToast} />}
    </div>
  );
}

/* ───── SKELETON LOADER ───── */
function SkeletonReel() {
  return (
    <div className="rc-reel-wrap">
      <div className="rc-player rc-skeleton-player">
        <div className="rc-skeleton-overlay">
          <div className="rc-skeleton-row">
            <div className="rc-skeleton-avatar"></div>
            <div className="rc-skeleton-text-group">
              <div className="rc-skeleton-line short"></div>
              <div className="rc-skeleton-line very-short"></div>
            </div>
          </div>
          <div className="rc-skeleton-line long"></div>
          <div className="rc-skeleton-line medium"></div>
          <div className="rc-skeleton-line medium" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
}

/* ───── TOAST COMPONENT ───── */
function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="rc-toast">
      {message}
    </div>
  );
}

/* ───── PAGE ───── */
export default function LegalCulture() {
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
  const [activeTab, setActiveTab] = useState("لك");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setLoading(true);
    setTimeout(() => setLoading(false), 800); // 800ms loading skeleton
  };

  const getCurrentPosts = () => {
    if (activeTab === "متابعون") return postsFollowing;
    if (activeTab === "رائج") return postsTrending;
    return postsForYou;
  };

  return (
    <div className="rc-page" dir={dir}>
      
      {/* Toast Notification */}
      <Toast message={toastMsg} />

      {/* Right Tabs Panel */}
      <div className="rc-right-panel">
        {[
          { id: "لك", labelKey: "forYouTab" },
          { id: "متابعون", labelKey: "followingTab" },
          { id: "رائج", labelKey: "trendingTab" }
        ].map((tab) => (
          <button key={tab.id} className={`rc-tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => handleTabChange(tab.id)}>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Feed (Snap Scroll Container) */}
      <div className="rc-feed">
        {loading ? (
          <SkeletonReel />
        ) : (
          getCurrentPosts().map((p) => <ReelCard key={p.id} post={p} showToast={showToast} />)
        )}
      </div>
    </div>
  );
}