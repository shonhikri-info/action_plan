import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dgoihnzvq',
  api_key: '269896922227325',
  api_secret: 'ltXB9aFmGG67ktgKqoJYe0wP4UY',
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ניקוי שם הקובץ והבטחת סיומת .pdf
    const cleanName = file.name.replace(/\.[^/.]+$/, "") + '.pdf';

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // שינוי ל-raw פותר את שגיאת הפורמט הלא נתמך
          resource_type: 'raw', 
          folder: 'action-plans',
          public_id: cleanName,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({ 
      url: result.secure_url,
      public_id: result.public_id 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }
}