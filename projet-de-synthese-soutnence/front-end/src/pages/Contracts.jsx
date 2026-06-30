import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Briefcase, 
  Users, 
  Lock, 
  ShoppingCart, 
  ClipboardCheck, 
  ArrowLeft, 
  Wand2, 
  ShieldAlert, 
  Check, 
  AlertTriangle,
  Download,
  Copy,
  ChevronRight,
  Sparkles,
  History,
  Calendar,
  ChevronDown,
  ShieldCheck,
  UploadCloud,
  FolderOpen,
  Info,
  Scale
} from 'lucide-react';
import './Contracts.css';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Contracts = () => {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    
    // Mode tabs: 'catalog', 'generator_form', 'analyzer', 'result_generation', 'result_analysis', 'history'
    const [activeTab, setActiveTab] = useState('catalog'); 
    const [user, setUser] = useState(null);
    const [contractsList, setContractsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Generator Form States
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [partyOne, setPartyOne] = useState('');
    const [partyTwo, setPartyTwo] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [details, setDetails] = useState('');
    const [generatedContractText, setGeneratedContractText] = useState('');

    // Extra Generator Form States to match premium target layout
    const [formContractTitle, setFormContractTitle] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const getFormLabels = (key) => {
        switch (key) {
            case 'rent':
                return {
                    title: 'توليد عقد الكراء السكني',
                    titleLabel: 'التسمية (العقد أو اسم الشراكة)',
                    titlePlaceholder: 'مثال: عقد كراء شقة سكنية',
                    partyOneLabel: 'الطرف الأول (المؤجر/صاحب العقار)',
                    partyOnePlaceholder: 'أدخل اسم المؤجر أو مالك العقار',
                    partyTwoLabel: 'الطرف الثاني (المستأجر)',
                    partyTwoPlaceholder: 'أدخل اسم المستأجر الكامل',
                    jobLabel: 'مواصفات العقار (العنوان / رقم الشقة)',
                    jobPlaceholder: 'مثال: شقة رقم 4، عمارة الياسمين، شارع الجيش الملكي، فاس',
                    priceLabel: 'مبلغ الكراء الشهري (درهم)',
                    pricePlaceholder: 'مثال: 2500',
                    durationLabel: 'مدة الكراء',
                    durationPlaceholder: 'مثال: سنة واحدة قابلة للتجديد',
                    startDateLabel: 'تاريخ بداية الكراء',
                    startDatePlaceholder: 'اختر تاريخ بداية الكراء',
                    endDateLabel: 'تاريخ نهاية الكراء (إن وجد)',
                    endDatePlaceholder: 'اختر تاريخ النهاية (اختياري)',
                    detailsLabel: 'شروط أو تفاصيل إضافية',
                    detailsPlaceholder: 'مثال: أداء مسبق لشهرين، التزام بإصلاح الأعطال... (اختياري)'
                };
            case 'nda':
                return {
                    title: 'توليد اتفاقية عدم الإفصاح والسرية',
                    titleLabel: 'التسمية (العقد أو اسم الشراكة)',
                    titlePlaceholder: 'مثال: اتفاقية سرية لمشروع برمجي',
                    partyOneLabel: 'الطرف الأول (الطرف الكاشف عن المعلومات)',
                    partyOnePlaceholder: 'أدخل اسم الشركة أو الطرف المفصح',
                    partyTwoLabel: 'الطرف الثاني (الطرف المستلم للمعلومات)',
                    partyTwoPlaceholder: 'أدخل اسم المستلم الكامل',
                    jobLabel: 'الغرض أو المشروع المشترك',
                    jobPlaceholder: 'مثال: مناقشة شراكة تجارية لتطوير تطبيق ذكي',
                    priceLabel: 'الشرط الجزائي / التعويض المالي (درهم)',
                    pricePlaceholder: 'مثال: 50000',
                    durationLabel: 'مدة حفظ السرية بعد انتهاء العلاقة',
                    durationPlaceholder: 'مثال: 3 سنوات من تاريخ التوقيع',
                    startDateLabel: 'تاريخ بداية الاتفاقية',
                    startDatePlaceholder: 'اختر تاريخ سريان الاتفاقية',
                    endDateLabel: 'تاريخ انتهاء الاتفاقية',
                    endDatePlaceholder: 'اختر تاريخ النهاية (اختياري)',
                    detailsLabel: 'شروط أو تفاصيل إضافية',
                    detailsPlaceholder: 'أدخل أي شروط خاصة أو استثناءات من السرية... (اختياري)'
                };
            case 'company':
                return {
                    title: 'توليد عقد تأسيس شركة تجارية',
                    titleLabel: 'التسمية (العقد أو اسم الشراكة)',
                    titlePlaceholder: 'مثال: عقد تأسيس شركة ذات مسؤولية محدودة (SARL)',
                    partyOneLabel: 'الشريك الأول (الاسم ونسبة الحصص)',
                    partyOnePlaceholder: 'مثال: أحمد الرامي (50% من الحصص)',
                    partyTwoLabel: 'الشريك الثاني (الاسم ونسبة الحصص)',
                    partyTwoPlaceholder: 'مثال: ليلى الفاسي (50% من الحصص)',
                    jobLabel: 'نشاط الشركة / الغرض التجاري',
                    jobPlaceholder: 'مثال: الاستيراد والتصدير وبيع الخدمات الرقمية',
                    priceLabel: 'رأس مال الشركة الإجمالي (درهم)',
                    pricePlaceholder: 'مثال: 100000',
                    durationLabel: 'مدة الشركة',
                    durationPlaceholder: 'مثال: 99 سنة',
                    startDateLabel: 'تاريخ التأسيس',
                    startDatePlaceholder: 'اختر تاريخ تأسيس الشركة',
                    endDateLabel: 'تاريخ إغلاق السنة المالية الأولى',
                    endDatePlaceholder: 'اختر تاريخ نهاية السنة المالية الأولى',
                    detailsLabel: 'شروط أو تفاصيل إضافية',
                    detailsPlaceholder: 'طريقة اتخاذ القرارات، توزيع الأرباح، شروط الانسحاب... (اختياري)'
                };
            case 'sell':
                return {
                    title: 'توليد عقد البيع الابتدائي',
                    titleLabel: 'التسمية (العقد أو اسم الشراكة)',
                    titlePlaceholder: 'مثال: عقد بيع سيارة مستعملة أو عقار',
                    partyOneLabel: 'الطرف الأول (البائع)',
                    partyOnePlaceholder: 'أدخل اسم البائع الكامل ورقم بطاقته الوطنية',
                    partyTwoLabel: 'الطرف الثاني (المشتري)',
                    partyTwoPlaceholder: 'أدخل اسم المشتري الكامل ورقم بطاقته الوطنية',
                    jobLabel: 'وصف الشيء المبيع (العقار أو السيارة)',
                    jobPlaceholder: 'مثال: سيارة Peugeot 208 موديل 2020، رقم التسجيل 1234-أ-50',
                    priceLabel: 'ثمن البيع المتفق عليه (درهم)',
                    pricePlaceholder: 'مثال: 85000',
                    durationLabel: 'طريقة دفع الثمن',
                    durationPlaceholder: 'مثال: نقداً دفعة واحدة عند توقيع العقد',
                    startDateLabel: 'تاريخ إبرام العقد',
                    startDatePlaceholder: 'اختر تاريخ إبرام البيع',
                    endDateLabel: 'تاريخ تسليم الشيء المبيع',
                    endDatePlaceholder: 'اختر تاريخ التسليم المتوقع',
                    detailsLabel: 'شروط أو تفاصيل إضافية',
                    detailsPlaceholder: 'خلو المبيع من العيوب، تحمل مصاريف التسجيل والتحويل... (اختياري)'
                };
            case 'agency':
                return {
                    title: 'توليد عقد الوكالة الرسمية',
                    titleLabel: 'التسمية (العقد أو اسم الشراكة)',
                    titlePlaceholder: 'مثال: وكالة خاصة لبيع سيارة أو تسيير عقار',
                    partyOneLabel: 'الطرف الأول (الموكل)',
                    partyOnePlaceholder: 'أدخل اسم الشخص الموكل ورقمه الوطني',
                    partyTwoLabel: 'الطرف الثاني (الوكيل)',
                    partyTwoPlaceholder: 'أدخل اسم الوكيل الكامل ورقمه الوطني',
                    jobLabel: 'موضوع الوكالة / الصلاحيات الممنوحة',
                    jobPlaceholder: 'مثال: بيع وإبرام عقود ونقل ملكية السيارة رقم 123-ب-40',
                    priceLabel: 'الأتعاب أو التعويض (إن وجد) (درهم)',
                    pricePlaceholder: 'مثال: 2000',
                    durationLabel: 'مدة صلاحية الوكالة',
                    durationPlaceholder: 'مثال: صالحة لمدة سنة واحدة أو حتى عزل الوكيل',
                    startDateLabel: 'تاريخ تفعيل الوكالة',
                    startDatePlaceholder: 'اختر تاريخ التفعيل',
                    endDateLabel: 'تاريخ انتهاء الوكالة',
                    endDatePlaceholder: 'اختر تاريخ انتهاء الوكالة (اختياري)',
                    detailsLabel: 'شروط أو تفاصيل إضافية',
                    detailsPlaceholder: 'استثناء صلاحيات معينة، تقديم تقارير دورية... (اختياري)'
                };
            case 'employment':
            default:
                return {
                    title: 'توليد عقد العمل الموحد',
                    titleLabel: 'التسمية (العقد أو اسم الشراكة)',
                    titlePlaceholder: 'مثال: عقد عمل محدد المدة',
                    partyOneLabel: 'الطرف الأول (صاحب العمل)',
                    partyOnePlaceholder: 'أدخل اسم الشركة أو المؤسسة',
                    partyTwoLabel: 'الطرف الثاني (المستفيد/الموظف)',
                    partyTwoPlaceholder: 'أدخل اسم الموظف أو المستفيد',
                    jobLabel: 'القسم / العمل / الوظيفة',
                    jobPlaceholder: 'مثال: قسم الموارد البشرية / مطور برمجيات',
                    priceLabel: 'المبلغ / الراتب الشهري (درهم)',
                    pricePlaceholder: 'مثال: 4000',
                    durationLabel: 'مدة العقد',
                    durationPlaceholder: 'اختر مدة العقد',
                    startDateLabel: 'تاريخ بداية العقد',
                    startDatePlaceholder: 'اختر تاريخ البداية',
                    endDateLabel: 'تاريخ نهاية العقد (إن وجد)',
                    endDatePlaceholder: 'اختر تاريخ النهاية (اختياري)',
                    detailsLabel: 'شروط أو تفاصيل إضافية',
                    detailsPlaceholder: 'أدخل أي تفاصيل ترغب في إضافتها داخل العقد... (اختياري).'
                };
        }
    };

    // Analyzer States
    const [contractTitle, setContractTitle] = useState('');
    const [contractContent, setContractContent] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Selected Contract from history or active view
    const [viewingContract, setViewingContract] = useState(null);

    const categories = [
        {
            id: 1,
            key: 'rent',
            title: 'عقد الكراء السكني',
            description: 'متوافق مع القانون 67.12 المنظم للعلاقات الكرائية بالمغرب.',
            icon: <FileText size={24} />,
            color: '#eef2ff',
        },
        {
            id: 2,
            key: 'employment',
            title: 'عقد العمل الموحد',
            description: 'CDD أو CDI وفق مدونة الشغل المغربية – كامل الشروط القانونية.',
            icon: <Briefcase size={24} />,
            color: '#fff7ed',
        },
        {
            id: 3,
            key: 'company',
            title: 'عقد الشركة التجارية',
            description: 'حصص وأرباح ومسؤوليات واضحة بين الشركاء التجاريين.',
            icon: <Users size={24} />,
            color: '#f0fdf4',
        },
        {
            id: 4,
            key: 'nda',
            title: 'اتفاقية السرية (NDA)',
            description: 'حماية المعلومات السرية والملكية الفكرية بين الأطراف.',
            icon: <Lock size={24} />,
            color: '#fff1f2',
        },
        {
            id: 5,
            key: 'sell',
            title: 'عقد البيع الابتدائي',
            description: 'بيع عقار أو منقول مع الشروط والضمانات القانونية الكاملة.',
            icon: <ShoppingCart size={24} />,
            color: '#f0f9ff',
        },
        {
            id: 6,
            key: 'agency',
            title: 'عقد الوكالة الرسمية',
            description: 'توكيل رسمي يمنح صلاحيات محددة للتصرف نيابة عنك.',
            icon: <ClipboardCheck size={24} />,
            color: '#f5f3ff',
        },
    ];

    useEffect(() => {
        // Load user info
        const localUser = localStorage.getItem('user');
        if (localUser) {
            setUser(JSON.parse(localUser));
        }
        fetchContractsHistory();
    }, []);

    const fetchContractsHistory = async () => {
        try {
            const response = await api.get('/contracts');
            setContractsList(response.data);
        } catch (err) {
            console.error('Error fetching contracts history:', err);
        }
    };

    const handleUseTemplate = (cat) => {
        setSelectedTemplate(cat);
        setActiveTab('generator_form');
        setError('');
        setSuccess('');
        
        // Reset all states
        setFormContractTitle('');
        setPartyOne('');
        setPartyTwo('');
        setPrice('');
        setDuration('');
        setJobTitle('');
        setStartDate('');
        setEndDate('');
        setDetails('');
    };

    const handleGenerateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const combinedDetails = `
- اسم العقد/التسمية: ${formContractTitle}
- الطرف الأول: ${partyOne}
- الطرف الثاني: ${partyTwo}
- القسم/العمل/الوظيفة: ${jobTitle}
- المبلغ/الراتب: ${price ? price + ' درهم' : 'غير محدد'}
- مدة العقد: ${duration}
- تاريخ بداية العقد: ${startDate}
- تاريخ نهاية العقد: ${endDate || 'غير محدد'}
- شروط وتفاصيل إضافية: ${details}
            `.trim();

            const response = await api.post('/contracts/generate', {
                type: selectedTemplate.key,
                party_one: partyOne,
                party_two: partyTwo,
                price: price ? parseFloat(price) : null,
                duration: duration,
                details: combinedDetails
            });

            setGeneratedContractText(response.data.content);
            setSuccess(t('generatingContract').replace('...', ''));
            setActiveTab('result_generation');
            fetchContractsHistory();
        } catch (err) {
            console.error('Generation error:', err);
            if (err.response && err.response.status === 403) {
                setError(t('premiumOnlyService'));
            } else {
                setError(err.response?.data?.message || (language === 'darija' ? 'حدث خطأ أثناء صياغة العقد.' : 'An error occurred while drafting the contract.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setSelectedFile(files[0]);
            setError('');
        }
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            setSelectedFile(files[0]);
            setError('');
        }
    };

    const triggerFileInput = () => {
        document.getElementById('analyzer-file-input').click();
    };

    const handleFileUpload = async (file) => {
        if (file.size > 20 * 1024 * 1024) {
            setError(language === 'darija' ? 'حجم الملف يتجاوز الحد الأقصى 20 ميغابايت.' : 'File size exceeds the 20MB limit.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setUploadProgress(language === 'darija' ? 'جاري رفع وتحليل المستند...' : 'Uploading and analyzing document...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/contracts/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setAnalysisResult(response.data.analysis);
            setSuccess(language === 'darija' ? 'تم تحليل العقد بنجاح.' : 'Contract analyzed successfully.');
            setSelectedFile(null);
            setActiveTab('result_analysis');
            fetchContractsHistory();
        } catch (err) {
            console.error('File upload analysis error:', err);
            setError(err.response?.data?.message || (language === 'darija' ? 'حدث خطأ أثناء رفع وتحليل الملف.' : 'An error occurred while uploading and analyzing the file.'));
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    const handleAnalyzeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/contracts/analyze', {
                contract_title: contractTitle,
                contract_content: contractContent
            });

            setAnalysisResult(response.data.analysis);
            setSuccess(t('analyzingContract').replace('...', ''));
            setActiveTab('result_analysis');
            fetchContractsHistory();
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.response?.data?.message || (language === 'darija' ? 'حدث خطأ أثناء تحليل العقد.' : 'An error occurred while analyzing the contract.'));
        } finally {
            setLoading(false);
        }
    };

    const handleViewContractHistory = (contract) => {
        setViewingContract(contract);
        if (contract.type === 'analyze') {
            setAnalysisResult(JSON.parse(contract.result));
            setActiveTab('result_analysis');
        } else {
            setGeneratedContractText(contract.content);
            setActiveTab('result_generation');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert(t('copySuccess'));
    };

    const downloadContract = (text, title) => {
        const element = document.createElement("a");
        const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
        element.href = URL.createObjectURL(file);
        element.download = `${title || 'عقد_قانوني'}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const direction = language === 'en' || language === 'fr' ? 'ltr' : 'rtl';

    return (
        <div className="contracts-premium-page" dir={direction}>
            <div className="page-wrapper">
                
                {/* Mode Switch Bar */}
                <div className="contracts-nav-tabs">
                    <button 
                        className={`tab-btn-pill ${activeTab === 'catalog' || activeTab === 'generator_form' || activeTab === 'result_generation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('catalog')}
                    >
                        <Wand2 size={16} /> {t('draftAndGenerate')}
                    </button>
                    <button 
                        className={`tab-btn-pill ${activeTab === 'analyzer' || activeTab === 'result_analysis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analyzer')}
                    >
                        <Sparkles size={16} /> {t('analyzeAndReview')}
                    </button>
                    <button 
                        className={`tab-btn-pill ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <History size={16} /> {t('contractsArchive')}
                    </button>
                </div>

                {error && (
                    <div className="auth-error-msg" style={{ margin: '15px 0', textAlign: 'center' }}>
                        <p>{error}</p>
                        {error.includes('Premium') && (
                            <button 
                                className="btn-primary" 
                                style={{ marginTop: '10px', padding: '6px 15px', fontSize: '0.9rem' }}
                                onClick={() => navigate('/pricing')}
                            >
                                {t('upgradeToPremium')}
                            </button>
                        )}
                    </div>
                )}

                {/* TAB 1: CATALOG */}
                {activeTab === 'catalog' && (
                    <>
                        <section className="contracts-hero animate-fade-in">
                            <div className="badge-premium">📄 {t('smartGenerator')}</div>
                            <h1>{t('professionalDrafting').split(' ').slice(0, 2).join(' ')} <span className="text-gradient">{t('professionalDrafting').split(' ').slice(2).join(' ')}</span></h1>
                            <p className="hero-subtext">{t('draftingSubtitle')}</p>
                        </section>

                        <section className="catalog-section">
                            <div className="catalog-grid-modern">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="modern-catalog-card animate-slide-up">
                                        <div className="card-top">
                                            <div className="icon-circle" style={{ background: cat.color }}>
                                                {cat.icon}
                                            </div>
                                            <div className="card-status">{t('updated2026')}</div>
                                        </div>
                                        <h3>{t(cat.key === 'nda' ? 'ndaTitle' : `${cat.key}ContractTitle`)}</h3>
                                        <p>{t(cat.key === 'nda' ? 'ndaDesc' : `${cat.key}ContractDesc`)}</p>
                                        <div className="card-footer">
                                            <span className="card-tag">{t('readyTemplate')}</span>
                                            <button className="use-btn" onClick={() => handleUseTemplate(cat)}>
                                                {t('useTemplate')} <ArrowLeft size={16} style={{ transform: direction === 'ltr' ? 'rotate(180deg)' : 'none' }} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {/* SUB-TAB: GENERATOR FORM */}
                {activeTab === 'generator_form' && (() => {
                    const labels = getFormLabels(selectedTemplate?.key);
                    return (
                        <section className="contracts-generator-container animate-slide-up">
                            {/* Header Banner matching Mockup */}
                            <div className="contracts-generator-header">
                                <button className="generator-back-btn" onClick={() => setActiveTab('catalog')}>
                                    <ChevronRight size={18} style={{ transform: direction === 'ltr' ? 'rotate(180deg)' : 'none' }} />
                                    <span>{language === 'darija' ? 'العودة للقوالب' : 'Back to Templates'}</span>
                                </button>
                                
                                <div className="generator-header-graphics">
                                    <img src="/scales_of_justice.png" alt="Scales of Justice" className="header-gavel-img" />
                                    <div className="header-gradient-overlay"></div>
                                </div>
                                
                                <div className="generator-header-info">
                                    <div className="generator-header-title-row">
                                        <div className="header-file-icon-box">
                                            <FileText size={28} className="header-file-icon" />
                                        </div>
                                        <h1>{labels.title}</h1>
                                    </div>
                                    <p className="generator-header-desc">
                                        {language === 'darija' 
                                            ? 'أدخل بيانات العقد ليقوم المساعد القانوني بإنشاء مسودة عقد دقيقة ومتكاملة.' 
                                            : 'Enter contract details for the legal assistant to generate a precise, comprehensive draft.'}
                                    </p>
                                </div>
                            </div>

                            {/* Form card matching Mockup */}
                            <div className="generator-form-card">
                                <form onSubmit={handleGenerateSubmit} className="generator-form-fields-grid">
                                    
                                    {/* Row 1 right: Title, left: Party One */}
                                    <div className="form-field-wrapper">
                                        <label>{labels.titleLabel}</label>
                                        <input 
                                            type="text" 
                                            placeholder={labels.titlePlaceholder} 
                                            value={formContractTitle} 
                                            onChange={(e) => setFormContractTitle(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-field-wrapper">
                                        <label>{labels.partyOneLabel}</label>
                                        <input 
                                            type="text" 
                                            placeholder={labels.partyOnePlaceholder} 
                                            value={partyOne} 
                                            onChange={(e) => setPartyOne(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    {/* Row 2 right: Party Two, left: Job/Work */}
                                    <div className="form-field-wrapper">
                                        <label>{labels.partyTwoLabel}</label>
                                        <input 
                                            type="text" 
                                            placeholder={labels.partyTwoPlaceholder} 
                                            value={partyTwo} 
                                            onChange={(e) => setPartyTwo(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-field-wrapper">
                                        <label>{labels.jobLabel}</label>
                                        <input 
                                            type="text" 
                                            placeholder={labels.jobPlaceholder} 
                                            value={jobTitle} 
                                            onChange={(e) => setJobTitle(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    {/* Row 3 right: Salary/Price, left: Duration */}
                                    <div className="form-field-wrapper with-icon">
                                        <label>{labels.priceLabel}</label>
                                        <div className="input-icon-container">
                                            <input 
                                                type="number" 
                                                placeholder={labels.pricePlaceholder} 
                                                value={price} 
                                                onChange={(e) => setPrice(e.target.value)} 
                                                required
                                            />
                                            <span className="input-inner-icon left-icon">
                                                <ChevronDown size={16} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-field-wrapper with-icon">
                                        <label>{labels.durationLabel}</label>
                                        <div className="input-icon-container">
                                            <input 
                                                type="text" 
                                                placeholder={labels.durationPlaceholder} 
                                                value={duration} 
                                                onChange={(e) => setDuration(e.target.value)} 
                                                required
                                            />
                                            <span className="input-inner-icon left-icon">
                                                <Calendar size={16} />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Row 4 right: Start Date, left: End Date */}
                                    <div className="form-field-wrapper with-icon">
                                        <label>{labels.startDateLabel}</label>
                                        <div className="input-icon-container">
                                            <input 
                                                type="date" 
                                                placeholder={labels.startDatePlaceholder} 
                                                value={startDate} 
                                                onChange={(e) => setStartDate(e.target.value)} 
                                                required
                                            />
                                            <span className="input-inner-icon left-icon">
                                                <Calendar size={16} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-field-wrapper with-icon">
                                        <label>{labels.endDateLabel}</label>
                                        <div className="input-icon-container">
                                            <input 
                                                type="date" 
                                                placeholder={labels.endDatePlaceholder} 
                                                value={endDate} 
                                                onChange={(e) => setEndDate(e.target.value)} 
                                            />
                                            <span className="input-inner-icon left-icon">
                                                <Calendar size={16} />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Row 5: Additional details (Full width) */}
                                    <div className="form-field-wrapper full-width">
                                        <label>{labels.detailsLabel}</label>
                                        <textarea 
                                            rows="4" 
                                            placeholder={labels.detailsPlaceholder}
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* Bottom-right Submit Button container */}
                                    <div className="form-submit-container">
                                        <button type="submit" className="submit-generator-btn-premium" disabled={loading}>
                                            {loading ? (
                                                <span>{t('generatingContract')}</span>
                                            ) : (
                                                <>
                                                    <span>إنشاء العقد الآن</span>
                                                    <FileText size={18} className="btn-icon-ar" />
                                                </>
                                            )}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </section>
                    );
                })()}

                {/* SUB-TAB: GENERATOR RESULT */}
                {activeTab === 'result_generation' && (
                    <section className="form-section-card glass animate-slide-up">
                        <div className="result-actions-top">
                            <button className="back-btn" onClick={() => setActiveTab('catalog')}>
                                <ChevronRight size={18} style={{ transform: direction === 'ltr' ? 'rotate(180deg)' : 'none' }} /> {t('backToTemplates')}
                            </button>
                            <div className="result-buttons" style={{ display: 'flex', gap: '10px' }}>
                                <button className="action-pill-btn" onClick={() => copyToClipboard(generatedContractText)}>
                                    <Copy size={16} /> {t('copyContract')}
                                </button>
                                <button className="action-pill-btn" onClick={() => downloadContract(generatedContractText, formContractTitle || 'عقد_قانوني')}>
                                    <Download size={16} /> {language === 'en' ? 'Download' : 'تحميل العقد'}
                                </button>
                            </div>
                        </div>

                        <div className="generated-contract-viewer" dir={direction}>
                            <div className="viewer-header">
                                <h3>{t('proposedDraft')}</h3>
                                <span className="ai-watermark">⚖️ {t('haqqiSmartAi')}</span>
                            </div>
                            <pre className="contract-pre-text">{generatedContractText}</pre>
                        </div>
                    </section>
                )}

                {/* TAB 2: ANALYZER FORM */}
                {activeTab === 'analyzer' && (
                    <div className="contracts-analyzer-container animate-slide-up">
                        {/* Header Banner matching Mockup in Image 4 */}
                        <div className="analyzer-header-banner">
                            <div className="analyzer-header-badge">
                                <ShieldCheck size={16} />
                                <span>{t('allFilesSecure')}</span>
                            </div>
                            <div className="analyzer-header-main">
                                <div className="analyzer-header-text">
                                    <h1>{t('analyzeContracts')}</h1>
                                    <p>{t('analyzeContractsSub')}</p>
                                </div>
                                <div className="analyzer-header-icon-box">
                                    <Scale size={36} className="analyzer-scale-icon" />
                                </div>
                            </div>
                        </div>

                        {/* Drag and Drop & Upload Section */}
                        <div className="analyzer-upload-section">
                            {/* Left Box: File Dropzone */}
                            <div 
                                className={`analyzer-dropzone ${isDragging ? 'dragging' : ''} ${uploadProgress ? 'uploading' : ''} ${selectedFile ? 'has-file' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={!selectedFile ? triggerFileInput : undefined}
                            >
                                <input 
                                    type="file" 
                                    id="analyzer-file-input" 
                                    className="hidden-file-input" 
                                    accept=".pdf,.docx,.doc" 
                                    onChange={handleFileChange}
                                />
                                {selectedFile ? (
                                    <div className="selected-file-container" onClick={(e) => e.stopPropagation()}>
                                        <div className="file-info-header">
                                            <FileText size={36} className="selected-file-icon" />
                                            <div className="file-text-details">
                                                <span className="file-name">{selectedFile.name}</span>
                                                <span className="file-size">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                            </div>
                                        </div>
                                        <div className="file-actions">
                                            <button 
                                                type="button" 
                                                className="verify-ai-btn" 
                                                disabled={loading}
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    handleFileUpload(selectedFile); 
                                                }}
                                            >
                                                {loading ? (
                                                    <span className="btn-spinner"></span>
                                                ) : (
                                                    <>
                                                        <Sparkles size={16} />
                                                        <span>{t('startAiInspection')}</span>
                                                    </>
                                                )}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="cancel-file-btn" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setSelectedFile(null); 
                                                }}
                                            >
                                                {t('cancel')}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="change-file-link" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    triggerFileInput(); 
                                                }}
                                            >
                                                {t('changeFile')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="dropzone-content">
                                        <div className="upload-icon-wrapper">
                                            <UploadCloud size={40} className="upload-cloud-icon" />
                                        </div>
                                        <h3>{t('dragAndDrop')}</h3>
                                        <p>{t('maxFileSize')}</p>
                                    </div>
                                )}
                                {uploadProgress && (
                                    <div className="upload-progress-overlay">
                                        <div className="progress-spinner"></div>
                                        <p>{uploadProgress}</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Box: Info block */}
                            <div className="analyzer-upload-info-box">
                                <h2>{t('uploadContract')}</h2>
                                <p>{t('uploadContractDesc')}</p>
                            </div>
                        </div>

                        {/* Previously Analyzed Documents List */}
                        <div className="analyzer-history-section">
                            <div className="history-header">
                                <h2>{t('previousDocuments')}</h2>
                                <p>{t('managePreviousAnalyses')}</p>
                            </div>

                            <div className="history-list-box">
                                {contractsList.filter(c => c.type === 'analyze').length > 0 ? (
                                    <div className="analyzer-history-table">
                                        {contractsList.filter(c => c.type === 'analyze').map((contract) => {
                                            let res = {};
                                            try {
                                                res = JSON.parse(contract.result || '{}');
                                            } catch (e) {
                                                res = {};
                                            }
                                            return (
                                                <div key={contract.id} className="history-table-row" onClick={() => handleViewContractHistory(contract)}>
                                                    <div className="row-file-info">
                                                        <FileText size={20} className="row-file-icon" />
                                                        <div>
                                                            <h4>{contract.title}</h4>
                                                            <span>{new Date(contract.created_at).toLocaleDateString(language === 'darija' ? 'ar-MA' : 'fr-FR')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="row-analysis-stats">
                                                        {res.risk_score !== undefined && (
                                                            <span className={`risk-badge risk-${res.risk_score > 50 ? 'high' : (res.risk_score > 30 ? 'medium' : 'low')}`}>
                                                                {t('riskIndicator')}: {res.risk_score}% ({res.status})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="row-actions">
                                                        <button className="row-view-btn">{t('viewAnalysis')}</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="empty-history-box">
                                        <div className="empty-icon-wrapper">
                                            <FolderOpen size={40} className="empty-folder-icon" />
                                        </div>
                                        <h3>{t('noDocumentsYet')}</h3>
                                        <p>{t('uploadFirstContract')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tip Banner at the Bottom */}
                        <div className="analyzer-tip-banner">
                            <Info size={20} className="tip-info-icon" />
                            <span>{t('analysisTip')}</span>
                        </div>
                    </div>
                )}

                {/* TAB 2 SUB-TAB: ANALYSIS RESULTS */}
                {activeTab === 'result_analysis' && analysisResult && (
                    <div className="analysis-page animate-fade-in" dir={direction} style={{ padding: 0 }}>
                        <div className="analysis-container">
                            <header className="analysis-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span className="analysis-badge">{t('aiAnalysis')}</span>
                                    <h1 className="analysis-title">{t('analysisResultsTitle')}</h1>
                                </div>
                                <div className="result-buttons" style={{ display: 'flex', gap: '10px' }}>
                                    <button className="back-btn" onClick={() => setActiveTab('analyzer')}>
                                        <ChevronRight size={18} style={{ transform: direction === 'ltr' ? 'rotate(180deg)' : 'none' }} /> {t('reviewAnotherContract')}
                                    </button>
                                    <button 
                                        className="action-pill-btn" 
                                        onClick={() => {
                                            const criticalStr = (analysisResult.critical_issues || []).map((issue, idx) => `${idx + 1}. ${issue}`).join('\n');
                                            const recsStr = (analysisResult.recommendations || []).map((rec, idx) => `${idx + 1}. ${rec}`).join('\n');
                                            const reportText = `
تقرير فحص وتحليل العقد بالذكاء الاصطناعي - ThemisMaroc الذكي
--------------------------------------------------

1. ملخص عام:
${analysisResult.summary}

2. مؤشر الخطورة:
- النسبة: ${analysisResult.risk_score}%
- الحالة: ${analysisResult.status}
- البنود المفحوصة: ${analysisResult.clauses_analyzed}

3. الثغرات القانونية والمخاطر:
${criticalStr || 'لا توجد مخاطر حرجة تم اكتشافها.'}

4. التوصيات المقترحة:
${recsStr}
                                            `.trim();
                                            downloadContract(reportText, `تقرير_تحليل_${viewingContract?.title || 'عقد'}`);
                                        }}
                                    >
                                        <Download size={16} /> {language === 'en' ? 'Download Report' : 'تحميل تقرير التحليل'}
                                    </button>
                                </div>
                            </header>

                            <div className="analysis-grid">
                                <div className="analysis-section summary">
                                    <div className="section-icon">📜</div>
                                    <div className="section-content">
                                        <h3>{t('generalSummary')}</h3>
                                        <p>{analysisResult.summary}</p>
                                        <div style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                                            <span>{t('clausesChecked')}{analysisResult.clauses_analyzed}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="analysis-section risks">
                                    <div className="section-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div className="section-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3>{t('legalRisks')}</h3>
                                            <span style={{ 
                                                fontWeight: 'bold', 
                                                padding: '4px 10px', 
                                                background: '#fee2e2', 
                                                color: '#ef4444', 
                                                borderRadius: '20px', 
                                                fontSize: '0.85rem' 
                                            }}>
                                                {t('riskIndex')}{analysisResult.risk_score}% ({analysisResult.status})
                                            </span>
                                        </div>
                                        <ul className="risks-list" style={{ marginTop: '15px' }}>
                                            {analysisResult.critical_issues.map((issue, idx) => (
                                                <li key={idx} className="risk-high" style={{ color: 'white', background: '#ffffff0a', margin: '8px 0', padding: '10px', borderRadius: '6px' }}>
                                                    <strong>{language === 'darija' ? 'ثغرة مهددة: ' : (language === 'fr' ? 'Faille critique: ' : 'Critical risk: ')}</strong> {issue}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="analysis-section solutions">
                                    <div className="section-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                        <Check size={24} />
                                    </div>
                                    <div className="section-content">
                                        <h3>{t('proposedRecommendations')}</h3>
                                        <ul className="risks-list" style={{ marginTop: '15px', listStyleType: 'disc', paddingRight: '20px' }}>
                                            {analysisResult.recommendations.map((rec, idx) => (
                                                <li key={idx} style={{ margin: '8px 0', opacity: 0.9 }}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="lawyer-cta-card">
                                    <div className="cta-info">
                                        <h3>{t('reviewWithLawyer')}</h3>
                                        <p>{t('connectWithLawyerDesc')}</p>
                                    </div>
                                    <button className="cta-btn" onClick={() => navigate('/lawyers')}>{t('bookWithLawyer')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: ARCHIVE HISTORY */}
                {activeTab === 'history' && (
                    <section className="form-section-card glass animate-slide-up">
                        <h2>{t('yourContractsArchive')}</h2>
                        <p style={{ opacity: 0.8, marginBottom: '20px' }}>{t('archiveSubtitle')}</p>

                        <div className="contracts-archive-list">
                            {contractsList.length > 0 ? (
                                contractsList.map((contract) => (
                                    <div key={contract.id} className="archive-item-row" onClick={() => handleViewContractHistory(contract)}>
                                        <div className="archive-item-left">
                                            <div className="archive-icon">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4>{contract.title}</h4>
                                                <span className="archive-date">
                                                    {new Date(contract.created_at).toLocaleDateString(language === 'darija' ? 'ar-MA' : (language === 'fr' ? 'fr-FR' : 'en-US'), { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="archive-item-right">
                                            <span className={`archive-badge ${contract.type}`}>
                                                {contract.type === 'analyze' ? t('analysisAndReviewType') : t('generationAndDraftType')}
                                            </span>
                                            <ArrowLeft size={16} style={{ transform: direction === 'ltr' ? 'rotate(180deg)' : 'none' }} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ padding: '30px', textAlign: 'center', opacity: 0.6 }}>{t('noArchiveContractsYet')}</p>
                            )}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
};

export default Contracts;

