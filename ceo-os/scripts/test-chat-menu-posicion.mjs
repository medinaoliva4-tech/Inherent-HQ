import assert from 'node:assert/strict';
import { espacioMenu } from '../public/js/chat-menu-posicion.js';
let n=0;
for(const [width,height,anchorY,vTop] of [[1440,900,500,0],[390,650,320,0],[390,300,100,0],[390,600,400,200],[800,400,50,0]]) {
 const frame={left:0,top:0,right:width,bottom:height},view={...frame,top:vTop};
 const p=espacioMenu({left:width-100,top:anchorY,bottom:anchorY+40},frame,view);
 assert.ok(p.top>=view.top+8);assert.ok(p.top+p.maxHeight<=height-8);assert.ok(p.left>=8);assert.ok(p.left+p.width<=width-8);n++;
}
console.log(`${n} pruebas de menús dentro de la ventana OK`);
