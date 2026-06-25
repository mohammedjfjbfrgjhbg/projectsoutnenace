import "./Footer.css";
import { useLanguage } from "../../context/LanguageContext";

function Footer() {
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
  
  return (
    <footer className="footer" dir={dir}>
      <div className="footer-main">
        {/* Column 1: Brand */}
        <div className="footer-col footer-brand">
          <span className="footer-logo">{t('brandBadge')}</span>
          <p className="footer-tagline">
            {t('footerTagline')}
          </p>
        </div>

        {/* Column 2: Services */}
        <div className="footer-col">
          <h4 className="footer-heading">{t('services')}</h4>
          <ul className="footer-links">
            <li><a href="/ai">{t('aiAssistant')}</a></li>
            <li><a href="#">{t('contracts')}</a></li>
            <li><a href="#">{t('lawyers')}</a></li>
            <li><a href="/culture">{t('legalCultureHeader')}</a></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="footer-col">
          <h4 className="footer-heading">{t('company')}</h4>
          <ul className="footer-links">
            <li><a href="#">{t('aboutUs')}</a></li>
            <li><a href="#">{t('blog')}</a></li>
            <li><a href="#">{t('joinAsLawyer')}</a></li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className="footer-col">
          <h4 className="footer-heading">{t('support')}</h4>
          <ul className="footer-links">
            <li><a href="#">FAQ</a></li>
            <li><a href="#">{t('contactUs')}</a></li>
            <li><a href="#">{t('privacy')}</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>{t('allRightsReserved')}</span>
        <span>{t('madeWithHeart')}</span>
      </div>
    </footer>
  );
}

export default Footer;
