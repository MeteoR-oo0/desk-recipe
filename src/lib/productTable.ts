import type {ProjectData} from "../types/project";
import type {Translation} from "./i18n";
import {priceTotal,parseYenCents} from "./priceTotal.ts";
import {formatLabelNumber} from "./labelOrder.ts";
import {tableAppearance,type TableAppearance} from "./theme.ts";
export function tableRows(p:ProjectData) {
  return p.labels.map((l,i)=>({number:formatLabelNumber(i+1,p.numberStyle),category:l.category??"",brand:l.brand,name:l.productName,price:parseYenCents(l.price)===null?l.price:"¥"+(parseYenCents(l.price)!/100).toLocaleString("ja-JP",{maximumFractionDigits:2})}));
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
export async function drawProductTable(p:ProjectData,t:Translation,showPrices=p.tableShowPrices!==false,colors:TableAppearance=tableAppearance()) {
  const table=tableRows(p), showTotal=p.showTotalPrice!==false, numbered=(p.numberStyle??"none")!=="none";
  await Promise.all([document.fonts.load('400 28px "Noto Sans JP"',t.app+table.map(r=>r.number+r.category+r.brand+r.name+r.price).join("")),document.fonts.load('700 48px "Noto Sans JP"',t.tableTitle+t.labelNumber+t.category+t.brand+t.productName+t.price+t.totalPrice+table.map(r=>r.name).join("")),document.fonts.ready]).catch(()=>{});
  const canvas=document.createElement("canvas");canvas.width=1600;
  let ctx=canvas.getContext("2d")!;
  const font='28px "Noto Sans JP", Inter, sans-serif',bold='700 28px "Noto Sans JP", Inter, sans-serif';
  const brandWidth=showPrices?256:320,categoryWidth=showPrices?224:256,numberWidth=numbered?128:0;
  const columns:{key:"number"|"category"|"brand"|"name"|"price";width:number;title:string;left:number}[]=[];
  let left=64;
  const add=(key:"number"|"category"|"brand"|"name"|"price",width:number,title:string)=>{columns.push({key,width,title,left});left+=width;};
  if(numbered)add("number",numberWidth,t.labelNumber);
  add("category",categoryWidth,t.category);add("brand",brandWidth,t.brand);add("name",1472-numberWidth-categoryWidth-brandWidth-(showPrices?256:0),t.productName);
  if(showPrices)add("price",256,t.price);
  const rows=table.map(row=>{const cells=columns.map(col=>{ctx.font=col.key==="name"?bold:font;return wrapTableText(row[col.key],col.width-40,s=>ctx.measureText(s).width);});return {cells,height:Math.max(80,Math.max(...cells.map(c=>c.length))*42+32)};});
  const {total,excluded}=priceTotal(p.labels);
  const height=214+rows.reduce((sum,r)=>sum+r.height,0)+(showTotal?96:0)+(showTotal&&excluded?70:0)+48;
  if(height>30000 || height*1600>45000000)throw Error("Table exceeds image limits");
  canvas.height=height;ctx=canvas.getContext("2d")!;
  ctx.fillStyle=colors.background;ctx.fillRect(0,0,1600,height);
  ctx.fillStyle=colors.accentText;ctx.font='700 48px "Noto Sans JP", Inter, sans-serif';ctx.fillText(t.tableTitle,64,95);
  ctx.fillStyle=colors.muted;ctx.font='22px "Noto Sans JP", Inter, sans-serif';ctx.fillText(t.app,64,130);
  ctx.fillStyle=colors.accent;ctx.fillRect(64,150,1472,64);
  ctx.fillStyle="#ffffff";ctx.font=bold;columns.forEach(col=>ctx.fillText(col.title,col.left+20,193));
  let y=214;
  rows.forEach((row,index)=>{
    ctx.fillStyle=index%2===0?colors.row:colors.background;ctx.fillRect(64,y,1472,row.height);
    row.cells.forEach((lines,i)=>{const col=columns[i];ctx.font=col.key==="name"?bold:font;ctx.fillStyle=colors.text;ctx.textAlign=col.key==="price"?"right":"left";lines.forEach((s,n)=>ctx.fillText(s,col.key==="price"?col.left+col.width-20:col.left+20,y+43+n*42));});
    ctx.strokeStyle=colors.border;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(64,y+row.height);ctx.lineTo(1536,y+row.height);ctx.stroke();y+=row.height;
  });
  if(showTotal){ctx.fillStyle=colors.accentSoft;ctx.fillRect(64,y,1472,96);ctx.fillStyle=colors.accentText;ctx.font='700 36px "Noto Sans JP", Inter, sans-serif';ctx.textAlign="left";ctx.fillText(t.totalPrice,88,y+62);ctx.textAlign="right";ctx.fillText("¥"+total.toLocaleString("ja-JP",{maximumFractionDigits:2}),1512,y+62);y+=96;}
  ctx.textAlign="left";
  if(showTotal&&excluded){ctx.font='22px "Noto Sans JP", Inter, sans-serif';ctx.fillStyle=colors.muted;ctx.fillText(t.tableExcluded.replace("{count}",String(excluded)),64,y+42);}
  return canvas;
}
export function tableBlob(canvas:HTMLCanvasElement,format:"png"|"jpeg") {
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Table export failed")),format==="png"?"image/png":"image/jpeg",0.95));
}
