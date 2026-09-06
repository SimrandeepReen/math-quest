export type BallState={x:number;y:number;vx:number;vy:number};
export const GRAVITY=820;
export function launch(x:number,y:number,dx:number,dy:number):BallState{return{x,y,vx:Math.max(-720,Math.min(720,dx*4.5)),vy:Math.max(-1120,Math.min(-180,dy*4.5))};}
export function advance(ball:BallState,dt:number){ball.x+=ball.vx*dt;ball.y+=ball.vy*dt+0.5*GRAVITY*dt*dt;ball.vy+=GRAVITY*dt;}
export function scored(previous:BallState,next:BallState,hoopX:number,hoopY:number){if(next.vy<=0||previous.y>hoopY||next.y<hoopY)return false;const t=(hoopY-previous.y)/Math.max(.001,next.y-previous.y);const cross=previous.x+(next.x-previous.x)*t;return Math.abs(cross-hoopX)<62;}
