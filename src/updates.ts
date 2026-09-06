export function registerUpdates(beforeReload:()=>Promise<void>){
 if(!('serviceWorker'in navigator)||import.meta.env.DEV)return;
 let reloading=false;const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',async()=>{if(!hadController||reloading)return;reloading=true;await beforeReload();location.reload();});
 const update=async()=>{try{const registration=await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{updateViaCache:'none'});await registration.update();}catch(error){console.warn('Offline update deferred:',error);}};
 void update();window.addEventListener('online',()=>void update());document.addEventListener('visibilitychange',()=>{if(!document.hidden)void update();});
}
