export const onRequestGet = () =>
  new Response(JSON.stringify({ ok: true, message: 'Server is healthy' }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });


