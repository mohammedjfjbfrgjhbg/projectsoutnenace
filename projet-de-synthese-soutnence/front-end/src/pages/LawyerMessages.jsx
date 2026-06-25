import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, MoreHorizontal, Phone, Video, Info, FileText, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './LawyerMessages.css';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const LawyerMessages = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [isContactTyping, setIsContactTyping] = useState(false);
  const [contactOnlineStatuses, setContactOnlineStatuses] = useState({});

  // Stories States
  const [stories, setStories] = useState([]);
  const [activeStoryContact, setActiveStoryContact] = useState(null);
  const [activeStoryItemIndex, setActiveStoryItemIndex] = useState(0);
  const [viewedStories, setViewedStories] = useState(() => {
    const saved = localStorage.getItem('viewed-stories');
    return saved ? JSON.parse(saved) : [];
  });

  // File upload input ref
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isContactTyping]);

  // Load current user
  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      setCurrentUser(JSON.parse(localUser));
    }
  }, []);

  // Fetch contacts (based on accepted follow relationships)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const response = await api.get('/messages/contacts');
        setContacts(response.data);

        // Fetch initial online status from socket server
        const userIds = response.data.map(c => c.id);
        if (userIds.length > 0) {
          try {
            const statusRes = await fetch('http://localhost:3000/online-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds })
            });
            const statuses = await statusRes.json();
            setContactOnlineStatuses(statuses);
          } catch (e) {
            console.warn("Could not retrieve initial online statuses: ", e);
          }
        }

        if (response.data.length > 0) {
          setActiveContact(response.data[0]);
        }
      } catch (err) {
        console.error('Error loading lawyer message contacts:', err);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  // Generate mock stories when contacts list is loaded
  useEffect(() => {
    if (contacts.length > 0) {
      const mockImages = [
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505664194779-8bebcb95df04?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?w=600&auto=format&fit=crop&q=80'
      ];
      
      // Map contacts to have mock stories or custom ones
      const list = contacts.map((c, index) => {
        const custom = localStorage.getItem(`custom-stories-${c.id}`);
        if (custom) {
          const parsed = JSON.parse(custom);
          if (parsed.length > 0) {
            return {
              ...c,
              stories: parsed
            };
          }
        }
        const itemsCount = 2 + (index % 2); // 2 or 3 items
        const items = [];
        for (let i = 0; i < itemsCount; i++) {
          items.push({
            id: `${c.id}-story-${i}`,
            url: mockImages[(index + i) % mockImages.length],
            type: 'image'
          });
        }
        return {
          ...c,
          stories: items
        };
      });
      setStories(list);
    }
  }, [contacts]);

  // Save viewed stories to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('viewed-stories', JSON.stringify(viewedStories));
  }, [viewedStories]);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!currentUser) return;

    const socket = io('http://localhost:3000');
    socketRef.current = socket;
    socket.emit('register', currentUser.id);

    socket.on('message', (msg) => {
      // Check if active contact matches
      if (activeContact && (msg.sender_id === activeContact.id || msg.sender_id === currentUser.id)) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        
        // If it is from contact, mark seen
        if (msg.sender_id === activeContact.id) {
          api.post('/messages/seen', { contact_id: activeContact.id });
        }
      } else {
        // Increment unread count in contact list
        setContacts(prev => prev.map(c => c.id === msg.sender_id ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c));
      }
    });

    socket.on('message_seen', (data) => {
      if (activeContact && data.receiver_id === activeContact.id) {
        setMessages(prev => prev.map(m => m.sender_id === currentUser.id ? { ...m, read_at: new Date() } : m));
      }
    });

    socket.on('typing', (data) => {
      if (activeContact && data.senderId === activeContact.id) {
        setIsContactTyping(data.isTyping);
      }
    });

    socket.on('user_status', (data) => {
      setContactOnlineStatuses(prev => ({
        ...prev,
        [data.userId]: data.status
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, activeContact]);

  // Fetch messages between lawyer and active contact
  useEffect(() => {
    if (!activeContact) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await api.get('/messages', {
          params: { contact_id: activeContact.id }
        });
        setMessages(response.data);
        setIsContactTyping(false);

        // Mark as seen immediately
        await api.post('/messages/seen', { contact_id: activeContact.id });
        setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, unread_count: 0 } : c));
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeContact]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeContact || sending) return;

    setSending(true);
    try {
      const response = await api.post('/messages', {
        receiver_id: activeContact.id,
        message: input
      });

      setMessages(prev => [...prev, response.data]);
      setInput('');

      // Stop typing status
      if (socketRef.current) {
        socketRef.current.emit('typing', {
          senderId: currentUser.id,
          receiverId: activeContact.id,
          isTyping: false
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleTypingInput = (e) => {
    setInput(e.target.value);
    if (socketRef.current && activeContact && currentUser) {
      socketRef.current.emit('typing', {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        isTyping: e.target.value.trim().length > 0
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeContact || sending) return;

    setSending(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiver_id', activeContact.id);

    try {
      const response = await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessages(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert(t('uploadFileError'));
    } finally {
      setSending(false);
    }
  };

  // Auto-advance logic for story viewer
  useEffect(() => {
    if (!activeStoryContact) return;

    const currentStories = activeStoryContact.stories || [];
    const timer = setTimeout(() => {
      if (activeStoryItemIndex < currentStories.length - 1) {
        // Next slide in current story
        setActiveStoryItemIndex(prev => prev + 1);
      } else {
        // Current contact's stories fully viewed! Mark as read
        if (!viewedStories.includes(activeStoryContact.id)) {
          setViewedStories(prev => [...prev, activeStoryContact.id]);
        }
        
        // Find next contact with stories
        const currentContactIndex = stories.findIndex(s => s.id === activeStoryContact.id);
        if (currentContactIndex !== -1 && currentContactIndex < stories.length - 1) {
          // Go to next contact's stories
          setActiveStoryContact(stories[currentContactIndex + 1]);
          setActiveStoryItemIndex(0);
        } else {
          // Close the story viewer
          setActiveStoryContact(null);
          setActiveStoryItemIndex(0);
        }
      }
    }, 4000); // 4 seconds per story

    return () => clearTimeout(timer);
  }, [activeStoryContact, activeStoryItemIndex, stories, viewedStories]);

  const handleNextStoryItem = () => {
    if (!activeStoryContact) return;
    const currentStories = activeStoryContact.stories || [];
    if (activeStoryItemIndex < currentStories.length - 1) {
      setActiveStoryItemIndex(prev => prev + 1);
    } else {
      // Mark as read
      if (!viewedStories.includes(activeStoryContact.id)) {
        setViewedStories(prev => [...prev, activeStoryContact.id]);
      }
      // Next contact
      const currentContactIndex = stories.findIndex(s => s.id === activeStoryContact.id);
      if (currentContactIndex !== -1 && currentContactIndex < stories.length - 1) {
        setActiveStoryContact(stories[currentContactIndex + 1]);
        setActiveStoryItemIndex(0);
      } else {
        setActiveStoryContact(null);
        setActiveStoryItemIndex(0);
      }
    }
  };

  const handlePrevStoryItem = () => {
    if (!activeStoryContact) return;
    if (activeStoryItemIndex > 0) {
      setActiveStoryItemIndex(prev => prev - 1);
    } else {
      // Previous contact
      const currentContactIndex = stories.findIndex(s => s.id === activeStoryContact.id);
      if (currentContactIndex > 0) {
        const prevContact = stories[currentContactIndex - 1];
        setActiveStoryContact(prevContact);
        setActiveStoryItemIndex((prevContact.stories || []).length - 1);
      }
    }
  };

  const handleStoryClick = (contact) => {
    setActiveStoryContact(contact);
    setActiveStoryItemIndex(0);
  };

  const getMyCustomStories = () => {
    if (!currentUser) return [];
    const saved = localStorage.getItem(`custom-stories-${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  };

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="lm-wrapper animate-fade-in" dir={dir}>
      {/* ── قصص أصدقائي (My Friends' Stories) — Full-width top banner ── */}
      {stories.length > 0 && (
        <div className="chat-stories-banner">
          <div className="stories-banner-inner">
            <h4 className="stories-banner-title">📖 {t('myFriendsStories')}</h4>
            <div className="stories-horizontal-scroll">
              {/* Current User's Story (قصتك) */}
              {currentUser && (
                <div 
                  className={`story-circle-item mine ${getMyCustomStories().length > 0 ? 'unviewed' : ''}`}
                  onClick={() => {
                    const myStories = getMyCustomStories();
                    if (myStories.length > 0) {
                      setActiveStoryContact({
                        id: currentUser.id,
                        name: currentUser.name,
                        avatar: currentUser.avatar,
                        stories: myStories
                      });
                      setActiveStoryItemIndex(0);
                    } else {
                      navigate(`/profile/${currentUser.id}`);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="story-avatar-wrapper mine-story-avatar" style={getMyCustomStories().length > 0 ? {
                    background: 'linear-gradient(45deg, #00f2fe 0%, #4facfe 30%, #d946ef 100%)',
                    boxShadow: '0 0 10px rgba(0, 242, 254, 0.35)',
                    padding: '3px'
                  } : {}}>
                    {currentUser.avatar ? (
                      <img src={`http://localhost:8000${currentUser.avatar}`} alt="My avatar" className="story-avatar-img" />
                    ) : (
                      <div className="story-avatar-placeholder" style={{ background: '#0a58ca' }}>
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                    <span className="add-story-plus">+</span>
                  </div>
                  <span className="story-username">{t('yourStoryLabel')}</span>
                </div>
              )}
              
              {/* Contacts' Stories */}
              {stories.map(c => {
                const isViewed = viewedStories.includes(c.id);
                return (
                  <div 
                    key={c.id} 
                    className={`story-circle-item ${isViewed ? 'viewed' : 'unviewed'}`}
                    onClick={() => handleStoryClick(c)}
                  >
                    <div className="story-avatar-wrapper">
                      {c.avatar ? (
                        <img src={`http://localhost:8000${c.avatar}`} alt={c.name} className="story-avatar-img" />
                      ) : (
                        <div className="story-avatar-placeholder" style={{ 
                          background: c.lawyer?.avatar_color || '#c9a84c'
                        }}>
                          {c.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="story-username">{c.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="lm-container">
        {/* Sidebar: Chat List */}
        <div className="lm-sidebar">
          <div className="lm-sidebar-header">
            <h3>{t('openConversationsTitle')}</h3>
            <div className="lm-search">
              <Search size={18} />
              <input 
                type="text" 
                placeholder={t('searchClientMessagesPlaceholder')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="lm-chat-list">
            {loadingContacts ? (
              <p style={{ padding: '20px', textAlign: 'center', opacity: 0.7 }}>{t('loadingClientsMessages')}</p>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(chat => {
                const isOnline = contactOnlineStatuses[chat.id] === 'online';
                return (
                  <div 
                    key={chat.id} 
                    className={`lm-chat-item ${activeContact?.id === chat.id ? 'active' : ''}`}
                    onClick={() => setActiveContact(chat)}
                  >
                    <div className="chat-avatar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      {chat.avatar ? (
                        <img src={`http://localhost:8000${chat.avatar}`} alt={chat.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        chat.name.charAt(0)
                      )}
                      <span style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: isOnline ? '#22c55e' : '#94a3b8',
                        border: '2px solid #1e293b'
                      }}></span>
                    </div>
                    <div className="chat-preview" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="chat-name-row" style={{ textAlign: 'right' }}>
                        <h4>{chat.name}</h4>
                        <p className="chat-last-msg">{t('communityMemberLabel')}</p>
                      </div>
                      {chat.unread_count > 0 && (
                        <span style={{
                          background: 'var(--gold)',
                          color: '#121212',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          marginRight: 'auto'
                        }}>{chat.unread_count}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>{t('noConversationsFound')}</p>
            )}
          </div>
        </div>

        {/* Main Content: Chat Window */}
        <div className="lm-main">
          {activeContact ? (
            <>
              <div className="lm-chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {activeContact.avatar ? (
                      <img src={`http://localhost:8000${activeContact.avatar}`} alt={activeContact.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      activeContact.name.charAt(0)
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h4>{activeContact.name}</h4>
                    <span className="user-status">{t('consultationOfficeOpen')}</span>
                  </div>
                </div>
                {/* Omitted call buttons as requested */}
              </div>

              <div className="lm-chat-messages">
                {loadingMessages && messages.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.7, marginTop: '20px' }}>{t('loading')}</p>
                ) : messages.length > 0 ? (
                  messages.map(msg => {
                    const isOwn = msg.sender_id !== activeContact.id;
                    const isSeen = msg.read_at !== null;
                    return (
                      <div key={msg.id} className={`message ${isOwn ? 'sent' : 'received'}`}>
                        <div className="msg-content">
                          {msg.is_file ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={20} style={{ color: '#d97706' }} />
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>{msg.file_name}</p>
                                <a href={`http://127.0.0.1:8000${msg.file_path}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'underline' }}>
                                  {t('downloadFile')}
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p>{msg.message}</p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginTop: '2px' }}>
                            <span className="msg-time">
                              {new Date(msg.created_at).toLocaleTimeString(language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : 'ar-MA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <span style={{ fontSize: '0.65rem', color: isSeen ? 'var(--gold)' : 'rgba(255,255,255,0.4)' }}>
                                {isSeen ? `✓ ${t('seenLabel')}` : `✓ ${t('sentLabel')}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '20px' }}>{t('startConversationTip')}</p>
                )}
                {isContactTyping && (
                  <div className="message received">
                    <div className="msg-content" style={{ border: '1px dashed var(--gold)', background: 'rgba(255, 215, 0, 0.03)' }}>
                      <p style={{ fontStyle: 'italic', margin: 0, fontSize: '0.85rem' }}>{t('typingLabel')}</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="lm-chat-input">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
                <button className="input-btn" onClick={() => fileInputRef.current?.click()} disabled={sending}>
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text" 
                  placeholder={t('typeYourMessagePlaceholder')} 
                  value={input}
                  onChange={handleTypingInput}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={sending}
                />
                <button className="send-btn" onClick={handleSendMessage} disabled={sending}>
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flex1: 1, height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.6 }}>
              <Send size={48} style={{ marginBottom: '15px' }} />
              <h3>{t('selectContactToStart')}</h3>
            </div>
          )}
        </div>
      </div>

      {/* ── Story Viewer Modal (Instagram Style) ── */}
      {activeStoryContact && (
        <div className="story-viewer-backdrop" onClick={() => { setActiveStoryContact(null); setActiveStoryItemIndex(0); }}>
          <div className="story-viewer-modal-premium" onClick={e => e.stopPropagation()}>
            
            {/* Header info */}
            <div className="story-viewer-header">
              <div className="story-author-info">
                <div className="story-author-avatar">
                  {activeStoryContact.avatar ? (
                    <img src={`http://localhost:8000${activeStoryContact.avatar}`} alt={activeStoryContact.name} />
                  ) : (
                    <div className="story-avatar-placeholder-sm" style={{ background: activeStoryContact.lawyer?.avatar_color || '#c9a84c' }}>
                      {activeStoryContact.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="story-author-meta">
                  <span className="story-author-name">{activeStoryContact.name}</span>
                  <span className="story-time-badge">{t('activeNow')}</span>
                </div>
              </div>
              <button className="story-close-btn" onClick={() => { setActiveStoryContact(null); setActiveStoryItemIndex(0); }}>
                <X size={20} />
              </button>
            </div>

            {/* Progress indicators */}
            <div className="story-progress-indicators">
              {(activeStoryContact.stories || []).map((item, idx) => {
                let fillClass = '';
                if (idx < activeStoryItemIndex) fillClass = 'filled';
                else if (idx === activeStoryItemIndex) fillClass = 'filling';
                
                return (
                  <div key={item.id} className="story-progress-bar-bg">
                    <div className={`story-progress-bar-fill ${fillClass}`} />
                  </div>
                );
              })}
            </div>

            {/* Media Content */}
            <div className="story-media-container">
              <button className="story-nav-btn prev" onClick={handlePrevStoryItem}>
                <ChevronRight size={28} />
              </button>
              
              <img 
                src={activeStoryContact.stories[activeStoryItemIndex]?.url} 
                alt="Story slide" 
                className="story-media-element"
              />

              <button className="story-nav-btn next" onClick={handleNextStoryItem}>
                <ChevronLeft size={28} />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerMessages;
