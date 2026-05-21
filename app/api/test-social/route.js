// app/api/test-social/route.js — Endpoint para probar el auto-post en redes sociales
// SOLO USAR PARA PRUEBAS — protegido con CRON_SECRET
import { NextResponse } from 'next/server';
import { postToSocialMedia } from '@/lib/social';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const testArticle = {
    title: '🧪 Prueba de Auto-Post — Imperio Público está en línea en Telegram',
    slug: 'prueba-auto-post-telegram',
    excerpt: 'Esta es una publicación de prueba para verificar que el sistema de auto-post en redes sociales está funcionando correctamente.',
    category: 'tecnologia',
    image: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
  };

  try {
    await postToSocialMedia(testArticle);
    return NextResponse.json({
      success: true,
      message: '✅ Prueba enviada. Revisa tus redes sociales.',
      testedWith: testArticle.title,
      networks: {
        telegram: !!process.env.TELEGRAM_BOT_TOKEN,
        facebook: !!process.env.FACEBOOK_PAGE_TOKEN,
        twitter: !!process.env.TWITTER_API_KEY,
        instagram: !!process.env.INSTAGRAM_USER_ID,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
