import React, { useState, useRef } from 'react';
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
  Check,
  Camera,
  Upload,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  FileText
} from 'lucide-react';
import './LawyerRegister.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const LawyerRegister = () => {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
    const [step, setStep] = useState(1);
    
    // Toggle Password Visibility
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Form States - Step 1
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [address, setAddress] = useState('');

    // Form States - Step 2 (KYC files)
    const [cinFront, setCinFront] = useState(null);
    const [cinFrontPreview, setCinFrontPreview] = useState('');
    const [cinBack, setCinBack] = useState(null);
    const [cinBackPreview, setCinBackPreview] = useState('');
    const [selfie, setSelfie] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState('');
    
    // Camera state
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Form States - Step 3
    const [barNumber, setBarNumber] = useState('');
    const [barCity, setBarCity] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [professionalDoc, setProfessionalDoc] = useState(null);
    const [professionalDocName, setProfessionalDocName] = useState('');

    // Status States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const specialties = [
        { value: 'قانون الأسرة', key: 'specialtyFamily' },
        { value: 'قانون الأعمال', key: 'specialtyBusiness' },
        { value: 'القانون الجنائي', key: 'specialtyCriminal' },
        { value: 'قانون الشغل', key: 'specialtyLabor' },
        { value: 'قانون العقار', key: 'specialtyRealEstate' },
        { value: 'قانون المقاولات', key: 'specialtyCompanies' },
        { value: 'مستشار قانوني عام', key: 'specialtyGeneralAdvisor' }
    ];

    // File Drop/Upload Handlers
    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'cin_front') {
            setCinFront(file);
            setCinFrontPreview(URL.createObjectURL(file));
        } else if (type === 'cin_back') {
            setCinBack(file);
            setCinBackPreview(URL.createObjectURL(file));
        } else if (type === 'selfie') {
            setSelfie(file);
            setSelfiePreview(URL.createObjectURL(file));
        } else if (type === 'professional_doc') {
            setProfessionalDoc(file);
            setProfessionalDocName(file.name);
        }
    };

    // Camera Handlers
    const startCamera = async () => {
        setIsCameraActive(true);
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
        } catch (err) {
            console.error('Camera access error:', err);
            setError(t('cameraAccessError'));
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const captureSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, 400, 400);
            
            canvasRef.current.toBlob((blob) => {
                const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
                setSelfie(file);
                setSelfiePreview(URL.createObjectURL(file));
                stopCamera();
            }, 'image/jpeg', 0.95);
        }
    };

    // Navigation checks
    const nextStep = () => {
        setError('');
        if (step === 1) {
            if (!name || !email || !phone || !password || !address) {
                setError(t('fillRequiredFields'));
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                setError(t('enterValidEmail'));
                return;
            }
            if (password !== confirmPassword) {
                setError(t('passwordsNotMatching'));
                return;
            }
            if (password.length < 6) {
                setError(t('passwordMinLength'));
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!cinFront || !cinBack || !selfie) {
                setError(t('uploadIDAndSelfie'));
                return;
            }
            setStep(3);
        }
    };

    const prevStep = () => {
        setError('');
        stopCamera();
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!barNumber || !barCity || !specialty || !professionalDoc) {
            setError(t('fillProfessionalFields'));
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email.trim());
        formData.append('phone', phone);
        formData.append('password', password);
        formData.append('address', address);
        
        formData.append('cin_front', cinFront);
        formData.append('cin_back', cinBack);
        formData.append('selfie', selfie);
        
        formData.append('bar_number', barNumber);
        formData.append('bar_city', barCity);
        formData.append('specialty', specialty);
        formData.append('professional_doc', professionalDoc);

        try {
            const response = await api.post('/lawyer-register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            setSuccess(true);
            setTimeout(() => {
                navigate('/pending-approval');
            }, 4000);
        } catch (err) {
            console.error('Lawyer registration error:', err);
            if (err.response?.data?.errors) {
                const messages = Object.values(err.response.data.errors).flat();
                setError(messages.join(' | '));
            } else {
                setError(err.response?.data?.message || t('registrationSubmitError'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper lawyer-reg-wrapper">
            <div className="auth-bg-motif">
                <ShieldCheck size={500} strokeWidth={0.5} className="bg-icon" />
            </div>

            <div className="auth-container animate-fade-in">
                {success ? (
                    <div className="auth-card glass success-card" dir={dir}>
                        <div className="success-icon-wrap">
                            <Check size={48} className="success-icon" />
                        </div>
                        <h1 className="auth-title success-title">{t('requestSentSuccess')}</h1>
                        <p className="success-desc" dangerouslySetInnerHTML={{ __html: t('thankYouCounsel').replace('{name}', `<strong>${name}</strong>`) }} />
                        <p className="success-subdesc">
                            {t('lawyerPendingApprovalDesc')}
                        </p>
                        <div className="pending-loader-line"></div>
                        <span className="redirect-note">{t('redirectingToPending')}</span>
                    </div>
                ) : (
                    <div className="auth-card glass register lawyer-register-card" dir={dir}>
                        <div className="auth-header">
                            <div className="auth-logo-box">
                                <img src="/logo.png" className="logo-icon-img" alt="حقي" />
                                <span className="logo-name">GIVENX</span>
                                <span className="logo-tag">حقي</span>
                            </div>
                            <h1 className="auth-title">{t('registerNewLawyer')}</h1>
                            <p className="auth-subtitle">
                                {t('kycSubtitle')}
                            </p>
                        </div>

                        {/* Step Indicator */}
                        <div className="kyc-steps-indicator">
                            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                <div className="step-number">{step > 1 ? <Check size={14} /> : '1'}</div>
                                <span className="step-label">{t('personalInfo')}</span>
                            </div>
                            <div className="step-connector"></div>
                            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                                <div className="step-number">{step > 2 ? <Check size={14} /> : '2'}</div>
                                <span className="step-label">{t('proofOfIdentity')}</span>
                            </div>
                            <div className="step-connector"></div>
                            <div className={`step-item ${step === 3 ? 'active' : ''}`}>
                                <div className="step-number">3</div>
                                <span className="step-label">{t('professionalRegistration')}</span>
                            </div>
                        </div>

                        {error && <div className="auth-error-msg">{error}</div>}

                        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="auth-form mt-4">
                            
                            {/* STEP 1: Personal Info */}
                            {step === 1 && (
                                <div className="step-content animate-slide-in">
                                    <div className="auth-input-group">
                                        <label className="input-label">{t('fullNameIdCard')}</label>
                                        <div className="input-wrap">
                                            <User className="field-icon" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder={t('nameAndSurname')} 
                                                value={name} 
                                                onChange={(e) => setName(e.target.value)} 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    <div className="auth-grid-split">
                                        <div className="auth-input-group">
                                            <label className="input-label">{t('email')}</label>
                                            <div className="input-wrap">
                                                <Mail className="field-icon" size={18} />
                                                <input 
                                                    type="email" 
                                                    placeholder="example@law.ma" 
                                                    value={email} 
                                                    onChange={(e) => setEmail(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        <div className="auth-input-group">
                                            <label className="input-label">{t('phone')}</label>
                                            <div className="input-wrap">
                                                <Phone className="field-icon" size={18} />
                                                <input 
                                                    type="tel" 
                                                    placeholder="0612345678" 
                                                    value={phone} 
                                                    onChange={(e) => setPhone(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="auth-grid-split">
                                        <div className="auth-input-group">
                                            <label className="input-label">{t('passwordPlaceholder')}</label>
                                            <div className="input-wrap">
                                                <Lock className="field-icon" size={18} />
                                                <input 
                                                    type={showPass ? "text" : "password"} 
                                                    placeholder="••••••" 
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
                                            <label className="input-label">{t('confirmPasswordPlaceholder')}</label>
                                            <div className="input-wrap">
                                                <Lock className="field-icon" size={18} />
                                                <input 
                                                    type={showConfirm ? "text" : "password"} 
                                                    placeholder="••••••" 
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
                                        <label className="input-label">{t('professionalAddressFull')}</label>
                                        <div className="input-wrap">
                                            <MapPin className="field-icon" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder={t('addressExample')} 
                                                value={address} 
                                                onChange={(e) => setAddress(e.target.value)} 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    <div className="form-navigation-actions">
                                        <button type="button" onClick={nextStep} className="auth-submit-btn next-btn">
                                            {t('continueToIdentity')} <ArrowLeft size={16} className="mr-2 icon-rtl" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Identity Verification */}
                            {step === 2 && (
                                <div className="step-content animate-slide-in">
                                    <div className="kyc-upload-row">
                                        <div className="upload-container">
                                            <span className="upload-title">{t('cinFrontLabel')}</span>
                                            <label className="kyc-upload-box glass">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleFileChange(e, 'cin_front')} 
                                                    style={{ display: 'none' }}
                                                />
                                                {cinFrontPreview ? (
                                                    <img src={cinFrontPreview} alt="CIN Front" className="kyc-img-preview" />
                                                ) : (
                                                    <div className="upload-placeholder">
                                                        <Upload size={32} className="upload-icon-style" />
                                                        <span>{t('dragOrChooseFront')}</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>

                                        <div className="upload-container">
                                            <span className="upload-title">{t('cinBackLabel')}</span>
                                            <label className="kyc-upload-box glass">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleFileChange(e, 'cin_back')} 
                                                    style={{ display: 'none' }}
                                                />
                                                {cinBackPreview ? (
                                                    <img src={cinBackPreview} alt="CIN Back" className="kyc-img-preview" />
                                                ) : (
                                                    <div className="upload-placeholder">
                                                        <Upload size={32} className="upload-icon-style" />
                                                        <span>{t('dragOrChooseBack')}</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Live Selfie Section */}
                                    <div className="selfie-section-wrapper mt-4">
                                        <span className="upload-title">{t('liveSelfieLabel')}</span>
                                        <div className="selfie-controls-box">
                                            {isCameraActive ? (
                                                <div className="camera-container glass">
                                                    <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
                                                    <canvas ref={canvasRef} width="400" height="400" style={{ display: 'none' }}></canvas>
                                                    <div className="camera-actions">
                                                        <button type="button" onClick={captureSelfie} className="btn-capture">
                                                            <Camera size={16} /> {t('takePhoto')}
                                                        </button>
                                                        <button type="button" onClick={stopCamera} className="btn-cancel-cam">
                                                            {t('cancelCamera')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="selfie-actions-row">
                                                    {selfiePreview && (
                                                        <div className="selfie-preview-box glass">
                                                            <img src={selfiePreview} alt="Selfie Preview" className="selfie-preview-img" />
                                                        </div>
                                                    )}
                                                    <div className="selfie-buttons">
                                                        <button type="button" onClick={startCamera} className="btn-start-camera">
                                                            <Camera size={18} /> {t('openCameraLive')}
                                                        </button>
                                                        <label className="btn-upload-selfie-fallback">
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={(e) => handleFileChange(e, 'selfie')} 
                                                                style={{ display: 'none' }}
                                                            />
                                                            <Upload size={18} /> {t('orUploadSelfie')}
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-navigation-actions mt-4">
                                        <button type="button" onClick={prevStep} className="auth-submit-btn prev-btn secondary-btn">
                                            <ArrowRight size={16} className="ml-2 icon-rtl" /> {t('previousBtn')}
                                        </button>
                                        <button type="button" onClick={nextStep} className="auth-submit-btn next-btn">
                                            {t('continueToProfessional')} <ArrowLeft size={16} className="mr-2 icon-rtl" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Professional Verification */}
                            {step === 3 && (
                                <div className="step-content animate-slide-in">
                                    <div className="auth-grid-split">
                                        <div className="auth-input-group">
                                            <label className="input-label">{t('barRegistrationNumber')}</label>
                                            <div className="input-wrap">
                                                <Briefcase className="field-icon" size={18} />
                                                <input 
                                                    type="text" 
                                                    placeholder="مثال: 94827" 
                                                    value={barNumber} 
                                                    onChange={(e) => setBarNumber(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        <div className="auth-input-group">
                                            <label className="input-label">{t('barCityName')}</label>
                                            <div className="input-wrap">
                                                <MapPin className="field-icon" size={18} />
                                                <input 
                                                    type="text" 
                                                    placeholder="مثال: هيئة الدار البيضاء" 
                                                    value={barCity} 
                                                    onChange={(e) => setBarCity(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="auth-input-group">
                                        <label className="input-label">{t('mainSpecializationLabel')}</label>
                                        <div className="input-wrap select-wrap">
                                            <Briefcase className="field-icon" size={18} />
                                            <select 
                                                value={specialty} 
                                                onChange={(e) => setSpecialty(e.target.value)}
                                                required
                                            >
                                                <option value="">{t('selectSpecialtyPlaceholder')}</option>
                                                {specialties.map(s => <option key={s.value} value={s.value}>{t(s.key)}</option>)}
                                            </select>
                                            <ChevronDown className="select-arrow" size={16} />
                                        </div>
                                    </div>

                                    <div className="auth-input-group">
                                        <label className="input-label">{t('professionalDocUploadLabel')}</label>
                                        <label className="professional-doc-upload-box glass">
                                            <input 
                                                type="file" 
                                                accept=".pdf,image/*" 
                                                onChange={(e) => handleFileChange(e, 'professional_doc')} 
                                                style={{ display: 'none' }}
                                                required
                                            />
                                            <div className="prof-doc-placeholder">
                                                <FileText size={32} className="upload-icon-style" />
                                                {professionalDocName ? (
                                                    <span className="selected-doc-name">{professionalDocName}</span>
                                                ) : (
                                                    <span>{t('clickToChooseFile')}</span>
                                                )}
                                            </div>
                                        </label>
                                    </div>

                                    <div className="form-navigation-actions mt-4">
                                        <button type="button" onClick={prevStep} className="auth-submit-btn prev-btn secondary-btn" disabled={loading}>
                                            <ArrowRight size={16} className="ml-2 icon-rtl" /> {t('previousBtn')}
                                        </button>
                                        <button type="submit" className="auth-submit-btn submit-kyc-btn" disabled={loading}>
                                            {loading ? t('submittingRequest') : t('submitKycBtn')}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </form>

                        <div className="auth-footer">
                            <p>{t('alreadyHaveAccount')} <Link to="/login" className="cta-link">{t('login')}</Link></p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LawyerRegister;
