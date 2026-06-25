import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, Download, Calendar, DollarSign } from 'lucide-react';
import './LawyerEarnings.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const LawyerEarnings = () => {
  const { language, t } = useLanguage();
  const [view, setView] = useState('weekly');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error('Error loading earnings details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, []);

  // Filter completed/confirmed consultations
  const confirmedApps = appointments.filter(app => app.status === 'confirmed' || app.status === 'completed');

  // Compute stats
  const totalEarningsVal = confirmedApps.reduce((sum, app) => sum + parseFloat(app.price || 0), 0);
  
  // Calculate current month's earnings
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed
  
  const currentMonthApps = confirmedApps.filter(app => {
    if (!app.created_at) return false;
    const date = new Date(app.created_at);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });

  const monthlyEarningsVal = currentMonthApps.reduce((sum, app) => sum + parseFloat(app.price || 0), 0);

  // Available balance
  const availableBalance = (totalEarningsVal * 0.8).toFixed(2);
  const currency = (language === 'en' || language === 'fr') ? 'MAD' : 'د.م';

  // Map to transaction structures
  const transactions = confirmedApps.map(app => ({
    id: app.id,
    type: t('legalConsultationType') || 'استشارة قانونية',
    client: app.user?.name || t('defaultClientName') || 'عميل',
    amount: `+${app.price} ${currency}`,
    date: app.date_string || t('recentDateLabel') || 'مؤخراً',
    status: t('completed') || 'مكتمل'
  }));

  const weeklyData = [
    { label: t('mon') || 'إثن', height: '40%' },
    { label: t('tue') || 'ثلا', height: '60%' },
    { label: t('wed') || 'أرب', height: '30%' },
    { label: t('thu') || 'خمي', height: '85%', active: true },
    { label: t('fri') || 'جمع', height: '50%' },
    { label: t('sat') || 'سبت', height: '70%' },
    { label: t('sun') || 'أحد', height: '45%' },
  ];

  const monthlyData = [
    { label: t('jan') || 'يناير', height: '30%' },
    { label: t('feb') || 'فبراير', height: '45%' },
    { label: t('mar') || 'مارس', height: '60%' },
    { label: t('apr') || 'أبريل', height: '80%', active: true },
    { label: t('may') || 'ماي', height: '20%' },
    { label: t('jun') || 'يونيو', height: '0%' },
  ];

  const currentData = view === 'weekly' ? weeklyData : monthlyData;
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="le-wrapper animate-fade-in" dir={dir}>
      <div className="le-header">
        <div>
          <h1>{t('earningsWalletTitle')}</h1>
          <p>{t('earningsWalletSub')}</p>
        </div>
        <button className="le-withdraw-btn" onClick={() => alert(t('withdrawAlert'))}>
          <ArrowDownCircle size={18} /> {t('requestWithdrawalBtn')}
        </button>
      </div>

      {loading ? (
        <p style={{ padding: '30px', textAlign: 'center', opacity: 0.7 }}>{t('loadingWallet')}</p>
      ) : (
        <>
          <div className="le-main-stats">
            <div className="le-stat-card primary">
              <div className="stat-card-info">
                <span className="stat-label">{t('availableBalanceLabel')}</span>
                <h2 className="stat-value">{availableBalance} {currency}</h2>
                <div className="stat-badge"><TrendingUp size={12} /> +12.5% {t('previousMonthComparison')}</div>
              </div>
              <div className="stat-icon-bg">
                <Wallet size={48} />
              </div>
            </div>

            <div className="le-secondary-stats">
              <div className="le-small-stat">
                <div className="small-stat-icon green"><ArrowUpCircle size={20} /></div>
                <div>
                  <span className="small-label">{t('totalIncomeLabel')}</span>
                  <span className="small-value">{totalEarningsVal} {currency}</span>
                </div>
              </div>
              <div className="le-small-stat">
                <div className="small-stat-icon blue"><Calendar size={20} /></div>
                <div>
                  <span className="small-label">{t('thisMonthEarningsLabel')}</span>
                  <span className="small-value">{monthlyEarningsVal} {currency}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="le-content-grid">
            <div className="le-chart-card">
              <div className="card-header">
                <h3>{t('performanceChartTitle')} ({view === 'weekly' ? t('last7Days') : t('thisYear')})</h3>
                <select className="le-select" value={view} onChange={(e) => setView(e.target.value)}>
                  <option value="weekly">{t('weeklyView')}</option>
                  <option value="monthly">{t('monthlyView')}</option>
                </select>
              </div>
              <div className="le-mock-chart">
                {currentData.map((d, i) => (
                  <div key={i} className={`chart-bar ${d.active ? 'active' : ''}`} style={{ height: d.height }}>
                    <span className="bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="le-history-card">
              <div className="card-header">
                <h3>{t('transactionsHistoryTitle')}</h3>
                <button className="le-export-btn" onClick={() => window.print()}><Download size={16} /> {t('exportReportBtn')}</button>
              </div>
              <div className="le-transactions">
                {transactions.length > 0 ? (
                  transactions.map(t => (
                    <div key={t.id} className="le-transaction-item">
                      <div className="t-icon income">
                        <ArrowUpCircle size={18} />
                      </div>
                      <div className="t-info">
                        <h4>{t.client}</h4>
                        <span>{t.type} • {t.date}</span>
                      </div>
                      <div className="t-amount-box">
                        <span className="t-amount positive">
                          {t.amount}
                        </span>
                        <span className="t-status">{t.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ padding: '30px', textAlign: 'center', opacity: 0.6 }}>{t('noTransactionsRecorded')}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LawyerEarnings;
