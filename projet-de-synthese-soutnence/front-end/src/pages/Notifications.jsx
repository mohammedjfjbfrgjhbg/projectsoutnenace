import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Trash2, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  UserPlus, 
  UserCheck, 
  Star, 
  Info, 
  CreditCard 
} from 'lucide-react';
import api from '../services/api';
import profileService from '../services/profile.service';
import { SOCKET_URL } from '../config';
import './Notifications.css';
import { useLanguage } from '../context/LanguageContext';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const { language, t } = useLanguage();
    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

    useEffect(() => {
        const localUser = localStorage.getItem('user');
        if (localUser) {
            setCurrentUser(JSON.parse(localUser));
        }
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // Socket.IO Listener
    useEffect(() => {
        if (!currentUser) return;

        const socket = io(SOCKET_URL);
        socket.emit('register', currentUser.id);

        const handleRealtimeNotif = (data) => {
            fetchNotifications();
        };

        socket.on('follow_request', handleRealtimeNotif);
        socket.on('follow_accept', handleRealtimeNotif);
        socket.on('message', handleRealtimeNotif);
        socket.on('appointment_new', handleRealtimeNotif);
        socket.on('appointment_update', handleRealtimeNotif);

        return () => {
            socket.disconnect();
        };
    }, [currentUser]);

    const handleMarkAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date() } : n));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleClearAll = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date() })));
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    const handleDeleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const handleAcceptFollow = async (e, senderId, notifId) => {
        e.stopPropagation();
        try {
            await profileService.acceptFollow(senderId);
            fetchNotifications();
        } catch (err) {
            console.error('Error accepting follow request:', err);
        }
    };

    const handleRejectFollow = async (e, senderId, notifId) => {
        e.stopPropagation();
        try {
            await profileService.rejectFollow(senderId);
            fetchNotifications();
        } catch (err) {
            console.error('Error rejecting follow request:', err);
        }
    };

    const getNotificationDetails = (notif) => {
        const name = notif.sender ? notif.sender.name : t('defaultUser');
        switch (notif.type) {
            case 'follow_request':
                return {
                    title: t('followRequestNotif'),
                    content: t('followRequestDesc').replace('{name}', name),
                    icon: <UserPlus size={18} />,
                    iconBg: 'rgba(59, 130, 246, 0.15)',
                    iconColor: '#3b82f6',
                    path: `/profile/${notif.sender_id}`,
                    action: t('actionViewProfile')
                };
            case 'follow_accept':
                return {
                    title: t('followAcceptNotif'),
                    content: t('followAcceptDesc').replace('{name}', name),
                    icon: <UserCheck size={18} />,
                    iconBg: 'rgba(20, 184, 166, 0.15)',
                    iconColor: '#14b8a6',
                    path: `/profile/${notif.sender_id}`,
                    action: t('actionViewProfile')
                };
            case 'message':
                const snippet = notif.data?.snippet || '';
                return {
                    title: t('messageNotif'),
                    content: `${name}: ${snippet}`,
                    icon: <MessageSquare size={18} />,
                    iconBg: 'rgba(14, 165, 233, 0.15)',
                    iconColor: '#0ea5e9',
                    path: notif.sender?.role === 'lawyer' ? '/lawyer-messages' : '/chat',
                    action: t('actionGoToChat')
                };
            case 'appointment_new':
                return {
                    title: t('newAppointmentNotif'),
                    content: t('newAppointmentDesc')
                        .replace('{name}', name)
                        .replace('{date}', notif.data?.date_string || '')
                        .replace('{time}', notif.data?.time || ''),
                    icon: <Calendar size={18} />,
                    iconBg: 'rgba(139, 92, 246, 0.15)',
                    iconColor: '#8b5cf6',
                    path: '/lawyer-dashboard',
                    action: t('actionGoToSchedule')
                };
            case 'appointment_confirmed':
                return {
                    title: t('confirmedAppointmentNotif'),
                    content: t('confirmedAppointmentDesc')
                        .replace('{name}', name)
                        .replace('{date}', notif.data?.date_string || '')
                        .replace('{time}', notif.data?.time || ''),
                    icon: <CheckCircle2 size={18} />,
                    iconBg: 'rgba(16, 185, 129, 0.15)',
                    iconColor: '#10b981',
                    path: '/dashboard',
                    action: t('actionViewAppointments')
                };
            case 'appointment_cancelled':
                return {
                    title: t('cancelledAppointmentNotif'),
                    content: t('cancelledAppointmentDesc')
                        .replace('{name}', name)
                        .replace('{date}', notif.data?.date_string || '')
                        .replace('{time}', notif.data?.time || ''),
                    icon: <XCircle size={18} />,
                    iconBg: 'rgba(239, 68, 68, 0.15)',
                    iconColor: '#ef4444',
                    path: notif.sender?.role === 'lawyer' ? '/dashboard' : '/lawyer-dashboard',
                    action: t('actionViewDetails')
                };
            case 'payment_received':
                return {
                    title: t('paymentReceivedNotif'),
                    content: notif.data?.message || t('paymentReceivedDesc').replace('{amount}', notif.data?.amount || '450'),
                    icon: <CreditCard size={18} />,
                    iconBg: 'rgba(16, 185, 129, 0.15)',
                    iconColor: '#10b981',
                    path: '/lawyer-earnings',
                    action: t('actionViewEarnings')
                };
            case 'review_new':
                return {
                    title: t('newReviewNotif'),
                    content: notif.data?.message || t('newReviewDesc').replace('{name}', name),
                    icon: <Star size={18} />,
                    iconBg: 'rgba(245, 158, 11, 0.15)',
                    iconColor: '#f59e0b',
                    path: `/profile/${currentUser?.id}`,
                    action: t('actionViewReviews')
                };
            default:
                return {
                    title: t('unknownNotif'),
                    content: t('unknownNotifDesc'),
                    icon: <Info size={18} />,
                    iconBg: 'rgba(107, 114, 128, 0.15)',
                    iconColor: '#9ca3af',
                    path: '/dashboard',
                    action: t('actionViewDetails')
                };
        }
    };

    return (
        <div className="notifications-page alternative-design" dir={dir}>
            <div className="notifications-wrapper">
                
                {/* Redesigned Header Row matching Mockup Image 2 */}
                <div className="notifications-header-row">
                    <h1 className="notifications-title">{t('notificationsTitle')}</h1>
                    <button className="mark-all-read-link" onClick={handleClearAll}>
                        {t('clearAllRead')}
                    </button>
                </div>

                <div className="notifications-list-container">
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>{t('loading')}</p>
                    ) : notifications.length > 0 ? (
                        notifications.map((notif) => {
                            const details = getNotificationDetails(notif);
                            const isUnread = !notif.read_at;
                            return (
                                <div 
                                    key={notif.id} 
                                    className={`notification-premium-card ${isUnread ? 'is-unread' : ''}`} 
                                    onClick={() => handleMarkAsRead(notif.id)}
                                >
                                    {/* Unread blue dot on top corner */}
                                    {isUnread && <span className="card-unread-dot"></span>}

                                    {/* Left Area: Time and Actions */}
                                    <div className="card-left-section">
                                        <span className="card-time-text">
                                            {new Date(notif.created_at).toLocaleDateString(language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : 'ar-MA', { 
                                                month: 'short', 
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        <button 
                                            className="delete-card-btn"
                                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                                            title={t('deleteNotificationTooltip')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Middle Area: Texts */}
                                    <div className="card-middle-section">
                                        <h3 className="card-title-text">{details.title}</h3>
                                        <p className="card-body-text">{details.content}</p>
                                        
                                        {/* Action link if follow request */}
                                        {notif.type === 'follow_request' ? (
                                            <div className="notif-follow-actions" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                                <button 
                                                    className="btn-accept" 
                                                    onClick={(e) => handleAcceptFollow(e, notif.sender_id, notif.id)}
                                                >
                                                    {t('accept')}
                                                </button>
                                                <button 
                                                    className="btn-reject" 
                                                    onClick={(e) => handleRejectFollow(e, notif.sender_id, notif.id)}
                                                >
                                                    {t('reject')}
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                className="card-action-trigger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(notif.id);
                                                    navigate(details.path);
                                                }}
                                            >
                                                {details.action}
                                            </button>
                                        )}
                                    </div>

                                    {/* Right Area: Icon */}
                                    <div 
                                        className="card-icon-wrapper" 
                                        style={{ backgroundColor: details.iconBg, color: details.iconColor }}
                                    >
                                        {details.icon}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-notifications-premium">
                            <Info size={40} className="empty-icon" />
                            <h3>{t('noNotifications')}</h3>
                            <p>{t('noNotificationsDesc')}</p>
                        </div>
                    )}
                </div>

                {/* Bottom Show previous notifications button matching Mockup */}
                {notifications.length > 0 && (
                    <button className="load-more-notifications-btn" onClick={fetchNotifications}>
                        {t('showPreviousNotifications')}
                    </button>
                )}

            </div>
        </div>
    );
};

export default Notifications;
