import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DiscoverPage.css";
import { useLanguage } from "../context/LanguageContext";

/* ─── DATA ─── */
const topLawyersData = [
  { id: 1, initial: "ي", name: "يوسف البكالي",   fieldKey: "filterWork",       followers: "3.8K", color: "linear-gradient(135deg,#0369a1,#0c4a6e)" },
  { id: 2, initial: "ف", name: "فاطمة الزهراء",  fieldKey: "filterFamily",     followers: "5.2K", color: "linear-gradient(135deg,#7c3aed,#5b21b6)" },
  { id: 3, initial: "ع", name: "عمر الحسيني",    fieldKey: "filterBusiness",   followers: "8.0K", color: "linear-gradient(135deg,#1a4731,#14532d)" },
  { id: 4, initial: "ن", name: "نجوى بنسالم",    fieldKey: "filterRealEstate", followers: "4.3K", color: "linear-gradient(135deg,#0f766e,#0d9488)" },
  { id: 5, initial: "ك", name: "كريم التازي",    fieldKey: "filterCriminal",   followers: "2.1K", color: "linear-gradient(135deg,#9d174d,#be185d)" },
  { id: 6, initial: "س", name: "سمية أوحمو",     fieldKey: "pricingEnterpriseTitle", followers: "6.7K", color: "linear-gradient(135deg,#b45309,#d97706)" },
];

export default function DiscoverPage() {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("الكل");
  const navigate = useNavigate();

  const filters = [
    { label: t('filterAll') || "الكل", value: "الكل" },
    { label: t('filterFamily') || "الأسرة", value: "الأسرة" },
    { label: t('filterWork') || "الشغل", value: "الشغل" },
    { label: t('filterBusiness') || "الأعمال", value: "الأعمال" },
    { label: t('filterRealEstate') || "العقار", value: "العقار" },
    { label: t('filterCriminal') || "الجنائي", value: "الجنائي" }
  ];

  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="dp-page" dir={dir}>

      {/* ── Header ── */}
      <div className="dp-header">
        <h1 className="dp-title">{t('discoverTitle') || "اكتشف المحامين 🔍"}</h1>

        {/* Search */}
        <div className="dp-search-row">
          <div className="dp-search-icon">🔍</div>
          <input
            className="dp-search-input"
            placeholder={t('searchTopicPlaceholder') || "ابحث عن محام أو موضوع..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="dp-filters">
          {filters.map(f => (
            <button
              key={f.value}
              className={`dp-pill ${active === f.value ? "active" : ""}`}
              onClick={() => f.value === "الكل" ? setActive("الكل") : navigate(`/field/${f.value}`)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Lawyers ── */}
      <section className="dp-section">
        <div className="dp-section-header">
          <span className="dp-section-title">{t('mostFollowedTitle') || "المحامون الأكثر متابعةً"}</span>
        </div>
        <div className="dp-lawyers-row">
          {topLawyersData.map(l => (
            <div key={l.id} className="dp-lawyer-card" onClick={() => navigate("/lawyers")}>
              <div className="dp-lawyer-avatar" style={{ background: l.color }}>{l.initial}</div>
              <div className="dp-lawyer-name">{l.name}</div>
              <div className="dp-lawyer-field">{t(l.fieldKey) || l.fieldKey}</div>
              <div className="dp-lawyer-followers">
                <span className="dp-followers-icon">👥</span>
                {l.followers} {t('followersCount') || "متابع"}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
