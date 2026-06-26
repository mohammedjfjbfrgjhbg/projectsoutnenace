import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import { 
  Bot, 
  FileText, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Search,
  Briefcase,
  CalendarDays,
  Plus,
  FolderOpen,
  ShieldCheck,
  Cpu,
  Cloud,
  Headphones,
  Eye,
  Edit3,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  MessageSquare
} from "lucide-react"
import Footer from "../components/Footer/Footer"
import "./HomePage.css"
import { useLanguage } from "../context/LanguageContext"
import { useCustomAlert } from "../context/CustomAlertContext"
import api from "../services/api"
import { BACKEND_URL } from "../config"

function HomePage() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const { showConfirm } = useCustomAlert()
  const [isLawyer, setIsLawyer] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Cases state
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal control states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // Selected case for details / editing
  const [selectedCase, setSelectedCase] = useState(null)
  const [editingCase, setEditingCase] = useState(null)

  // Form fields state
  const [formData, setFormData] = useState({
    client_name: "",
    case_number: "",
    case_type: "الأسرة",
    status: "upcoming_session",
    progress: 15,
    session_date: "",
    notes: ""
  })

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const user = JSON.parse(localUser);
      if (user && user.role === 'lawyer') {
        setIsLawyer(true);
        fetchCases();

        // Check if welcome animation has been shown during this session
        const hasSeen = sessionStorage.getItem('hasSeenWelcome');
        if (!hasSeen) {
          setShowWelcome(true);
          // Set timeout to start fade out after 4 seconds
          setTimeout(() => {
            const el = document.getElementById('lawyer-welcome-splash');
            if (el) {
              el.classList.add('fade-out');
            }
            // Fully remove splash after another 600ms transition
            setTimeout(() => {
              setShowWelcome(false);
              sessionStorage.setItem('hasSeenWelcome', 'true');
            }, 600);
          }, 4000);
        }
      }
    }
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await api.get("/lawyer/cases");
      setCases(response.data);
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCase) {
        // Update case
        const response = await api.put(`/lawyer/cases/${editingCase.id}`, formData);
        setCases(cases.map(c => c.id === editingCase.id ? response.data.case : c));
      } else {
        // Create case
        const response = await api.post("/lawyer/cases", formData);
        setCases([response.data.case, ...cases]);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error saving case:", err);
      alert("حدث خطأ أثناء حفظ القضية. يرجى مراجعة الحقول وإعادة المحاولة.");
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm(t('confirmDeleteCase') || "هل أنت متأكد من حذف هذه القضية نهائياً؟");
    if (isConfirmed) {
      try {
        await api.delete(`/lawyer/cases/${id}`);
        setCases(cases.filter(c => c.id !== id));
        if (selectedCase && selectedCase.id === id) {
          setShowDetailsModal(false);
          setSelectedCase(null);
        }
      } catch (err) {
        console.error("Error deleting case:", err);
        alert("حدث خطأ أثناء حذف القضية.");
      }
    }
  };

  const formatDatetimeForInput = (str) => {
    if (!str) return "";
    // Standardize to YYYY-MM-DDTHH:MM
    let dateStr = str.trim();
    if (dateStr.includes(" ") && !dateStr.includes("T")) {
      dateStr = dateStr.replace(" ", "T");
    }
    // Check if it's just a date YYYY-MM-DD, append T00:00 if needed for datetime-local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      dateStr += "T10:00";
    }
    return dateStr;
  };

  const getClientAvatar = (client) => {
    if (client && client.avatar) {
      return `${BACKEND_URL}${client.avatar}`;
    }
    return null;
  };

  const openEditModal = (caseObj, e) => {
    if (e) e.stopPropagation();
    setEditingCase(caseObj);
    setFormData({
      client_name: caseObj.client_name,
      case_number: caseObj.case_number,
      case_type: caseObj.case_type,
      status: caseObj.status,
      progress: caseObj.progress,
      session_date: formatDatetimeForInput(caseObj.session_date),
      notes: caseObj.notes || ""
    });
    setShowFormModal(true);
    setShowDetailsModal(false);
  };

  const openAddModal = () => {
    setEditingCase(null);
    setFormData({
      client_name: "",
      case_number: "33" + Math.floor(100 + Math.random() * 900),
      case_type: "الأسرة",
      status: "upcoming_session",
      progress: 15,
      session_date: "",
      notes: ""
    });
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingCase(null);
    setFormData({
      client_name: "",
      case_number: "",
      case_type: "الأسرة",
      status: "upcoming_session",
      progress: 15,
      session_date: "",
      notes: ""
    });
  };

  const filteredCases = cases.filter(c => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.client_name && c.client_name.toLowerCase().includes(term)) ||
      (c.case_number && c.case_number.toString().includes(term)) ||
      (c.case_type && c.case_type.toLowerCase().includes(term));

    if (statusFilter === "all") return matchesSearch;
    return c.status === statusFilter && matchesSearch;
  });

  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl'
  
  return (
    <div className="home-container" dir={dir}>
      {showWelcome && (
        <div id="lawyer-welcome-splash" className="welcome-splash-overlay">
          <div className="splash-video-container">
            <video 
              src="/animations.mp4" 
              autoPlay 
              muted 
              playsInline
              className="splash-video"
            />
          </div>
        </div>
      )}
      {isLawyer ? (
        <>
          {/* ── LAWYER HERO ── */}
          <section className="hero-modern lawyer-mode">
            {/* RIGHT (in RTL) — Text content & Lawyer cards */}
            <div className="hero-content lawyer-mode-content">
              {/* Badge matching mockup */}
              <div className="lawyer-hero-badge">
                <span className="gold-star-icon">⭐</span>
                <span>المنصة الذكية الرائدة للمحامين</span>
              </div>

              <h1 className="hero-title lawyer-title">
                منصة ذكية <span className="cyan-text">مصممة للمحامين</span>
              </h1>

              <p className="hero-subtitle lawyer-subtitle">
                أدر قضاياك، تواصل مع موكليك، انجز مهامك، وتابع كل تفاصيل عملك القانوني بسهولة وأمان.
              </p>

              {/* Search Bar matching Mockup Image 2 */}
              <div className="lawyer-hero-search-box">
                <div className="search-input-wrapper">
                  <input 
                    type="text" 
                    placeholder={t('searchCases') || "البحث في القضايا والموكلين..."} 
                    className="lawyer-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="lawyer-search-btn">
                    <Search size={18} />
                  </button>
                </div>
              </div>

              {/* Three Cards Grid */}
              <div className="lawyer-hero-cards-grid">
                <div className="lawyer-hero-card" onClick={() => navigate('/lawyer-dashboard')}>
                  <div className="card-icon-box blue">
                    <Users size={22} />
                  </div>
                  <div className="card-info-box">
                    <h3>إدارة الموكلين</h3>
                    <p>تتبع معلومات موكليك وسجل تواصلك معهم</p>
                  </div>
                </div>

                <div className="lawyer-hero-card" onClick={() => navigate('/lawyer-dashboard')}>
                  <div className="card-icon-box gold">
                    <Briefcase size={22} />
                  </div>
                  <div className="card-info-box">
                    <h3>إدارة القضايا</h3>
                    <p>تنظيم ملفات القضايا ومراحل التقدم</p>
                  </div>
                </div>

                <div className="lawyer-hero-card" onClick={() => navigate('/lawyer-appointments')}>
                  <div className="card-icon-box purple">
                    <CalendarDays size={22} />
                  </div>
                  <div className="card-info-box">
                    <h3>المواعيد والمهام</h3>
                    <p>جدولة الجلسات والمهام وتتبع التذكيرات</p>
                  </div>
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="lawyer-hero-actions">
                <button className="lawyer-btn-primary" onClick={openAddModal}>
                  <span>إضافة قضية جديدة</span>
                  <Plus size={16} />
                </button>
                <button className="lawyer-btn-secondary" onClick={() => {
                  const el = document.querySelector('.lawyer-cases-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <span>عرض القضايا</span>
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>



            {/* Bottom pillars */}
            <div className="lawyer-hero-pillars">
              <div className="pillar-item">
                <div className="pillar-icon-box">
                  <ShieldCheck size={20} />
                </div>
                <div className="pillar-info">
                  <h4>أمان عالي</h4>
                  <p>حماية بياناتك بمعايير عالمية</p>
                </div>
              </div>

              <div className="pillar-divider"></div>

              <div className="pillar-item">
                <div className="pillar-icon-box">
                  <Cpu size={20} />
                </div>
                <div className="pillar-info">
                  <h4>تقنيات AI متقدمة</h4>
                  <p>مساعد ذكي لتحليل القضايا والعقود</p>
                </div>
              </div>

              <div className="pillar-divider"></div>

              <div className="pillar-item">
                <div className="pillar-icon-box">
                  <Cloud size={20} />
                </div>
                <div className="pillar-info">
                  <h4>الوصول من أي مكان</h4>
                  <p>على جميع أجهزتك وفي أي وقت</p>
                </div>
              </div>

              <div className="pillar-divider"></div>

              <div className="pillar-item">
                <div className="pillar-icon-box">
                  <Headphones size={20} />
                </div>
                <div className="pillar-info">
                  <h4>دعم فني 24/7</h4>
                  <p>فريق دعم متخصص لخدمتك</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── CASES DASHBOARD SECTION ── */}
          <section className="lawyer-cases-section">
            <div className="cases-section-header">
              <div className="header-titles">
                <h2>{t('casesManagement')}</h2>
                <p>{t('casesManagementDesc')}</p>
              </div>
              
              <button className="add-case-floating-btn" onClick={openAddModal}>
                <Plus size={18} />
                <span>{t('addCase')}</span>
              </button>
            </div>

            {/* Filters and search info */}
            <div className="cases-filters-bar">
              <div className="status-filters">
                <button 
                  className={`filter-badge ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  {t('filterAll') || "الكل"}
                </button>
                <button 
                  className={`filter-badge upcoming ${statusFilter === 'upcoming_session' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('upcoming_session')}
                >
                  {t('upcomingSession') || "جلسة قادمة"}
                </button>
                <button 
                  className={`filter-badge review ${statusFilter === 'under_review' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('under_review')}
                >
                  {t('underReview') || "قيد المراجعة"}
                </button>
                <button 
                  className={`filter-badge completed ${statusFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('completed')}
                >
                  {t('completed') || "مكتمل"}
                </button>
              </div>

              <div className="search-stat-info">
                <span>{filteredCases.length} {t('existingCases')}</span>
              </div>
            </div>

            {/* Cards Grid */}
            {loading ? (
              <div className="cases-loading-spinner">
                <div className="spinner"></div>
                <p>{t('loading') || "جاري التحميل..."}</p>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="cases-empty-state no-content-only-scale">
                <div className="empty-state-scale-wrapper large-display">
                  <svg viewBox="0 0 100 100" className="animated-scale-justice empty-state-scale">
                    {/* Stand / Base */}
                    <path d="M50 25v50M20 75h60M30 75c0-12 40-12 40 0" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <circle cx="50" cy="25" r="3" fill="#00d2ff" />
                    
                    {/* Beam and Pans */}
                    <g className="scale-beam-group">
                      <line x1="20" y1="35" x2="80" y2="35" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" className="scale-beam" />
                      
                      {/* Left Pan */}
                      <g className="scale-pan-left">
                        <line x1="20" y1="35" x2="10" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                        <line x1="20" y1="35" x2="30" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                        <path d="M6 60c0 8 28 8 28 0z" fill="#00d2ff" opacity="0.95" />
                      </g>
                      
                      {/* Right Pan */}
                      <g className="scale-pan-right">
                        <line x1="80" y1="35" x2="70" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                        <line x1="80" y1="35" x2="90" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                        <path d="M66 60c0 8 28 8 28 0z" fill="#00d2ff" opacity="0.95" />
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
            ) : (
              <div className="cases-cards-grid">
                {filteredCases.map((c) => (
                  <div 
                    key={c.id} 
                    className="case-card glass"
                    onClick={() => {
                      setSelectedCase(c);
                      setShowDetailsModal(true);
                    }}
                  >
                    {/* Status Badge */}
                    <div className="case-card-header">
                      <span className={`case-status-badge ${c.status}`}>
                        {c.status === 'upcoming_session' ? t('upcomingSession') :
                         c.status === 'under_review' ? t('underReview') : t('completed')}
                      </span>
                    </div>

                    <div className="case-card-body">
                      {/* Left Side: Suit avatar */}
                      <div className={`client-avatar-wrapper ${!getClientAvatar(c.client) ? 'has-scale' : ''}`}>
                        {getClientAvatar(c.client) ? (
                          <img 
                            src={getClientAvatar(c.client)} 
                            alt={c.client_name} 
                            className="suit-avatar" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                              e.target.parentNode.classList.add('has-scale');
                            }}
                          />
                        ) : null}
                        <svg 
                          viewBox="0 0 100 100" 
                          className="animated-scale-justice suit-avatar-scale"
                          style={{ display: getClientAvatar(c.client) ? 'none' : 'block' }}
                        >
                          {/* Stand / Base */}
                          <path d="M50 25v50M20 75h60M30 75c0-12 40-12 40 0" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" fill="none" />
                          <circle cx="50" cy="25" r="3" fill="#00d2ff" />
                          
                          {/* Beam and Pans */}
                          <g className="scale-beam-group">
                            <line x1="20" y1="35" x2="80" y2="35" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" className="scale-beam" />
                            
                            {/* Left Pan */}
                            <g className="scale-pan-left">
                              <line x1="20" y1="35" x2="10" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                              <line x1="20" y1="35" x2="30" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                              <path d="M6 60c0 8 28 8 28 0z" fill="#00d2ff" opacity="0.95" />
                            </g>
                            
                            {/* Right Pan */}
                            <g className="scale-pan-right">
                              <line x1="80" y1="35" x2="70" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                              <line x1="80" y1="35" x2="90" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                              <path d="M66 60c0 8 28 8 28 0z" fill="#00d2ff" opacity="0.95" />
                            </g>
                          </g>
                        </svg>
                      </div>

                      {/* Right Side: Info */}
                      <div className="client-info-wrapper">
                        <div className="info-row">
                          <span className="info-label">{t('clientName')}:</span>
                          <span className="info-value name">{c.client_name}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">{t('caseNumber')}:</span>
                          <span className="info-value code">{c.case_number}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">{t('caseType')}:</span>
                          <span className="info-value type">{c.case_type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="case-card-progress">
                      <div className="progress-text-row">
                        <span>{t('progressIndicator')}</span>
                        <span className="progress-percentage">{c.progress}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${c.progress}%` }}></div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="case-card-actions">
                      <button 
                        className="action-btn view-btn" 
                        title={t('viewDetails') || "عرض التفاصيل"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCase(c);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      {c.client_id && (
                        <button 
                          className="action-btn chat-btn" 
                          title="مراسلة الموكل"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat?contact_id=${c.client_id}`);
                          }}
                        >
                          <MessageSquare size={16} />
                        </button>
                      )}
                      <button 
                        className="action-btn edit-btn" 
                        title="تعديل"
                        onClick={(e) => openEditModal(c, e)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        title="حذف"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── ADD/EDIT CASE MODAL ── */}
          {showFormModal && (
            <div className="case-modal-overlay" onClick={handleCloseModal}>
              <div className="case-modal-content glass animate-scale-in" onClick={(e) => e.stopPropagation()} dir={dir}>
                <div className="modal-header">
                  <h3>{editingCase ? "تعديل ملف القضية" : "إضافة ملف قضية جديد"}</h3>
                  <button className="close-modal-btn" onClick={handleCloseModal}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="case-modal-form">
                  <div className="form-group">
                    <label>{t('clientName')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="الاسم الكامل للموكل"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label>{t('caseNumber')}</label>
                      <input 
                        type="text" 
                        required
                        placeholder="مثال: 33550"
                        value={formData.case_number}
                        onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                      />
                    </div>

                    <div className="form-group half">
                      <label>{t('caseType')}</label>
                      <select 
                        value={formData.case_type}
                        onChange={(e) => setFormData({...formData, case_type: e.target.value})}
                      >
                        <option value="الأسرة">الأسرة (Family)</option>
                        <option value="الشغل">الشغل (Labor)</option>
                        <option value="التجاري">التجاري (Business)</option>
                        <option value="العقار">العقار (Real Estate)</option>
                        <option value="الجنائي">الجنائي (Criminal)</option>
                        <option value="مدني">مدني (Civil)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label>حالة الملف</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="upcoming_session">جلسة قادمة (Upcoming)</option>
                        <option value="under_review">قيد المراجعة (Review)</option>
                        <option value="completed">مكتمل (Completed)</option>
                      </select>
                    </div>

                    <div className="form-group half">
                      <label>تاريخ الجلسة القادمة</label>
                      <input 
                        type="datetime-local" 
                        value={formData.session_date}
                        onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('progressIndicator') || "مؤشر التقدم"} ({formData.progress}%)</label>
                    <div className="progress-slider-wrapper">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        className="progress-range-slider"
                        value={formData.progress}
                        onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ملاحظات وتفاصيل القضية</label>
                    <textarea 
                      rows="3" 
                      placeholder="سجل هنا تفاصيل إضافية حول القضية، القرارات أو الإجراءات القادمة..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>إلغاء</button>
                    <button type="submit" className="btn-submit">
                      {editingCase ? "حفظ التعديلات" : "إضافة الملف"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── DETAILS VIEW MODAL ── */}
          {showDetailsModal && selectedCase && (
            <div className="case-modal-overlay" onClick={() => setShowDetailsModal(false)}>
              <div className="case-modal-content detail-mode glass animate-scale-in" onClick={(e) => e.stopPropagation()} dir={dir}>
                <div className="modal-header">
                  <h3>تفاصيل ملف القضية #{selectedCase.case_number}</h3>
                  <button className="close-modal-btn" onClick={() => setShowDetailsModal(false)}>
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-detail-body">
                  <div className="detail-profile-header">
                    <div className={`client-avatar-wrapper large ${!getClientAvatar(selectedCase.client) ? 'has-scale' : ''}`}>
                      {getClientAvatar(selectedCase.client) ? (
                        <img 
                          src={getClientAvatar(selectedCase.client)} 
                          alt={selectedCase.client_name} 
                          className="suit-avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                            e.target.parentNode.classList.add('has-scale');
                          }}
                        />
                      ) : null}
                      <svg 
                        viewBox="0 0 100 100" 
                        className="animated-scale-justice suit-avatar-scale"
                        style={{ display: getClientAvatar(selectedCase.client) ? 'none' : 'block' }}
                      >
                        {/* Stand / Base */}
                        <path d="M50 25v50M20 75h60M30 75c0-12 40-12 40 0" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" fill="none" />
                        <circle cx="50" cy="25" r="3" fill="#00d2ff" />
                        
                        {/* Beam and Pans */}
                        <g className="scale-beam-group">
                          <line x1="20" y1="35" x2="80" y2="35" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" className="scale-beam" />
                          
                          {/* Left Pan */}
                          <g className="scale-pan-left">
                            <line x1="20" y1="35" x2="10" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                            <line x1="20" y1="35" x2="30" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                            <path d="M6 60c0 8 28 8 28 0z" fill="#00d2ff" opacity="0.95" />
                          </g>
                          
                          {/* Right Pan */}
                          <g className="scale-pan-right">
                            <line x1="80" y1="35" x2="70" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                            <line x1="80" y1="35" x2="90" y2="60" stroke="#3b82f6" strokeWidth="1.5" />
                            <path d="M66 60c0 8 28 8 28 0z" fill="#00d2ff" opacity="0.95" />
                          </g>
                        </g>
                      </svg>
                    </div>
                    <div className="detail-client-meta">
                      <h4>{selectedCase.client_name}</h4>
                      <span className="client-role-badge">موكل معتمد</span>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">{t('caseNumber')}</span>
                      <span className="value code">{selectedCase.case_number}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">{t('caseType')}</span>
                      <span className="value">{selectedCase.case_type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">حالة الملف</span>
                      <span className={`value status-badge-val ${selectedCase.status}`}>
                        {selectedCase.status === 'upcoming_session' ? t('upcomingSession') :
                         selectedCase.status === 'under_review' ? t('underReview') : t('completed')}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">تاريخ الجلسة</span>
                      <span className="value date">
                        <Calendar size={14} />
                        {selectedCase.session_date ? selectedCase.session_date.replace("T", " ") : "غير محدد"}
                      </span>
                    </div>
                  </div>

                  <div className="detail-progress-section">
                    <div className="progress-labels">
                      <span>{t('progressIndicator')}</span>
                      <span>{selectedCase.progress}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${selectedCase.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="detail-notes-section">
                    <h5>ملاحظات وتفاصيل</h5>
                    <p>{selectedCase.notes || "لا توجد ملاحظات مسجلة لهذه القضية."}</p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>إغلاق</button>
                  <button className="btn-edit-inside" onClick={(e) => openEditModal(selectedCase, e)}>تعديل البيانات</button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── CLIENT HERO ── */}
          <section className="hero-modern">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-ma-flag">🇲🇦</span>
                <span className="badge-text">{t('heroBadge')}</span>
              </div>

              <h1 className="hero-title">
                {t('heroTitlePart1')} <span className="cyan-text">{t('heroTitlePart2')}</span>
              </h1>

              <p className="hero-subtitle">
                {t('heroSubtitle')}
              </p>

              <div className="hero-actions">
                <button className="cta-primary" onClick={() => navigate('/ai')}>
                  <span>{t('heroCtaPrimary')}</span>
                  <ArrowRight size={16} />
                </button>
                <button className="cta-secondary" onClick={() => navigate('/lawyers')}>
                  <span>{t('heroCtaSecondary')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="hero-social-proof">
                <div className="proof-text">
                  {t('heroSocialProof')}
                </div>
              </div>
            </div>

            {/* LEFT PANEL with Mock Chat & Stats */}
            <div className="hero-visual">
              <div className="visual-top-row">
                <div className="visual-stat-card" onClick={() => navigate('/ai')}>
                  <div className="visual-stat-icon blue">
                    <Bot size={18} />
                  </div>
                  <div className="visual-stat-text">
                    <span className="visual-stat-title">{t('statAssistantLabel')}</span>
                    <span className="visual-stat-sub">{t('statAssistantVal')}</span>
                  </div>
                </div>
                <div className="visual-stat-card" onClick={() => navigate('/contracts')}>
                  <div className="visual-stat-icon">
                    <FileText size={18} />
                  </div>
                  <div className="visual-stat-text">
                    <span className="visual-stat-title">{t('statContractsLabel')}</span>
                    <span className="visual-stat-sub">{t('statContractsVal')}</span>
                  </div>
                </div>
              </div>

              {/* Chat Interface Preview */}
              <div className="main-visual-box">
                <div className="chat-interface">
                  <div className="chat-header-mock">{t('chatHeaderMock')}</div>
                  <div className="chat-body-mock">
                    <div className="chat-line user">{t('chatUserMsg1')}</div>
                    <div className="chat-line ai">{t('chatAiMsg1')}</div>
                    <div className="chat-line user">{t('chatUserMsg2')}</div>
                  </div>
                  <div className="chat-suggestions-mock">
                    <span className="suggestion" onClick={() => navigate('/ai')}>{t('chatSuggestion1')}</span>
                    <span className="suggestion" onClick={() => navigate('/ai')}>{t('chatSuggestion2')}</span>
                  </div>
                  <div className="chat-input-mock">
                    <input type="text" placeholder={t('chatInputPlaceholder')} readOnly />
                    <button className="send-btn" onClick={() => navigate('/ai')}>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── SERVICES GRID ── */}
          <section className="services-modern">
            <div className="wrapper">
              <div className="section-header">
                <span className="label">{t('servicesLabel')}</span>
                <h2 className="title">{t('servicesTitle')}</h2>
              </div>
              <div className="grid-container">
                <div className="modern-card" onClick={() => navigate('/ai')}>
                  <div className="icon-box">
                    <Bot size={28} />
                  </div>
                  <h3>{t('serviceAiTitle')}</h3>
                  <p>{t('serviceAiDesc')}</p>
                  <button className="card-link">{t('serviceAiBtn')} <ArrowRight size={16} /></button>
                </div>
                <div className="modern-card" onClick={() => navigate('/contracts')}>
                  <div className="icon-box gold">
                    <FileText size={28} />
                  </div>
                  <h3>{t('serviceContractsTitle')}</h3>
                  <p>{t('serviceContractsDesc')}</p>
                  <button className="card-link">{t('serviceContractsBtn')} <ArrowRight size={16} /></button>
                </div>
                <div className="modern-card" onClick={() => navigate('/lawyers')}>
                  <div className="icon-box">
                    <Users size={28} />
                  </div>
                  <h3>{t('serviceLawyersTitle')}</h3>
                  <p>{t('serviceLawyersDesc')}</p>
                  <button className="card-link">{t('serviceLawyersBtn')} <ArrowRight size={16} /></button>
                </div>
              </div>
            </div>
          </section>

          {/* ── PRICING SECTION ── */}
          <section className="pricing-modern">
            <div className="wrapper">
              <div className="section-header light">
                <h2 className="title">{t('pricingTitle')}</h2>
                <p className="subtitle">{t('pricingSubtitle')}</p>
              </div>
              <div className="pricing-tabs">
                {/* Free Plan */}
                <div className="pricing-card-modern">
                  <div className="p-header">
                    <h3>{t('pricingFreeTitle')}</h3>
                    <div className="p-price">0<span>DH</span></div>
                  </div>
                  <ul className="p-features">
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingFreeFeature1')}</li>
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingFreeFeature2')}</li>
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingFreeFeature3')}</li>
                  </ul>
                  <button className="p-btn" onClick={() => navigate('/login')}>{t('pricingFreeBtn')}</button>
                </div>
                {/* Premium Plan */}
                <div className="pricing-card-modern featured">
                  <div className="featured-label">{t('pricingFeaturedLabel')}</div>
                  <div className="p-header">
                    <h3>{t('pricingPremiumTitle')}</h3>
                    <div className="p-price">49<span>DH</span></div>
                  </div>
                  <ul className="p-features">
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingPremiumFeature1')}</li>
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingPremiumFeature2')}</li>
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingPremiumFeature3')}</li>
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingPremiumFeature4')}</li>
                  </ul>
                  <button className="p-btn primary" onClick={() => navigate('/pricing')}>{t('pricingPremiumBtn')}</button>
                </div>
                {/* Enterprise Plan */}
                <div className="pricing-card-modern">
                  <div className="p-header">
                    <h3>{t('pricingEnterpriseTitle')}</h3>
                    <div className="p-price">299<span>DH</span></div>
                  </div>
                  <ul className="p-features">
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingEnterpriseFeature1')}</li>
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingEnterpriseFeature2')}</li>
                    <li><CheckCircle2 size={16} className="check" /> {t('pricingEnterpriseFeature3')}</li>
                  </ul>
                  <button className="p-btn" onClick={() => navigate('/pricing')}>{t('pricingEnterpriseBtn')}</button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      <Footer />
    </div>
  )
}

export default HomePage
