import type { SaveData } from '../../persistence/SaveStore';
export const CATALOG=[
 {id:'plant',label:'Daisy pot',cost:8,kind:'decoration'},
 {id:'bow',label:'Cherry bow',cost:8,kind:'accessory'},
 {id:'balloon',label:'Sky balloon',cost:10,kind:'toy'},
 {id:'mint',label:'Mint scoop',cost:12,kind:'flavour'},
 {id:'cushion',label:'Sunny cushion',cost:12,kind:'decoration'},
 {id:'cat',label:'Sleepy cat',cost:16,kind:'toy'},
 {id:'rocket',label:'Moon rocket',cost:18,kind:'toy'},
 {id:'rainbow',label:'Little rainbow',cost:18,kind:'decoration'},
 {id:'hat',label:'Sun hat',cost:20,kind:'accessory'}
] as const;
export function earn(data:SaveData,reason:'serve'|'learning'|'basket'){const amount=reason==='learning'?5:reason==='serve'?3:1;data.coins+=amount;data.earned+=amount;if(reason==='basket')data.goals++;else data.served++;return amount;}
export function purchase(data:SaveData,id:string):'owned'|'funds'|'bought'|'unknown'{const item=CATALOG.find(i=>i.id===id);if(!item)return'unknown';if(data.unlocked.includes(id))return'owned';if(data.coins<item.cost)return'funds';data.coins-=item.cost;data.unlocked.push(id);if(item.kind==='accessory')data.accessory=id;else if(item.kind!=='flavour')data.placements[id]={x:720,y:660,location:'Room'};return'bought';}
