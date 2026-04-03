import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.REVALIDATE_SECRET || 'mi-secreto-super-seguro';

    if (authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    revalidatePath('/', 'layout');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
