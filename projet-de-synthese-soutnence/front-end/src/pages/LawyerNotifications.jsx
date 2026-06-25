import React from 'react';
import { Bell, Calendar, MessageSquare, CreditCard, Star, Info, MoreHorizontal } from 'lucide-react';
import './LawyerNotifications.css';
import { useLanguage } from '../context/LanguageContext';

const LawyerNotifications = () => {
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  const notifications = [
    { id: 1, type: 'appointment', title: t('newAppointmentTitle') || 'موعد جديد', desc: 'قام محمد أمين بحجز استشارة قانونية غداً الساعة 14:00', time: t('timeNow') || 'منذ 5 دقائق', icon: <Calendar size={18} />, color: '#7c3aed', unread: true },
    { id: 2, type: 'message', title: t('messageNotifTitle') || 'رسالة جديدة', desc: 'أرسلت لك سارة العلمي رسالة بخصوص تأسيس الشركة', time: 'منذ ساعة', icon: <MessageSquare size={18} />, color: '#0369a1', unread: true },
    { id: 3, type: 'payment', title: t('paymentReceivedTitle') || 'تم استلام الدفعة', desc: 'تم تحويل مبلغ 450 د.م لرصيدك من الاستشارة الأخيرة', time: 'منذ 3 ساعات', icon: <CreditCard size={18} />, color: '#16a34a', unread: false },
    { id: 4, type: 'review', title: t('newReviewTitle') || 'تقييم جديد', desc: 'ترك لك العميل ياسين بنعلي تقييماً بـ 5 نجوم', time: 'منذ يوم واحد', icon: <Star size={18} />, color: '#d97706', unread: false },
    { id: 5, type: 'system', title: 'تحديث النظام', desc: 'تم إضافة ميزة المكالمات المرئية الجديدة، اكتشفها الآن', time: 'منذ يومين', icon: <Info size={18} />, color: '#4b5563', unread: false },
  ];

  return (
    <div className="ln-wrapper animate-fade-in" dir={dir}>
      <div className="ln-header">
        <h1>{t('notificationsTitle')}</h1>
        <div className="ln-actions">
           <button className="ln-mark-btn">{t('clearAllRead')}</button>
        </div>
      </div>

      <div className="ln-list animate-slide-up">
        {notifications.map(notif => (
          <div key={notif.id} className={`ln-item ${notif.unread ? 'unread' : ''}`}>
            <div className="ln-icon-box" style={{ backgroundColor: `${notif.color}15`, color: notif.color }}>
              {notif.icon}
            </div>
            <div className="ln-content">
              <div className="ln-top-row">
                <h3>{notif.title}</h3>
                <span className="ln-time">{notif.time}</span>
              </div>
              <p>{notif.desc}</p>
            </div>
            <button className="ln-more"><MoreHorizontal size={18} /></button>
            {notif.unread && <span className="ln-dot"></span>}
          </div>
        ))}
      </div>
      
      <button className="ln-load-more">{t('showPreviousNotifications')}</button>
    </div>
  );
};

export default LawyerNotifications;
