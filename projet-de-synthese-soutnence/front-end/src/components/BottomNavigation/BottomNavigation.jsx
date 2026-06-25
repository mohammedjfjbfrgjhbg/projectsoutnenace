import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Bot, 
  Users, 
  MessageSquare, 
  User 
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import './BottomNavigation.css';
import { useLanguage } from '../../context/LanguageContext';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    let userId = null;
    if (localUser) {
      const parsed = JSON.parse(localUser);
      setCurrentUser(parsed);
      userId = parsed.id;
    }

    const fetchCounts = async () => {
      try {
        const contactsRes = await api.get('/messages/contacts');
        const totalUnreadMsgs = contactsRes.data.reduce((acc, c) => acc + (c.unread_count || 0), 0);
        setUnreadMessagesCount(totalUnreadMsgs);
      } catch (err) {
        console.error('Error fetching bottom navigation counts:', err);
      }
    };

    fetchCounts();

    if (userId) {
      const socket = io('http://localhost:3000');
      socket.emit('register', userId);

      socket.on('message', (msg) => {
        // Increment message count if not currently viewing the chat
        const isLawyerPage = window.location.pathname.startsWith('/lawyer-messages');
        const isUserPage = window.location.pathname.startsWith('/chat');
        if (!isLawyerPage && !isUserPage) {
          setUnreadMessagesCount(prev => prev + 1);
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [location.pathname]);

  if (!currentUser) return null;

  const isLawyer = currentUser.role === 'lawyer';
  
  // Define dynamic paths
  const homePath = isLawyer ? '/lawyer-dashboard' : '/home';
  const chatPath = isLawyer ? '/lawyer-messages' : '/chat';
  const profilePath = `/profile/${currentUser.id}`;
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  return (
    <div className="bottom-nav-bar" dir={dir}>
      <NavLink to={homePath} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={22} />
        <span className="bottom-nav-label">{t('home')}</span>
      </NavLink>

      <NavLink to="/ai" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Bot size={22} />
        <span className="bottom-nav-label">{t('aiAssistant')}</span>
      </NavLink>

      <NavLink to="/community" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Users size={22} />
        <span className="bottom-nav-label">{t('community')}</span>
      </NavLink>

      <NavLink to={chatPath} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div className="bottom-nav-icon-wrapper">
          <MessageSquare size={22} />
          {unreadMessagesCount > 0 && (
            <span className="bottom-nav-badge">{unreadMessagesCount}</span>
          )}
        </div>
        <span className="bottom-nav-label">{t('messages')}</span>
      </NavLink>

      <NavLink to={profilePath} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User size={22} />
        <span className="bottom-nav-label">{t('profile')}</span>
      </NavLink>
    </div>
  );
};

export default BottomNavigation;
