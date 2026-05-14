import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X } from 'lucide-react';
import { useData } from '../context/DataContext';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'meeting' | 'deadline' | 'training' | 'other';
  description?: string;
  createdBy: string;
  isActive: boolean;
}

const defaultEvents: CalendarEvent[] = [
  {
    id: 'CE001',
    title: 'Pakistan Day',
    date: '2026-03-23',
    type: 'holiday',
    description: 'National holiday celebrating Pakistan Day',
    createdBy: 'Super Admin',
    isActive: true
  },
  {
    id: 'CE002',
    title: 'Eid ul Fitr',
    date: '2026-03-28',
    type: 'holiday',
    description: 'Eid ul Fitr celebrations',
    createdBy: 'Super Admin',
    isActive: true
  },
  {
    id: 'CE003',
    title: 'Monthly Team Meeting',
    date: '2026-05-15',
    type: 'meeting',
    description: 'Monthly team sync and updates',
    createdBy: 'HR Manager',
    isActive: true
  },
  {
    id: 'CE004',
    title: 'Payroll Deadline',
    date: '2026-05-25',
    type: 'deadline',
    description: 'Monthly payroll processing deadline',
    createdBy: 'Finance',
    isActive: true
  }
];

const eventTypeColors = {
  holiday: '#ef4444',
  meeting: '#3b82f6',
  deadline: '#f59e0b',
  training: '#10b981',
  other: '#6b7280'
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { globalDays, setGlobalDays } = useData();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newType, setNewType] = useState<CalendarEvent['type']>('holiday');
  const [newDescription, setNewDescription] = useState('');

  // Sync events with DataContext.globalDays so Calendar and Dashboard remain in sync
  useEffect(() => {
    if (globalDays && globalDays.length) {
      const mapped = globalDays.map((g: any) => ({
        id: g.id,
        title: g.title || g.type,
        date: g.date,
        type: (g.type as CalendarEvent['type']) || 'other',
        description: g.banner_message || '',
        createdBy: g.created_by || 'system',
        isActive: g.is_active !== false,
      }));
      setEvents(mapped);
      try { localStorage.setItem('calendar-events', JSON.stringify(mapped)); } catch {}
    } else {
      // Initialize DataContext with default events if empty
      const init = defaultEvents.map(e => ({
        id: `GD-${e.id}`,
        title: e.title,
        date: e.date,
        type: e.type,
        banner_message: e.description || '',
        created_by: e.createdBy,
        created_at: new Date().toISOString(),
        is_active: true,
      }));
      setGlobalDays?.((prev: any[]) => {
        if (!prev || prev.length === 0) return init;
        return prev;
      });
      setEvents(defaultEvents);
    }
  }, [globalDays, setGlobalDays]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        events: []
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.date === dateStr && event.isActive);

      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents
      });
    }

    // Next month days
    const remainingCells = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        events: []
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectedDateEvents = selectedDate
    ? events.filter(event => event.date === selectedDate && event.isActive)
    : [];

  const createEvent = () => {
    const gd = {
      id: `GD-${Date.now()}`,
      title: newTitle.trim() || 'New calendar event',
      date: newDate,
      type: newType,
      affects_attendance: false,
      show_banner: false,
      banner_message: newDescription.trim(),
      created_by: 'Local HR',
      created_at: new Date().toISOString(),
      is_active: true,
    };

    setGlobalDays?.((prev:any[]) => [...(prev||[]), gd]);
    setIsCreateOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewType('holiday');
    setNewDate(newDate);
    setSelectedDate(newDate);
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Calendar Events</div>
          <div className="pg-sub">Manage holidays, meetings, deadlines, and organizational events.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="card">
        {/* Calendar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            className="btn btn-secondary"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          background: '#e5e7eb',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              background: '#f9fafb',
              padding: '12px 8px',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 12,
              color: '#6b7280'
            }}>
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => (
            <div
              key={index}
              style={{
                background: '#fff',
                minHeight: 100,
                padding: 8,
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => setSelectedDate(day.date.toISOString().split('T')[0])}
            >
              <div style={{
                fontSize: 14,
                fontWeight: day.isCurrentMonth ? 600 : 400,
                color: day.isCurrentMonth ? '#1f2937' : '#9ca3af',
                marginBottom: 4
              }}>
                {day.date.getDate()}
              </div>

              {/* Events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {day.events.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    style={{
                      background: eventTypeColors[event.type],
                      color: 'white',
                      fontSize: 10,
                      padding: '2px 4px',
                      borderRadius: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {day.events.length > 2 && (
                  <div style={{
                    fontSize: 10,
                    color: '#6b7280',
                    fontWeight: 600
                  }}>
                    +{day.events.length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 16 }}>
            <CalendarIcon size={20} style={{ marginRight: 8 }} />
            Events for {new Date(selectedDate).toLocaleDateString()}
          </h3>

          {selectedDateEvents.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No events scheduled</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  style={{
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#f9fafb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                        {event.title}
                      </h4>
                      <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>
                        {event.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          background: eventTypeColors[event.type],
                          color: 'white'
                        }}>
                          {event.type.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          Created by {event.createdBy}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-secondary">Edit</button>
                      <button className="btn btn-sm btn-danger">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20 }}>Create Calendar Event</h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>Events are stored locally for this session.</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Title</span>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Event title"
                  className="input"
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Date</span>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="input"
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Type</span>
                <select className="input" value={newType} onChange={(e) => setNewType(e.target.value as CalendarEvent['type'])}>
                  <option value="holiday">Holiday</option>
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Description</span>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  placeholder="Optional details"
                  className="input"
                  style={{ resize: 'vertical' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
              <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createEvent}>Save Event</button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 12 }}>Event Types</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {Object.entries(eventTypeColors).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: color
                }}
              />
              <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}