import React from 'react';
import { Video, Plus, Eye, Heart, MoreVertical, Search, Filter } from 'lucide-react';
import './LawyerVideos.css';
import { useLanguage } from '../context/LanguageContext';

const LawyerVideos = () => {
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  const videos = [
    { id: 1, title: 'كيفاش تأسس شركة في المغرب خطوة بخطوة', date: 'منذ يومين', views: '2.4K', likes: '450', comments: 12, thumbnail: 'linear-gradient(135deg, #1e1b4b, #4f46e5)' },
    { id: 2, title: 'شنو دير إلى جراو عليك من الخدمة (الفصل التعسفي)', date: 'منذ أسبوع', views: '12K', likes: '1.2K', comments: 89, thumbnail: 'linear-gradient(135deg, #0f172a, #0369a1)' },
    { id: 3, title: 'إجراءات طلاق الشقاق والنفقة المترتبة عنه', date: 'منذ أسبوعين', views: '8K', likes: '890', comments: 45, thumbnail: 'linear-gradient(135deg, #052e16, #15803d)' },
    { id: 4, title: 'عقود الكراء التجاري: حق الزينة والاسترجاع', date: 'منذ شهر', views: '5.1K', likes: '320', comments: 18, thumbnail: 'linear-gradient(135deg, #450a0a, #b91c1c)' },
    { id: 5, title: 'كيفاش تحمي العلامة التجارية ديالك INPI', date: 'منذ شهرين', views: '3.3K', likes: '210', comments: 5, thumbnail: 'linear-gradient(135deg, #422006, #d97706)' },
  ];

  return (
    <div className="lv-wrapper animate-fade-in" dir={dir}>
      <div className="lv-header">
        <div>
          <h1>{t('myVideosTitle')}</h1>
          <p>{t('myVideosSub')}</p>
        </div>
        <button className="lv-upload-btn">
          <Plus size={18} /> {t('uploadNewVideo')}
        </button>
      </div>

      <div className="lv-toolbar">
        <div className="lv-search-box">
          <Search size={18} className="lv-search-icon" />
          <input type="text" placeholder={t('searchVideosPlaceholder')} />
        </div>
        <button className="lv-filter-btn">
          <Filter size={18} /> {t('filterLabel')}
        </button>
      </div>

      <div className="lv-grid">
        {videos.map(vid => (
          <div key={vid.id} className="lv-card animate-slide-up">
            <div className="lv-thumb" style={{ background: vid.thumbnail }}>
              <div className="lv-duration">0:45</div>
            </div>
            <div className="lv-info">
              <h3>{vid.title}</h3>
              <p className="lv-date">{vid.date}</p>
              
              <div className="lv-metrics">
                <div className="lv-metric"><Eye size={14} /> {vid.views}</div>
                <div className="lv-metric"><Heart size={14} /> {vid.likes}</div>
                <div className="lv-metric">💬 {vid.comments}</div>
              </div>
            </div>
            <button className="lv-more-opts"><MoreVertical size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LawyerVideos;
