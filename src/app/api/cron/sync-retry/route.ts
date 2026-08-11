import { NextResponse } from 'next/server';
import { getAllLinks } from '@/lib/db';
import { syncLinkToSharePoint } from '@/lib/sharepoint-sync';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized Cron Execution' }, { status: 401 });
  }

  try {
    const links = await getAllLinks();
    const pendingOrFailed = links.filter(
      (l) => l.syncStatus === 'FAILED' || l.syncStatus === 'PENDING'
    ).slice(0, 10); // Batch size 10 to avoid timeouts

    let retried = 0;
    let succeeded = 0;

    for (const link of pendingOrFailed) {
      if (link.syncAttempts < 5) {
        retried++;
        const res = await syncLinkToSharePoint(link);
        if (res.success) succeeded++;
      }
    }

    return NextResponse.json({
      message: 'Vercel Cron Sync Retry execution completed.',
      totalFound: pendingOrFailed.length,
      retriedCount: retried,
      succeededCount: succeeded,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
