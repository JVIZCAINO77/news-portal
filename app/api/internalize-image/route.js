// app/api/internalize-image/route.js
// Internaliza una URL externa a Cloudinary — usado por el editor al pegar URLs
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // Necesita Buffer para la descarga

export async function POST(request) {
  // Solo editores autenticados pueden usar este endpoint
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { url } = await request.json().catch(() => ({}));
  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  // Si ya es Cloudinary, devolver tal cual
  if (url.includes('cloudinary.com')) {
    return NextResponse.json({ cloudinaryUrl: url });
  }

  try {
    // Intentar descargar la imagen con headers de navegador
    const imgResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
        'Referer': new URL(url).origin + '/',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!imgResponse.ok) {
      return NextResponse.json({ cloudinaryUrl: null, reason: 'download_failed' });
    }

    const contentType = imgResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ cloudinaryUrl: null, reason: 'not_image' });
    }

    const buffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;

    // Subir a Cloudinary via upload API
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      // Sin config server-side → devolver null (el editor mantiene la URL original)
      return NextResponse.json({ cloudinaryUrl: null, reason: 'no_config' });
    }

    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('folder', 'imperio-publico/editorial');
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!cloudRes.ok) {
      return NextResponse.json({ cloudinaryUrl: null, reason: 'upload_failed' });
    }

    const cloudData = await cloudRes.json();
    return NextResponse.json({ cloudinaryUrl: cloudData.secure_url });

  } catch (err) {
    console.error('[InternalizeImage] Error:', err.message);
    return NextResponse.json({ cloudinaryUrl: null, reason: 'error' });
  }
}
