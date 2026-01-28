import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // המר את הקובץ ל-Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // פרטי Cloudinary
    const cloudName = 'dgoihnzvq';
    const apiKey = '269896922227325';
    const apiSecret = 'ltXB9aFmGG67ktgKqoJYe0wP4UY';
    
    // צור חתימה
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'action-plans';
    
    // הפרמטרים לחתימה (בסדר אלפביתי!)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign)
      .digest('hex');

    // צור FormData חדש עם כל הפרמטרים
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([buffer]), file.name);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('signature', signature);
    uploadFormData.append('folder', folder);

    // העלה לCloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    const responseText = await cloudinaryResponse.text();
    
    if (!cloudinaryResponse.ok) {
      console.error('Cloudinary error:', responseText);
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: responseText 
      }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    return NextResponse.json({ url: data.secure_url });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}