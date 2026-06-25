import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Zap, Crown, ChevronRight, ChevronLeft } from 'lucide-react';
import './Pricing.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Pricing = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
  const BackIcon = (language === 'en' || language === 'fr') ? ChevronLeft : ChevronRight;

  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    // Load local user
    const localUser = localStorage.getItem('user');
    if (localUser) {
      setUser(JSON.parse(localUser));
    }

    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await api.get('/pricing/plans');
        setPlans(response.data);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (planId, planName) => {
    if (submitting) return;
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await api.post('/pricing/subscribe', { plan_id: planId });
      
      // Update local storage user premium status
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setFeedback({
        type: 'success',
        message: (t('subscribeSuccessRedirect') || 'تم ترقية حسابك بنجاح إلى {planName}! يتم الآن توجيهك إلى لوحة التحكم...').replace('{planName}', planName)
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Subscription error:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || t('subscribeErrorAlert') || 'حدث خطأ أثناء الاشتراك. يرجى المحاولة لاحقاً.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Static decorations matching the original designs, now localized
  const planDecorations = {
    1: {
      desc: t('plan1Desc'),
      features: [
        t('plan1Feature1'),
        t('plan1Feature2'),
        t('plan1Feature3'),
        t('plan1Feature4'),
      ],
      highlight: false
    },
    2: {
      desc: t('plan2Desc'),
      features: [
        t('plan2Feature1'),
        t('plan2Feature2'),
        t('plan2Feature3'),
        t('plan2Feature4'),
        t('plan2Feature5'),
        t('plan2Feature6')
      ],
      highlight: true
    },
    3: {
      desc: t('plan3Desc'),
      features: [
        t('plan3Feature1'),
        t('plan3Feature2'),
        t('plan3Feature3'),
        t('plan3Feature4'),
        t('plan3Feature5'),
        t('plan3Feature6')
      ],
      highlight: false
    }
  };

  return (
    <div className="pricing-page-wrapper" dir={dir}>
      <div className="pricing-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
           <BackIcon size={20} /> {t('backToDashboard')}
        </button>
        <h1>{t('pricingTitle') || 'اختر الخطة المناسبة لاحتياجاتك'}</h1>
        <p>{t('pricingPageSubtitle') || 'استثمر في حمايتك القانونية مع باقات حقي المرنة والقابلة للإلغاء في أي وقت.'}</p>
      </div>

      {feedback.message && (
        <div 
          className={feedback.type === 'success' ? 'auth-success-msg' : 'auth-error-msg'}
          style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'center' }}
        >
          {feedback.message}
        </div>
      )}

      <div className="plans-container">
        {loading ? (
          <p style={{ color: 'white', opacity: 0.8, fontSize: '1.2rem' }}>{t('loadingPlans') || 'جاري تحميل الباقات...'}</p>
        ) : plans.map((plan, index) => {
          const deco = planDecorations[plan.id] || { desc: plan.description, features: [], highlight: false };
          const isCurrentPlan = user?.is_premium 
            ? (plan.id > 1 && user.premium_until ? true : false) // Simplification for development
            : (plan.id === 1);

          return (
            <div key={plan.id} className={`plan-card ${deco.highlight ? 'highlighted' : ''}`}>
              {deco.highlight && <div className="popular-badge">{t('popularBadge')}</div>}
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="currency">MAD</span>
                  <span className="amount">{Math.round(plan.price)}</span>
                  <span className="period">{t('monthlyPeriod')}</span>
                </div>
                <p className="plan-desc">{deco.desc}</p>
              </div>

              <div className="plan-features">
                {deco.features.map((feature, idx) => (
                  <div key={idx} className="feature-item">
                    <div className="check-icon"><Check size={14} /></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                className={`plan-btn ${deco.highlight ? 'btn-gold' : ''} ${isCurrentPlan ? 'btn-disabled' : ''}`}
                disabled={isCurrentPlan || submitting}
                onClick={() => plan.id > 1 && handleSubscribe(plan.id, plan.name)}
              >
                {isCurrentPlan ? t('currentPlanLabel') : (plan.id === 1 ? t('pricingFreeTitle') : t('pricingPremiumBtn'))}
              </button>
            </div>
          );
        })}
      </div>

      <div className="pricing-footer">
        <div className="trust-badges">
          <div className="badge-item">
             <Shield size={24} />
             <span>{t('payoutSecure')}</span>
          </div>
          <div className="badge-item">
             <Zap size={24} />
             <span>{t('instantActivation')}</span>
          </div>
          <div className="badge-item">
             <Crown size={24} />
             <span>{t('moneyBackGuarantee')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

