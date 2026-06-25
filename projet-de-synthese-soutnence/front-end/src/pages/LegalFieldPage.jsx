import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Users, 
  PlayCircle, 
  Bot, 
  ChevronRight, 
  CheckCircle2,
  Calendar,
  MessageSquare,
  FileText
} from 'lucide-react';
import legalFieldsData from '../data/legalFieldsData';
import './LegalFieldPage.css';
import { useLanguage } from '../context/LanguageContext';

const LegalFieldPage = () => {
  const { fieldName } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (legalFieldsData[fieldName]) {
      setData(legalFieldsData[fieldName]);
    }
  }, [fieldName]);

  if (!data) return <div className="field-loading">{t('loadingFilesText') || "جاري تحضير الملفات..."}</div>;

  const fieldKeys = {
    "الجنائي": "filterCriminal",
    "العقار": "filterRealEstate",
    "الأعمال": "filterBusiness",
    "الشغل": "filterWork",
    "الأسرة": "filterFamily"
  };
  const fieldKey = fieldKeys[fieldName] || "allFilter";
  const translatedFieldName = t(fieldKey) || fieldName;

  const formatExp = (exp) => {
    if (language === 'en') {
      return exp.replace('سنة', 'years').replace('سنوات', 'years') + ' ' + t('experienceLabel');
    }
    if (language === 'fr') {
      return exp.replace('سنة', 'ans').replace('سنوات', 'ans') + ' ' + t('experienceLabel');
    }
    return exp + ' ' + t('experienceLabel');
  };

  const viewsLabel = t('viewsCount') || (language === 'darija' ? 'مشاهدة' : (language === 'fr' ? 'vues' : 'views'));
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="field-hub-container" dir={dir}>
      
      {/* Header Hub */}
      <header className="field-header">
        <button className="hub-back-btn" onClick={() => navigate('/discover')}>
          <ChevronRight size={20} style={{ transform: dir === 'ltr' ? 'rotate(180deg)' : 'none' }} /> {t('backToDiscoverBtn') || "العودة للاكتشاف"}
        </button>
        <div className="field-title-area">
          <div className="field-main-icon">{data.icon}</div>
          <div>
            <h1>{t('fieldHubTitlePrefix') || "قسـم"} <span className="highlight">{translatedFieldName}</span></h1>
            <p>{t(data.descriptionKey) || data.description}</p>
          </div>
        </div>
      </header>

      <div className="field-hub-grid">
        
        {/* Main Hub Content */}
        <div className="hub-main">
          
          {/* AI Assistant Section */}
          <section className="hub-card ai-hub">
            <div className="hub-card-header">
              <div className="title-with-icon">
                <Bot size={24} className="icon-gold" />
                <h3>{t('aiHubTitle') || "المساعد الذكي لـ"} {translatedFieldName}</h3>
              </div>
              <button className="btn-hub-primary" onClick={() => navigate(`/ai/${fieldName}`)}>{t('startConsultationBtn') || "ابدأ الاستشارة"}</button>
            </div>
            <p className="hub-card-desc">
              {t('aiHubDesc') ? t('aiHubDesc').replace('{field}', translatedFieldName) : `اطرح أسئلتك القانونية حول ${translatedFieldName} واحصل على إجابات فورية مدعمة بالنصوص القانونية المغربية.`}
            </p>
            <div className="ai-prompts-row">
              {data.promptsKeys ? data.promptsKeys.map((pk, idx) => (
                <span key={idx}>{t(pk)}</span>
              )) : data.prompts.map((p, idx) => (
                <span key={idx}>{p}</span>
              ))}
            </div>
          </section>

          {/* Lawyers Section */}
          <section className="hub-card">
            <div className="hub-card-header">
              <div className="title-with-icon">
                <Users size={24} className="icon-blue" />
                <h3>{t('prominentLawyersTitle') || "أبرز المحامين في"} {translatedFieldName}</h3>
              </div>
              <button className="btn-hub-link" onClick={() => navigate('/lawyers')}>{t('viewAllBtn') || "عرض الكل"}</button>
            </div>
            <div className="hub-lawyers-list">
              {data.lawyers.map(lawyer => (
                <div key={lawyer.id} className="hub-lawyer-item">
                  <div className="lawyer-hub-avatar">{lawyer.avatar}</div>
                  <div className="lawyer-hub-info">
                    <h4>{lawyer.name}</h4>
                    <div className="lawyer-meta">
                      <span><CheckCircle2 size={12} /> {formatExp(lawyer.experience)}</span>
                      <span>⭐ {lawyer.rating}</span>
                    </div>
                  </div>
                  <button className="btn-book-small" onClick={() => navigate('/lawyers')}><Calendar size={14} /> {t('lawyerBookingBtn') || "حجز"}</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Hub Content */}
        <aside className="hub-sidebar">
          
          {/* Legal Culture Section */}
          <section className="hub-card culture-hub">
            <div className="hub-card-header">
              <div className="title-with-icon">
                <PlayCircle size={24} className="icon-purple" />
                <h3>{t('legalCultureHeader') || "ثقافة قانونية"}</h3>
              </div>
            </div>
            <div className="hub-topics-list">
              {data.topics.map((topic, idx) => (
                <div key={idx} className="hub-topic-item">
                  <div className="topic-play-icon"><PlayCircle size={16} /></div>
                  <div className="topic-hub-details">
                    <h5>{t(topic.titleKey) || topic.title}</h5>
                    <span>{topic.views} {viewsLabel} • {topic.duration}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-hub-full" onClick={() => navigate('/discover')}>{t('watchMoreBtn') || "شاهد المزيد"}</button>
          </section>

          {/* Quick Resources */}
          <section className="hub-card resource-hub">
            <h3>{t('quickResourcesHeader') || "مصادر سريعة"}</h3>
            <div className="resource-btns">
              <button className="res-btn" onClick={() => navigate('/contracts')}><FileText size={18} /> {t('downloadTemplatesBtn') || "تحميل نماذج عقود"}</button>
              <button className="res-btn" onClick={() => navigate('/chat')}><MessageSquare size={18} /> {t('writtenConsultationBtn') || "استشارة مكتوبة"}</button>
            </div>
          </section>

        </aside>

      </div>
    </div>
  );
};

export default LegalFieldPage;
