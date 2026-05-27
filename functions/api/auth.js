export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { password } = await request.json();

    if (!env.APP_PASSWORD) {
      return new Response('Server misconfiguration', { status: 500 });
    }

    if (password === env.APP_PASSWORD) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
}
