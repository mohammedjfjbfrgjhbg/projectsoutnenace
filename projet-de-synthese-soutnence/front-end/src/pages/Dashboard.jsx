import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  MessageSquare, 
  LogOut, 
  Plus, 
  Clock, 
  ExternalLink,
  Crown,
  Search,
  Bell,
  Settings,
  ShieldCheck
} from 'lucide-react';
import './Dashboard.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [contractsList, setContractsList] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Load user from localStorage or API
    const localUser = localStorage.getItem('user');
    if (localUser) {
      setUser(JSON.parse(localUser));
    }

    // 2. Fetch fresh data from backend
    const fetchData = async () => {
      try {
        setLoading(true);
        const meRes = await api.get('/me');
        setUser(meRes.data.user);
        localStorage.setItem('user', JSON.stringify(meRes.data.user));

        const contractsRes = await api.get('/contracts');
        setContractsList(contractsRes.data);

        const appointmentsRes = await api.get('/appointments');
        setAppointmentsList(appointmentsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // Compute stats dynamically
  const stats = [
    { 
      id: 1, 
      label: t('generatedContracts'), 
      value: contractsList.length.toString().padStart(2, '0'), 
      icon: <FileText size={20} />, 
      color: '#064e3b', 
      trend: '+100%' 
    },
    { 
      id: 2, 
      label: t('aiQuestions'), 
      value: user?.is_premium ? '15' : '05', 
      icon: <MessageSquare size={20} />, 
      color: '#b8860b', 
      trend: '+5%' 
    },
    { 
      id: 3, 
      label: t('consultations'), 
      value: appointmentsList.length.toString().padStart(2, '0'), 
      icon: <Calendar size={20} />, 
      color: '#0369a1', 
      trend: '0%' 
    },
  ];

  const username = user?.name || (language === 'darija' ? 'مستخدم' : 'User');
  const initial = username.charAt(0);
  const direction = language === 'en' || language === 'fr' ? 'ltr' : 'rtl';

  return (
    <div className="db-premium-container" dir={direction}>
      
      {/* Top Navigation Bar */}
      <nav className="db-top-nav">
        <div className="nav-left">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder={t('searchPlaceholder')} />
          </div>
        </div>
        <div className="nav-right">
          <div className="top-user-info">
            <span className="top-username">{username}</span>
            <div className="top-avatar">{initial}</div>
          </div>
          <div className="nav-divider"></div>
          <button className="nav-icon-btn" onClick={() => navigate('/notifications')}>
            <Bell size={20} /><span className="notif-dot"></span>
          </button>
          <button className="nav-icon-btn" onClick={() => navigate('/settings')}>
            <Settings size={20} />
          </button>
          <button className="nav-icon-btn logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>
      
      <div className="db-content-grid">
        
        {/* Main Content Area */}
        <div className="db-main-area">
          
          <header className="welcome-hero">
            <div className="hero-content">
              <div className="user-profile-badge">
                <div className="avatar-wrapper">
                  <span className="avatar-letter">{initial}</span>
                  <div className="status-indicator"></div>
                </div>
                <div className="profile-badge-text">
                  <h3>{t('helloUser')}{username}</h3>
                  <p>{user?.is_premium ? t('premiumMember') : t('memberHaqqi')}</p>
                </div>
              </div>
              <div className="hero-message">
                {appointmentsList.filter(a => a.status === 'confirmed').length > 0 ? (
                  <>
                    <h1>{t('upcomingConsultationsMsg').split(' ')[0]} <span className="highlight-text">{appointmentsList.filter(a => a.status === 'confirmed').length} {t('consultations')}</span> {t('upcomingConsultationsMsg').split(' ').slice(1).join(' ')}</h1>
                    <p>{t('upcomingConsultationsDesc')}</p>
                  </>
                ) : (
                  <>
                    <h1>{t('welcomeToHaqqi').split(' ').slice(0, -2).join(' ')} <span className="highlight-text">{t('welcomeToHaqqi').split(' ').slice(-2).join(' ')}</span></h1>
                    <p>{t('welcomeToHaqqiDesc')}</p>
                  </>
                )}
                <div className="hero-actions">
                  <button className="btn-primary" onClick={() => navigate('/contracts')}>{t('reviewContracts')}</button>
                  <button className="btn-outline" onClick={() => navigate('/lawyers')}>{t('findLawyer')}</button>
                </div>
              </div>
            </div>
            <div className="hero-illustration">
              <ShieldCheck size={120} strokeWidth={1} />
            </div>
          </header>

          <section className="stats-grid">
            {stats.map(stat => (
              <div key={stat.id} className="modern-stat-card">
                <div className="stat-icon-bg" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <span className="stat-label">{stat.label}</span>
                  <div className="stat-row">
                    <h2 className="stat-number">{stat.value}</h2>
                    <span className={`stat-trend-tag ${stat.trend.startsWith('+') ? 'up' : ''}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <div className="activity-grid">
            <div className="activity-card large">
              <div className="card-header">
                <h3>{t('recentContracts')}</h3>
                <button className="text-link" onClick={() => navigate('/contracts')}>{t('viewAll')}</button>
              </div>
              <div className="contract-table">
                {loading ? (
                  <p style={{ padding: '20px', opacity: 0.7 }}>{t('loading')}</p>
                ) : contractsList.length > 0 ? (
                  contractsList.slice(0, 3).map(contract => (
                    <div key={contract.id} className="contract-row">
                      <div className="c-info">
                        <div className="c-icon"><FileText size={18} /></div>
                        <div>
                          <h4>{contract.title}</h4>
                          <span className="c-date">{new Date(contract.created_at).toLocaleDateString(language === 'darija' ? 'ar-MA' : (language === 'fr' ? 'fr-FR' : 'en-US'), { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className={`c-status success`}>
                        {t('completed')}
                      </div>
                      <button className="c-action-btn" onClick={() => navigate('/contracts', { state: { activeContract: contract } })}><ExternalLink size={16} /></button>
                    </div>
                  ))
                ) : (
                  <p style={{ padding: '20px', opacity: 0.6, textAlign: 'center' }}>{t('noContractsYet')}</p>
                )}
              </div>
            </div>

            <div className="activity-card small">
              <div className="card-header">
                <h3>{t('subscriptionStatus')}</h3>
              </div>
              <div className="sub-widget">
                <div className="sub-plan">
                  <div className="plan-icon"><Crown size={24} /></div>
                  <div>
                    <h4>{user?.is_premium ? t('premiumPlan') : t('freePlan')}</h4>
                    <span className="plan-exp">
                      {user?.is_premium ? t('planActivePremium') : t('limitedBalance')}
                    </span>
                  </div>
                </div>
                <div className="usage-stats">
                  <div className="usage-item">
                    <span>{t('aiCredit')}</span>
                    <span dir="ltr">{user?.is_premium ? t('unlimited') : '5 / 15'}</span>
                  </div>
                  <div className="progress-bar-small">
                    <div className="progress-fill" style={{ width: user?.is_premium ? '100%' : '33%' }}></div>
                  </div>
                </div>
                {!user?.is_premium && (
                  <button className="btn-upgrade" onClick={() => navigate('/pricing')}>{t('upgradeAccount')}</button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Side Widgets */}
        <div className="db-side-widgets">
          <div className="widget-card appointment-widget">
            <h3>{t('upcomingAppointments')}</h3>
            <div className="apt-list">
              {loading ? (
                <p style={{ opacity: 0.7 }}>{t('loading')}</p>
              ) : appointmentsList.length > 0 ? (
                appointmentsList.slice(0, 3).map(consult => (
                  <div key={consult.id} className="apt-item">
                    <div className="apt-date-box">
                      <span className="day">{consult.date_string.split(' ')[0]}</span>
                      <span className="month">{consult.date_string.split(' ')[1]}</span>
                    </div>
                    <div className="apt-details">
                      <h4>{consult.lawyer?.name || (language === 'darija' ? 'مستشار قانوني' : 'Legal Advisor')}</h4>
                      <span><Clock size={12} /> {consult.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ opacity: 0.6, padding: '10px 0', textAlign: 'center' }}>{t('noUpcomingAppointments')}</p>
              )}
            </div>
            <button className="btn-block" onClick={() => navigate('/lawyers')}>{t('bookNewAppointment')}</button>
          </div>

          <div className="widget-card quick-actions">
            <h3>{t('quickLinks')}</h3>
            <div className="action-btns">
              <button className="action-chip" onClick={() => navigate('/ai')}><MessageSquare size={16} /> {t('askAssistant')}</button>
              <button className="action-chip" onClick={() => navigate('/contracts')}><Plus size={16} /> {t('draftAndGenerate').split(' ')[0]}</button>
              <button className="action-chip" onClick={() => navigate('/lawyers')}><Calendar size={16} /> {t('contactLawyer')}</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
