import { useNavigate } from "react-router-dom";
import "./HeroSection.css";
import categories from "../../data/legalCategories";
import { useLanguage } from "../../context/LanguageContext";

function HeroSection({ onAsk, chatRef }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <section className="ai-hero" dir={dir}>
      <div className="ai-hero-content">
        <div className="hero-text-wrapper">
          <h1 className="hero-title">
            {t('chatHeaderMock')} <span className="robot-emoji">🤖</span>
          </h1>
          <p className="hero-desc">
            {t('chatWelcomeBody')}
          </p>
        </div>
        <div className="ai-categories">
          {categories.map((cat, index) => (
            <button key={index} className="category-chip" onClick={() => navigate(`/ai/${cat.name}`)}>
              <span className="cat-icon">{cat.icon}</span> {t(cat.nameKey) || cat.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;