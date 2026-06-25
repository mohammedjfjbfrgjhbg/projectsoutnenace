import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Shield, 
  CreditCard, 
  ChevronRight, 
  Mail, 
  Phone, 
  LogOut,
  MapPin,
  Lock,
  Globe
} from 'lucide-react';
import './UserSettings.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const UserSettings = () => {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'profile', label: t('profileTab'), icon: <UserIcon size={20} /> },
    { id: 'security', label: t('securityTab'), icon: <Shield size={20} /> },
    { id: 'billing', label: t('billingTab'), icon: <CreditCard size={20} /> },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/profile');
        const userData = response.data.user;
        setUser(userData);
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setAddress(userData.address || '');
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const payload = { name, phone, address };
      if (password) payload.password = password;

      const response = await api.put('/profile', payload);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setMessage(t('saveSuccess'));
      setPassword('');
    } catch (err) {
      console.error(err);
      setMessage(t('saveError'));
    } finally {
      setSubmitting(false);
    }
  };

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

  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="settings-page-container" dir={dir}>
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ChevronRight size={20} style={{ transform: dir === 'ltr' ? 'rotate(180deg)' : 'none' }} /> {t('backToDashboard')}
        </button>
        <h1>{t('accountSettings')}</h1>
        <p>{t('manageSettingsSub')}</p>
      </div>

      <div className="settings-content-wrapper">
        <aside className="settings-sidebar">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
          <div className="sidebar-divider"></div>
          <button className="tab-btn logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>{t('logout')}</span>
          </button>
        </aside>

        <main className="settings-main-panel">
          {activeTab === 'profile' && (
            <form className="settings-card" onSubmit={handleUpdateProfile}>
              <h3>{t('personalInfo')}</h3>
              
              {message && <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRight: '4px solid var(--gold)', borderLeft: dir === 'ltr' ? '4px solid var(--gold)' : 'none', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '15px' }}>{message}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label>{t('fullName')}</label>
                  <div className="input-with-icon">
                    <UserIcon size={18} />
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>{t('emailReadOnly')}</label>
                  <div className="input-with-icon" style={{ opacity: 0.6 }}>
                    <Mail size={18} />
                    <input type="email" value={user?.email || ''} readOnly disabled />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('phone')}</label>
                  <div className="input-with-icon">
                    <Phone size={18} />
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('cityAddress')}</label>
                  <div className="input-with-icon">
                    <MapPin size={18} />
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Dynamic Language Selection Input */}
                <div className="form-group">
                  <label>{t('languageSelect')}</label>
                  <div className="input-with-icon select-wrap">
                    <Globe size={18} />
                    <select 
                      value={language} 
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="lang-select-field"
                    >
                      <option value="darija">الدارجة المغربية (Darija)</option>
                      <option value="fr">Français (French)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

              </div>
              <button type="submit" className="btn-save" disabled={submitting}>
                {submitting ? t('saving') : t('saveChanges')}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form className="settings-card" onSubmit={handleUpdateProfile}>
              <h3>{t('securityHeader')}</h3>
              
              {message && <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRight: '4px solid var(--gold)', borderLeft: dir === 'ltr' ? '4px solid var(--gold)' : 'none', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '15px' }}>{message}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label>{t('newPasswordLabel')}</label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input 
                      type="password" 
                      placeholder={t('editPasswordPlaceholder')} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-save" disabled={submitting}>
                {submitting ? t('saving') : t('updatePassword')}
              </button>
            </form>
          )}

          {activeTab === 'billing' && (
            <div className="settings-card">
              <h3>{t('billingHeader')}</h3>
              <div className="current-plan-banner">
                <div className="plan-info">
                  <h4>{user?.is_premium ? t('billingPremium') : t('billingFree')}</h4>
                  <p>{user?.is_premium ? t('premiumPlanDesc') : t('freePlanDesc')}</p>
                </div>
                <span className="plan-price">{user?.is_premium ? t('planStatusActive') : t('planPriceFree')}</span>
              </div>
              <div className="billing-actions">
                <button className="btn-secondary" onClick={() => navigate('/pricing')}>{t('viewPlans')}</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserSettings;
