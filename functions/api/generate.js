export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { password, prompt, images } = await request.json();

    // Verify password
    if (!env.APP_PASSWORD || password !== env.APP_PASSWORD) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!env.CLAUDE_API_KEY) {
      return new Response('Claude API key not configured', { status: 500 });
    }

    // Build message content
    const content = [];

    // Attach images if provided
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.data && img.type) {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: img.type, data: img.data },
          });
        }
      }
    }

    content.push({ type: 'text', text: prompt });

    // Call Claude API with streaming
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':        env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 4096,
        stream:     true,
        messages:   [{ role: 'user', content }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return new Response(`Claude API error: ${errText}`, { status: 502 });
    }

    // Stream response back to client
    return new Response(claudeRes.body, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (e) {
    return new Response(`Internal error: ${e.message}`, { status: 500 });
  }
}
