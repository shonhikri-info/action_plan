'use client';

import { useState, useEffect } from 'react';
import { sendToWebhooks } from '../lib/webhooks.config';

export default function ActionPlan() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // בדוק אם כבר נכנס
  useEffect(() => {
    if (sessionStorage.getItem('authorized') === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  const checkPassword = () => {
    if (password === 'plan2025') {
      sessionStorage.setItem('authorized', 'true');
      setIsAuthorized(true);
    } else {
      alert('סיסמה שגויה');
    }
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    occupation: '',
    currentState: [''],
    desiredState: [''],
    vision1Year: [''],
    goals: [''],
    phase30Goal: '',
    phase30Actions: [''],
    phase30Metrics: [''],
    phase60Goal: '',
    phase60Actions: [''],
    phase60Metrics: [''],
    phase90Goal: '',
    phase90Actions: [''],
    phase90Metrics: [''],
    morningRoutine: [''],
    eveningRoutine: ['']
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addPoint = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const deletePoint = (field, index) => {
    setFormData(prev => {
      if (prev[field].length === 1) {
        alert('חייב להישאר לפחות נקודה אחת!');
        return prev;
      }
      const newArray = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: newArray };
    });
  };

  // הורדה ישירה של PDF (למנהל בלבד)
  const downloadPDFDirectly = async () => {
    // בקש סיסמת מנהל
    const adminPassword = prompt('הזן סיסמת מנהל:');
    
    if (adminPassword !== 'admin1!') {
      alert('❌ סיסמת מנהל שגויה!');
      return;
    }

    try {
      // הצג הודעת טעינה
      const loadingMsg = document.createElement('div');
      loadingMsg.id = 'loading-msg';
      loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#D4B160,#B89542);color:white;padding:30px 50px;border-radius:20px;font-size:20px;z-index:9999;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:Rubik,sans-serif;direction:rtl;';
      loadingMsg.innerHTML = '⏳ יוצר PDF...';
      document.body.appendChild(loadingMsg);

      // טען ספריות
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // הסתר כפתורים
      document.querySelectorAll('.action-buttons').forEach(btn => btn.style.display = 'none');

      // וודא RTL
      document.body.style.direction = 'rtl';
      document.querySelectorAll('input, textarea').forEach(el => {
        el.style.textAlign = 'right';
        el.style.direction = 'rtl';
      });

      // צור PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const maxContentHeight = pageHeight - 25;

      let currentY = margin;
      let isFirstPage = true;

      // צלם פוטר פעם אחת
      const footerElement = document.querySelector('.footer');
      const footerCanvas = await html2canvas(footerElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const addFooter = () => {
        if (footerCanvas) {
          const footerImgData = footerCanvas.toDataURL('image/jpeg', 0.95);
          const footerWidth = contentWidth;
          const footerHeight = ((footerCanvas.height / 2) * footerWidth) / (footerCanvas.width / 2);
          const footerY = pageHeight - footerHeight - margin;
          pdf.addImage(footerImgData, 'JPEG', margin, footerY, footerWidth, footerHeight, undefined, 'FAST');
        }
      };

      const addSectionToPDF = async (element) => {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            clonedDoc.body.style.direction = 'rtl';
            clonedDoc.body.style.overflow = 'visible';
            const clonedInputs = clonedDoc.querySelectorAll('input');
            clonedInputs.forEach(input => {
              input.style.textAlign = 'right';
              input.style.direction = 'rtl';
            });
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = contentWidth;
        const imgHeight = ((canvas.height / 2) * imgWidth) / (canvas.width / 2);

        // בדוק אם צריך לעבור לדף חדש
        if (currentY + imgHeight > maxContentHeight) {
          if (!isFirstPage) {
            addFooter();
          }
          pdf.addPage();
          currentY = margin;
          isFirstPage = false;
        }

        pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
        currentY += imgHeight + 3;
        isFirstPage = false;
      };

      // צלם כל הסקשנים - לפי סדר נכון
      const header = document.querySelector('.header');
      if (header) await addSectionToPDF(header);

      const clientInfo = document.querySelector('.client-info');
      if (clientInfo) await addSectionToPDF(clientInfo);

      const intro = document.querySelector('.intro-section');
      if (intro) await addSectionToPDF(intro);

      const quote = document.querySelector('.quote-section');
      if (quote) await addSectionToPDF(quote);

      const gapAnalysis = document.querySelector('.gap-analysis');
      if (gapAnalysis) {
        const gapSection = gapAnalysis.closest('.section');
        if (gapSection) await addSectionToPDF(gapSection);
      }

      const visionCard = document.querySelector('.vision-card');
      if (visionCard) {
        const visionSection = visionCard.closest('.section');
        if (visionSection) await addSectionToPDF(visionSection);
      }

      const goalsCard = document.querySelector('.goals-card');
      if (goalsCard) {
        const goalsSection = goalsCard.closest('.section');
        if (goalsSection) await addSectionToPDF(goalsSection);
      }

      const phase30 = document.querySelector('.phase-card.green');
      if (phase30) await addSectionToPDF(phase30);

      const phase60 = document.querySelector('.phase-card.blue');
      if (phase60) await addSectionToPDF(phase60);

      const phase90 = document.querySelector('.phase-card.yellow');
      if (phase90) await addSectionToPDF(phase90);

      const routineGrid = document.querySelector('.routine-grid');
      if (routineGrid) {
        const routineSection = routineGrid.closest('.section');
        if (routineSection) await addSectionToPDF(routineSection);
      }

      // הוסף פוטר לדף אחרון
      addFooter();

      // הורד את ה-PDF
      const todayFormatted = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
      const clientName = formData.fullName ? formData.fullName.replace(/\s+/g, '-') : 'client';
      const fileName = `action-plan-${clientName}-${todayFormatted}.pdf`;
      
      pdf.save(fileName);

      // הסר הודעת טעינה
      document.body.removeChild(loadingMsg);

      // הצג הודעת הצלחה
      const successMsg = document.createElement('div');
      successMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#10b981;color:white;padding:30px 50px;border-radius:20px;font-size:20px;z-index:9999;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:Rubik,sans-serif;direction:rtl;';
      successMsg.innerHTML = '✅ PDF הורד בהצלחה!<br><br><small style="font-size:14px;opacity:0.9;">הורדה ישירה - ללא שליחה</small>';
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        document.body.removeChild(successMsg);
        document.querySelectorAll('.action-buttons').forEach(btn => btn.style.display = 'flex');
      }, 3000);

    } catch (error) {
      console.error('Error:', error);
      alert('שגיאה ביצירת PDF: ' + error.message);
      const loadingMsgElement = document.getElementById('loading-msg');
      if (loadingMsgElement) document.body.removeChild(loadingMsgElement);
      document.querySelectorAll('.action-buttons').forEach(btn => btn.style.display = 'flex');
    }
  };

  const generatePDF = async () => {
    try {
      // צור modal לבקשת מספר טלפון
      const modalHtml = `
        <div id="phone-modal" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: Rubik, sans-serif;
          direction: rtl;
        ">
          <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
          ">
            <h2 style="
              font-size: 28px;
              color: #1a2332;
              margin-bottom: 15px;
              font-weight: 700;
            ">📱 שליחה ל-WhatsApp</h2>
            <p style="
              color: #6c757d;
              margin-bottom: 25px;
              font-size: 16px;
            ">הזן את מספר הטלפון שלך ונשלח את תכנית הפעולה ישירות ל-WhatsApp</p>
            <input 
              type="tel" 
              id="phone-input" 
              placeholder="הכנס כאן את הטלפון שלך"
              style="
                width: 100%;
                padding: 15px;
                font-size: 18px;
                border: 2px solid #D4B160;
                border-radius: 10px;
                margin-bottom: 20px;
                text-align: center;
                outline: none;
                font-family: Rubik, sans-serif;
              "
            />
            <div style="display: flex; gap: 10px;">
              <button id="send-btn" style="
                flex: 1;
                padding: 15px;
                font-size: 18px;
                background: linear-gradient(135deg, #D4B160 0%, #B89542 100%);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
                font-family: Rubik, sans-serif;
              ">שלח</button>
              <button id="cancel-btn" style="
                flex: 1;
                padding: 15px;
                font-size: 18px;
                background: #e9ecef;
                color: #6c757d;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
                font-family: Rubik, sans-serif;
              ">ביטול</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const modal = document.getElementById('phone-modal');
      const phoneInput = document.getElementById('phone-input');
      const sendBtn = document.getElementById('send-btn');
      const cancelBtn = document.getElementById('cancel-btn');

      phoneInput.focus();

      // המתן למספר טלפון
      const phoneNumber = await new Promise((resolve, reject) => {
        sendBtn.onclick = () => {
          const value = phoneInput.value.trim();
          if (value) {
            resolve(value);
          } else {
            phoneInput.style.borderColor = 'red';
            phoneInput.placeholder = 'חובה להזין מספר טלפון!';
          }
        };

        cancelBtn.onclick = () => {
          document.body.removeChild(modal);
          reject('cancelled');
        };

        phoneInput.onkeypress = (e) => {
          if (e.key === 'Enter') {
            sendBtn.click();
          }
        };
      });

      // הסר modal
      modal.remove();

      // נקה את המספר
      let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      
      // אם מתחיל ב-0, החלף ל-972
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '972' + cleanPhone.substring(1);
      }
      
      // ודא שהמספר תקין
      if (cleanPhone.length < 10) {
        alert('מספר טלפון לא תקין');
        return;
      }

      // הצג הודעת טעינה
      const loadingMsg = document.createElement('div');
      loadingMsg.id = 'loading-msg';
      loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a2332;color:white;padding:30px 50px;border-radius:20px;font-size:20px;z-index:9999;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:Rubik,sans-serif;direction:rtl;';
      loadingMsg.innerHTML = '⏳ יוצר את התכנית שלך...<br><br><small style="font-size:14px;opacity:0.8;">זה לוקח כמה שניות</small>';
      document.body.appendChild(loadingMsg);

      // ייבוא דינמי
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // הסתר כפתורים
      const buttons = document.querySelector('.action-buttons');
      const deleteButtons = document.querySelectorAll('.delete-btn');
      const addButtons = document.querySelectorAll('.add-btn');
      
      if (buttons) buttons.style.display = 'none';
      deleteButtons.forEach(btn => btn.style.display = 'none');
      addButtons.forEach(btn => btn.style.display = 'none');

      // וודא RTL
      const container = document.querySelector('.container');
      const allInputs = container.querySelectorAll('input');
      allInputs.forEach(input => {
        input.style.textAlign = 'right';
        input.style.direction = 'rtl';
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // צור PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;  // ⭐ 10mm מכל צד!
      const contentWidth = pageWidth - (margin * 2);  // 190mm
      const maxContentHeight = pageHeight - 25;

      let currentY = margin;
      let isFirstPage = true;

      // צלם פוטר - עם scale 2!
      const footer = document.querySelector('.footer');
      let footerCanvas = null;
      if (footer) {
        footerCanvas = await html2canvas(footer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: null,
          onclone: (clonedDoc) => {
            clonedDoc.body.style.direction = 'rtl';
          }
        });
      }

      const addFooter = () => {
        if (footerCanvas) {
          const footerImgData = footerCanvas.toDataURL('image/jpeg', 0.95);
          const footerWidth = contentWidth;  // ⭐ רוחב עם margins!
          // חלק ב-2 כי scale=2!
          const footerHeight = ((footerCanvas.height / 2) * footerWidth) / (footerCanvas.width / 2);
          const footerY = pageHeight - footerHeight - margin;  // ⭐ עם margin!
          pdf.addImage(footerImgData, 'JPEG', margin, footerY, footerWidth, footerHeight, undefined, 'FAST');
        }
      };

      const addSectionToPDF = async (element) => {
        const canvas = await html2canvas(element, {
          scale: 2,  // רזולוציה גבוהה
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            clonedDoc.body.style.direction = 'rtl';
            clonedDoc.body.style.overflow = 'visible';
            const clonedInputs = clonedDoc.querySelectorAll('input');
            clonedInputs.forEach(input => {
              input.style.textAlign = 'right';
              input.style.direction = 'rtl';
            });
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = contentWidth;
        // חלק ב-2 כי scale=2
        const imgHeight = ((canvas.height / 2) * imgWidth) / (canvas.width / 2);

        // בדוק אם צריך לעבור לדף חדש (גם בדף הראשון!)
        if (currentY + imgHeight > maxContentHeight) {
          if (!isFirstPage) {
            addFooter();
          }
          pdf.addPage();
          currentY = margin;
          isFirstPage = false;
        }

        // מוסיף את התמונה עם margin
        pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
        currentY += imgHeight + 3;
        isFirstPage = false;
      };

      // בנה את ה-PDF - כל הסקשנים ברצף, מעבר דף אוטומטי רק כשצריך
      const header = document.querySelector('.header');
      if (header) await addSectionToPDF(header);

      const clientInfo = document.querySelector('.client-info');
      if (clientInfo) await addSectionToPDF(clientInfo);

      const intro = document.querySelector('.intro-section');
      if (intro) await addSectionToPDF(intro);

      const quote = document.querySelector('.quote-section');
      if (quote) await addSectionToPDF(quote);

      const gapAnalysis = document.querySelector('.gap-analysis');
      if (gapAnalysis) {
        const gapSection = gapAnalysis.closest('.section');
        if (gapSection) await addSectionToPDF(gapSection);
      }

      const visionCard = document.querySelector('.vision-card');
      if (visionCard) {
        const visionSection = visionCard.closest('.section');
        if (visionSection) await addSectionToPDF(visionSection);
      }

      const goalsCard = document.querySelector('.goals-card');
      if (goalsCard) {
        const goalsSection = goalsCard.closest('.section');
        if (goalsSection) await addSectionToPDF(goalsSection);
      }

      const phase30 = document.querySelector('.phase-card.green');
      if (phase30) await addSectionToPDF(phase30);

      const phase60 = document.querySelector('.phase-card.blue');
      if (phase60) await addSectionToPDF(phase60);

      const phase90 = document.querySelector('.phase-card.yellow');
      if (phase90) await addSectionToPDF(phase90);

      const routineGrid = document.querySelector('.routine-grid');
      if (routineGrid) {
        const routineSection = routineGrid.closest('.section');
        if (routineSection) await addSectionToPDF(routineSection);
      }

      addFooter();

      // החזר כפתורים
      if (buttons) buttons.style.display = 'flex';
      deleteButtons.forEach(btn => btn.style.display = '');
      addButtons.forEach(btn => btn.style.display = '');

      // ⭐ Cloudinary + n8n
      loadingMsg.innerHTML = '📤 שולח ל-WhatsApp...';

      const pdfBlob = pdf.output('blob');
      // שם קובץ עם שם הלקוח ותאריך
      const todayFormatted = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
      const clientName = formData.fullName ? formData.fullName.replace(/\s+/g, '-') : 'client';
      const fileName = `action-plan-${clientName}-${todayFormatted}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', pdfFile);
      
      const cloudinaryResponse = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: uploadFormData
      });

      if (!cloudinaryResponse.ok) {
        throw new Error('שגיאה בשמירת הקובץ');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const pdfUrl = cloudinaryData.url;

      // ⭐ שלח לכל הוובהוקים הפעילים
      const webhookData = {
        phone: cleanPhone,
        pdfUrl: pdfUrl,
        fileName: fileName,
        userData: {
          fullName: formData.fullName || '',
          email: formData.email || '',
          occupation: formData.occupation || ''
        }
      };

      const webhookResult = await sendToWebhooks(webhookData);

      // הסר הודעת טעינה
      const loadingMsgElement = document.getElementById('loading-msg');
      if (loadingMsgElement) document.body.removeChild(loadingMsgElement);

      // בדוק אם נשלח לפחות לוובהוק אחד
      if (webhookResult.success && webhookResult.successful > 0) {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#10b981;color:white;padding:30px 50px;border-radius:20px;font-size:20px;z-index:9999;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:Rubik,sans-serif;direction:rtl;';
        successMsg.innerHTML = `✅ נשלח בהצלחה!<br><br><small style="font-size:14px;opacity:0.9;">נשלח ל-${webhookResult.successful} מתוך ${webhookResult.total} webhooks</small>`;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      } else {
        // לא נשלח לאף webhook - הודעת כישלון
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ef4444;color:white;padding:30px 50px;border-radius:20px;font-size:20px;z-index:9999;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:Rubik,sans-serif;direction:rtl;';
        errorMsg.innerHTML = '❌ נכשל השליחה לווטסאפ<br><br><small style="font-size:14px;opacity:0.9;">בדוק את הגדרות ה-webhooks או נסה שוב</small>';
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
          document.body.removeChild(errorMsg);
        }, 4000);
        
        throw new Error('נכשל השליחה - אף webhook לא עבד');
      }

    } catch (error) {
      console.error('Error:', error);
      const loadingMsg = document.getElementById('loading-msg');
      if (loadingMsg) document.body.removeChild(loadingMsg);
      
      // החזר כפתורים
      document.querySelectorAll('.action-buttons').forEach(btn => btn.style.display = 'flex');
      
      if (error !== 'cancelled') {
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ef4444;color:white;padding:30px 50px;border-radius:20px;font-size:18px;z-index:9999;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:Rubik,sans-serif;direction:rtl;';
        errorMsg.innerHTML = '❌ אופס, משהו השתבש<br><br><small style="font-size:14px;">נסה שוב או פנה לתמיכה</small>';
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
          document.body.removeChild(errorMsg);
        }, 4000);
      }
    }
  };

  const today = new Date().toLocaleDateString('he-IL');

  // אם לא מורשה, הצג מסך סיסמה
  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #D4B160 0%, #B89542 100%)',
        fontFamily: 'Rubik, sans-serif',
        direction: 'rtl',
        position: 'relative'
      }}>
        {/* כפתור אדמין קטן בפינה */}
        <a
          href="/admin"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '8px 16px',
            fontSize: '14px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          🔧 אדמין
        </a>
        
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%'
        }}>
          <h1 style={{fontSize: '32px', color: '#1a2332', marginBottom: '10px'}}>
            תכנית פעולה פרקטית
          </h1>
          <p style={{color: '#6c757d', marginBottom: '30px'}}>
            הזן את קוד הגישה שקיבלת
          </p>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              placeholder="הזן קוד גישה..."
              style={{
                width: '100%',
                padding: '15px',
                paddingLeft: '50px',
                fontSize: '18px',
                border: '2px solid #D4B160',
                borderRadius: '10px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <button
            onClick={checkPassword}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              background: 'linear-gradient(135deg, #D4B160 0%, #B89542 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            כניסה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* כפתור אדמין קטן בפינה */}
      <a
        href="/admin"
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '10px 20px',
          fontSize: '14px',
          background: 'rgba(102, 126, 234, 0.9)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '10px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          zIndex: 1000,
          transition: 'all 0.3s',
          backdropFilter: 'blur(10px)'
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'rgba(118, 75, 162, 0.9)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'rgba(102, 126, 234, 0.9)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        🔧 אדמין
      </a>
      
      <div className="header">
        <h1>תכנית פעולה פרקטית</h1>
      </div>

      <div className="content">
        {/* Client Info */}
        <div className="client-info">
          <div className="info-card">
            <div className="info-label">שם מלא</div>
            <div className="info-value">
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="הקלד שם מלא..."
              />
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">אימייל</div>
            <div className="info-value">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">מה עושה בחיים</div>
            <div className="info-value">
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="תפקיד/עיסוק..."
              />
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">תאריך</div>
            <div className="info-value">
              <div>{today}</div>
            </div>
          </div>
        </div>

        {/* Intro - READONLY */}
        <div className="intro-section">
          <div className="intro-title">למה תכנית 30/60/90 יום?</div>
          <div className="intro-content">
            תכנית זו תעזור לך להגדיר מטרות ברורות, לבנות תוכנית פעולה ממוקדת ולמדוד את ההתקדמות שלך.
          </div>
        </div>

        {/* Quote - READONLY */}
        <div className="quote-section">
          <div className="quote-text">הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו</div>
          <div className="quote-author">— פיטר דרקר</div>
        </div>

        {/* Gap Analysis */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">ניתוח פערים - רצוי ומצוי</h2>
          </div>

          <div className="gap-analysis">
            <div className="gap-card">
              <div className="gap-card-title">מצוי - איפה אני היום</div>
              <ul className="gap-list">
                {formData.currentState.map((item, index) => (
                  <li key={index}>
                    <span className="bullet">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('currentState', index, e.target.value)}
                      placeholder="תאר את המצב הנוכחי שלך..."
                    />
                    {formData.currentState.length > 1 && (
                      <button className="delete-btn" onClick={() => deletePoint('currentState', index)}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <button className="add-btn" onClick={() => addPoint('currentState')}>+ הוסף נקודה</button>
            </div>

            <div className="gap-card">
              <div className="gap-card-title">רצוי - לאן אני רוצה להגיע</div>
              <ul className="gap-list">
                {formData.desiredState.map((item, index) => (
                  <li key={index}>
                    <span className="bullet">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('desiredState', index, e.target.value)}
                      placeholder="תאר את המצב הרצוי..."
                    />
                    {formData.desiredState.length > 1 && (
                      <button className="delete-btn" onClick={() => deletePoint('desiredState', index)}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <button className="add-btn" onClick={() => addPoint('desiredState')}>+ הוסף נקודה</button>
            </div>
          </div>
        </div>

        {/* Vision */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">חזון לשנה מהיום</h2>
          </div>

          <div className="vision-card">
            <div className="vision-label">איפה אתה רוצה להיות בעוד שנה</div>
            <ul className="vision-list">
              {formData.vision1Year.map((item, index) => (
                <li key={index}>
                  <span className="bullet">→</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('vision1Year', index, e.target.value)}
                    placeholder="תאר איפה תהיה בעוד שנה..."
                  />
                  {formData.vision1Year.length > 1 && (
                    <button className="delete-btn" onClick={() => deletePoint('vision1Year', index)}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button className="add-btn" onClick={() => addPoint('vision1Year')}>+ הוסף מטרה</button>
          </div>
        </div>

        {/* Goals */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">מטרות</h2>
          </div>

          <div className="goals-card">
            <div className="vision-label">המטרות העיקריות שלך</div>
            <ul className="vision-list">
              {formData.goals.map((item, index) => (
                <li key={index}>
                  <span className="bullet">→</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('goals', index, e.target.value)}
                    placeholder="מה המטרות שלך?"
                  />
                  {formData.goals.length > 1 && (
                    <button className="delete-btn" onClick={() => deletePoint('goals', index)}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button className="add-btn" onClick={() => addPoint('goals')}>+ הוסף מטרה</button>
          </div>

          <div className="success-formula">
            <h3>הנוסחה להצלחה ב-90 יום</h3>
            <div className="success-steps">
              <div className="success-step">
                <div className="success-step-number">1</div>
                <div className="success-step-text">הגדר מטרות ברורות ומדידות</div>
              </div>
              <div className="success-step">
                <div className="success-step-number">2</div>
                <div className="success-step-text">פרק למשימות יומיות קטנות</div>
              </div>
              <div className="success-step">
                <div className="success-step-number">3</div>
                <div className="success-step-text">בצע באופן עקבי ומדוד התקדמות</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 30 */}
        <PhaseSection
          number="30"
          title="ימים 1-30 | יסודות והשקעה"
          subtitle="התמקדות בלמידה, הבנה והקמת תשתיות"
          color="green"
          goalValue={formData.phase30Goal}
          onGoalChange={(val) => handleInputChange('phase30Goal', val)}
          actions={formData.phase30Actions}
          onActionsChange={(idx, val) => handleArrayChange('phase30Actions', idx, val)}
          onAddAction={() => addPoint('phase30Actions')}
          onDeleteAction={(idx) => deletePoint('phase30Actions', idx)}
          metrics={formData.phase30Metrics}
          onMetricsChange={(idx, val) => handleArrayChange('phase30Metrics', idx, val)}
          onAddMetric={() => addPoint('phase30Metrics')}
          onDeleteMetric={(idx) => deletePoint('phase30Metrics', idx)}
        />

        {/* Phase 60 */}
        <PhaseSection
          number="60"
          title="ימים 31-60 | צמיחה ופיתוח"
          subtitle="התמקדות בהטמעה, שיפור ובניית מומנטום"
          color="blue"
          goalValue={formData.phase60Goal}
          onGoalChange={(val) => handleInputChange('phase60Goal', val)}
          actions={formData.phase60Actions}
          onActionsChange={(idx, val) => handleArrayChange('phase60Actions', idx, val)}
          onAddAction={() => addPoint('phase60Actions')}
          onDeleteAction={(idx) => deletePoint('phase60Actions', idx)}
          metrics={formData.phase60Metrics}
          onMetricsChange={(idx, val) => handleArrayChange('phase60Metrics', idx, val)}
          onAddMetric={() => addPoint('phase60Metrics')}
          onDeleteMetric={(idx) => deletePoint('phase60Metrics', idx)}
        />

        {/* Phase 90 */}
        <PhaseSection
          number="90"
          title="ימים 61-90 | מקסום וחידוד"
          subtitle="התמקדות בתוצאות, אופטימיזציה ותכנון המשך"
          color="yellow"
          goalValue={formData.phase90Goal}
          onGoalChange={(val) => handleInputChange('phase90Goal', val)}
          actions={formData.phase90Actions}
          onActionsChange={(idx, val) => handleArrayChange('phase90Actions', idx, val)}
          onAddAction={() => addPoint('phase90Actions')}
          onDeleteAction={(idx) => deletePoint('phase90Actions', idx)}
          metrics={formData.phase90Metrics}
          onMetricsChange={(idx, val) => handleArrayChange('phase90Metrics', idx, val)}
          onAddMetric={() => addPoint('phase90Metrics')}
          onDeleteMetric={(idx) => deletePoint('phase90Metrics', idx)}
        />

        {/* Routines */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">שגרה יומית</h2>
          </div>

          <div className="routine-grid">
            <RoutineCard
              title="שגרת בוקר"
              items={formData.morningRoutine}
              onChange={(idx, val) => handleArrayChange('morningRoutine', idx, val)}
              onAdd={() => addPoint('morningRoutine')}
              onDelete={(idx) => deletePoint('morningRoutine', idx)}
            />
            <RoutineCard
              title="שגרת ערב"
              items={formData.eveningRoutine}
              onChange={(idx, val) => handleArrayChange('eveningRoutine', idx, val)}
              onAdd={() => addPoint('eveningRoutine')}
              onDelete={(idx) => deletePoint('eveningRoutine', idx)}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={generatePDF}>הורד PDF</button>
          <button 
            className="btn" 
            onClick={downloadPDFDirectly}
            style={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              color: 'white',
              padding: '15px 30px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(231, 76, 60, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.3)';
            }}
          >
            🔧 מנהל
          </button>
        </div>
      </div>

      <div className="footer">
        נוצר במיוחד עבורך | האקדמיה למקצועות פרקטיים | © 2025
      </div>
    </div>
  );
}

function PhaseSection({ number, title, subtitle, color, goalValue, onGoalChange, actions, onActionsChange, onAddAction, onDeleteAction, metrics, onMetricsChange, onAddMetric, onDeleteMetric }) {
  return (
    <div className={`phase-card ${color}`}>
      <div className="phase-header">
        <div className={`phase-number ${color}`}>{number}</div>
        <div>
          <div className="phase-title">{title}</div>
          <div className="phase-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="phase-goal">
        <input
          type="text"
          value={goalValue}
          onChange={(e) => onGoalChange(e.target.value)}
          placeholder="מטרה מרכזית לתקופה זו..."
        />
      </div>

      <div className="phase-section">
        <div className="phase-section-title">פעולות</div>
        <div className="phase-list-container">
          <ul className="gap-list">
            {actions.map((item, index) => (
              <li key={index}>
                <span className="bullet">✔</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => onActionsChange(index, e.target.value)}
                  placeholder="פעולה ספציפית..."
                />
                {actions.length > 1 && (
                  <button className="delete-btn" onClick={() => onDeleteAction(index)}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button className="add-btn" onClick={onAddAction}>+ הוסף פעולה</button>
        </div>
      </div>

      <div className="phase-section">
        <div className="phase-section-title">מדדי הצלחה</div>
        <div className="phase-list-container">
          <ul className="gap-list">
            {metrics.map((item, index) => (
              <li key={index}>
                <span className="bullet">✔</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => onMetricsChange(index, e.target.value)}
                  placeholder="איך נמדוד הצלחה?"
                />
                {metrics.length > 1 && (
                  <button className="delete-btn" onClick={() => onDeleteMetric(index)}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button className="add-btn" onClick={onAddMetric}>+ הוסף מדד</button>
        </div>
      </div>
    </div>
  );
}

function RoutineCard({ title, items, onChange, onAdd, onDelete }) {
  return (
    <div className="routine-card">
      <div className="routine-card-title">{title}</div>
      <ul className="gap-list">
        {items.map((item, index) => (
          <li key={index}>
            <span className="bullet">▸</span>
            <input
              type="text"
              value={item}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder="הוסף פעילות..."
            />
            {items.length > 1 && (
              <button className="delete-btn" onClick={() => onDelete(index)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
      <button className="add-btn" onClick={onAdd}>+ הוסף פעולה</button>
    </div>
  );
}