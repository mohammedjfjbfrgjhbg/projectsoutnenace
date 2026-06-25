import { useParams } from "react-router-dom";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./TopicPage.css";
import { useLanguage } from "../context/LanguageContext";

const topicData = {
  "SARL": {
    color: "#d97706",
    bg: "linear-gradient(135deg,#78350f,#d97706)",
    posts: [
      {
        id: 1, initials: "ع", avatarColor: "linear-gradient(135deg,#d97706,#b45309)",
        name: "عمر الحسيني", badge: "✓ قانون الأعمال", emoji: "🏢",
        illustrationBg: "linear-gradient(135deg,#78350f,#d97706)",
        title: "كيفاش تأسس SARL في أقل من أسبوع؟",
        desc: "المراحل الكاملة: كراء المقر، الرأسمال، كتابة الضبط، والسجل التجاري.",
        tags: ["#SARL", "#المقاولات"], likes: "4.8K", comments: "312", shares: "891", saves: "1.2K",
      },
    ]
  },
  "الطلاق": {
    color: "#7c3aed",
    bg: "linear-gradient(135deg,#4c1d95,#7c3aed)",
    posts: [
      {
        id: 1, initials: "ف", avatarColor: "linear-gradient(135deg,#7c3aed,#5b21b6)",
        name: "فاطمة الزهراء بنعلي", badge: "✓ قانون الأسرة", emoji: "⚖️",
        illustrationBg: "linear-gradient(135deg,#4c1d95,#7c3aed)",
        title: "حقوق الزوجة عند الطلاق",
        desc: "النفقة، الحضانة، السكن — كل واحدة بالتفصيل مع الأرقام الحقيقية لعام 2025.",
        tags: ["#الطلاق", "#مدونة_الأسرة"], likes: "9.2K", comments: "1.1K", shares: "3.4K", saves: "5.7K",
      },
    ]
  },
};

const defaultTopic = (name) => ({
  color: "#14532d",
  bg: "linear-gradient(135deg,#052e16,#14532d)",
  posts: [
    {
      id: 1, initials: "ق", avatarColor: "linear-gradient(135deg,#14532d,#166534)",
      name: "فريق حقّي", badge: "✓ قانون عام", emoji: "📚",
      illustrationBg: "linear-gradient(135deg,#052e16,#14532d)",
      title: `كل منشورات موضوع #${name}`,
      desc: "محتوى قانوني موثوق من محامين معتمدين. تابع المحامي لتصلك تحديثاته مباشرة.",
      tags: [`#${name}`], likes: "—", comments: "—", shares: "—", saves: "—",
    },
  ]
});

function PostCard({ post, accent }) {
  const { t } = useLanguage();
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="tp-post-card">
      <div className="tp-post-inner">
        <div className="tp-overlay-actions">
          <div className={`tp-action-btn ${liked ? "active" : ""}`} onClick={() => setLiked(!liked)} style={liked ? { "--accent": accent } : {}}>
            <div className="tp-action-icon"><HeartIcon filled={liked} /></div>
            <span>{post.likes}</span>
          </div>
          <div className="tp-action-btn">
            <div className="tp-action-icon"><CommentIcon /></div>
            <span>{post.comments}</span>
          </div>
          <div className="tp-action-btn">
            <div className="tp-action-icon"><ShareIcon /></div>
            <span>{post.shares}</span>
          </div>
          <div className={`tp-action-btn ${saved ? "active" : ""}`} onClick={() => setSaved(!saved)}>
            <div className="tp-action-icon"><SaveIcon /></div>
            <span>{post.saves}</span>
          </div>
        </div>

        <div className="tp-post-illustration" style={{ background: post.illustrationBg }}>
          {post.emoji}
        </div>

        <div className="tp-post-content">
          <div className="tp-post-header">
            <div className="tp-avatar" style={{ background: post.avatarColor }}>{post.initials}</div>
            <div className="tp-author-info">
              <div className="tp-author-name">{post.name}</div>
              <div className="tp-author-badge" style={{ color: accent }}>{post.badge}</div>
            </div>
            <button className={`tp-follow-btn ${following ? "following" : ""}`}
              style={{ borderColor: accent, "--accent": accent }}
              onClick={() => setFollowing(!following)}>
              {following ? t('followStatusFollowed') : t('followStatusUnfollowed')}
            </button>
          </div>
          <div className="tp-post-title">{post.title}</div>
          <div className="tp-post-desc">{post.desc}</div>
          <div className="tp-post-tags">
            {post.tags.map((t) => (
              <NavLink key={t} to={`/topic/${t.replace("#", "")}`} className="tp-post-tag" style={{ "--accent": accent }}>{t}</NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TopicPage() {
  const { name } = useParams();
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
  const data = topicData[name] || defaultTopic(name);

  return (
    <div className="tp-page" dir={dir}>
      <div className="tp-page-header" style={{ borderColor: data.color }}>
        <span className="tp-hashtag" style={{ color: data.color, background: `${data.color}18` }}>#{name}</span>
        <h1 className="tp-page-title">{t('topicLabel')} {name}</h1>
        <p className="tp-page-sub">{t('topicPageSub')}</p>
      </div>
      <div className="tp-feed">
        {data.posts.map((p) => <PostCard key={p.id} post={p} accent={data.color} />)}
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