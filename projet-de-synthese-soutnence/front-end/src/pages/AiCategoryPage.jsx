import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  MessageSquare, 
  FileText, 
  Gavel, 
  Info, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import ChatBox from '../components/Chat/ChatBox';
import categories from '../data/legalCategories';
import './AiCategoryPage.css';
import { useLanguage } from '../context/LanguageContext';

const AiCategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const chatRef = useRef();
  const [catData, setCatData] = useState(null);
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  useEffect(() => {
    const found = categories.find(c => c.name === category);
    if (found) {
      setCatData(found);
    }
  }, [category]);

  if (!catData) return <div className="loading">{t('loading')}</div>;

  const quickQuestions = [
    t('quickQuestion1').replace('{category}', t(catData.nameKey)),
    t('quickQuestion2').replace('{category}', t(catData.nameKey)),
    t('quickQuestion3').replace('{category}', t(catData.nameKey)),
    t('quickQuestion4').replace('{category}', t(catData.nameKey))
  ];

  return (
    <div className="cat-page-wrapper" dir={dir}>
      <header className="cat-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate('/ai')}>
            <ChevronRight size={20} /> {t('backToGeneralAssistant')}
          </button>
          <div className="cat-badge">{t('fieldHubTitlePrefix')} {t(catData.nameKey)}</div>
        </div>
        
        <div className="cat-hero-content">
          <div className="cat-icon-lg">{catData.icon}</div>
          <div className="cat-text">
            <h1>{t('aiHubTitle')} <span className="highlight">{t(catData.nameKey)}</span></h1>
            <p>{t('aiHubDesc').replace('{field}', t(catData.nameKey))}</p>
          </div>
        </div>
      </header>

      <div className="cat-layout">
        <aside className="cat-sidebar">
          <div className="sidebar-card">
            <h3><Info size={18} /> {t('quickTipsTitle')}</h3>
            <ul className="tips-list">
              <li>{t('tip1')}</li>
              <li>{t('tip2')}</li>
              <li>{t('tip3')}</li>
            </ul>
          </div>

          <div className="sidebar-card">
            <h3><FileText size={18} /> {t('contractTemplatesTitle')}</h3>
            <div className="template-list">
              <button className="template-item">
                <span>{t('templateContractBasic').replace('{category}', t(catData.nameKey))}</span>
                <ChevronRight size={14} />
              </button>
              <button className="template-item">
                <span>{t('templateCertification').replace('{category}', t(catData.nameKey))}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </aside>

        <main className="cat-main">
          <div className="quick-q-grid">
            {quickQuestions.map((q, idx) => (
              <button key={idx} className="q-card" onClick={() => chatRef.current?.sendMessage(q)}>
                <MessageSquare size={16} />
                <span>{q}</span>
              </button>
            ))}
          </div>

          <div className="chat-container-cat">
            <div className="chat-welcome">
              <Sparkles size={20} className="sparkle-icon" />
              <span>{t('chatWithAiCategory').replace('{category}', t(catData.nameKey))}</span>
            </div>
            <ChatBox ref={chatRef} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AiCategoryPage;
