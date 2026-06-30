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
  Globe,
  Bookmark,
  Folder,
  Trash2,
  Edit,
  FolderOpen
} from 'lucide-react';
import './UserSettings.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import postService from '../services/post.service';
import { BACKEND_URL } from '../config';

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

  // Saved Posts States
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('all'); // 'all', 'none', or id
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [editingCollectionName, setEditingCollectionName] = useState('');

  const tabs = [
    { id: 'profile', label: t('profileTab'), icon: <UserIcon size={20} /> },
    { id: 'security', label: t('securityTab'), icon: <Shield size={20} /> },
    { id: 'billing', label: t('billingTab'), icon: <CreditCard size={20} /> },
    { id: 'saved', label: t('savedTab') || 'المحفوظات', icon: <Bookmark size={20} /> },
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

  useEffect(() => {
    if (activeTab === 'saved') {
      loadCollections();
      loadSavedPosts(selectedCollectionId);
    }
  }, [activeTab, selectedCollectionId]);

  const loadCollections = async () => {
    try {
      const data = await postService.getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Error loading collections:', err);
    }
  };

  const loadSavedPosts = async (colId) => {
    setLoadingSaved(true);
    try {
      const filterId = (colId === 'all' || colId === 'none') ? null : colId;
      const data = await postService.getSavedPosts(filterId);
      
      // If we filtered locally for uncategorized ('none')
      if (colId === 'none') {
        setSavedPosts(data.filter(sp => !sp.collection_id));
      } else {
        setSavedPosts(data);
      }
    } catch (err) {
      console.error('Error loading saved posts:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleDeleteCollection = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذه المجموعة؟ لن يتم حذف المنشورات نفسها.')) return;
    try {
      await postService.deleteCollection(id);
      if (selectedCollectionId === id) {
        setSelectedCollectionId('all');
      }
      loadCollections();
    } catch (err) {
      console.error('Error deleting collection:', err);
    }
  };

  const handleRenameCollection = async (id, name) => {
    if (!name.trim()) return;
    try {
      await postService.updateCollection(id, name.trim());
      setEditingCollectionId(null);
      loadCollections();
    } catch (err) {
      console.error('Error renaming collection:', err);
    }
  };

  const handleUnsavePost = async (savedPostId, e) => {
    e.stopPropagation();
    if (!window.confirm('هل تريد إزالة هذا المنشور من المحفوظات؟')) return;
    try {
      await postService.removeSavedPost(savedPostId);
      setSavedPosts(prev => prev.filter(sp => sp.id !== savedPostId));
      loadCollections();
    } catch (err) {
      console.error('Error unsaving post:', err);
    }
  };

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

          {activeTab === 'saved' && (
            <div className="settings-saved-container">
              {/* Sidebar with Collections */}
              <div className="saved-collections-sidebar">
                <div className="sidebar-header">
                  <h4>مجموعات الحفظ</h4>
                </div>
                <div className="collections-menu-list">
                  <button 
                    className={`collection-menu-btn ${selectedCollectionId === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCollectionId('all')}
                  >
                    <Bookmark size={18} />
                    <span>الكل</span>
                  </button>
                  <button 
                    className={`collection-menu-btn ${selectedCollectionId === 'none' ? 'active' : ''}`}
                    onClick={() => setSelectedCollectionId('none')}
                  >
                    <Bookmark size={18} style={{ opacity: 0.5 }} />
                    <span>غير مصنفة</span>
                  </button>

                  <div className="collections-divider">المجموعات الخاصة</div>

                  {collections.map(col => (
                    <div 
                      key={col.id}
                      className={`collection-menu-btn-wrapper ${selectedCollectionId === col.id ? 'active' : ''}`}
                      onClick={() => setSelectedCollectionId(col.id)}
                    >
                      {editingCollectionId === col.id ? (
                        <div className="inline-rename-row" onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editingCollectionName}
                            onChange={e => setEditingCollectionName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleRenameCollection(col.id, editingCollectionName)}
                            className="inline-rename-input"
                            autoFocus
                          />
                          <button 
                            className="inline-rename-save"
                            onClick={() => handleRenameCollection(col.id, editingCollectionName)}
                          >
                            حفظ
                          </button>
                        </div>
                      ) : (
                        <>
                          <button className="collection-select-btn">
                            <Folder size={18} />
                            <span className="col-name-label">{col.name}</span>
                            <span className="col-count-badge">{col.saved_posts_count || 0}</span>
                          </button>
                          <div className="collection-actions-btns">
                            <button 
                              className="col-action-btn edit" 
                              title="تعديل الاسم"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCollectionId(col.id);
                                setEditingCollectionName(col.name);
                              }}
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="col-action-btn delete" 
                              title="حذف المجموعة"
                              onClick={(e) => handleDeleteCollection(col.id, e)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Saved Posts Grid / Content */}
              <div className="saved-posts-content-area">
                <div className="content-area-header">
                  <h3>
                    {selectedCollectionId === 'all' && 'كل المنشورات المحفوظة'}
                    {selectedCollectionId === 'none' && 'منشورات غير مصنفة'}
                    {typeof selectedCollectionId === 'number' && (collections.find(c => c.id === selectedCollectionId)?.name || 'المجموعة')}
                  </h3>
                </div>

                {loadingSaved ? (
                  <div className="saved-loading-spinner">جاري تحميل المنشورات...</div>
                ) : savedPosts.length > 0 ? (
                  <div className="saved-posts-grid">
                    {savedPosts.map(sp => {
                      const post = sp.post;
                      if (!post) return null;
                      const hasImages = post.images && post.images.length > 0;
                      return (
                        <div key={sp.id} className="saved-post-card" onClick={() => navigate('/community')}>
                          {hasImages && (
                            <div className="saved-post-thumbnail">
                              <img src={`${BACKEND_URL}${post.images[0]}`} alt="Post Thumbnail" />
                            </div>
                          )}
                          <div className="saved-post-info-block">
                            <div className="saved-post-author-row">
                              <span className="author-name">{post.user?.name || 'مستخدم'}</span>
                              <span className="saved-date">{new Date(sp.created_at).toLocaleDateString('ar-MA', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <p className="saved-post-preview-text">
                              {post.content ? (post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content) : 'منشور يحتوي على وسائط'}
                            </p>
                            <div className="saved-post-card-footer">
                              <button 
                                className="unsave-card-btn" 
                                onClick={(e) => handleUnsavePost(sp.id, e)}
                                title="إلغاء الحفظ"
                              >
                                <Trash2 size={14} /> إلغاء الحفظ
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="saved-empty-state">
                    <FolderOpen size={48} className="empty-folder-icon" />
                    <p>لا توجد منشورات محفوظة في هذه المجموعة.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserSettings;
