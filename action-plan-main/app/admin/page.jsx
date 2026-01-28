'use client';

import { useState, useEffect } from 'react';
import { getAllWebhooks, addWebhook, deleteWebhook, toggleWebhook, updateWebhook } from '../../lib/webhooks.config';

// 🔐 פרטי כניסה לאדמין
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'tsi2025admin';

export default function AdminWebhooks() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // טופס הוספה/עריכה
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    enabled: true
  });

  // בדוק אם כבר התחבר
  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // טען webhooks
  const loadWebhooks = async () => {
    setLoading(true);
    const data = await getAllWebhooks();
    setWebhooks(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadWebhooks();
    }
  }, [isAuthenticated]);

  // התחברות
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUsername === ADMIN_USERNAME && loginPassword === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
    } else {
      alert('❌ שם משתמש או סיסמה שגויים!');
    }
  };

  // התנתקות
  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  // אם לא מחובר - הצג מסך התחברות
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Rubik, sans-serif',
        direction: 'rtl'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%'
        }}>
          <h1 style={{ fontSize: '32px', color: '#1a2332', marginBottom: '10px' }}>
            🔐 פאנל אדמין
          </h1>
          <p style={{ color: '#6c757d', marginBottom: '30px' }}>
            הזן שם משתמש וסיסמה
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="שם משתמש"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                border: '2px solid #667eea',
                borderRadius: '10px',
                marginBottom: '15px',
                textAlign: 'center',
                outline: 'none',
                fontFamily: 'Rubik, sans-serif'
              }}
            />
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type={showLoginPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                placeholder="סיסמה"
                style={{
                  width: '100%',
                  padding: '15px',
                  paddingLeft: '50px',
                  fontSize: '18px',
                  border: '2px solid #667eea',
                  borderRadius: '10px',
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: 'Rubik, sans-serif'
                }}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '5px',
                  opacity: '0.6',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.target.style.opacity = '1'}
                onMouseOut={(e) => e.target.style.opacity = '0.6'}
              >
                {showLoginPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'Rubik, sans-serif'
              }}
            >
              כניסה
            </button>
          </form>
          <div style={{ marginTop: '20px' }}>
            <a
              href="/"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              ← חזרה לדף הראשי
            </a>
          </div>
        </div>
      </div>
    );
  }

  // הוסף/עדכן webhook
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      // עריכה
      const result = await updateWebhook(editingId, formData);
      if (result.success) {
        alert('✅ Webhook עודכן בהצלחה!');
        setEditingId(null);
      } else {
        alert('❌ שגיאה בעדכון: ' + result.error);
      }
    } else {
      // הוספה
      const result = await addWebhook(formData);
      if (result.success) {
        alert('✅ Webhook נוסף בהצלחה!');
      } else {
        alert('❌ שגיאה בהוספה: ' + result.error);
      }
    }
    
    // איפוס טופס
    setFormData({ name: '', url: '', description: '', enabled: true });
    setShowAddForm(false);
    loadWebhooks();
  };

  // מחק webhook
  const handleDelete = async (id, name) => {
    if (confirm(`בטוח שרוצה למחוק את "${name}"?`)) {
      const result = await deleteWebhook(id);
      if (result.success) {
        alert('✅ Webhook נמחק!');
        loadWebhooks();
      } else {
        alert('❌ שגיאה במחיקה: ' + result.error);
      }
    }
  };

  // הפעל/כבה webhook
  const handleToggle = async (id, currentStatus) => {
    const result = await toggleWebhook(id, !currentStatus);
    if (result.success) {
      loadWebhooks();
    } else {
      alert('❌ שגיאה: ' + result.error);
    }
  };

  // ערוך webhook
  const handleEdit = (webhook) => {
    setFormData({
      name: webhook.name,
      url: webhook.url,
      description: webhook.description || '',
      enabled: webhook.enabled
    });
    setEditingId(webhook.id);
    setShowAddForm(true);
  };

  // ביטול עריכה
  const handleCancelEdit = () => {
    setFormData({ name: '', url: '', description: '', enabled: true });
    setEditingId(null);
    setShowAddForm(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: 'Rubik, sans-serif',
      direction: 'rtl'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <h1 style={{ fontSize: '32px', color: '#1a2332', margin: 0 }}>
            🔗 ניהול Webhooks
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                background: showAddForm ? '#e74c3c' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'Rubik, sans-serif'
              }}
            >
              {showAddForm ? '✕ ביטול' : '+ הוסף Webhook'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'Rubik, sans-serif'
              }}
              title="התנתק"
            >
              🚪 יציאה
            </button>
          </div>
        </div>

        {/* טופס הוספה/עריכה */}
        {showAddForm && (
          <div style={{
            background: '#f8f9fa',
            padding: '30px',
            borderRadius: '15px',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0, color: '#1a2332' }}>
              {editingId ? '✏️ עריכת Webhook' : '➕ Webhook חדש'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                  שם הוובהוק:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="לדוגמה: n8n - WhatsApp"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'Rubik, sans-serif'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                  URL:
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://n8n.litbe.co.il/webhook/..."
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'Rubik, sans-serif'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                  תיאור (אופציונלי):
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="לדוגמה: שליחת PDF ל-WhatsApp"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'Rubik, sans-serif'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    style={{ marginLeft: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#555' }}>פעיל</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontFamily: 'Rubik, sans-serif'
                  }}
                >
                  {editingId ? '💾 שמור שינויים' : '➕ הוסף'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      flex: 1,
                      padding: '14px',
                      fontSize: '16px',
                      background: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontFamily: 'Rubik, sans-serif'
                    }}
                  >
                    ביטול
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* רשימת Webhooks */}
        <div>
          <h3 style={{ color: '#1a2332', marginBottom: '20px' }}>
            📋 Webhooks ({webhooks.length})
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              טוען...
            </div>
          ) : webhooks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: '#f8f9fa',
              borderRadius: '15px',
              color: '#999'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔗</div>
              <div style={{ fontSize: '18px' }}>אין webhooks עדיין</div>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>לחץ על "הוסף Webhook" כדי להתחיל</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  style={{
                    background: webhook.enabled ? '#f0fff4' : '#fff5f5',
                    border: `2px solid ${webhook.enabled ? '#48bb78' : '#fc8181'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1a2332',
                      marginBottom: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: webhook.enabled ? '#48bb78' : '#fc8181',
                        display: 'inline-block'
                      }}></span>
                      {webhook.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '5px',
                      wordBreak: 'break-all'
                    }}>
                      {webhook.url}
                    </div>
                    {webhook.description && (
                      <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
                        {webhook.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginRight: '20px' }}>
                    <button
                      onClick={() => handleToggle(webhook.id, webhook.enabled)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        background: webhook.enabled ? '#fc8181' : '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontFamily: 'Rubik, sans-serif'
                      }}
                      title={webhook.enabled ? 'כבה' : 'הפעל'}
                    >
                      {webhook.enabled ? '⏸' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleEdit(webhook)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontFamily: 'Rubik, sans-serif'
                      }}
                      title="ערוך"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id, webhook.name)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontFamily: 'Rubik, sans-serif'
                      }}
                      title="מחק"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* כפתור חזרה */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              fontSize: '16px',
              background: '#95a5a6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontFamily: 'Rubik, sans-serif'
            }}
          >
            ← חזרה לדף הראשי
          </a>
        </div>
      </div>
    </div>
  );
}