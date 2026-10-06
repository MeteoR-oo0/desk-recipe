import test from "node:test";
import assert from "node:assert/strict";
import { imageFromTransfer, transferHasFiles, readClipboardImage } from "../src/lib/imageImport.ts";
import { placeLabelImage } from "../src/lib/labelMedia.ts";
import { previousLabelStyle } from "../src/lib/newLabelStyle.ts";
import { makeLabel } from "../src/types/project.ts";

test("file drops and image pastes extract the first supported image without fetching text URLs",()=>{
  const png=new File(["png"],"photo.png",{type:"image/png"}), json=new File(["{}"],"project.json",{type:"application/json"});
  assert.equal(imageFromTransfer({files:[json,png],items:[]}),png);
  assert.equal(imageFromTransfer({files:[],items:[{kind:"file",type:"image/png",getAsFile:()=>png}]}),png);
  assert.equal(imageFromTransfer({files:[],items:[{kind:"string",type:"text/html",getAsFile:()=>{throw Error("Do not read text");}}]}),null);
  assert.equal(imageFromTransfer(null),null);
  assert.equal(transferHasFiles({types:["Files"],items:[]}),true);
  assert.equal(transferHasFiles({types:["text/plain"],items:[]}),false);
});
test("clipboard button reads image blobs, retains their MIME type and handles missing or denied data",async()=>{
  const source=new Blob(["image pixels"],{type:"image/png"});
  const file=await readClipboardImage(async()=>[{types:["text/plain","image/png"],getType:async type=>{assert.equal(type,"image/png");return source;}}]);
  assert.equal(file.type,"image/png");assert.equal(file.name,"clipboard-image.png");assert.equal(await file.text(),await source.text());
  assert.equal(await readClipboardImage(async()=>[{types:["text/plain"],getType:()=>{throw Error("Do not read text");}}]),null);
  await assert.rejects(readClipboardImage(async()=>{throw Error("Denied");}),/Denied/);
});
test("replacing an imported label image preserves placement, size, opacity and shadow",()=>{
  const original=makeLabel(100,300),added={src:"data:image/png;base64,AA==",name:"new.png",naturalWidth:160,naturalHeight:80,x:0,y:0,width:160,opacity:1};
  const placed=placeLabelImage(original,added,false);assert.equal(placed.y,-92);
  original.image={...placed,x:50,y:-130,width:220,opacity:0.5,shadow:{shadowEnabled:true,shadowBlur:8}};
  const replacement=placeLabelImage(original,{...added,naturalWidth:200,naturalHeight:200},false);
  assert.equal(replacement.x,50);assert.equal(replacement.y,-130);assert.equal(replacement.width,220);assert.equal(replacement.opacity,0.5);assert.deepEqual(replacement.shadow,original.image.shadow);
  assert.equal(replacement.naturalWidth,200);assert.equal(original.image.naturalWidth,160);
});
test("new labels inherit text and frame appearance while retaining new contents, IDs and positions",()=>{
  const previous={...makeLabel(100,200),category:"PC",description:"Old details",fontFamily:"Montserrat",fontWeight:500,fontSizeCategory:24,fontSizeDescription:22,textColor:"#123456",boxWidth:440,boxExtraHeight:60,
    textEffects:{shadowEnabled:true,outlineEnabled:true,outlineWidth:2},frame:{style:"glass",radius:28,opacity:0.6,blur:12},image:{src:"old image"}};
  const next={...makeLabel(300,400),...previousLabelStyle(previous)};
  assert.notEqual(next.id,previous.id);assert.equal(next.x,300);assert.equal(next.y,400);assert.equal(next.productName,"Product Name");assert.equal(next.category,undefined);assert.equal(next.image,undefined);assert.equal(next.description,undefined);
  assert.equal(next.fontFamily,"Montserrat");assert.equal(next.fontSizeCategory,24);assert.equal(next.boxWidth,440);assert.equal(next.frame.radius,28);assert.equal(next.textEffects.outlineWidth,2);
  next.frame.radius=10;next.textEffects.outlineWidth=4;assert.equal(previous.frame.radius,28);assert.equal(previous.textEffects.outlineWidth,2);
  assert.deepEqual(previousLabelStyle(),{});
});
