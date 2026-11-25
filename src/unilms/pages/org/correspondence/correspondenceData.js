// Central Data Store for Correspondence Module (Notifications, Message Templates & Festival Greetings)
import apiClient from '../../../services/api';

export const initialNotifications = [];

export const initialTemplates = [
  {
    id: 1,
    name: 'Fee Due Final Reminder',
    type: 'Fee Reminder',
    body_text: 'Dear {name}, your semester tuition fee is overdue. Please settle your dues via the student portal.',
    created_at: '2026-08-01 10:00:00'
  },
  {
    id: 2,
    name: 'Examination Schedule Announcement',
    type: 'Exam Alert',
    body_text: 'Dear {name}, the terminal examination schedule has been officially published on your dashboard.',
    created_at: '2026-08-01 10:00:00'
  },
  {
    id: 3,
    name: 'Annual Convocation Invitation',
    type: 'Festival',
    body_text: 'Warm greetings from University Management on the auspicious occasion of our Annual Convocation.',
    created_at: '2026-08-01 10:00:00'
  }
];

export const initialFestivals = [
  {
    id: 1,
    festival_name: 'Diwali Institutional Greetings',
    audience: 'All',
    template_id: 3,
    template_name: 'Annual Convocation Invitation',
    send_date: '2026-11-01',
    status: 'Sent',
    created_at: '2026-10-25 10:00:00'
  }
];

// Clean in-memory caches synced with PostgreSQL PlatformSetting
let _cachedNotifications = null;
let _cachedTemplates = null;
let _cachedFestivals = null;

export const getStoredNotifications = () => {
  return _cachedNotifications || initialNotifications;
};

export const saveStoredNotifications = (notifications) => {
  _cachedNotifications = notifications;
  apiClient.post('/tenants/settings/unilms_correspondence_notifications', { value: notifications }).catch(() => {});
};

export const getStoredTemplates = () => {
  return _cachedTemplates || initialTemplates;
};

export const saveStoredTemplates = (templates) => {
  _cachedTemplates = templates;
  apiClient.post('/tenants/settings/unilms_correspondence_templates', { value: templates }).catch(() => {});
};

export const getStoredFestivals = () => {
  return _cachedFestivals || initialFestivals;
};

export const saveStoredFestivals = (festivals) => {
  _cachedFestivals = festivals;
  apiClient.post('/tenants/settings/unilms_correspondence_festivals', { value: festivals }).catch(() => {});
};

// Action Helpers
export const markNotificationRead = (id) => {
  const current = getStoredNotifications();
  const updated = current.map(item => item.id === id ? { ...item, is_read: 1 } : item);
  saveStoredNotifications(updated);
  return updated;
};

export const toggleNotificationStatus = (id) => {
  const current = getStoredNotifications();
  const updated = current.map(item => item.id === id ? { ...item, is_read: item.is_read ? 0 : 1 } : item);
  saveStoredNotifications(updated);
  return updated;
};

export const markAllNotificationsRead = () => {
  const current = getStoredNotifications();
  const updated = current.map(item => ({ ...item, is_read: 1 }));
  saveStoredNotifications(updated);
  return updated;
};

export const addBroadcastNotification = ({ recipient_name, title, message, channel = 'In-App Notification' }) => {
  const current = getStoredNotifications();
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  const newNotification = {
    id: Date.now(),
    recipient_name: recipient_name || 'All Campus Users',
    title: title || 'System Announcement',
    message: message || '',
    created_at: dateStr,
    is_read: 0,
    channel: channel
  };

  const updated = [newNotification, ...current];
  saveStoredNotifications(updated);
  return updated;
};

export const saveTemplate = (templateData) => {
  const templates = getStoredTemplates();
  let updated;
  if (templateData.id) {
    updated = templates.map(t => t.id === Number(templateData.id) ? { ...t, ...templateData, id: Number(templateData.id) } : t);
  } else {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newTemplate = {
      id: Date.now(),
      name: templateData.name,
      type: templateData.type || 'Festival',
      body_text: templateData.body_text || '',
      created_at: dateStr
    };
    updated = [newTemplate, ...templates];
  }
  saveStoredTemplates(updated);
  return updated;
};

export const deleteTemplate = (id) => {
  const templates = getStoredTemplates();
  const updated = templates.filter(t => t.id !== Number(id));
  saveStoredTemplates(updated);
  return updated;
};

export const saveFestivalCampaign = (campaignData) => {
  const festivals = getStoredFestivals();
  const templates = getStoredTemplates();
  const selectedTemplate = templates.find(t => t.id === Number(campaignData.template_id));
  const templateName = selectedTemplate ? selectedTemplate.name : 'Custom Greeting';

  let updatedFestivals;
  if (campaignData.id) {
    updatedFestivals = festivals.map(f => f.id === Number(campaignData.id) ? {
      ...f,
      ...campaignData,
      id: Number(campaignData.id),
      template_name: templateName
    } : f);
  } else {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newFestival = {
      id: Date.now(),
      festival_name: campaignData.festival_name,
      audience: campaignData.audience || 'All',
      template_id: Number(campaignData.template_id),
      template_name: templateName,
      send_date: campaignData.send_date || dateStr.split(' ')[0],
      status: 'Sent',
      created_at: dateStr
    };
    updatedFestivals = [newFestival, ...festivals];

    const audienceLabel = campaignData.audience === 'Students' ? 'Students Only' : campaignData.audience === 'Staff' ? 'Staff Only' : 'All Campus Members';
    let sampleBody = selectedTemplate ? selectedTemplate.body_text : 'Best wishes from the university management.';
    sampleBody = sampleBody.replace('{name}', 'Valued Member');

    addBroadcastNotification({
      recipient_name: audienceLabel,
      title: `Happy ${campaignData.festival_name}!`,
      message: sampleBody,
      channel: 'Campaign Broadcast'
    });
  }

  saveStoredFestivals(updatedFestivals);
  return updatedFestivals;
};
