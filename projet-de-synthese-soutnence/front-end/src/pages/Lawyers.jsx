import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Calendar, Clock, Banknote, ShieldCheck, Map as MapIcon, List as ListIcon } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Lawyers.css";
import api from '../services/api';
import { useLanguage } from "../context/LanguageContext";
import { useDarkMode } from "../hooks/useDarkMode";

const FILTERS = ["الكل", "الأسرة", "الشغل", "الأعمال", "العقار", "الجنائي"];

const filterKeys = {
  "الكل": "filterAll",
  "الأسرة": "filterFamily",
  "الشغل": "filterWork",
  "الأعمال": "filterBusiness",
  "العقار": "filterRealEstate",
  "الجنائي": "filterCriminal"
};

function getLawyerColor(fieldKey) {
  switch (fieldKey) {
    case "الأسرة":
      return "#8b5cf6"; // Indigo/Purple for Family Law
    case "الشغل":
      return "#10b981"; // Green for Labor Law
    case "الأعمال":
      return "#fbbf24"; // Gold/Yellow for Business Law
    case "العقار":
      return "#f59e0b"; // Orange/Amber for Real Estate Law
    case "الجنائي":
      return "#0ea5e9"; // Sky Blue for Criminal Law
    default:
      return "#3b82f6";
  }
}

function getLawyerFieldIcon(fieldKey) {
  switch (fieldKey) {
    case "الأسرة": // Family - Users Icon
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    case "الشغل": // Work/Labor - Briefcase Icon
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
    case "الأعمال": // Business - Scales Icon
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.06-1.92-.18-3-.5-1.08.32-2.13.56-3 .5z"/><path d="m2 16 3-8 3 8c-.87.06-1.92-.18-3-.5-1.08.32-2.13.56-3 .5z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>`;
    case "العقار": // Real Estate - Home Icon
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    case "الجنائي": // Criminal - Gavel Icon
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m14 13-5-5 1.5-1.5 5 5L14 13Z"/><path d="m9 8-5.5 5.5a2.5 2.5 0 1 0 3.5 3.5L12.5 11.5 9 8Z"/><path d="m14 13 5.5 5.5a2.5 2.5 0 1 1-3.5 3.5L10.5 16.5 14 13Z"/><path d="m16 2-4.5 4.5 4.5 4.5L20.5 6.5 16 2Z"/></svg>`;
    default: // Scale or Document
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  }
}

const Stars = ({ count }) => (
  <div className="lw-stars">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={14} className={i <= count ? "star filled" : "star"} />
    ))}
  </div>
);

