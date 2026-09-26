import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml'};
const miloraEndpoint='https://api.milorapart.top/apis/mbAIsc';
const allowedAudioHosts=new Set(['media.milorapart.top','api.milorapart.top']);
async function proxyMilora(url,res){
  const text=url.searchParams.get('text')?.trim();
  if(!text){res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'});return res.end(JSON.stringify({error:'缺少 text 参数'}));}
  const apiUrl=new URL(miloraEndpoint);apiUrl.searchParams.set('text',text);apiUrl.searchParams.set('format','mp3');
  const apiResponse=await fetch(apiUrl);
  const result=await apiResponse.json();
  if(!apiResponse.ok||result.code!==200||!result.url)throw new Error(result.msg||'Milora 未返回音频地址');
  const audioUrl=new URL(String(result.url).replace(/^http:\/\//,'https://'));
  if(!allowedAudioHosts.has(audioUrl.hostname))throw new Error('音频地址不是允许的 Milora 域名');
  const audioResponse=await fetch(audioUrl);
  if(!audioResponse.ok)throw new Error(`音频下载失败（${audioResponse.status}）`);
  const buffer=Buffer.from(await audioResponse.arrayBuffer());
  res.writeHead(200,{'Content-Type':'audio/mpeg','Content-Length':String(buffer.length),'Content-Disposition':`attachment; filename="voiceprint-${Date.now()}.mp3"`,'Cache-Control':'no-store'});res.end(buffer);
}
const server=http.createServer(async(req,res)=>{try{
  const pathname=decodeURIComponent((req.url||'/').split('?')[0]);const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
  if(pathname==='/api/milora'){return await proxyMilora(url,res)}
  const safe=normalize(pathname==='/'?'/index.html':pathname);const file=join(root,safe);if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden')}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
}catch(error){res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:error.message||'代理请求失败'}));}});
server.listen(Number(process.env.PORT||4173),'0.0.0.0',()=>console.log('PWA server ready'));
