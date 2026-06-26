import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Search, MessageSquare, Eye, CalendarCheck, FileSearch, Trash2 } from 'lucide-react';
import './LawyerAppointments.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useCustomAlert } from '../context/CustomAlertContext';

const LawyerAppointments = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { showConfirm } = useCustomAlert();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successTooltipId, setSuccessTooltipId] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching lawyer appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (id) => {
    const isConfirmed = await showConfirm(t('confirmDeleteAppointment'));
    if (isConfirmed) {
      try {
        await api.delete(`/appointments/${id}`);
        setAppointments(appointments.filter(app => app.id !== id));
      } catch (err) {
        console.error('Error deleting appointment:', err);
        alert(t('deleteAppointmentError'));
      }
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleConfirmWithTooltip = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'confirmed' });
      // Show tooltip popover for this appointment card
      setSuccessTooltipId(id);
      // Refresh list
      fetchAppointments();
      // Hide tooltip after 3.5 seconds
      setTimeout(() => {
        setSuccessTooltipId(null);
      }, 3500);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert(t('confirmAppointmentError'));
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const clientName = app.user?.name || 'عميل';
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return app.status === statusFilter && matchesSearch;
  });

  // Calculate metrics
  const todayCount = appointments.filter(app => {
    const today = new Date().toLocaleDateString('ar-MA', { day: 'numeric', month: 'short' });
    return app.date_string && typeof app.date_string === 'string' && app.date_string.includes(today) && app.status === 'confirmed';
  }).length;

  const pendingCount = appointments.filter(app => app.status === 'pending').length;
  const totalCount = appointments.length;

  return (
    <div className="la-wrapper animate-fade-in" dir={dir}>
      <div className="la-header">
        <div>
          <h1>{t('appointmentsTitle')}</h1>
          <p>{t('appointmentsSub')}</p>
        </div>
      </div>

      {/* Glassmorphic Stats Section */}
      <div className="la-stats">
        <div className="la-stat-box glass">
          <div className="la-stat-icon confirmed">
            <CalendarCheck size={28} />
          </div>
          <div className="la-stat-info">
            <span className="stat-label">{t('confirmedTodayLabel')}</span>
            <span className="stat-value">{todayCount}</span>
          </div>
        </div>
        <div className="la-stat-box glass">
          <div className="la-stat-icon pending">
            <FileSearch size={28} />
          </div>
          <div className="la-stat-info">
            <span className="stat-label">{t('pendingReviewLabel')}</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>
        <div className="la-stat-box glass">
          <div className="la-stat-icon total">
            <Clock size={28} />
          </div>
          <div className="la-stat-info">
            <span className="stat-label">{t('totalConsultationsLabel')}</span>
            <span className="stat-value">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Toolbar Search & Filter */}
      <div className="la-toolbar">
        <div className="la-filters">
           <button 
             className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
             onClick={() => setStatusFilter('all')}
           >
             {t('allFilter')}
           </button>
           <button 
             className={`filter-pill ${statusFilter === 'confirmed' ? 'active' : ''}`}
             onClick={() => setStatusFilter('confirmed')}
           >
             {t('confirmedFilter')}
           </button>
           <button 
             className={`filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
             onClick={() => setStatusFilter('pending')}
           >
             {t('pendingFilter')}
           </button>
        </div>

        <div className="la-search">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={t('searchClientPlaceholder')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Appointments Cards Grid */}
      <div className="la-cards-container">
        {loading ? (
          <div className="la-loading"><p>{t('loadingAppointments')}</p></div>
        ) : filteredAppointments.length > 0 ? (
          <div className="la-cards-grid animate-slide-up">
            {filteredAppointments.map(app => {
              const clientName = app.user?.name || t('defaultClientName');
              const clientInitial = clientName.charAt(0);

              return (
                <div key={app.id} className="la-appointment-card glass">
                  <div className="la-card-top">
                    <div className="la-client-profile">
                      <div className="la-client-avatar">
                        {clientInitial}
                      </div>
                      <div className="la-client-meta">
                        <h3>{clientName}</h3>
                        <span className="la-date-span">
                          <Calendar size={12} style={{ marginLeft: '4px' }} /> {app.date_string || `${app.day_name}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="la-status-container">
                      {app.status === 'pending' ? (
                        <button 
                          className="la-confirm-btn" 
                          onClick={() => handleConfirmWithTooltip(app.id)}
                        >
                          {t('acceptBtn')}
                        </button>
                      ) : app.status === 'confirmed' ? (
                        <span className="la-status-badge confirmed">{t('confirmedFilter')}</span>
                      ) : (
                        <span className="la-status-badge cancelled">{t('cancelledLabel')}</span>
                      )}

                      {successTooltipId === app.id && (
                        <div className="la-confirm-tooltip animate-fade-in">
                          <div className="la-tooltip-arrow"></div>
                          <p>{t('appointmentAcceptSuccessTooltip')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="la-card-middle">
                    <div className="la-time-range">
                      <Clock size={14} style={{ marginLeft: '6px' }} />
                      <span>{app.time} - {app.time}</span>
                    </div>
                  </div>

                  <div className="la-card-bottom">
                    <button 
                      className="la-action-icon-btn" 
                      onClick={() => navigate('/lawyer-messages')}
                      title={t('chatTooltip')}
                    >
                      <MessageSquare size={16} />
                    </button>
                    {/* Notice: Omitted camera/video call button as requested */}
                    <button 
                      className="la-action-icon-btn" 
                      onClick={() => alert(`${t('appointmentDetailsAlert')} ${clientName}`)}
                      title={t('viewDetailsTooltip')}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="la-action-icon-btn delete-btn" 
                      onClick={() => handleDeleteAppointment(app.id)}
                      title={t('deleteAppointmentTooltip')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="la-empty-state no-content-only-scale">
            <div className="empty-state-video-wrapper">
              <video 
                src="/avocta  marrocaine.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="empty-state-video"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LawyerAppointments;

