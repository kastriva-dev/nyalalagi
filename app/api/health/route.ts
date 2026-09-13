import { app } from '@/lib/firebase';

export async function GET() {
  if (!app) {
    return new Response(JSON.stringify({ error: 'Firebase not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ status: 'ok', firebase: 'connected' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}