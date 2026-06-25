import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  CalendarCheck, 
  Wallet, 
  TrendingUp, 
  Plus, 
  Eye, 
  Heart,
  MessageCircle,
  MoreVertical,
  Star
} from 'lucide-react';
import './LawyerDashboard.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const LawyerDashboard = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local user metadata
    const localUser = localStorage.getItem('user');
    if (localUser) {
      setUser(JSON.parse(localUser));
    }

    const loadData = async () => {
      try {
        setLoading(true);
        // Load fresh user with profile info
        const profileRes = await api.get('/profile');
        const refreshedUser = profileRes.data.user;
        setUser(refreshedUser);
        localStorage.setItem('user', JSON.stringify(refreshedUser));

        // Load appointments
        const appRes = await api.get('/appointments');
        setAppointments(appRes.data);
      } catch (err) {
        console.error('Error loading lawyer dashboard details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute stats
  const upcomingCount = appointments.filter(app => app.status === 'confirmed').length;
  
  const totalEarnings = appointments
    .filter(app => app.status === 'confirmed')
    .reduce((sum, app) => sum + parseFloat(app.price || 0), 0);

  const ratingVal = user?.lawyer?.rating || 5.0;

  const stats = [
    { id: 2, label: t('upcomingAppointmentsLabel'), value: upcomingCount, icon: <CalendarCheck size={20} />, color: '#0369a1' },
    { id: 3, label: t('officeEarningsLabel'), value: `${totalEarnings} MAD`, icon: <Wallet size={20} />, color: '#16a34a' },
    { id: 4, label: t('accountRatingLabel'), value: `${ratingVal}/5`, icon: <Star size={20} />, color: '#d97706' },
  ];

  // Map database appointments to page structure
  const pendingOrConfirmedApps = appointments
    .filter(app => app.status === 'pending' || app.status === 'confirmed')
    .slice(0, 3);

  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="lawyer-db-wrapper" dir={dir}>
      
      {/* Header Area */}
      <header className="ldb-header animate-fade-in">
        <div className="ldb-welcome">
          <h1>{t('lawyerDashboardWelcome')}, <span className="text-primary">{user?.name || ''}</span> 👋</h1>
          <p>{t('lawyerDashboardSub')}</p>
        </div>
      </header>

      {/* Stats Section */}
      <section className="ldb-stats-section animate-slide-up">
        {stats.map(stat => (
          <div key={stat.id} className="ldb-stat-card">
            <div className="stat-card-top">
              <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-trend"><TrendingUp size={12} /> {t('stableTrend')}</div>
            </div>
            <div className="stat-card-body">
              <h3 className="stat-val">{stat.value}</h3>
              <p className="stat-name">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Main Grid */}
      <div className="ldb-main-grid animate-slide-up-delay">
        
        {/* Recent Messages & Tasks */}
        <div className="ldb-card animate-slide-up">
          <div className="ldb-card-header">
            <div>
              <h3>{t('liveSupportTitle')}</h3>
              <p>{t('liveSupportSub')}</p>
            </div>
          </div>
          <div className="ldb-video-list" style={{ padding: '20px', textAlign: 'center' }}>
            <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p style={{ fontSize: '0.95rem', opacity: 0.8 }}>{t('liveSupportDesc')}</p>
          </div>
          <button className="ldb-view-all" onClick={() => navigate('/lawyer-messages')}>{t('viewAllMessages')}</button>
        </div>

        {/* Upcoming Appointments */}
        <div className="ldb-card animate-slide-up">
          <div className="ldb-card-header">
            <div>
              <h3>{t('incomingAppointmentsTitle')}</h3>
              <p>{t('lawyerScheduleSub')}</p>
            </div>
          </div>
          <div className="ldb-list">
            {loading ? (
              <p style={{ padding: '20px', textAlign: 'center', opacity: 0.7 }}>{t('loadingConsultations')}</p>
            ) : pendingOrConfirmedApps.length > 0 ? (
              pendingOrConfirmedApps.map(app => {
                const clientName = app.user?.name || t('defaultClientName');
                const statusMap = {
                  confirmed: { text: t('confirmedFilter'), className: 'success' },
                  pending: { text: t('pendingFilter'), className: 'warning' }
                };
                const statusInfo = statusMap[app.status] || { text: app.status, className: 'warning' };

                return (
                  <div key={app.id} className="ldb-list-item">
                    <div className="item-main">
                       <div className="item-avatar">{clientName.charAt(0)}</div>
                       <div className="item-text">
                          <h4>{clientName}</h4>
                          <div className="item-meta">
                            <span>{app.day_name} ({app.date_string})</span>
                            <span className="meta-dot">•</span>
                            <span>{app.time}</span>
                          </div>
                       </div>
                    </div>
                    <div className="item-actions">
                      <div className={`status-pill ${statusInfo.className}`}>{statusInfo.text}</div>
                      <button 
                        className="join-call-btn" 
                        disabled={app.status !== 'confirmed'}
                        onClick={() => alert(`${t('joiningCallAlert')} ${clientName}...`)}
                      >
                        {t('joinCallBtn')}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ padding: '30px', textAlign: 'center', opacity: 0.6 }}>{t('noConsultationsScheduled')}</p>
            )}
          </div>
          <button className="ldb-view-all" onClick={() => navigate('/lawyer-appointments')}>{t('fullScheduleBtn')}</button>
        </div>

      </div>
    </div>
  );
};

export default LawyerDashboard;

