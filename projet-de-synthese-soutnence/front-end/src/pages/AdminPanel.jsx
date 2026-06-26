import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ExternalLink, 
  ShieldAlert, 
  LogOut, 
  RefreshCw, 
  User, 
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react';
import api from '../services/api';
import './AdminPanel.css';
import { useLanguage } from '../context/LanguageContext';
import { useCustomAlert } from '../context/CustomAlertContext';

const AdminPanel = () => {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const { showConfirm } = useCustomAlert();
    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Dashboard States
    const [stats, setStats] = useState({ total_pending: 0, total_approved: 0, total_rejected: 0 });
    const [lawyers, setLawyers] = useState([]);
    const [activeTab, setActiveTab] = useState('pending_review'); // pending_review, approved, rejected
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Modal States
    const [selectedLawyer, setSelectedLawyer] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [zoomImage, setZoomImage] = useState(null);

    // Check if user is already logged in as admin
    const checkAdminAuth = () => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            const user = JSON.parse(storedUser);
            if (user.role === 'admin') {
                setIsAdmin(true);
                fetchStats();
                fetchLawyers(activeTab);
                setLoading(false);
                return;
            }
        }
        // Redirect to regular login if not admin
        navigate('/login');
    };

    useEffect(() => {
        checkAdminAuth();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchLawyers(activeTab);
        }
    }, [activeTab, isAdmin]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);

        try {
            const response = await api.post('/login', { email, password });
            const user = response.data.user;

            if (user.role === 'admin') {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(user));
                setIsAdmin(true);
                fetchStats();
                fetchLawyers(activeTab);
            } else {
                setLoginError(t('adminLoginErrorAdmin'));
                // Clean up token immediately if logged in user isn't admin
                api.post('/logout').catch(() => {});
                localStorage.clear();
            }
        } catch (err) {
            console.error('Admin login error:', err);
            setLoginError(err.response?.data?.message || t('adminLoginErrorCredentials'));
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.clear();
            setIsAdmin(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/secure-admin-8392/dashboard');
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        }
    };

    const fetchLawyers = async (statusTab) => {
        setRefreshing(true);
        try {
            const response = await api.get(`/secure-admin-8392/lawyers?status=${statusTab}`);
            setLawyers(response.data);
        } catch (err) {
            console.error('Error fetching lawyers:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleViewDetails = async (id) => {
        setModalLoading(true);
        setSelectedLawyer(null);
        setShowRejectionForm(false);
        setRejectionReason('');
        try {
            const response = await api.get(`/secure-admin-8392/lawyers/${id}`);
            setSelectedLawyer(response.data);
        } catch (err) {
            console.error('Error fetching lawyer details:', err);
            alert(t('loadDetailsError'));
        } finally {
            setModalLoading(false);
        }
    };

    const handleApprove = async (id) => {
        const isConfirmed = await showConfirm(t('confirmApproveAlert'));
        if (!isConfirmed) return;
        
        setActionLoading(true);
        try {
            await api.post(`/secure-admin-8392/lawyers/${id}/approve`);
            setSelectedLawyer(null);
            fetchStats();
            fetchLawyers(activeTab);
        } catch (err) {
            console.error('Error approving lawyer:', err);
            alert(t('approveErrorAlert'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        if (!rejectionReason) {
            alert(t('rejectReasonRequiredAlert'));
            return;
        }

        setActionLoading(true);
        try {
            await api.post(`/secure-admin-8392/lawyers/${selectedLawyer.id}/reject`, {
                reason: rejectionReason
            });
            setSelectedLawyer(null);
            fetchStats();
            fetchLawyers(activeTab);
        } catch (err) {
            console.error('Error rejecting lawyer:', err);
            alert(t('rejectErrorAlert'));
        } finally {
            setActionLoading(false);
        }
    };

    // Filtered lawyers by search query
    const filteredLawyers = lawyers.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.bar_number?.includes(searchTerm) ||
        l.bar_city?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="admin-loading-wrapper">
                <RefreshCw className="spinner-icon" size={40} />
                <p>{t('adminLoading')}</p>
            </div>
        );
    }

    // LOGIN GATE IF NOT ADMIN
    if (!isAdmin) {
        return null;
    }

    // MAIN ADMIN PANEL VIEW
    return (
        <div className="admin-panel-layout" dir={dir}>
            {/* Header / Top Navbar */}
            <header className="admin-header-nav glass">
                <div className="admin-header-right">
                    <Shield className="admin-logo-shield" />
                    <h1>{t("adminPanelTitle")}</h1>
                </div>
                <div className="admin-header-left">
                    <button onClick={handleLogout} className="btn-admin-logout">
                        <LogOut size={16} /> {t("logout")}
                    </button>
                </div>
            </header>

            <main className="admin-content-container">
                {/* Stats Section */}
                <section className="admin-stats-grid">
                    <div className="stat-card glass pending" onClick={() => setActiveTab('pending_review')}>
                        <div className="stat-card-info">
                            <span className="stat-num">{stats.total_pending}</span>
                            <span className="stat-label">{t("statsPendingRequests")}</span>
                        </div>
                        <div className="stat-card-icon">
                            <RefreshCw size={24} />
                        </div>
                    </div>

                    <div className="stat-card glass approved" onClick={() => setActiveTab('approved')}>
                        <div className="stat-card-info">
                            <span className="stat-num">{stats.total_approved}</span>
                            <span className="stat-label">{t("statsApprovedLawyers")}</span>
                        </div>
                        <div className="stat-card-icon">
                            <CheckCircle size={24} />
                        </div>
                    </div>

                    <div className="stat-card glass rejected" onClick={() => setActiveTab('rejected')}>
                        <div className="stat-card-info">
                            <span className="stat-num">{stats.total_rejected}</span>
                            <span className="stat-label">{t("statsRejectedRequests")}</span>
                        </div>
                        <div className="stat-card-icon">
                            <XCircle size={24} />
                        </div>
                    </div>
                </section>

                {/* Table Control Panel */}
                <section className="table-controls-card glass">
                    <div className="controls-header">
                        <div className="tabs-row">
                            <button 
                                onClick={() => setActiveTab('pending_review')} 
                                className={`tab-btn ${activeTab === 'pending_review' ? 'active' : ''}`}
                            >
                                {t("tabPending")} ({stats.total_pending})
                            </button>
                            <button 
                                onClick={() => setActiveTab('approved')} 
                                className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                            >
                                {t("tabApproved")} ({stats.total_approved})
                            </button>
                            <button 
                                onClick={() => setActiveTab('rejected')} 
                                className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                            >
                                {t("tabRejected")} ({stats.total_rejected})
                            </button>
                        </div>

                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder={t("adminSearchPlaceholder")} 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Lawyers List Table */}
                    <div className="table-wrapper">
                        {refreshing ? (
                            <div className="table-loading">
                                <RefreshCw className="spinner-icon" size={32} />
                                <p>{t("updatingData")}</p>
                            </div>
                        ) : filteredLawyers.length === 0 ? (
                            <div className="table-empty">
                                <ShieldAlert size={48} className="empty-icon" />
                                <p>{t("noRequestsInSection")}</p>
                            </div>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>{t("fullName")}</th>
                                        <th>{t("colEmail")}</th>
                                        <th>{t("phone")}</th>
                                        <th>{t("cityLabel") || t("cityAddress")}</th>
                                        <th>{t("colRegNum")}</th>
                                        <th>{t("colSubDate")}</th>
                                        <th>{t("colActions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLawyers.map((lawyer) => (
                                        <tr key={lawyer.id}>
                                            <td className="lawyer-td-name">
                                                <div className="lawyer-avatar-placeholder" style={{ backgroundColor: lawyer.avatar_color }}>
                                                    {lawyer.initial}
                                                </div>
                                                <span>{lawyer.name}</span>
                                            </td>
                                            <td>{lawyer.user?.email || 'N/A'}</td>
                                            <td>{lawyer.user?.phone || 'N/A'}</td>
                                            <td>{lawyer.bar_city}</td>
                                            <td><span className="badge-bar-num">{lawyer.bar_number}</span></td>
                                            <td>{new Date(lawyer.created_at).toLocaleDateString('ar-MA')}</td>
                                            <td>
                                                <button onClick={() => handleViewDetails(lawyer.id)} className="btn-view-details">
                                                    <Eye size={14} /> {t("actionAudit")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </main>

            {/* DETAILS AND DOCUMENT AUDIT MODAL */}
            {(selectedLawyer || modalLoading) && (
                <div className="admin-modal-backdrop animate-fade-in">
                    <div className="admin-modal-card glass animate-slide-in">
                        {modalLoading ? (
                            <div className="modal-loading-box">
                                <RefreshCw className="spinner-icon" size={36} />
                                <p>{t("loadingAuditDetails")}</p>
                            </div>
                        ) : (
                            <>
                                <header className="modal-header">
                                    <h3>{t("auditTitle")} {selectedLawyer.name}</h3>
                                    <button onClick={() => setSelectedLawyer(null)} className="btn-close-modal">×</button>
                                </header>
                                
                                <div className="modal-body-content">
                                    <div className="modal-grid-layout">
                                        
                                        {/* Right Side: Information Details */}
                                        <div className="modal-info-column">
                                            <div className="info-section-card">
                                                <h4><User size={16} /> {t("personalInfoSection")}</h4>
                                                <div className="info-detail-row"><span className="lbl">{t("fullName")}:</span> <span className="val">{selectedLawyer.name}</span></div>
                                                <div className="info-detail-row"><span className="lbl"><Mail size={12} /> {t("colEmail")}:</span> <span className="val">{selectedLawyer.user?.email}</span></div>
                                                <div className="info-detail-row"><span className="lbl"><Phone size={12} /> {t("phone")}:</span> <span className="val">{selectedLawyer.user?.phone}</span></div>
                                                <div className="info-detail-row"><span className="lbl"><MapPin size={12} /> {t("officeAddress")}</span> <span className="val">{selectedLawyer.city}</span></div>
                                            </div>

                                            <div className="info-section-card mt-3">
                                                <h4><Briefcase size={16} /> {t("professionalData")}</h4>
                                                <div className="info-detail-row"><span className="lbl">{t("mainSpecializationLabel") || "التخصص"}:</span> <span className="val">{selectedLawyer.field}</span></div>
                                                <div className="info-detail-row"><span className="lbl">{t("barRegNumber")}</span> <span className="val font-bold">{selectedLawyer.bar_number}</span></div>
                                                <div className="info-detail-row"><span className="lbl">{t("barCityName")}</span> <span className="val">{selectedLawyer.bar_city}</span></div>
                                                <div className="info-detail-row"><span className="lbl">{t("currentVerificationStatus")}</span> 
                                                    <span className={`status-badge-val ${selectedLawyer.verification_status}`}>
                                                        {selectedLawyer.verification_status === 'pending_review' ? t('tabPending') :
                                                         selectedLawyer.verification_status === 'approved' ? t('approvedStatus') : t('rejectedStatus')}
                                                    </span>
                                                </div>
                                                {selectedLawyer.rejection_reason && (
                                                    <div className="info-detail-row reason-row">
                                                        <span className="lbl text-red">{t("rejectionReasonLabel")}</span> 
                                                        <p className="val text-red">{selectedLawyer.rejection_reason}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Decisions Action row */}
                                            {selectedLawyer.verification_status === 'pending_review' && (
                                                <div className="decision-actions-section">
                                                    {!showRejectionForm ? (
                                                        <div className="decision-buttons">
                                                            <button 
                                                                onClick={() => handleApprove(selectedLawyer.id)} 
                                                                className="btn-approve-kyc"
                                                                disabled={actionLoading}
                                                            >
                                                                {t("approveAccountBtn")}
                                                            </button>
                                                            <button 
                                                                onClick={() => setShowRejectionForm(true)} 
                                                                className="btn-reject-kyc-trigger"
                                                                disabled={actionLoading}
                                                            >
                                                                {t("rejectAccountBtn")}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <form onSubmit={handleReject} className="rejection-form">
                                                            <label>{t("rejectionReasonPrompt")}</label>
                                                            <textarea 
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                                placeholder={t("rejectionExample")}
                                                                required
                                                            ></textarea>
                                                            <div className="rejection-form-buttons">
                                                                <button type="submit" className="btn-confirm-reject" disabled={actionLoading}>
                                                                    {t("confirmRejectBtn")}
                                                                </button>
                                                                <button type="button" onClick={() => setShowRejectionForm(false)} className="btn-cancel-rejection">
                                                                    {t("cancelBtn")}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Left Side: KYC Documents Audit */}
                                        <div className="modal-documents-column">
                                            <h4><FileText size={16} /> {t("attachedDocumentsTitle")}</h4>
                                            
                                            <div className="images-preview-grid">
                                                <div className="doc-preview-item">
                                                    <span>{t("cinFrontLabel")}</span>
                                                    <div className="doc-img-wrapper" onClick={() => setZoomImage(selectedLawyer.cin_front_url)}>
                                                        <img src={selectedLawyer.cin_front_url} alt="CIN Front" />
                                                    </div>
                                                </div>

                                                <div className="doc-preview-item">
                                                    <span>{t("cinBackLabel")}</span>
                                                    <div className="doc-img-wrapper" onClick={() => setZoomImage(selectedLawyer.cin_back_url)}>
                                                        <img src={selectedLawyer.cin_back_url} alt="CIN Back" />
                                                    </div>
                                                </div>

                                                <div className="doc-preview-item">
                                                    <span>{t("liveSelfieLabel")}</span>
                                                    <div className="doc-img-wrapper" onClick={() => setZoomImage(selectedLawyer.selfie_url)}>
                                                        <img src={selectedLawyer.selfie_url} alt="Selfie" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Professional Document Box */}
                                            <div className="prof-doc-section mt-4">
                                                <span>{t("proofDocLabel")}</span>
                                                <div className="prof-doc-link-box glass">
                                                    <FileText size={28} className="prof-doc-icon" />
                                                    <div className="prof-doc-info">
                                                        <span>{t("proofDocTitle")}</span>
                                                        <a href={selectedLawyer.professional_doc_url} target="_blank" rel="noopener noreferrer" className="btn-download-doc">
                                                            {t("openInNewWindow")} <ExternalLink size={12} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* LIGHTBOX FOR IMAGE ZOOM */}
            {zoomImage && (
                <div className="zoom-backdrop" onClick={() => setZoomImage(null)}>
                    <div className="zoom-content-box">
                        <img src={zoomImage} alt="Zoomed Document" className="zoomed-image" />
                        <button className="zoom-close-btn" onClick={() => setZoomImage(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