// Haversine distance calculator
function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* ─── BOOKING MODAL ─── */
function BookingModal({ lawyer, onClose, userLat, userLon }) {
  const { language, t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const locale = language === 'darija' ? 'ar-MA' : (language === 'fr' ? 'fr-FR' : 'en-US');
    return {
      day: d.toLocaleDateString(locale, { weekday: "long" }),
      date: d.getDate(),
      month: d.toLocaleDateString(locale, { month: "short" })
    };
  });

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedDayObj = days[selectedDay];
      await api.post('/appointments', {
        lawyer_id: lawyer.id,
        day_index: selectedDay,
        day_name: selectedDayObj.day,
        date_string: `${selectedDayObj.date} ${selectedDayObj.month}`,
        time: selectedTime,
        latitude: userLat,
        longitude: userLon,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Booking error:', err);
      setError(t('bookingError'));
    } finally {
      setLoading(false);
    }
  };

  const direction = language === 'en' || language === 'fr' ? 'ltr' : 'rtl';

  return (
    <div className="bm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bm-modal glass" dir={direction}>
        <button className="bm-close" onClick={onClose}>✕</button>

        <h2 className="bm-title">{t('bookConsultation')}</h2>
        <p className="bm-subtitle">{t('bookingWith')}{lawyer.name}</p>

        {error && <div className="auth-error-msg" style={{ margin: '15px 0' }}>{error}</div>}

        {success ? (
          <div className="bm-confirm animate-fade-in">
             <div className="success-icon" style={{ color: 'var(--success, #10b981)' }}><ShieldCheck size={48} /></div>
             <h3>{t('bookingConfirmedSuccess')}</h3>
             <p style={{ margin: '10px 0', opacity: 0.8 }}>{t('bookingRecordedSuccess')}</p>
             <button className="bm-confirm-btn" onClick={onClose}>{t('okButton')}</button>
          </div>
        ) : step === 1 ? (
          <>
            <div className="bm-section">
              <p className="bm-label">{t('chooseDay')}</p>
              <div className="bm-days">
                {days.map((d, i) => (
                  <div
                    key={i}
                    className={`bm-day ${selectedDay === i ? "active" : ""}`}
                    onClick={() => setSelectedDay(i)}
                  >
                    <span className="bm-day-name">{d.day}</span>
                    <span className="bm-day-date">{d.date} {d.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bm-section">
              <p className="bm-label">{t('availableTime')}</p>
              <div className="bm-times">
                {times.map(t => (
                  <button
                    key={t}
                    className={`bm-time ${selectedTime === t ? "active" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`bm-next-btn ${(!selectedDay && selectedDay !== 0) || !selectedTime ? "disabled" : ""}`}
              onClick={() => selectedTime && (selectedDay !== null) && setStep(2)}
            >
              {t('continueBooking')}
            </button>
          </>
        ) : (
          <div className="bm-confirm animate-fade-in">
             <div className="success-icon"><ShieldCheck size={48} /></div>
             <h3>{t('confirmOrder')}</h3>
             <div className="bm-confirm-details">
                <p><Calendar size={18} /> {days[selectedDay]?.day} {days[selectedDay]?.date} {days[selectedDay]?.month}</p>
                <p><Clock size={18} /> {selectedTime}</p>
                <p><Banknote size={18} /> {lawyer.price} MAD ({t('securePayment')})</p>
             </div>
             <button className="bm-confirm-btn" onClick={handleConfirmBooking} disabled={loading}>
                 {loading ? t('confirming') : t('confirmAndPay')}
             </button>
             <button className="bm-back-link" onClick={() => setStep(1)} disabled={loading}>{t('goBackToEditTime')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── LAWYER CARD ─── */
function LawyerCard({ lawyer, distance, onBook }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  // Parse tags if they are a string or default to array
  const tagsList = Array.isArray(lawyer.tags) 
    ? lawyer.tags 
    : (typeof lawyer.tags === 'string' ? JSON.parse(lawyer.tags) : []);

  return (
    <div className="lawyer-card-premium animate-slide-up">
      <div className="card-top-info" onClick={() => navigate(`/profile/${lawyer.user_id}`)} style={{ cursor: 'pointer' }}>
          <div className="lawyer-meta">
              <div className="avatar-box" style={{ background: lawyer.avatar_color || 'var(--primary)' }}>
                  {lawyer.initial}
              </div>
              <div className="ratings">
                  <Stars count={lawyer.rating} />
                  <span className="review-count">({lawyer.reviews} {t('reviewsCount')})</span>
              </div>
          </div>
          <div className="lawyer-identity">
              <h3>{lawyer.name}</h3>
              <p className="field-tag">{lawyer.field}</p>
          </div>
      </div>

      <div className="card-body">
          <div className="info-row">
              <MapPin size={16} /> 
              <span>
                {lawyer.city} {distance !== null && `(${t('awayKm').replace('كم', `${distance.toFixed(1)} كم` || `${distance.toFixed(1)} km`)})`}
              </span>
          </div>
          <div className="tags-container">
              {tagsList.map(t => <span key={t} className="l-tag">{t}</span>)}
          </div>
      </div>

      <div className="card-footer-premium">
          <div className="price-box">
              <span className="price-val">{lawyer.price} MAD</span>
              <span className="price-label">/ {t('hour')}</span>
          </div>
          <div className="card-actions">
              <button 
                  className="profile-link-btn"
                  onClick={() => navigate(`/profile/${lawyer.user_id}`)}
              >
                  {t('viewProfile')}
              </button>
              <button 
                  className={`booking-btn ${!lawyer.available ? 'busy' : ''}`}
                  onClick={() => lawyer.available && onBook(lawyer)}
              >
                  {lawyer.available ? t('bookAppointment') : t('unavailable')}
              </button>
          </div>
      </div>
    </div>
  );
}

/* ─── CLIENT REQUEST CARD FOR LAWYERS ─── */
function ClientRequestCard({ request, onAccept, onDecline }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="lawyer-card-premium animate-slide-up">
      <div className="card-top-info" onClick={() => navigate(`/profile/${request.client_id}`)} style={{ cursor: 'pointer' }}>
          <div className="lawyer-meta">
              <div className="avatar-box" style={{ background: 'var(--primary)' }}>
                  {request.initial}
              </div>
          </div>
          <div className="lawyer-identity">
              <h3>{request.name}</h3>
              <p className="field-tag">{request.email || request.phone}</p>
          </div>
      </div>

      <div className="card-body">
          <div className="info-row">
              <MapPin size={16} /> 
              <span>{request.address || request.city || 'No address provided'}</span>
          </div>
          <div className="info-row" style={{ marginTop: '8px' }}>
              <span>📅 <b>{request.date_string}</b> • ⏰ <b>{request.time}</b></span>
          </div>
      </div>

      <div className="card-footer-premium" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          {request.status === 'pending' ? (
              <>
                  <button 
                      className="booking-btn" 
                      style={{ background: '#10b981', flex: 1, height: '42px', padding: 0 }}
                      onClick={() => onAccept(request.id)}
                  >
                      {t('okButton') || 'قبول'}
                  </button>
                  <button 
                      className="profile-link-btn" 
                      style={{ background: '#ef4444', color: 'white', border: 'none', flex: 1, height: '42px', padding: 0 }}
                      onClick={() => onDecline(request.id)}
                  >
                      {t('deletePost') || 'إلغاء'}
                  </button>
              </>
          ) : (
              <span style={{ width: '100%', textAlign: 'center', color: '#10b981', fontWeight: 'bold', padding: '8px 0' }}>
                  ✅ {t('planStatusActive') || 'مؤكد'}
              </span>
          )}
      </div>
    </div>
  );
}

/* ─── PAGE ─── */
export default function Lawyers() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const direction = language === 'en' || language === 'fr' ? 'ltr' : 'rtl';
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [bookingLawyer, setBookingLawyer] = useState(null);
  
  const [lawyersList, setLawyersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" or "map" on mobile

  const [userLat, setUserLat] = useState(33.5731);
  const [userLon, setUserLon] = useState(-7.5898);

  const { isDark } = useDarkMode();
  const [mapTheme, setMapTheme] = useState(isDark ? "dark" : "light");

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markersMapRef = useRef({});

  // Sync mapTheme with global dark mode
  useEffect(() => {
    setMapTheme(isDark ? "dark" : "light");
  }, [isDark]);

  // Handle tileLayer switching reactively
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      
      const url = mapTheme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        
      tileLayerRef.current = L.tileLayer(url, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(mapInstanceRef.current);
    }
  }, [mapTheme]);

  // Handle Leaflet size invalidation when mobile viewMode toggles (map/list)
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Check role
  const localUser = localStorage.getItem('user');
  const currentUser = localUser ? JSON.parse(localUser) : null;
  const isLawyerUser = currentUser?.role === 'lawyer';

  // Acquire Geolocation for client
  useEffect(() => {
    if (!isLawyerUser && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLat(position.coords.latitude);
          setUserLon(position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation access denied/failed, falling back to Casablanca:", error);
        }
      );
    }
  }, [isLawyerUser]);

  const fetchLawyersOrRequests = async () => {
    try {
      setLoading(true);
      if (isLawyerUser) {
        // Fetch lawyer's appointments (requests)
        const response = await api.get('/appointments');
        // Filter pending and confirmed appointments
        const activeRequests = response.data.filter(app => app.status === 'pending' || app.status === 'confirmed');
        
        const processed = activeRequests.map(app => {
          const clientName = app.user?.name || t('memberRole');
          // If no coordinates are present, default to random city positions in Morocco (Casablanca/Berrechid) for demo
          const lat = app.latitude || (33.2646 + (Math.random() - 0.5) * 0.05); // slightly randomized around Berrechid
          const lon = app.longitude || (-7.5822 + (Math.random() - 0.5) * 0.05);
          return {
            id: app.id,
            name: clientName,
            client_id: app.user_id,
            email: app.user?.email || '',
            phone: app.user?.phone || '',
            city: app.user?.address || 'برشيد',
            address: app.user?.address || '',
            latitude: lat,
            longitude: lon,
            date_string: app.date_string,
            time: app.time,
            status: app.status,
            price: app.price,
            initial: clientName.charAt(0).toUpperCase()
          };
        });
        setLawyersList(processed);
      } else {
        // Fetch lawyers list
        const response = await api.get('/lawyers', {
          params: {
            search: search,
            field_key: activeFilter
          }
        });
        
        // Calculate distances for all lawyers
        const processed = response.data.map(lawyer => ({
          ...lawyer,
          distance: getDistance(userLat, userLon, lawyer.latitude, lawyer.longitude)
        }));
        
        setLawyersList(processed);
      }
    } catch (err) {
      console.error('Error fetching lawyers list or requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyersOrRequests();
  }, [search, activeFilter, userLat, userLon]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const centerLat = isLawyerUser ? (currentUser?.lawyer?.latitude || 33.5731) : userLat;
      const centerLon = isLawyerUser ? (currentUser?.lawyer?.longitude || -7.5898) : userLon;

      const map = L.map(mapRef.current, {
        center: [centerLat, centerLon],
        zoom: isLawyerUser ? 10 : 12,
        zoomControl: false
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Set tileLayer based on current mapTheme
      const url = mapTheme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      
      tileLayerRef.current = L.tileLayer(url, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      if (!isLawyerUser) {
        // Radar 10km circle around user
        L.circle([userLat, userLon], {
          color: '#0d6efd',
          fillColor: '#0d6efd',
          fillOpacity: 0.05,
          radius: 10000 // 10 km
        }).addTo(map);

        // User location marker
        const userIcon = L.divIcon({
          className: 'user-location-marker-container',
          html: '<div class="user-location-marker"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        L.marker([userLat, userLon], { icon: userIcon })
          .addTo(map)
          .bindPopup("<div class='user-popup-label'>📍 " + t('currentLocation') + "</div>");
      } else {
        // Lawyer's own office marker
        const lawyerIcon = L.divIcon({
          className: 'user-location-marker-container',
          html: '<div class="user-location-marker" style="background: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2)"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        L.marker([centerLat, centerLon], { icon: lawyerIcon })
          .addTo(map)
          .bindPopup("<div class='user-popup-label'>💼 مكتبك الحالي</div>");
      }

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, [t, isLawyerUser, userLat, userLon]);

  // Update Markers on Map
  useEffect(() => {
    if (mapInstanceRef.current && markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
      markersMapRef.current = {};

      lawyersList.forEach(item => {
        if (item.latitude && item.longitude) {
          if (isLawyerUser) {
            // Client Request Markers
            const clientIcon = L.divIcon({
              className: 'lawyer-marker-container',
              html: `<div class="lawyer-map-pin" style="--pin-color: var(--primary)">
                       <div class="lawyer-pin-icon-wrapper">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                       </div>
                     </div>`,
              iconSize: [36, 46],
              iconAnchor: [18, 46],
              popupAnchor: [0, -46]
            });

            const popupHtml = `
              <div class="lawyer-map-popup" dir="${direction}">
                <div class="popup-header-box">
                  <div class="popup-avatar" style="background-color: var(--primary)">${item.initial}</div>
                  <div>
                    <h4>${item.name}</h4>
                    <p class="popup-field">${item.email || item.phone}</p>
                  </div>
                </div>
                <div class="popup-body-box">
                  <p class="popup-meta">📅 <b>${item.date_string}</b> • ⏰ <b>${item.time}</b></p>
                  <p class="popup-meta">📍 ${item.address || 'برشيد، المغرب'}</p>
                  <div class="popup-actions-grid" style="grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
                    ${item.status === 'pending' ? `
                      <button class="popup-accept-btn" data-req-id="${item.id}" style="background:#10b981; color:white; border:none; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer;">${t('okButton') || 'قبول'}</button>
                      <button class="popup-decline-btn" data-req-id="${item.id}" style="background:#ef4444; color:white; border:none; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer;">${t('deletePost') || 'إلغاء'}</button>
                    ` : `
                      <span style="grid-column: span 2; text-align:center; color:#10b981; font-weight:bold; padding: 6px 0;">✅ ${t('planStatusActive') || 'مؤكد'}</span>
                    `}
                  </div>
                </div>
              </div>
            `;

            const marker = L.marker([item.latitude, item.longitude], { icon: clientIcon })
              .bindPopup(popupHtml);
            
            markersMapRef.current[item.id] = marker;
            markersLayerRef.current.addLayer(marker);
          } else {
            // Lawyer Markers (standard client-facing flow)
            const lawyerIcon = L.divIcon({
              className: 'lawyer-marker-container',
              html: `<div class="lawyer-map-pin" style="--pin-color: ${getLawyerColor(item.field_key)}">
                       <div class="lawyer-pin-icon-wrapper">
                         ${getLawyerFieldIcon(item.field_key)}
                       </div>
                     </div>`,
              iconSize: [36, 46],
              iconAnchor: [18, 46],
              popupAnchor: [0, -46]
            });

            const popupHtml = `
              <div class="lawyer-map-popup" dir="${direction}">
                <div class="popup-header-box">
                  <div class="popup-avatar" style="background-color: ${getLawyerColor(item.field_key)}">${item.initial}</div>
                  <div>
                    <h4>${item.name}</h4>
                    <p class="popup-field">${item.field}</p>
                  </div>
                </div>
                <div class="popup-body-box">
                  <p class="popup-meta">📍 ${item.city} • <b>${item.distance ? item.distance.toFixed(1) : '?'} ${t('awayKm')}</b></p>
                  <div class="popup-actions-grid">
                    <a href="/profile/${item.user_id}" class="popup-link-btn">${t('viewProfile')}</a>
                    <button class="popup-book-btn" data-lawyer-id="${item.id}">${t('bookAppointment')}</button>
                  </div>
                </div>
              </div>
            `;

            const marker = L.marker([item.latitude, item.longitude], { icon: lawyerIcon })
              .bindPopup(popupHtml);
            
            markersMapRef.current[item.id] = marker;
            markersLayerRef.current.addLayer(marker);
          }
        }
      });
    }
  }, [lawyersList, t, direction, isLawyerUser]);

  // Search Sync: Pan map and open popup
  useEffect(() => {
    if (search && lawyersList.length > 0 && mapInstanceRef.current) {
      const queryStr = search.toLowerCase();
      const matched = lawyersList.find(l => 
        l.name.toLowerCase().includes(queryStr) || 
        l.city.toLowerCase().includes(queryStr)
      );

      if (matched && matched.latitude && matched.longitude) {
        const map = mapInstanceRef.current;
        map.setView([matched.latitude, matched.longitude], 14, { animate: true });
        
        const marker = markersMapRef.current[matched.id];
        if (marker) {
          setTimeout(() => {
            marker.openPopup();
          }, 300);
        }
      }
    }
  }, [search]);

  const handleBook = (lawyer) => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    setBookingLawyer(lawyer);
  };

  const handleAcceptRequest = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'confirmed' });
      fetchLawyersOrRequests();
    } catch (err) {
      console.error('Error confirming request:', err);
      alert('حدث خطأ أثناء قبول الطلب.');
    }
  };

  const handleDeclineRequest = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟')) return;
    try {
      await api.put(`/appointments/${id}`, { status: 'cancelled' });
      fetchLawyersOrRequests();
    } catch (err) {
      console.error('Error cancelling request:', err);
      alert('حدث خطأ أثناء إلغاء الطلب.');
    }
  };

  // Click delegation for popup router navigation and actions
  const handleMapClick = (e) => {
    const link = e.target.closest('.popup-link-btn');
    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href) {
        navigate(href);
      }
      return;
    }

    const bookBtn = e.target.closest('.popup-book-btn');
    if (bookBtn) {
      e.preventDefault();
      const lawyerId = parseInt(bookBtn.getAttribute('data-lawyer-id'), 10);
      const lawyer = lawyersList.find(l => l.id === lawyerId);
      if (lawyer) {
        handleBook(lawyer);
      }
      return;
    }

    const acceptBtn = e.target.closest('.popup-accept-btn');
    if (acceptBtn) {
      e.preventDefault();
      const reqId = parseInt(acceptBtn.getAttribute('data-req-id'), 10);
      handleAcceptRequest(reqId);
      return;
    }

    const declineBtn = e.target.closest('.popup-decline-btn');
    if (declineBtn) {
      e.preventDefault();
      const reqId = parseInt(declineBtn.getAttribute('data-req-id'), 10);
      handleDeclineRequest(reqId);
      return;
    }
  };

  return (
    <div className="lawyers-page-premium" dir={direction}>
      <div className="page-wrapper-split">
          
          {/* Right/Left Side Panel: Search Controls & Cards */}
          <div className={`split-left-panel ${viewMode === 'map' ? 'mobile-hidden' : ''}`}>
              <div className="lawyers-header animate-fade-in">
                  <div className="badge-premium">🏛️ {isLawyerUser ? t('appointments') : t('lawyersNetwork')}</div>
                  <h1>{isLawyerUser ? t('appointments') : t('findYourAdvisor')}</h1>
                  <p>{isLawyerUser ? 'إدارة واستعراض طلبات الموكلين الواردة بشكل جغرافي.' : t('lawyersSubtitle')}</p>
              </div>

              <div className="lawyers-controls animate-slide-up">
                  <div className="search-container-premium">
                      <Search className="search-icon" size={20} />
                      <input
                          type="text"
                          placeholder={isLawyerUser ? 'البحث عن عميل...' : t('searchLawyersPlaceholder')}
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                      />
                  </div>
                  {!isLawyerUser && (
                    <div className="filters-premium">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                className={`filter-pill-modern ${activeFilter === f ? "active" : ""}`}
                                onClick={() => setActiveFilter(f)}
                            >
                                {t(filterKeys[f])}
                            </button>
                        ))}
                    </div>
                  )}
              </div>

              <div className="results-count animate-fade-in">
                  {loading ? t('loading') : `${lawyersList.length} ${isLawyerUser ? 'طلبات واردة' : t('lawyersAvailableCount')}`}
              </div>

              <div className="lawyers-grid-premium">
                  {loading ? (
                      <div className="empty-results"><p>{t('loading')}</p></div>
                  ) : lawyersList.length > 0 ? (
                      lawyersList.map(l => (
                        isLawyerUser ? (
                          <ClientRequestCard 
                            key={l.id} 
                            request={l}
                            onAccept={handleAcceptRequest}
                            onDecline={handleDeclineRequest}
                          />
                        ) : (
                          <LawyerCard 
                            key={l.id} 
                            lawyer={l} 
                            distance={l.distance} 
                            onBook={handleBook} 
                          />
                        )
                      ))
                  ) : (
                      <div className="empty-results">
                          <p>{isLawyerUser ? 'لا توجد طلبات واردة حالياً.' : t('noLawyersFound')}</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Left/Right Side Panel: Interactive Map */}
          <div 
            className={`split-right-panel ${viewMode === 'list' ? 'mobile-hidden' : ''}`}
            onClick={handleMapClick}
            style={{ position: 'relative' }}
          >
              <div id="lawyers-map" ref={mapRef}></div>
              
              {/* Map Theme Toggle Button */}
              <div className="map-theme-toggle-container">
                  <button 
                      type="button" 
                      className={`map-theme-btn ${mapTheme === 'light' ? 'active' : ''}`}
                      onClick={(e) => {
                          e.stopPropagation();
                          setMapTheme('light');
                      }}
                  >
                      ☀️ {language === 'darija' ? 'النهار' : (language === 'fr' ? 'Jour' : 'Light')}
                  </button>
                  <button 
                      type="button" 
                      className={`map-theme-btn ${mapTheme === 'dark' ? 'active' : ''}`}
                      onClick={(e) => {
                          e.stopPropagation();
                          setMapTheme('dark');
                      }}
                  >
                      🌙 {language === 'darija' ? 'الليل' : (language === 'fr' ? 'Nuit' : 'Night')}
                  </button>
              </div>
          </div>
      </div>

      {/* Floating Toggle View Button on Mobile */}
      <button 
        className="mobile-view-toggle-btn" 
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
      >
        {viewMode === 'map' ? (
          <>
            <ListIcon size={18} />
            <span>{t('showList')}</span>
          </>
        ) : (
          <>
            <MapIcon size={18} />
            <span>{t('showMap')}</span>
          </>
        )}
      </button>

      {bookingLawyer && (
        <BookingModal 
          lawyer={bookingLawyer} 
          userLat={userLat}
          userLon={userLon}
          onClose={() => setBookingLawyer(null)} 
        />
      )}
    </div>
  );
}