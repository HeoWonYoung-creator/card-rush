export const onRequestPost = async ({ env, request }) => {
  try{
    const { hand, nickname, ms } = await request.json();
    if(!hand || !nickname || typeof ms !== 'number' || !(ms>0)){
      return new Response(JSON.stringify({ error: 'invalid' }), { status: 400, headers: {'content-type':'application/json'} });
    }
    const name = String(nickname).trim().slice(0, 20);
    if(!name){
      return new Response(JSON.stringify({ error: 'empty nick' }), { status: 400, headers: {'content-type':'application/json'} });
    }
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS rankings (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      hand INTEGER NOT NULL,\n      nickname TEXT NOT NULL,\n      ms INTEGER NOT NULL,\n      created_at TEXT NOT NULL DEFAULT (strftime(\'%%Y-%%m-%%dT%%H:%%M:%%fZ\',\'now\'))\n    );').run();
    await env.DB.prepare('INSERT INTO rankings (hand, nickname, ms) VALUES (?, ?, ?)')
      .bind(Number(hand), name, ms)
      .run();
    return new Response(JSON.stringify({ ok: true }), { headers: {'content-type':'application/json'} });
  }catch(e){
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500, headers: {'content-type':'application/json'} });
  }
};


