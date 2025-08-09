export const onRequestGet = async ({ env, request }) => {
  try{
    const url = new URL(request.url);
    const hand = url.searchParams.get('hand');
    if(!hand){
      return new Response(JSON.stringify({ error: 'hand required' }), { status: 400, headers: {'content-type':'application/json'} });
    }
    const { results } = await env.DB.prepare(
      'SELECT nickname, ms, created_at as at FROM rankings WHERE hand = ? ORDER BY ms ASC LIMIT 50'
    ).bind(Number(hand)).all();
    return new Response(JSON.stringify({ hand, ranks: results||[] }), { headers: {'content-type':'application/json'} });
  }catch(e){
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500, headers: {'content-type':'application/json'} });
  }
};


