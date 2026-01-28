// webhooks.config.js
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const WEBHOOKS_COLLECTION = 'webhooks';

// קבל את כל הוובהוקים מ-Firebase
export async function getAllWebhooks() {
  try {
    const webhooksRef = collection(db, WEBHOOKS_COLLECTION);
    const snapshot = await getDocs(webhooksRef);
    
    const webhooks = [];
    snapshot.forEach((doc) => {
      webhooks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return webhooks;
  } catch (error) {
    console.error('Error getting webhooks:', error);
    return [];
  }
}

// קבל רק webhooks פעילים
export async function getActiveWebhooks() {
  const allWebhooks = await getAllWebhooks();
  return allWebhooks.filter(webhook => webhook.enabled === true);
}

// הוסף webhook חדש
export async function addWebhook(webhookData) {
  try {
    const webhooksRef = collection(db, WEBHOOKS_COLLECTION);
    const docRef = await addDoc(webhooksRef, {
      name: webhookData.name,
      url: webhookData.url,
      enabled: webhookData.enabled !== undefined ? webhookData.enabled : true,
      description: webhookData.description || '',
      createdAt: new Date().toISOString()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding webhook:', error);
    return { success: false, error: error.message };
  }
}

// עדכן webhook
export async function updateWebhook(webhookId, updates) {
  try {
    const webhookRef = doc(db, WEBHOOKS_COLLECTION, webhookId);
    await updateDoc(webhookRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating webhook:', error);
    return { success: false, error: error.message };
  }
}

// מחק webhook
export async function deleteWebhook(webhookId) {
  try {
    const webhookRef = doc(db, WEBHOOKS_COLLECTION, webhookId);
    await deleteDoc(webhookRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return { success: false, error: error.message };
  }
}

// הפעל/כבה webhook
export async function toggleWebhook(webhookId, enabled) {
  return updateWebhook(webhookId, { enabled });
}

// שלח לכל הוובהוקים הפעילים
export async function sendToWebhooks(data) {
  const activeWebhooks = await getActiveWebhooks();
  
  if (activeWebhooks.length === 0) {
    console.warn('⚠️ אין webhooks פעילים!');
    return { 
      success: false, 
      message: 'No active webhooks',
      total: 0,
      successful: 0,
      failed: 0
    };
  }

  const results = await Promise.allSettled(
    activeWebhooks.map(async (webhook) => {
      try {
        console.log(`📤 שולח ל-${webhook.name}...`);
        
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          console.log(`✅ ${webhook.name} - הצליח!`);
          return { webhook: webhook.name, success: true };
        } else {
          console.error(`❌ ${webhook.name} - נכשל!`, response.status);
          return { webhook: webhook.name, success: false, error: response.statusText };
        }
      } catch (error) {
        console.error(`❌ ${webhook.name} - שגיאה:`, error.message);
        return { webhook: webhook.name, success: false, error: error.message };
      }
    })
  );

  // בדוק אם לפחות אחד הצליח
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
  
  return {
    success: successful.length > 0,
    total: activeWebhooks.length,
    successful: successful.length,
    failed: results.length - successful.length,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
  };
}