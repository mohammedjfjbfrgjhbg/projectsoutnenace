import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Heart, 
  MessageCircle, 
  MapPin, 
  Link as LinkIcon, 
  Edit3, 
  Camera, 
  Plus, 
  Scale, 
  User, 
  Phone,
  Mail,
  X,
  MessageSquare,
  Bookmark,
  Send,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Gavel,
  Eye,
  Users,
  UserCheck,
  BookOpen,
  Star
} from 'lucide-react';
import { io } from 'socket.io-client';
import profileService from '../services/profile.service';
import postService from '../services/post.service';
import api from '../services/api';
import './Profile.css';
import { useLanguage } from '../context/LanguageContext';
import { BACKEND_URL, SOCKET_URL } from '../config';

const Profile = () => {
  const { userId } = useParams();
  const { language, t } = useLanguage();
  const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';

  const specialtyKeyMap = {
    'قانون الأسرة': 'specialtyFamily',
    'قانون الأعمال': 'specialtyBusiness',
    'القانون الجنائي': 'specialtyCriminal',
    'قانون الشغل': 'specialtyLabor',
    'قانون العقار': 'specialtyRealEstate',
    'قانون المقاولات': 'specialtyCompanies',
    'مستشار قانوني عام': 'specialtyGeneralAdvisor'
  };

  const getSpecialtyLabel = (field) => {
    const key = specialtyKeyMap[field];
    return key ? t(key) : field;
  };
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileAnimation, setShowProfileAnimation] = useState(false);
  const [stats, setStats] = useState({ posts_count: 0, followers_count: 0, following_count: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState(null); // 'pending', 'accepted', or null
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Reviews & Tab states
  const [activeGalleryTab, setActiveGalleryTab] = useState('posts');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Followers & Following Lists Modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [updating, setUpdating] = useState(false);

  // Post Detail Modal
  const [activePost, setActivePost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);

  const fileInputRef = useRef(null);
  const avatarUploadRef = useRef(null);
  const reelFileInputRef = useRef(null);
  const storyFileInputRef = useRef(null);

  // Custom Stories States
  const [customStories, setCustomStories] = useState([]);
  const [activeStoryContact, setActiveStoryContact] = useState(null);
  const [activeStoryItemIndex, setActiveStoryItemIndex] = useState(0);
  const [viewedStories, setViewedStories] = useState(() => {
    const saved = localStorage.getItem('viewed-stories');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic Reels State (Starts empty, no mock data)
  const [reels, setReels] = useState([]);
  const [activeReelIndex, setActiveReelIndex] = useState(null);
  const [newReelComment, setNewReelComment] = useState('');

  const handleOpenReel = (index) => {
    setActiveReelIndex(index);
  };

  const handleCloseReel = () => {
    setActiveReelIndex(null);
  };

  const handleNextReel = () => {
    if (activeReelIndex !== null && activeReelIndex < reels.length - 1) {
      setActiveReelIndex(activeReelIndex + 1);
    }
  };

  const handlePrevReel = () => {
    if (activeReelIndex !== null && activeReelIndex > 0) {
      setActiveReelIndex(activeReelIndex - 1);
    }
  };

  const handleLikeReel = (index) => {
    setReels(prev => prev.map((r, idx) => {
      if (idx === index) {
        return {
          ...r,
          isLiked: !r.isLiked,
          likes: r.isLiked ? r.likes - 1 : r.likes + 1
        };
      }
      return r;
    }));
  };

  const handleAddReelComment = (index) => {
    if (!newReelComment.trim()) return;
    setReels(prev => prev.map((r, idx) => {
      if (idx === index) {
        return {
          ...r,
          comments: [...(r.comments || []), newReelComment]
        };
      }
      return r;
    }));
    setNewReelComment('');
  };

  const handleReelUploadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        alert(t('imageOrVideoOnlyAlert'));
        return;
      }
      
      const title = prompt(t('highlightUploadPrompt'));
      if (title) {
        const newReel = {
          id: Date.now(),
          title: title,
          type: isImage ? 'image' : 'video',
          emoji: isImage ? "📷" : "🎥",
          videoUrl: URL.createObjectURL(file),
          likes: 0,
          isLiked: false,
          comments: []
        };
        setReels(prev => [newReel, ...prev]);
        setActiveReelIndex(0); // View immediately
      }
    }
  };

  // Load current user on mount
  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      setCurrentUser(JSON.parse(localUser));
    }
  }, []);

  // Trigger profile entrance animation when loading finishes and profile user is rendered
  useEffect(() => {
    if (!loading && profileUser) {
      setShowProfileAnimation(true);
      const timer = setTimeout(() => {
        setShowProfileAnimation(false);
      }, 3800);
      return () => clearTimeout(timer);
    } else {
      setShowProfileAnimation(false);
    }
  }, [loading, profileUser, userId]);

  // Load profile user's stories on mount/userId change
  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`custom-stories-${userId}`);
      if (saved) {
        setCustomStories(JSON.parse(saved));
      } else {
        setCustomStories([]);
      }
    }
  }, [userId]);

  // Auto-advance logic for story viewer
  useEffect(() => {
    if (!activeStoryContact) return;

    const currentStories = activeStoryContact.stories || [];
    const timer = setTimeout(() => {
      if (activeStoryItemIndex < currentStories.length - 1) {
        setActiveStoryItemIndex(prev => prev + 1);
      } else {
        // Mark as viewed when finished
        const targetId = activeStoryContact.id;
        if (targetId && !viewedStories.includes(targetId)) {
          const updated = [...viewedStories, targetId];
          setViewedStories(updated);
          localStorage.setItem('viewed-stories', JSON.stringify(updated));
        }
        setActiveStoryContact(null);
        setActiveStoryItemIndex(0);
      }
    }, 4000); // 4 seconds per story

    return () => clearTimeout(timer);
  }, [activeStoryContact, activeStoryItemIndex, viewedStories]);

  const handleNextStoryItem = () => {
    if (!activeStoryContact) return;
    const currentStories = activeStoryContact.stories || [];
    if (activeStoryItemIndex < currentStories.length - 1) {
      setActiveStoryItemIndex(prev => prev + 1);
    } else {
      // Mark as viewed when finished
      const targetId = activeStoryContact.id;
      if (targetId && !viewedStories.includes(targetId)) {
        const updated = [...viewedStories, targetId];
        setViewedStories(updated);
        localStorage.setItem('viewed-stories', JSON.stringify(updated));
      }
      setActiveStoryContact(null);
      setActiveStoryItemIndex(0);
    }
  };

  const handlePrevStoryItem = () => {
    if (!activeStoryContact) return;
    if (activeStoryItemIndex > 0) {
      setActiveStoryItemIndex(prev => prev - 1);
    }
  };

  const handleAvatarClick = () => {
    if (customStories.length > 0) {
      setActiveStoryContact({
        id: profileUser?.id,
        name: profileUser?.name,
        avatar: profileUser?.avatar,
        lawyer: profileUser?.lawyer,
        stories: customStories
      });
      setActiveStoryItemIndex(0);
    } else if (isOwnProfile) {
      storyFileInputRef.current?.click();
    }
  };

  const handleStoryUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("يرجى اختيار صورة فقط للقصة.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newStory = {
          id: `custom-story-${Date.now()}`,
          url: reader.result, // base64 string
          type: 'image',
          timestamp: Date.now()
        };
        const updatedStories = [...customStories, newStory];
        setCustomStories(updatedStories);
        localStorage.setItem(`custom-stories-${profileUser.id}`, JSON.stringify(updatedStories));
        
        // Remove from viewed stories list when uploading a new story
        const filteredViewed = viewedStories.filter(id => id !== profileUser.id);
        setViewedStories(filteredViewed);
        localStorage.setItem('viewed-stories', JSON.stringify(filteredViewed));

        // Reset file input
        e.target.value = '';
        
        alert("تم نشر القصة بنجاح!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteStory = (storyId) => {
    if (window.confirm("هل تريد {t('deleteCommentBtn') || 'حذف'} هذه القصة؟")) {
      const updatedStories = customStories.filter(s => s.id !== storyId);
      setCustomStories(updatedStories);
      localStorage.setItem(`custom-stories-${profileUser.id}`, JSON.stringify(updatedStories));
      
      // If no stories left, close viewer. Otherwise adjust index if out of bounds
      if (updatedStories.length === 0) {
        setActiveStoryContact(null);
        setActiveStoryItemIndex(0);
      } else {
        setActiveStoryContact(prev => ({
          ...prev,
          stories: updatedStories
        }));
        if (activeStoryItemIndex >= updatedStories.length) {
          setActiveStoryItemIndex(updatedStories.length - 1);
        }
      }
    }
  };

  // Fetch profile when userId changes
  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  // Real-time Follows Socket Listener
  useEffect(() => {
    if (!userId || !currentUser) return;

    const socket = io(SOCKET_URL);
    socket.emit('register', currentUser.id);

    socket.on('follow_request', (data) => {
      if (currentUser.id === parseInt(userId)) {
        fetchProfileData();
      }
    });

    socket.on('follow_accept', (data) => {
      fetchProfileData();
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, currentUser]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile(userId);
      setProfileUser(data.user);
      setStats(data.stats);
      setIsFollowing(data.is_following);
      setFollowStatus(data.follow_status);
      setPosts(data.posts);
      setPendingRequests(data.pending_requests || []);

      // Prepopulate edit fields
      setEditName(data.user.name || '');
      setEditBio(data.user.bio || '');
      setEditWebsite(data.user.website || '');
      setEditPhone(data.user.phone || '');
      setEditAddress(data.user.address || '');
      setEditAvatarPreview(data.user.avatar || '');
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    try {
      const res = await profileService.toggleFollow(profileUser.id);
      setIsFollowing(res.is_following);
      setFollowStatus(res.follow_status);
      setStats(prev => ({ ...prev, followers_count: res.followers_count }));
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handleAcceptRequest = async (senderId) => {
    try {
      const res = await profileService.acceptFollow(senderId);
      setPendingRequests(prev => prev.filter(r => r.id !== senderId));
      setStats(prev => ({ ...prev, followers_count: res.followers_count }));
      fetchProfileData();
    } catch (err) {
      console.error('Error accepting follow request:', err);
    }
  };

  const handleRejectRequest = async (senderId) => {
    try {
      await profileService.rejectFollow(senderId);
      setPendingRequests(prev => prev.filter(r => r.id !== senderId));
    } catch (err) {
      console.error('Error rejecting follow request:', err);
    }
  };

  const openFollowersModal = async () => {
    try {
      const list = await profileService.getFollowers(userId);
      setFollowersList(list);
      setShowFollowersModal(true);
    } catch (err) {
      console.error('Error fetching followers list:', err);
    }
  };

  const openFollowingModal = async () => {
    try {
      const list = await profileService.getFollowing(userId);
      setFollowingList(list);
      setShowFollowingModal(true);
    } catch (err) {
      console.error('Error fetching following list:', err);
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditAvatarFile(file);
      setEditAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('bio', editBio);
      formData.append('website', editWebsite);
      formData.append('phone', editPhone);
      formData.append('address', editAddress);
      if (editPassword) {
        formData.append('password', editPassword);
      }
      if (editAvatarFile) {
        formData.append('avatar', editAvatarFile);
      }

      const res = await profileService.updateProfile(formData);
      
      // Update states
      setProfileUser(res.user);
      // Sync local storage if updating self
      if (currentUser && currentUser.id === res.user.id) {
        localStorage.setItem('user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }

      setShowEditModal(false);
      setEditPassword('');
      setEditAvatarFile(null);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Chat Redirect
  const handleMessageRedirect = () => {
    if (!currentUser) return;
    // Route to Chat page and pass contact user
    navigate('/chat', { state: { selectedContact: profileUser } });
  };

  // Post Detail Actions
  const handlePostClick = async (postSummary) => {
    try {
      // Fetch full post details (including comments) by hitting community feed list
      const allPosts = await postService.getPosts();
      const detailed = allPosts.find(p => p.id === postSummary.id);
      if (detailed) {
        setActivePost(detailed);
      } else {
        // Fallback to post summary details if not in current feed
        setActivePost({
          ...postSummary,
          user: profileUser,
          comments: []
        });
      }
    } catch (err) {
      console.error('Error fetching post detail:', err);
    }
  };

  const handleModalLike = async () => {
    if (!activePost) return;
    try {
      const res = await postService.toggleLike(activePost.id);
      setActivePost(prev => ({
        ...prev,
        is_liked: res.is_liked,
        likes_count: res.likes_count
      }));
      // Update list
      setPosts(prev => prev.map(p => p.id === activePost.id ? { ...p, likes_count: res.likes_count } : p));
    } catch (err) {
      console.error('Error liking modal post:', err);
    }
  };

  const handleModalAddComment = async (parentId = null) => {
    if (!activePost) return;
    const text = parentId ? replyInputs[parentId] : commentText;
    if (!text || !text.trim()) return;

    try {
      const res = await postService.addComment(activePost.id, text, parentId);
      
      setActivePost(prev => {
        let updatedComments = [...prev.comments];
        if (parentId) {
          updatedComments = updatedComments.map(c => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), res.comment] };
            }
            return c;
          });
        } else {
          updatedComments = [...updatedComments, res.comment];
        }

        return {
          ...prev,
          comments_count: prev.comments_count + 1,
          comments: updatedComments
        };
      });

      // Update in posts list
      setPosts(prev => prev.map(p => p.id === activePost.id ? { ...p, comments_count: p.comments_count + 1 } : p));

      if (parentId) {
        setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
        setActiveReplyId(null);
      } else {
        setCommentText('');
      }
    } catch (err) {
      console.error('Error adding modal comment:', err);
    }
  };

  const handleModalCommentVote = async (commentId, isLike, parentId = null) => {
    if (!activePost) return;
    try {
      const res = await postService.toggleCommentLike(commentId, isLike);

      setActivePost(prev => {
        const updateVotes = (c) => {
          if (c.id === commentId) {
            return {
              ...c,
              user_liked: res.user_liked,
              likes_count: res.likes_count,
              dislikes_count: res.dislikes_count,
            };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.map(r =>
                r.id === commentId
                  ? {
                      ...r,
                      user_liked: res.user_liked,
                      likes_count: res.likes_count,
                      dislikes_count: res.dislikes_count,
                    }
                  : r
              ),
            };
          }
          return c;
        };

        return {
          ...prev,
          comments: prev.comments.map(updateVotes)
        };
      });
    } catch (err) {
      console.error('Error voting on comment in modal:', err);
    }
  };

  const handleModalDeleteComment = async (commentId, parentId = null) => {
    if (!activePost) return;
    if (!window.confirm('هل تريد حذف التعليق؟')) return;

    try {
      await postService.deleteComment(commentId);

      setActivePost(prev => {
        let updatedComments = [...prev.comments];
        if (parentId) {
          updatedComments = updatedComments.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: c.replies.filter(r => r.id !== commentId)
              };
            }
            return c;
          });
        } else {
          updatedComments = updatedComments.filter(c => c.id !== commentId);
        }

        return {
          ...prev,
          comments_count: Math.max(0, prev.comments_count - 1),
          comments: updatedComments
        };
      });

      // Update posts list
      setPosts(prev => prev.map(p => p.id === activePost.id ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p));
    } catch (err) {
      console.error('Error deleting comment in modal:', err);
    }
  };

  const handleWriteReviewClick = () => {
    if (!currentUser) {
      alert('الرجاء تسجيل الدخول أولاً لتتمكن من كتابة تقييم.');
      navigate('/login');
      return;
    }
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!profileUser?.lawyer) return;
    
    setSubmittingReview(true);
    try {
      const response = await api.post(`/lawyers/${profileUser.lawyer.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });

      // Update profileUser local state
      setProfileUser(prev => ({
        ...prev,
        lawyer: {
          ...prev.lawyer,
          rating: response.data.rating,
          reviews: response.data.reviews,
          reviews_json: response.data.reviews_json
        }
      }));

      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      alert('تم إرسال تقييمك بنجاح. شكراً لك!');
    } catch (err) {
      console.error('Error submitting review:', err);
      const errMsg = err.response?.data?.message || 'حدث خطأ أثناء إرسال التقييم. الرجاء المحاولة مجدداً.';
      alert(errMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helpers
  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;
  const avatarSrc = (user) => {
    if (user?.avatar) {
      return `${BACKEND_URL}${user.avatar}`;
    }
    return null;
  };

  const initials = (name) => name ? name.charAt(0) : '⚖️';

  const avatarColor = (user) => {
    if (user?.role === 'lawyer' && user.lawyer?.avatar_color) {
      return user.lawyer.avatar_color;
    }
    return '#064e3b';
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>{t('loading') || 'جاري تحميل الملف الشخصي...'}</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-not-found glass">
        <h2>{t('userNotFound') || 'المستخدم غير موجود'}</h2>
        <p>{t('userNotFoundDesc') || 'قد يكون هذا الملف الشخصي تم حذفه أو أن الرابط غير صحيح.'}</p>
        <button onClick={() => navigate('/community')}>{t('backToCommunity') || 'العودة للمجتمع'}</button>
      </div>
    );
  }

  return (
    <div className="profile-page" dir={dir}>
      
      {/* ── Profile Header ── */}
      {/* ── Profile Header ── */}
      {profileUser.role === 'lawyer' ? (
        <section className="profile-header-card lawyer-theme">
          
          {/* Decorative absolute gavel icon in bottom left */}
          <div className="lawyer-gavel-deco">
            <Gavel size={110} strokeWidth={1} />
          </div>

          {/* Avatar Area (Right in RTL) */}
          <div className="profile-avatar-container">
            <div 
              className={`avatar-ring lawyer-avatar-ring ${customStories.length > 0 ? (viewedStories.includes(profileUser.id) ? 'has-stories viewed' : 'has-stories unviewed') : ''}`}
              onClick={handleAvatarClick}
              style={{ cursor: customStories.length > 0 || isOwnProfile ? 'pointer' : 'default' }}
            >
              {avatarSrc(profileUser) ? (
                <img src={avatarSrc(profileUser)} alt={profileUser.name} className="profile-pic" />
              ) : (
                <div className="profile-pic-placeholder" style={{ backgroundColor: avatarColor(profileUser) }}>
                  {initials(profileUser.name)}
                </div>
              )}

              {isOwnProfile && (
                <>
                  <button 
                    className="edit-avatar-overlay"
                    onClick={(e) => { e.stopPropagation(); avatarUploadRef.current?.click(); }}
                    title={t('changeAvatarLabel')}
                  >
                    <Camera size={16} />
                  </button>
                  <div 
                    className="add-story-badge"
                    onClick={(e) => { e.stopPropagation(); storyFileInputRef.current?.click(); }}
                    title={t('publishNewStory') || 'نشر قصة جديدة'}
                  >
                    <Plus size={14} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats & Info Area (Left in RTL) */}
          <div className="profile-details-area">
            <div className="profile-top-row lawyer-top-row">
              <div className="lawyer-username-wrapper">
                <h2 className="profile-username" style={{ position: 'relative' }}>
                  {profileUser.name}
                  {showProfileAnimation && (
                    <div className="profile-orbit-container">
                      <img src="/scale.png" className="orbit-item orbit-scale" alt="" />
                      <img src="/robe.png" className="orbit-item orbit-robe" alt="" />
                    </div>
                  )}
                </h2>
                <span className="verified-badge-wrap" title={t('certifiedLawyer')}>
                  <svg className="verified-badge-icon" viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ffffff"/>
                  </svg>
                </span>
              </div>

              <div className="profile-actions">
                {isOwnProfile ? (
                  <button className="btn-edit-lawyer" onClick={() => setShowEditModal(true)}>
                    <Edit3 size={15} />
                    <span>{t('editProfileTitle')}</span>
                  </button>
                ) : (
                  <>
                    <button 
                      className={`btn-follow ${followStatus === 'accepted' ? 'following' : followStatus === 'pending' ? 'requested' : 'primary'} lawyer-follow-btn`}
                      onClick={handleFollowToggle}
                    >
                      {followStatus === 'accepted' ? t('unfollowBtn') : followStatus === 'pending' ? t('requestedBtn') : t('followBtn')}
                    </button>
                    <button className="btn-secondary lawyer-btn" onClick={handleMessageRedirect}>
                      {t('messageBtn')}
                    </button>
                    <button className="btn-secondary lawyer-btn" title="معلومات الاتصال">
                      {t('callBtn')}
                    </button>
                    <button className="btn-secondary lawyer-btn rate-lawyer-btn-capsule" onClick={handleWriteReviewClick}>
                      ⭐ {t('rateBtn')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Capsule Pill */}
            <div className="lawyer-stats-pill">
              <div className="lawyer-stat-item">
                <BookOpen size={14} />
                <strong>{stats.posts_count}</strong>
                <span>{t('postsLabel')}</span>
              </div>
              <span className="lawyer-stat-divider">•</span>
              <div className="lawyer-stat-item" onClick={openFollowersModal} style={{ cursor: 'pointer' }}>
                <Users size={14} />
                <strong>{stats.followers_count}</strong>
                <span>{t('followersLabel')}</span>
              </div>
              <span className="lawyer-stat-divider">•</span>
              <div className="lawyer-stat-item" onClick={openFollowingModal} style={{ cursor: 'pointer' }}>
                <UserCheck size={14} />
                <strong>{stats.following_count}</strong>
                <span>{t('followingLabel')}</span>
              </div>
              {profileUser.lawyer && (
                <>
                  <span className="lawyer-stat-divider">•</span>
                  <div className="lawyer-stat-item" onClick={() => setActiveGalleryTab('reviews')} style={{ cursor: 'pointer' }}>
                    <Star size={14} fill="#eab308" stroke="#eab308" />
                    <strong>{profileUser.lawyer.rating ? profileUser.lawyer.rating.toFixed(1) : '5.0'}</strong>
                    <span>({profileUser.lawyer.reviews || 0} {t('reviewsLabel')})</span>
                  </div>
                </>
              )}
            </div>

            {/* Bio Description */}
            <div className="profile-bio-container lawyer-bio-container">
              {profileUser.lawyer && (
                <p className="lawyer-field-info">
                  <Scale size={14} /> 
                  <span>{t('specialtyLabel')} {getSpecialtyLabel(profileUser.lawyer.field || 'قانون العمل')}</span>
                </p>
              )}
              
              {profileUser.bio ? (
                <p className="bio-text">{profileUser.bio}</p>
              ) : (
                isOwnProfile && <p className="bio-text text-placeholder" onClick={() => setShowEditModal(true)}>{t('bioPlaceholder') || 'أضف نبذة تعريفية قصيرة عنك...'}</p>
              )}

              {/* View count indicator */}
              <div className="lawyer-view-count">
                <span>{profileUser.views_count || 21}</span>
                <Eye size={14} />
              </div>
            </div>

          </div>

        </section>
      ) : (
        <section className="profile-header-card glass">
          
          {/* Avatar Area (Right in RTL) */}
          <div className="profile-avatar-container">
            <div 
              className={`avatar-ring ${customStories.length > 0 ? (viewedStories.includes(profileUser.id) ? 'has-stories viewed' : 'has-stories unviewed') : ''}`}
              onClick={handleAvatarClick}
              style={{ cursor: customStories.length > 0 || isOwnProfile ? 'pointer' : 'default' }}
            >
              {avatarSrc(profileUser) ? (
                <img src={avatarSrc(profileUser)} alt={profileUser.name} className="profile-pic" />
              ) : (
                <div className="profile-pic-placeholder" style={{ backgroundColor: avatarColor(profileUser) }}>
                  {initials(profileUser.name)}
                </div>
              )}

              {isOwnProfile && (
                <>
                  <button 
                    className="edit-avatar-overlay"
                    onClick={(e) => { e.stopPropagation(); avatarUploadRef.current?.click(); }}
                    title="تغيير الصورة الشخصية"
                  >
                    <Camera size={16} />
                  </button>
                  <div 
                    className="add-story-badge"
                    onClick={(e) => { e.stopPropagation(); storyFileInputRef.current?.click(); }}
                    title="نشر قصة جديدة"
                  >
                    <Plus size={14} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats & Info Area (Left in RTL) */}
          <div className="profile-details-area">
            <div className="profile-top-row">
              <h2 className="profile-username" style={{ position: 'relative' }}>
                {profileUser.name}
                {showProfileAnimation && (
                  <div className="profile-orbit-container">
                    <img src="/scale.png" className="orbit-item orbit-scale" alt="" />
                    <img src="/robe.png" className="orbit-item orbit-robe" alt="" />
                  </div>
                )}
              </h2>
              
              {profileUser.role === 'lawyer' && (
                <span className="badge lawyer-badge">
                  <Scale size={12} /> محامي معتمد
                </span>
              )}

              <div className="profile-actions">
                {isOwnProfile ? (
                  <button className="btn-secondary edit-profile-btn" onClick={() => setShowEditModal(true)}>
                    <Edit3 size={15} />
                    <span>تعديل الملف الشخصي</span>
                  </button>
                ) : (
                  <>
                    <button 
                      className={`btn-follow ${followStatus === 'accepted' ? 'following' : followStatus === 'pending' ? 'requested' : 'primary'}`}
                      onClick={handleFollowToggle}
                    >
                      {followStatus === 'accepted' ? t('unfollowBtn') : followStatus === 'pending' ? t('requestedBtn') : t('followBtn')}
                    </button>
                    <button className="btn-secondary" onClick={handleMessageRedirect}>
                      {t('messageBtn')}
                    </button>
                    <button className="btn-secondary" title="معلومات الاتصال">
                      {t('callBtn')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Followers / Following / Posts Counts */}
            <div className="profile-stats">
              <div className="stat-item">
                <strong>{stats.posts_count}</strong>
                <span>{t('postsLabel')}</span>
              </div>
              <div className="stat-item" onClick={openFollowersModal} style={{ cursor: 'pointer' }}>
                <strong>{stats.followers_count}</strong>
                <span>{t('followersLabel')}</span>
              </div>
              <div className="stat-item" onClick={openFollowingModal} style={{ cursor: 'pointer' }}>
                <strong>{stats.following_count}</strong>
                <span>{t('followingLabel')}</span>
              </div>
            </div>

            {/* Bio Description */}
            <div className="profile-bio-container">
              {profileUser.role === 'lawyer' && profileUser.lawyer && (
                <p className="lawyer-field-info">⚖️ {t('specialtyLabel')} {getSpecialtyLabel(profileUser.lawyer.field)}</p>
              )}
              
              {profileUser.bio ? (
                <p className="bio-text">{profileUser.bio}</p>
              ) : (
                isOwnProfile && <p className="bio-text text-placeholder" onClick={() => setShowEditModal(true)}>أضف نبذة تعريفية قصيرة عنك...</p>
              )}

              <div className="bio-metadata">
                {profileUser.website && (
                  <a href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} target="_blank" rel="noopener noreferrer" className="meta-link">
                    <LinkIcon size={14} />
                    <span>{profileUser.website}</span>
                  </a>
                )}
                {profileUser.address && (
                  <span className="meta-item">
                    <MapPin size={14} />
                    <span>{profileUser.address}</span>
                  </span>
                )}
              </div>
            </div>

          </div>

        </section>
      )}

      {/* Hidden avatar input defined once */}
      <input 
        type="file" 
        ref={avatarUploadRef}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            const formData = new FormData();
            formData.append('avatar', file);
            profileService.updateProfile(formData).then(res => {
              setProfileUser(res.user);
              // Sync storage
              localStorage.setItem('user', JSON.stringify(res.user));
              setCurrentUser(res.user);
            });
          }
        }}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Hidden story input */}
      <input 
        type="file" 
        ref={storyFileInputRef}
        onChange={handleStoryUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* ── Dynamic Reels highlights Section (Instagram Style) ── */}
      <section className={`profile-highlights ${profileUser.role === 'lawyer' ? 'lawyer-highlights' : ''}`}>
        {/* Hidden video/image input to publish new Reels/Highlights */}
        <input 
          type="file" 
          ref={reelFileInputRef}
          onChange={handleReelUploadChange}
          accept="video/*,image/*"
          style={{ display: 'none' }}
        />

        {isOwnProfile && (
          <div className="highlight-item add-reel-highlight" onClick={() => reelFileInputRef.current?.click()}>
            <div className="highlight-circle add-circle">
              <Plus size={28} />
            </div>
            <span className="highlight-label">Highlights</span>
          </div>
        )}
        
        {reels.map((reel, idx) => (
          <div key={reel.id} className="highlight-item" onClick={() => handleOpenReel(idx)}>
            <div className="highlight-circle reel-active-ring">
              <span className="reel-emoji">{reel.emoji || "🎥"}</span>
            </div>
            <span className="highlight-label">{reel.title}</span>
          </div>
        ))}
      </section>

      {/* ── Gallery Wrap (Allows watermark positioning) ── */}
      <div className="profile-gallery-wrapper">
        {profileUser.role === 'lawyer' && (
          <div className="profile-watermark">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M30 90 L70 90 M50 90 L50 20 M20 30 L80 30 M20 30 L10 55 M20 30 L30 55 M8 55 L32 55 A12 12 0 0 0 20 67 A12 12 0 0 0 32 55 M80 30 L70 55 M80 30 L90 55 M68 55 L92 55 A12 12 0 0 0 80 67 A12 12 0 0 0 92 55 M50 30 L50 24" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* ── Gallery Tabs ── */}
        <div className="gallery-tabs-container">
          <div 
            className={`gallery-tab ${activeGalleryTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveGalleryTab('posts')}
          >
            <Grid size={18} />
            <span>{t('postsLabel')} ({posts.length})</span>
          </div>
          {profileUser.role === 'lawyer' && (
            <div 
              className={`gallery-tab ${activeGalleryTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveGalleryTab('reviews')}
            >
              <ThumbsUp size={18} />
              <span>{t('reviewsLabel')} ({profileUser.lawyer?.reviews || 0})</span>
            </div>
          )}
        </div>

        {/* ── Gallery Content ── */}
        {activeGalleryTab === 'posts' ? (
          <section className="posts-gallery-grid">
            {posts.length > 0 ? (
              posts.map((post) => {
                const hasImages = post.images && post.images.length > 0;
                const previewUrl = hasImages ? `${BACKEND_URL}${post.images[0]}` : null;
                
                return (
                  <div 
                    key={post.id} 
                    className="gallery-item"
                    onClick={() => handlePostClick(post)}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Post thumbnail" className="gallery-thumbnail" />
                    ) : (
                      <div className="gallery-text-only">
                        <p>{post.content}</p>
                      </div>
                    )}
                    
                    {/* Statistics Overlay */}
                    <div className="gallery-overlay">
                      <div className="overlay-stat">
                        <Heart size={18} fill="#fff" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="overlay-stat">
                        <MessageCircle size={18} fill="#fff" />
                        <span>{post.comments_count}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="gallery-empty">
                <div className="empty-icon-box">
                  <Grid size={32} />
                </div>
                <h3>{t('emptyPostsLabel')}</h3>
                <p>
                  {isOwnProfile
                    ? t('emptyPostsDescOwn')
                    : profileUser.role === 'lawyer'
                    ? t('emptyPostsDescLawyer')
                    : t('emptyPostsDescMember')}
                </p>
              </div>
            )}
          </section>
        ) : (
          /* ── Reviews List Section ── */
          <section className="reviews-gallery-section animate-fade-in">
            <div className="reviews-summary-card">
              <div className="summary-stars-box">
                <span className="summary-rating-number">
                  {profileUser.lawyer?.rating ? profileUser.lawyer.rating.toFixed(1) : '5.0'}
                </span>
                <div className="summary-stars-row">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const ratingVal = profileUser.lawyer?.rating || 5;
                    const isFilled = idx < Math.round(ratingVal);
                    return <Star key={idx} size={20} fill={isFilled ? "#eab308" : "none"} stroke="#eab308" />;
                  })}
                </div>
                <span className="summary-reviews-count">
                  {t('reviewsBasedOn').replace('{count}', profileUser.lawyer?.reviews || 0)}
                </span>
              </div>
              
              {isOwnProfile ? (
                <div className="own-profile-review-note" style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '320px',
                  margin: '10px auto 0'
                }}>
                  {t('ownProfileReviewNote')}
                </div>
              ) : (
                <button className="write-review-btn-primary" onClick={handleWriteReviewClick}>
                  {t('writeReviewBtn')}
                </button>
              )}
            </div>

            <div className="reviews-list-container">
              {profileUser.lawyer?.reviews_json && profileUser.lawyer.reviews_json.length > 0 ? (
                profileUser.lawyer.reviews_json.map((rev, idx) => (
                  <div key={idx} className="review-card-item">
                    <div className="review-card-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar-placeholder">
                          {rev.user_name ? rev.user_name.charAt(0) : '👤'}
                        </div>
                        <div>
                          <h4 className="reviewer-name">{rev.user_name}</h4>
                          <span className="reviewer-date">{rev.date}</span>
                        </div>
                      </div>
                      <div className="reviewer-stars-row">
                        {Array.from({ length: 5 }).map((_, sIdx) => (
                          <Star key={sIdx} size={14} fill={sIdx < rev.rating ? "#eab308" : "none"} stroke="#eab308" />
                        ))}
                      </div>
                    </div>
                    {rev.comment && <p className="review-card-comment">{rev.comment}</p>}
                  </div>
                ))
              ) : (
                <div className="reviews-empty-state">
                  <Star size={32} className="empty-star-icon" />
                  <h3>{t('emptyReviewsLabel')}</h3>
                  <p>{t('emptyReviewsDesc')}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="profile-modal-card glass animate-fade-in" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>{t('editProfileTitle')}</h3>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleUpdateProfile} className="modal-form">
              
              {/* Profile Pic Upload */}
              <div className="form-avatar-pick">
                <div className="picker-preview">
                  {editAvatarPreview ? (
                    <img src={editAvatarPreview.startsWith('blob:') ? editAvatarPreview : `${BACKEND_URL}${editAvatarPreview}`} alt="avatar pick preview" />
                  ) : (
                    <div className="pic-placeholder-sm" style={{ backgroundColor: avatarColor(profileUser) }}>
                      {initials(editName)}
                    </div>
                  )}
                  <button 
                    type="button" 
                    className="avatar-change-overlay"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <span>{t('changeAvatarLabel')}</span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>{t('fullName')}</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('websiteLabel')}</label>
                  <input 
                    type="text" 
                    placeholder="example.com"
                    value={editWebsite}
                    onChange={e => setEditWebsite(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('phone')}</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('cityAddress')}</label>
                  <input 
                    type="text" 
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label>{t('bioLabel')}</label>
                  <textarea 
                    rows={3}
                    placeholder={t('bioPlaceholder')}
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label>{t('newPasswordLabel')} ({t('newPasswordPlaceholder')})</label>
                  <input 
                    type="password" 
                    placeholder="******"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                  />
                </div>
              </div>

              <footer className="form-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>{t('cancelBtn')}</button>
                <button type="submit" className="btn-save" disabled={updating}>
                  {updating ? t('saving') : t('saveChanges')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ── Submit Review Modal ── */}
      {showReviewModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="profile-modal-card glass animate-fade-in" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>{t('rateLawyerTitle')}</h3>
              <button className="modal-close-btn" onClick={() => setShowReviewModal(false)}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleReviewSubmit} className="modal-form">
              
              {/* Star Rating Selector */}
              <div className="review-stars-selector-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
                <label style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{t('ratingStarsLabel')}</label>
                <div className="stars-input-row" style={{ display: 'flex', gap: '8px' }}>
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const val = idx + 1;
                    return (
                      <button 
                        key={idx}
                        type="button"
                        className="star-select-btn"
                        style={{ background: 'transparent', padding: '4px', border: 'none', cursor: 'pointer' }}
                        onClick={() => setReviewRating(val)}
                      >
                        <Star size={28} fill={val <= reviewRating ? "#eab308" : "none"} stroke="#eab308" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group full-width">
                <label>{t('commentOptionalLabel')}</label>
                <textarea 
                  rows={4}
                  placeholder={t('commentPlaceholder')}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-white)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>

              <footer className="form-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowReviewModal(false)}>{t('cancelBtn')}</button>
                <button type="submit" className="btn-save" disabled={submittingReview}>
                  {submittingReview ? t('submittingRating') : t('submitRatingBtn')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ── Post Detail Detail Modal (Instagram overlay look) ── */}
      {activePost && (
        <div className="post-detail-backdrop" onClick={() => setActivePost(null)}>
          <div className="post-detail-modal glass animate-fade-in" onClick={e => e.stopPropagation()}>
            
            <button className="post-modal-close" onClick={() => setActivePost(null)}>
              <X size={24} />
            </button>

            <div className="post-modal-content-wrapper">
              
              {/* Right Side: Media Display */}
              <div className="post-modal-media">
                {activePost.images && activePost.images.length > 0 ? (
                  <img src={`${BACKEND_URL}${activePost.images[0]}`} alt="Post detailed visual" />
                ) : (
                  <div className="text-post-placeholder">
                    <p>{activePost.content}</p>
                  </div>
                )}
              </div>

              {/* Left Side: Detail & Comment Drawer */}
              <div className="post-modal-comments-sidebar">
                
                {/* Header (Author info) */}
                <div className="sidebar-author-header">
                  <div 
                    className="user-avatar size-sm" 
                    style={{ backgroundColor: avatarColor(activePost.user || profileUser) }}
                  >
                    {avatarSrc(activePost.user || profileUser) ? (
                      <img src={avatarSrc(activePost.user || profileUser)} alt={(activePost.user || profileUser).name} />
                    ) : (
                      initials((activePost.user || profileUser).name)
                    )}
                  </div>
                  <div>
                    <span className="author-name">{(activePost.user || profileUser).name}</span>
                    <span className="post-time-indicator">نشط • {profileUser.role === 'lawyer' ? t('certifiedLawyer') : t('memberRole')}</span>
                  </div>
                </div>

                {/* Scroller for Bio content and Comments */}
                <div className="sidebar-scroller">
                  {/* Bio post description if there are images */}
                  {activePost.images && activePost.images.length > 0 && activePost.content && (
                    <div className="post-caption-card">
                      <div 
                        className="user-avatar size-sm" 
                        style={{ backgroundColor: avatarColor(activePost.user || profileUser) }}
                      >
                        {avatarSrc(activePost.user || profileUser) ? (
                          <img src={avatarSrc(activePost.user || profileUser)} alt={(activePost.user || profileUser).name} />
                        ) : (
                          initials((activePost.user || profileUser).name)
                        )}
                      </div>
                      <div>
                        <span className="commenter-name">{(activePost.user || profileUser).name}</span>
                        <p className="comment-text">{activePost.content}</p>
                      </div>
                    </div>
                  )}

                  {/* YouTube-style comments nested list */}
                  <div className="modal-comments-list">
                    {activePost.comments && activePost.comments.length > 0 ? (
                      activePost.comments.map((comment) => (
                        <div key={comment.id} className="comment-thread">
                          <div className="comment-card">
                            <div 
                              className="user-avatar size-sm" 
                              style={{ backgroundColor: avatarColor(comment.user) }}
                            >
                              {avatarSrc(comment.user) ? (
                                <img src={avatarSrc(comment.user)} alt={comment.user.name} />
                              ) : (
                                initials(comment.user.name)
                              )}
                            </div>
                            <div className="comment-content-area">
                              <div className="comment-header">
                                <span className="commenter-name">{comment.user.name}</span>
                                {comment.user.role === 'lawyer' && (
                                  <span className="badge lawyer-badge size-xs">{t('certifiedLawyer')}</span>
                                )}
                              </div>
                              <p className="comment-text">{comment.content}</p>

                              {/* Actions */}
                              <div className="comment-actions">
                                <button 
                                  className={`thumb-btn ${comment.user_liked === true ? 'liked' : ''}`}
                                  onClick={() => handleModalCommentVote(comment.id, true)}
                                >
                                  <ThumbsUp size={12} />
                                  <span>{comment.likes_count}</span>
                                </button>
                                <button 
                                  className={`thumb-btn ${comment.user_liked === false ? 'disliked' : ''}`}
                                  onClick={() => handleModalCommentVote(comment.id, false)}
                                >
                                  <ThumbsDown size={12} />
                                  <span>{comment.dislikes_count}</span>
                                </button>
                                <button 
                                  className="reply-btn"
                                  onClick={() => {
                                    setActiveReplyId(activeReplyId === comment.id ? null : comment.id);
                                    setReplyInputs({ ...replyInputs, [comment.id]: '' });
                                  }}
                                >
                                  {t('replyBtn')}
                                </button>

                                {currentUser && currentUser.id === comment.user.id && (
                                  <button 
                                    className="delete-comment-btn"
                                    onClick={() => handleModalDeleteComment(comment.id)}
                                  >
                                    حذف
                                  </button>
                                )}
                              </div>

                              {/* Reply Input */}
                              {activeReplyId === comment.id && currentUser && (
                                <div className="new-reply-box animate-fade-in">
                                  <div className="comment-input-wrapper">
                                    <input 
                                      type="text"
                                      placeholder={`${t('replyBtn')} ${comment.user.name}...`}
                                      value={replyInputs[comment.id] || ''}
                                      onChange={e => setReplyInputs({ ...replyInputs, [comment.id]: e.target.value })}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleModalAddComment(comment.id);
                                      }}
                                    />
                                    <button 
                                      className="comment-send-btn"
                                      onClick={() => handleModalAddComment(comment.id)}
                                      disabled={!replyInputs[comment.id]?.trim()}
                                    >
                                      <Send size={12} style={{ transform: 'rotate(180deg)' }} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Nested Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="replies-container">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="reply-card">
                                  <div 
                                    className="user-avatar size-xs" 
                                    style={{ backgroundColor: avatarColor(reply.user) }}
                                  >
                                    {avatarSrc(reply.user) ? (
                                      <img src={avatarSrc(reply.user)} alt={reply.user.name} />
                                    ) : (
                                      initials(reply.user.name)
                                    )}
                                  </div>
                                  <div className="comment-content-area">
                                    <div className="comment-header">
                                      <span className="commenter-name">{reply.user.name}</span>
                                      {reply.user.role === 'lawyer' && (
                                        <span className="badge lawyer-badge size-xs">محامي معتمد</span>
                                      )}
                                    </div>
                                    <p className="comment-text">{reply.content}</p>

                                    <div className="comment-actions">
                                      <button 
                                        className={`thumb-btn ${reply.user_liked === true ? 'liked' : ''}`}
                                        onClick={() => handleModalCommentVote(reply.id, true, comment.id)}
                                      >
                                        <ThumbsUp size={11} />
                                        <span>{reply.likes_count}</span>
                                      </button>
                                      <button 
                                        className={`thumb-btn ${reply.user_liked === false ? 'disliked' : ''}`}
                                        onClick={() => handleModalCommentVote(reply.id, false, comment.id)}
                                      >
                                        <ThumbsDown size={11} />
                                        <span>{reply.dislikes_count}</span>
                                      </button>
                                      
                                      {currentUser && currentUser.id === reply.user.id && (
                                        <button 
                                          className="delete-comment-btn"
                                          onClick={() => handleModalDeleteComment(reply.id, comment.id)}
                                        >
                                          حذف
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      ))
                    ) : (
                      <div className="no-comments">
                        <p>{t('noCommentsYet')}</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer Section: Likes count + New Comment Form */}
                <div className="sidebar-footer">
                  <div className="footer-actions">
                    <button 
                      className={`action-btn ${activePost.is_liked ? 'liked' : ''}`}
                      onClick={handleModalLike}
                    >
                      <Heart size={22} fill={activePost.is_liked ? 'currentColor' : 'none'} />
                    </button>
                    <button className="action-btn">
                      <MessageCircle size={22} />
                    </button>
                  </div>
                  
                  <div className="likes-summary">
                    <strong>{t('likesCountLabel').replace('{count}', activePost.likes_count)}</strong>
                  </div>

                  {currentUser && (
                    <div className="modal-comment-input-wrap">
                      <input 
                        type="text" 
                        placeholder={t('addCommentPlaceholder')}
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleModalAddComment();
                        }}
                      />
                      <button 
                        onClick={() => handleModalAddComment()}
                        disabled={!commentText.trim()}
                      >
                        {t('publishBtn')}
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── Pending Requests Banner inside profile (under header card) ── */}
      {isOwnProfile && pendingRequests.length > 0 && (
        <section className="pending-requests-banner glass">
          <h3>{t('pendingRequestsTitle').replace('{count}', pendingRequests.length)}</h3>
          <div className="pending-requests-list">
            {pendingRequests.map(reqUser => (
              <div key={reqUser.id} className="pending-request-item">
                <div className="user-info-mini" onClick={() => { navigate(`/profile/${reqUser.id}`); }} style={{ cursor: 'pointer' }}>
                  <div className="user-avatar size-xs" style={{ backgroundColor: avatarColor(reqUser) }}>
                    {avatarSrc(reqUser) ? (
                      <img src={avatarSrc(reqUser)} alt={reqUser.name} />
                    ) : (
                      initials(reqUser.name)
                    )}
                  </div>
                  <span>{reqUser.name}</span>
                </div>
                <div className="pending-actions">
                  <button className="btn-accept" onClick={() => handleAcceptRequest(reqUser.id)}>{t('acceptBtn')}</button>
                  <button className="btn-reject" onClick={() => handleRejectRequest(reqUser.id)}>{t('rejectBtn')}</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Followers List Modal ── */}
      {showFollowersModal && (
        <div className="follow-modal-backdrop" onClick={() => setShowFollowersModal(false)}>
          <div className="follow-modal-card glass" onClick={e => e.stopPropagation()}>
            <header className="follow-modal-header">
              <h3>{t('followersLabel')}</h3>
              <button className="follow-modal-close-btn" onClick={() => setShowFollowersModal(false)}>
                <X size={18} />
              </button>
            </header>
            <div className="follow-modal-list">
              {followersList.length > 0 ? (
                followersList.map(item => (
                  <div key={item.id} className="follow-modal-item">
                    <div className="follow-modal-item-info" onClick={() => { setShowFollowersModal(false); navigate(`/profile/${item.id}`); }}>
                      <div className="user-avatar size-sm" style={{ backgroundColor: avatarColor(item) }}>
                        {avatarSrc(item) ? (
                          <img src={avatarSrc(item)} alt={item.name} />
                        ) : (
                          initials(item.name)
                        )}
                      </div>
                      <div>
                        <div className="follow-modal-name">{item.name}</div>
                        <div className="follow-modal-role">{item.role === 'lawyer' ? t('lawyerRole') : t('memberRole')}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.6 }}>{t('noFollowersYet')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Following List Modal ── */}
      {showFollowingModal && (
        <div className="follow-modal-backdrop" onClick={() => setShowFollowingModal(false)}>
          <div className="follow-modal-card glass" onClick={e => e.stopPropagation()}>
            <header className="follow-modal-header">
              <h3>{t('followingLabel')}</h3>
              <button className="follow-modal-close-btn" onClick={() => setShowFollowingModal(false)}>
                <X size={18} />
              </button>
            </header>
            <div className="follow-modal-list">
              {followingList.length > 0 ? (
                followingList.map(item => (
                  <div key={item.id} className="follow-modal-item">
                    <div className="follow-modal-item-info" onClick={() => { setShowFollowingModal(false); navigate(`/profile/${item.id}`); }}>
                      <div className="user-avatar size-sm" style={{ backgroundColor: avatarColor(item) }}>
                        {avatarSrc(item) ? (
                          <img src={avatarSrc(item)} alt={item.name} />
                        ) : (
                          initials(item.name)
                        )}
                      </div>
                      <div>
                        <div className="follow-modal-name">{item.name}</div>
                        <div className="follow-modal-role">{item.role === 'lawyer' ? t('lawyerRole') : t('memberRole')}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.6 }}>{t('noFollowingYet')}</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Instagram Reel Viewer Modal ── */}
      {activeReelIndex !== null && (
        <div className="reel-viewer-backdrop" onClick={handleCloseReel}>
          <div className="reel-viewer-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="reel-close-btn" onClick={handleCloseReel}>
              <X size={24} />
            </button>

            <div className="reel-player-container">
              {activeReelIndex > 0 && (
                <button className="reel-nav-btn prev-reel" onClick={handlePrevReel}>
                  <ChevronRight size={32} />
                </button>
              )}

              <div className="reel-video-wrapper">
                {reels[activeReelIndex].type === 'image' ? (
                  <img 
                    src={reels[activeReelIndex].videoUrl} 
                    alt={reels[activeReelIndex].title} 
                    className="reel-video-element"
                    style={{ objectFit: 'contain', backgroundColor: '#000' }}
                  />
                ) : (
                  <video 
                    src={reels[activeReelIndex].videoUrl} 
                    autoPlay 
                    loop 
                    controls 
                    className="reel-video-element"
                  />
                )}
                
                {/* Description overlay */}
                <div className="reel-video-info-overlay">
                  <div className="reel-author-info">
                    <div className="user-avatar size-xs" style={{ backgroundColor: avatarColor(profileUser) }}>
                      {avatarSrc(profileUser) ? (
                        <img src={avatarSrc(profileUser)} alt={profileUser.name} />
                      ) : (
                        initials(profileUser.name)
                      )}
                    </div>
                    <span className="reel-author-name">{profileUser.name}</span>
                  </div>
                  <h4 className="reel-video-title">{reels[activeReelIndex].title}</h4>
                </div>
              </div>

              {/* Sidebar actions inside the modal (Instagram style) */}
              <div className="reel-actions-sidebar">
                <button 
                  className={`reel-action-btn ${reels[activeReelIndex].isLiked ? 'liked' : ''}`}
                  onClick={() => handleLikeReel(activeReelIndex)}
                >
                  <Heart size={24} fill={reels[activeReelIndex].isLiked ? '#ef4444' : 'none'} style={{ color: reels[activeReelIndex].isLiked ? '#ef4444' : '#fff' }} />
                  <span>{reels[activeReelIndex].likes}</span>
                </button>
                <div className="reel-action-btn comments-trigger">
                  <MessageCircle size={24} style={{ color: '#fff' }} />
                  <span>{reels[activeReelIndex].comments?.length || 0}</span>
                </div>
              </div>

              {activeReelIndex < reels.length - 1 && (
                <button className="reel-nav-btn next-reel" onClick={handleNextReel}>
                  <ChevronLeft size={32} />
                </button>
              )}
            </div>

            {/* Reel Comments Section */}
            <div className="reel-comments-section">
              <h3 className="comments-section-title">التعليقات</h3>
              <div className="reel-comments-list">
                {reels[activeReelIndex].comments && reels[activeReelIndex].comments.length > 0 ? (
                  reels[activeReelIndex].comments.map((comment, cidx) => (
                    <div key={cidx} className="reel-comment-item">
                      <strong>مستخدم:</strong> {comment}
                    </div>
                  ))
                ) : (
                  <p className="no-comments-placeholder">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                )}
              </div>
              <div className="reel-comment-input-box">
                <input 
                  type="text" 
                  placeholder="أضف تعليقاً..." 
                  value={newReelComment}
                  onChange={e => setNewReelComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddReelComment(activeReelIndex)}
                />
                <button onClick={() => handleAddReelComment(activeReelIndex)}>إرسال</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Story Viewer Modal (Instagram Style) ── */}
      {activeStoryContact && (
        <div className="story-viewer-backdrop" onClick={() => { setActiveStoryContact(null); setActiveStoryItemIndex(0); }}>
          <div className="story-viewer-modal-premium" onClick={e => e.stopPropagation()}>
            
            {/* Header info */}
            <div className="story-viewer-header">
              <div className="story-author-info">
                <div className="story-author-avatar">
                  {avatarSrc(profileUser) ? (
                    <img src={avatarSrc(profileUser)} alt={profileUser.name} />
                  ) : (
                    <div className="story-avatar-placeholder-sm" style={{ backgroundColor: avatarColor(profileUser) }}>
                      {initials(profileUser.name)}
                    </div>
                  )}
                </div>
                <div className="story-author-meta">
                  <span className="story-author-name">{profileUser.name}</span>
                  <span className="story-time-badge">نشط الآن</span>
                </div>
              </div>
              <div className="story-header-actions">
                {isOwnProfile && (
                  <button 
                    className="story-delete-btn" 
                    onClick={() => handleDeleteStory(activeStoryContact.stories[activeStoryItemIndex]?.id)}
                    title="حذف القصة"
                  >
                    حذف
                  </button>
                )}
                <button className="story-close-btn" onClick={() => { setActiveStoryContact(null); setActiveStoryItemIndex(0); }}>
                  <X size={20} />
                </button>
              </div>
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

export default Profile;
