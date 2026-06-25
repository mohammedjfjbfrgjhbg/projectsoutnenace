import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  MapPin, 
  Briefcase, 
  ChevronDown,
  ShieldCheck 
} from 'lucide-react';
import './Register.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [role, setRole] = useState('user'); // 'user' (client) or 'lawyer' (avocat)
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [address, setAddress] = useState('');
    const [specialty, setSpecialty] = useState('');
    
    // Status States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const specialties = [
        'Généraliste',
        'Droit des Affaires',
        'Droit Pénal',
        'Droit de la Famille',
        'Droit du Travail',
        'Droit Immobilier',
        'Autre'
    ];

    const getSpecialtyLabel = (spec) => {
        if (spec === 'Généraliste') return t('filterAll') || spec;
        if (spec === 'Droit des Affaires') return t('filterBusiness') || spec;
        if (spec === 'Droit Pénal') return t('filterCriminal') || spec;
        if (spec === 'Droit de la Famille') return t('filterFamily') || spec;
        if (spec === 'Droit du Travail') return t('filterWork') || spec;
        if (spec === 'Droit Immobilier') return t('filterRealEstate') || spec;
        return spec;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError(t('passwordsNotMatching') || 'كلمتا المرور غير متطابقتين.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/register', {
                name,
                email,
                password,
                phone,
                address,
                specialty: role === 'lawyer' ? (specialty || 'Généraliste') : null
            });

            setSuccess(t('signupSuccess') || 'تم تسجيل الحساب بنجاح! يتم الآن توجيهك...');
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            const registeredRole = response.data.user.role;
            setTimeout(() => {
                if (registeredRole === 'lawyer') {
                    navigate('/lawyer-dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 2000);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || t('signupError') || 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
    const hasAccountText = language === 'darija' ? 'لدي حساب بالفعل، ' : (language === 'fr' ? "J'ai déjà un compte, " : "Already have an account, ");

    return (
        <div className="auth-page-wrapper" dir={dir}>
            <div className="auth-bg-motif">
                <ShieldCheck size={500} strokeWidth={0.5} className="bg-icon" />
            </div>

            <div className="auth-container animate-fade-in">
                <div className="auth-card glass register">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-logo-box">
                            <img src="/logo-transparent.png" className="logo-icon-img" alt="حقي" />
                            <span className="logo-name">GIVENX</span>
                            <span className="logo-tag">{t('brandBadge')}</span>
                        </div>
                        <h1 className="auth-title">{t('register')}</h1>
                        <p className="auth-subtitle">
                            {role === 'lawyer' ? t('signupSubtitleLawyer') : t('signupSubtitleClient')}
                        </p>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="auth-role-tabs" dir={dir}>
                        <button 
                            type="button" 
                            className={`auth-role-tab ${role === 'user' ? 'active' : ''}`}
                            onClick={() => {
                                setRole('user');
                                setSpecialty('');
                            }}
                        >
                            {t('roleClient')}
                        </button>
                        <button 
                            type="button" 
                            className={`auth-role-tab ${role === 'lawyer' ? 'active' : ''}`}
                            onClick={() => navigate('/lawyer-register')}
                        >
                            {t('roleLawyer')}
                        </button>
                    </div>

                    {error && <div className="auth-error-msg">{error}</div>}
                    {success && <div className="auth-success-msg">{success}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <div className="input-wrap">
                                <User className="field-icon" size={18} />
                                <input 
                                    type="text" 
                                    placeholder={t('fullNamePlaceholder') || "Nom complet"} 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="auth-grid-split">
                            <div className="auth-input-group">
                                <div className="input-wrap">
                                    <Mail className="field-icon" size={18} />
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
                                    <Phone className="field-icon" size={18} />
                                    <input 
                                        type="tel" 
                                        placeholder={t('phonePlaceholder') || "Téléphone"} 
                                        value={phone} 
                                        onChange={(e) => setPhone(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="auth-grid-split">
                            <div className="auth-input-group">
                                <div className="input-wrap">
                                    <Lock className="field-icon" size={18} />
                                    <input 
                                        type={showPass ? "text" : "password"} 
                                        placeholder={t('passwordPlaceholder') || "Mot de passe"} 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                    />
                                    <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="auth-input-group">
                                <div className="input-wrap">
                                    <Lock className="field-icon" size={18} />
                                    <input 
                                        type={showConfirm ? "text" : "password"} 
                                        placeholder={t('confirmNewPasswordLabel') || "Confirmé"} 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        required 
                                    />
                                    <button type="button" className="toggle-pass" onClick={() => setShowConfirm(!showConfirm)}>
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <div className="input-wrap">
                                <MapPin className="field-icon" size={18} />
                                <input 
                                    type="text" 
                                    placeholder={t('addressPlaceholder') || "Adresse complète"} 
                                    value={address} 
                                    onChange={(e) => setAddress(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        {role === 'lawyer' && (
                            <div className="auth-input-group">
                                <div className="input-wrap select-wrap">
                                    <Briefcase className="field-icon" size={18} />
                                    <select 
                                        value={specialty} 
                                        onChange={(e) => setSpecialty(e.target.value)}
                                        required={role === 'lawyer'}
                                    >
                                        <option value="">{t('selectSpecialtyPlaceholder') || "Sélectionnez votre spécialité"}</option>
                                        {specialties.map(s => <option key={s} value={s}>{getSpecialtyLabel(s)}</option>)}
                                    </select>
                                    <ChevronDown className="select-arrow" size={16} />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? t('saving') : (role === 'lawyer' ? t('signupSubmitLawyer') : t('signupSubmitClient'))}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>{hasAccountText}<Link to="/login" className="cta-link">{t('login')}</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

