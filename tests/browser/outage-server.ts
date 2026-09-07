import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

// A real server outage avoids depending on a browser's offline-emulation API.
// Each test gets its own port, so it cannot disconnect another parallel worker.
export async function startOutageServer(){
 const root=resolve('dist');let connected=true,revision=1;
 const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
 const server=createServer(async(req,res)=>{
  if(!connected){req.socket.destroy();return;}
  const pathname=new URL(req.url||'/', 'http://localhost').pathname;
  if(!pathname.startsWith('/math-quest/')){res.writeHead(404).end();return;}
  const file=resolve(root,decodeURIComponent(pathname.slice('/math-quest/'.length)||'index.html'));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  try{
   let body:Buffer|string=await readFile(file);
   if(file.endsWith('/index.html'))body=body.toString().replace('<head>',`<head><meta name="qa-server-release" content="${revision}">`);
   res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');
   if(req.headers.origin)res.setHeader('Access-Control-Allow-Origin',req.headers.origin);
   res.end(body);
  }catch{res.writeHead(404).end();}
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=(server.address() as {port:number}).port;
 return{url:`http://127.0.0.1:${port}/math-quest/`,nextRelease(){revision++;},disconnect(){connected=false;server.closeAllConnections();},async close(){server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}};
}
