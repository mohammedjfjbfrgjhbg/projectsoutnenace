import React, { useState } from 'react';
import { lawyerService } from '../services/lawyer.service';

const Reserver = ({ lawyerId = 1, onBooked }) => {
  const [selectedDate, setSelectedDate] = useState('2026-05-20');
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    setLoading(true);
    try {
      const response = await lawyerService.bookConsultation(lawyerId, selectedDate, selectedSlot);
      alert(response.message);
      if (onBooked) onBooked();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reserver-card animate-fade-in" style={{
      background: 'var(--card-bg, #ffffff)',
      border: '1px solid var(--glass-border)',
      padding: '32px',
      borderRadius: 'var(--border-radius-premium, 16px)',
      boxShadow: 'var(--shadow-premium)',
      textAlign: 'left',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px', color: 'var(--text-primary)' }}>Book Consultation Slot</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Reserve direct secured video room meetings with licensed co-counsels.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              background: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Select Time</label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              background: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              outline: 'none'
            }}
          >
            <option value="09:00 AM">09:00 AM</option>
            <option value="10:00 AM">10:00 AM</option>
            <option value="11:00 AM">11:00 AM</option>
            <option value="02:00 PM">02:00 PM</option>
            <option value="03:30 PM">03:30 PM</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleBooking}
        disabled={loading}
        style={{
          width: '100%',
          background: '#0f3a20',
          color: '#fcfbfa',
          border: 'none',
          padding: '12px',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '13.5px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        {loading ? 'Confirming slot...' : 'Confirm Reservation ➔'}
      </button>
    </div>
  );
};

export default Reserver;
