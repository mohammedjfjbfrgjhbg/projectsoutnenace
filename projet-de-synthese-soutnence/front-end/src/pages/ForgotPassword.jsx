import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import './ForgotPassword.css';
import { useLanguage } from '../context/LanguageContext';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
    
    // Inlines for states
    const checkEmailText = language === 'darija' ? 'تفقد بريدك الإلكتروني' : (language === 'fr' ? 'Vérifiez vos e-mails' : 'Check your email');
    const checkEmailDesc = language === 'darija' ? 'لقد أرسلنا تعليمات الاسترداد إلى بريدك' : (language === 'fr' ? 'Nous avons envoyé les instructions de récupération à votre e-mail' : 'We sent recovery instructions to your email');

    return (
        <div className="auth-page-wrapper" dir={dir}>
            <div className="auth-bg-motif">
                <ShieldCheck size={500} strokeWidth={0.5} className="bg-icon" />
            </div>

            <div className="auth-container animate-fade-in">
                <div className="auth-card glass">
                    <div className="auth-header">
                        <div className="auth-logo-box">
                            <img src="/logo-transparent.png" className="logo-icon-img" alt="حقي" />
                            <span className="logo-name">GIVENX</span>
                            <span className="logo-tag">{t('brandBadge')}</span>
                        </div>
                        
                        {!submitted ? (
                            <>
                                <h1 className="auth-title">{t('forgotPasswordTitle')}</h1>
                                <p className="auth-subtitle">{t('forgotPasswordSubtitle')}</p>
                            </>
                        ) : (
                            <div className="success-state animate-bounce-in">
                                <CheckCircle size={60} color="#22c55e" strokeWidth={1.5} />
                                <h1 className="auth-title mt-4">{checkEmailText}</h1>
                                <p className="auth-subtitle">{checkEmailDesc}</p>
                            </div>
                        )}
                    </div>

                    {!submitted ? (
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="auth-input-group">
                                <div className="input-wrap">
                                    <Mail className="field-icon" size={20} />
                                    <input type="email" placeholder="E-mail" required />
                                </div>
                            </div>

                            <button type="submit" className="auth-submit-btn">
                                {t('sendResetLink')} <ArrowRight size={18} className="ml-2" style={{ transform: dir === 'ltr' ? 'none' : 'rotate(180deg)' }} />
                            </button>
                        </form>
                    ) : (
                        <div className="auth-extra text-center mt-6">
                            <p className="no-receive">{t('noReceiveEmail')}</p>
                            <button className="resend-btn" onClick={() => setSubmitted(false)}>{t('resendBtn')}</button>
                        </div>
                    )}

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                             {t('backToLogin')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
