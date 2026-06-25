import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, XCircle, LogOut, RefreshCw } from 'lucide-react';
import api from '../services/api';
import './PendingApproval.css';
import { useLanguage } from '../context/LanguageContext';

const PendingApproval = () => {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const [status, setStatus] = useState('pending_review');
    const [reason, setReason] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const response = await api.get('/me');
            const user = response.data.user;
            setName(user.name);
            
            if (user.role === 'lawyer' && user.lawyer) {
                const lawyerStatus = user.lawyer.verification_status;
                setStatus(lawyerStatus);
                setReason(user.lawyer.rejection_reason || '');
                
                if (lawyerStatus === 'approved') {
                    localStorage.setItem('user', JSON.stringify(user));
                    navigate('/lawyer-dashboard');
                }
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Error fetching user status:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.clear();
            navigate('/login');
        }
    };

    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
    const refreshText = language === 'darija' ? 'تحديث الحالة' : (language === 'fr' ? 'Actualiser' : 'Refresh');
    const welcomePrefix = language === 'darija' ? 'أهلاً بك الأستاذ(ة) ' : (language === 'fr' ? 'Bienvenue Maître ' : 'Welcome Counsel ');

    if (loading) {
        return (
            <div className="pending-page-wrapper" dir={dir}>
                <div className="pending-card glass animate-fade-in">
                    <RefreshCw className="spinner-icon" size={40} />
                    <p className="mt-4" style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pending-page-wrapper" dir={dir}>
            <div className="pending-card glass animate-fade-in">
                {status === 'rejected' ? (
                    <div className="status-section rejected animate-slide-in">
                        <div className="status-icon-box red-glow">
                            <XCircle size={48} />
                        </div>
                        <h1 className="status-title text-red">{t('verificationRejectedTitle')}</h1>
                        <p className="status-desc">
                            {t('verificationRejectedDesc') ? t('verificationRejectedDesc').replace('{name}', name) : `${welcomePrefix} ${name} ...`}
                        </p>
                        
                        {reason && (
                            <div className="rejection-reason-box">
                                <strong>{t('verificationRejectedReason')}</strong>
                                <p>{reason}</p>
                            </div>
                        )}

                        <p className="contact-support-text">
                            {t('verificationRejectedTip')}
                        </p>
                        
                        <div className="pending-actions-row">
                            <button onClick={() => navigate('/lawyer-register')} className="btn-resubmit">
                                {t('resubmitRequest')}
                            </button>
                            <button onClick={handleLogout} className="btn-logout-pending">
                                <LogOut size={16} /> {t('logout')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="status-section pending animate-slide-in">
                        <div className="status-icon-box blue-glow">
                            <Clock size={48} className="pulse-clock" />
                        </div>
                        <h1 className="status-title">{t('verificationPendingReviewTitle')}</h1>
                        <p className="status-desc">
                            {welcomePrefix} <strong>{name}</strong>. {t('verificationPendingReviewDesc')}
                        </p>
                        <p className="status-subdesc">
                            {t('verificationPendingReviewSub')}
                        </p>
                        <div className="status-badge-pending">{t('verificationStatusText')}</div>
                        
                        <div className="pending-actions-row mt-4">
                            <button onClick={checkStatus} className="btn-refresh">
                                <RefreshCw size={16} /> {refreshText}
                            </button>
                            <button onClick={handleLogout} className="btn-logout-pending">
                                <LogOut size={16} /> {t('logout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingApproval;
