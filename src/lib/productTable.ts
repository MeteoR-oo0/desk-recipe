import type {ProjectData} from "../types/project";
import type {Translation} from "./i18n";
import {priceTotal,parseYenCents} from "./priceTotal.ts";
export function tableRows(p:ProjectData) {
  return p.labels.map((l,i)=>({number:l.labelNumber||String(i+1),brand:l.brand,name:l.productName,price:parseYenCents(l.price)===null?l.price:"¥"+(parseYenCents(l.price)!/100).toLocaleString("ja-JP",{maximumFractionDigits:2})}));
}
export function wrapTableText(text:string,maxWidth:number,measure:(s:string)=>number) {
  const lines:string[]=[];
  for(const paragraph of text.split(/\r?\n/)) {
    let line="";
    for(const c of Array.from(paragraph)) {if(line && measure(line+c)>maxWidth){lines.push(line);line=c;}else line+=c;}
    lines.push(line);
  }
  return lines;
}
export async function drawProductTable(p:ProjectData,t:Translation,showTotal=true) {
  await Promise.all([document.fonts.load('400 28px "Noto Sans JP"',t.app+p.labels.map(l=>l.brand+l.productName+l.price).join("")),document.fonts.load('700 48px "Noto Sans JP"',t.tableTitle+t.labelNumber+t.brand+t.productName+t.price+t.totalPrice+p.labels.map(l=>l.productName).join("")),document.fonts.ready]).catch(()=>{});
  const canvas=document.createElement("canvas");canvas.width=1600;
  let ctx=canvas.getContext("2d")!;
  const font='28px "Noto Sans JP", Inter, sans-serif', bold='700 28px "Noto Sans JP", Inter, sans-serif';
  ctx.font=font;
  const widths=[128,288,768,288],starts=[64,192,480,1248],lineHeight=42;
  const rows=tableRows(p).map(row=>{const cells=[row.number,row.brand,row.name,row.price].map((v,i)=>{ctx.font=i===2?bold:font;return wrapTableText(v,widths[i]-40,s=>ctx.measureText(s).width);});return {cells,height:Math.max(80,Math.max(...cells.map(c=>c.length))*lineHeight+32)};});
  const {total,excluded}=priceTotal(p.labels);
  const height=214+rows.reduce((sum,r)=>sum+r.height,0)+(showTotal?96:0)+(excluded?70:0)+90;
  if(height>30000 || height*1600>45000000) throw Error("Table exceeds image limits");
  canvas.height=height;ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,1600,height);
  ctx.fillStyle="#294f3d";ctx.font='700 48px "Noto Sans JP", Inter, sans-serif';ctx.fillText(t.tableTitle,64,95);
  ctx.fillStyle="#73887c";ctx.font='22px "Noto Sans JP", Inter, sans-serif';ctx.fillText(t.app,64,130);
  ctx.fillStyle="#377460";ctx.fillRect(64,150,1472,64);
  ctx.fillStyle="#ffffff";ctx.font=bold;[t.labelNumber,t.brand,t.productName,t.price].forEach((v,i)=>ctx.fillText(v,starts[i]+20,193));
  let y=214;
  for(const row of rows) {
    ctx.fillStyle=(y===214||rows.indexOf(row)%2===0)?"#f3f7f4":"#ffffff";ctx.fillRect(64,y,1472,row.height);
    row.cells.forEach((lines,i)=>{ctx.font=i===2?bold:font;ctx.fillStyle="#314e3d";ctx.textAlign=i===3?"right":"left";lines.forEach((s,n)=>ctx.fillText(s,i===3?1536-20:starts[i]+20,y+43+n*lineHeight));});
    ctx.strokeStyle="#dfe8e2";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(64,y+row.height);ctx.lineTo(1536,y+row.height);ctx.stroke();y+=row.height;
  }
  if(showTotal) {ctx.fillStyle="#e6f2e9";ctx.fillRect(64,y,1472,96);ctx.fillStyle="#28533d";ctx.font='700 36px "Noto Sans JP", Inter, sans-serif';ctx.textAlign="left";ctx.fillText(t.totalPrice,88,y+62);ctx.textAlign="right";ctx.fillText("¥"+total.toLocaleString("ja-JP",{maximumFractionDigits:2}),1512,y+62);y+=96;}
  ctx.textAlign="left";
  if(excluded){ctx.font='22px "Noto Sans JP", Inter, sans-serif';ctx.fillStyle="#806b4c";ctx.fillText(t.tableExcluded.replace("{count}",String(excluded)),64,y+42);y+=70;}
  ctx.font='20px "Noto Sans JP", Inter, sans-serif';ctx.fillStyle="#81968a";ctx.fillText("DESK RECIPE STUDIO",64,y+52);
  return canvas;
}
export function tableBlob(canvas:HTMLCanvasElement,format:"png"|"jpeg") {
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Table export failed")),format==="png"?"image/png":"image/jpeg",0.95));
}
