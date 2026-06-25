import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import './Login.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('user'); // 'user' (client) or 'lawyer' (avocat)
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Status States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/login', { email, password });
            const user = response.data.user;

            if (role === 'admin' && user.role !== 'admin') {
                setError(t('signupError') || 'عذراً، هذا الحساب ليس مسؤول إدارة (Admin).');
                api.post('/logout').catch(() => {});
                localStorage.clear();
                return;
            }
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'admin') {
                navigate('/secure-admin-8392');
            } else if (user.role === 'lawyer') {
                const status = user.lawyer?.verification_status;
                if (status === 'pending_review' || status === 'rejected') {
                    navigate('/pending-approval');
                } else {
                    navigate('/lawyer-dashboard');
                }
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || t('settingsSaveError') || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        } finally {
            setLoading(false);
        }
    };

    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
    const noAccountText = language === 'darija' ? 'إذا لم يكن لديك حساب، ' : (language === 'fr' ? "Si vous n'avez pas de compte, " : "If you don't have an account, ");

    return (
        <div className="auth-page-wrapper" dir={dir}>
            {/* Background Video */}
            <video className="auth-bg-video" autoPlay loop muted playsInline>
                <source src="/login-bg-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="auth-video-overlay"></div>

            {/* Background Branding Elements */}
            <div className="auth-bg-motif">
                <ShieldCheck size={500} strokeWidth={0.5} className="bg-icon" />
            </div>

            <div className="auth-container animate-fade-in">
                <div className="auth-card glass">
                    {/* Header: Logo & Title */}
                    <div className="auth-header">
                        <div className="auth-logo-box">
                            <img src="/logo.jpg" className="logo-icon-img" alt="حقي" />
                            <span className="logo-name">GIVENX</span>
                            <span className="logo-tag">{t('brandBadge')}</span>
                        </div>
                        <h1 className="auth-title">{t('login')}</h1>
                        <p className="auth-subtitle">
                            {role === 'lawyer' ? t('loginSubtitleLawyer') : 
                             role === 'admin' ? t('loginSubtitleAdmin') : 
                             t('loginSubtitleClient')}
                        </p>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="auth-role-tabs" dir={dir}>
                        <button 
                            type="button" 
                            className={`auth-role-tab ${role === 'user' ? 'active' : ''}`}
                            onClick={() => setRole('user')}
                        >
                            {t('roleClient')}
                        </button>
                        <button 
                            type="button" 
                            className={`auth-role-tab ${role === 'lawyer' ? 'active' : ''}`}
                            onClick={() => setRole('lawyer')}
                        >
                            {t('roleLawyer')}
                        </button>
                        <button 
                            type="button" 
                            className={`auth-role-tab ${role === 'admin' ? 'active' : ''}`}
                            onClick={() => setRole('admin')}
                        >
                            {t('roleAdmin')}
                        </button>
                    </div>

                    {error && <div className="auth-error-msg">{error}</div>}

                    {/* Form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <div className="input-wrap">
                                <Mail className="field-icon" size={20} />
                                <input 
                                    type="email" 
                                    placeholder="E-mail" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <div className="input-wrap">
                                <Lock className="field-icon" size={20} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder={t('passwordPlaceholder')} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                />
                                <button 
                                    type="button" 
                                    className="toggle-pass" 
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="auth-extra">
                            <Link to="/forgot-password" className="forgot-link">{t('forgotPasswordTitle')}</Link>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? t('saving') : 
                             (role === 'lawyer' ? t('loginSubmitLawyer') : 
                              role === 'admin' ? t('loginSubmitAdmin') : t('loginSubmitClient'))}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>{noAccountText}<Link to="/register" className="cta-link">{t('register')}</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

