import React, { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Bell, CreditCard, ExternalLink, Camera, Save, Globe } from 'lucide-react';
import './LawyerSettings.css';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const LawyerSettings = () => {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [field, setField] = useState('الأعمال');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState(500);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/profile');
        const refreshedUser = res.data.user;
        setUser(refreshedUser);
        
        setName(refreshedUser.name || '');
        setCity(refreshedUser.address || refreshedUser.lawyer?.city || '');
        
        if (refreshedUser.lawyer) {
          setPrice(refreshedUser.lawyer.price || 500);
          setField(refreshedUser.lawyer.field || 'الأعمال');
        }
      } catch (err) {
        console.error('Error fetching lawyer profile settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveChanges = async () => {
    setSaving(true);
    setMessage('');

    if (password && password !== confirmPassword) {
      setMessage(t('passwordsNotMatching'));
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name,
        address: city,
        price: parseInt(price),
        field
      };

      if (password) {
        payload.password = password;
      }

      const res = await api.put('/profile', payload);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setMessage(t('settingsSaveSuccess'));
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating lawyer settings:', err);
      setMessage(t('settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            <section className="ls-section">
              <h3 className="section-title">{t('avatarSectionTitle')}</h3>
              <div className="ls-avatar-edit">
                <div className="ls-avatar-big" style={{ backgroundColor: user?.lawyer?.avatar_color || '#d97706', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {name.charAt(0) || 'ع'}
                </div>
                <div className="ls-avatar-actions">
                   <button className="ls-btn-outline" onClick={() => alert(t('changingAvatarAlert'))}><Camera size={16} /> {t('changeAvatarBtn')}</button>
                   <span className="ls-hint">{t('avatarUploadHint')}</span>
                </div>
              </div>
            </section>

            <section className="ls-section">
              <h3 className="section-title">{t('professionalInfoSection')}</h3>
              <div className="ls-form-grid">
                <div className="ls-form-group">
                  <label>{t('fullName')}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="ls-form-group">
                  <label>{t('mainSpecializationLabel')}</label>
                  <select value={field} onChange={(e) => setField(e.target.value)}>
                    <option value="قانون الأعمال">{t('filterBusiness')}</option>
                    <option value="قانون الأسرة">{t('filterFamily')}</option>
                    <option value="القانون الجنائي">{t('filterCriminal')}</option>
                    <option value="قانون الشغل">{t('filterWork')}</option>
                    <option value="القانون العقاري">{t('filterRealEstate')}</option>
                  </select>
                </div>
                <div className="ls-form-group">
                  <label>{t('cityLabel')}</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div className="ls-form-group">
                  <label>{t('consultationPriceLabel')}</label>
                  <div className="input-with-label">
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    <span>MAD</span>
                  </div>
                </div>
                <div className="ls-form-group">
                  <label>{t('preferredLanguageLabel')}</label>
                  <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
                    <option value="darija">الدارجة المغربية (Darija)</option>
                    <option value="fr">Français (French)</option>
                    <option value="en">English (English)</option>
                  </select>
                </div>
              </div>
            </section>
          </>
        );
      case 'security':
        return (
          <section className="ls-section">
            <h3 className="section-title">{t('changePasswordSection')}</h3>
            <div className="ls-form-grid">
              <div className="ls-form-group">
                <label>{t('newPasswordLabel')}</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="ls-form-group">
                <label>{t('confirmNewPasswordLabel')}</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </section>
        );
      case 'notifications':
        return (
          <section className="ls-section">
            <h3 className="section-title">{t('notificationPreferencesSection')}</h3>
            <div className="ls-notif-list">
              <div className="ls-notif-item">
                <div>
                  <h4>{t('emailNotifTitle')}</h4>
                  <p>{t('emailNotifDesc')}</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="ls-notif-item">
                <div>
                  <h4>{t('browserNotifTitle')}</h4>
                  <p>{t('browserNotifDesc')}</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </section>
        );
      case 'payment':
        return (
          <section className="ls-section">
            <h3 className="section-title">{t('payoutMethodsSection')}</h3>
            <div className="ls-card-item active">
               <div className="ls-card-info">
                 <CreditCard size={24} />
                 <div>
                   <h4>{t('bankAccountTitle')}</h4>
                   <p>{t('bankAccountDesc')}</p>
                 </div>
               </div>
               <span className="ls-tag-success">{t('primaryTag')}</span>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="ls-wrapper animate-fade-in" dir={dir}>
      <div className="ls-header">
        <h1>{t('settings')}</h1>
        <p>{t('settingsDesc')}</p>
      </div>

      {loading ? (
        <p style={{ padding: '30px', textAlign: 'center', opacity: 0.7 }}>{t('loadingSettings')}</p>
      ) : (
        <div className="ls-container">
          {/* Settings Nav */}
          <div className="ls-nav" style={{ textAlign: dir === 'ltr' ? 'left' : 'right' }}>
            <button 
              className={`ls-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserIcon size={18} /> {t('personalAccountTab')}
            </button>
            <button 
              className={`ls-nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} /> {t('securitySettingsTab')}
            </button>
            <button 
              className={`ls-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} /> {t('notificationsSettingsTab')}
            </button>
            <button 
              className={`ls-nav-item ${activeTab === 'payment' ? 'active' : ''}`}
              onClick={() => setActiveTab('payment')}
            >
              <CreditCard size={18} /> {t('paymentsSettingsTab')}
            </button>
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <button onClick={handleLogout} className="ls-nav-item" style={{ color: '#ef4444', width: '100%', textAlign: dir === 'ltr' ? 'left' : 'right' }}>
                {t('logoutButton')}
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="ls-content">
            {message && <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRight: dir === 'rtl' ? '4px solid #d97706' : 'none', borderLeft: dir === 'ltr' ? '4px solid #d97706' : 'none', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '20px' }}>{message}</div>}

            {renderContent()}

            <div className="ls-footer">
              <button className="ls-save-btn" onClick={handleSaveChanges} disabled={saving}>
                <Save size={18} /> {saving ? t('savingButton') : t('saveChangesButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerSettings;
