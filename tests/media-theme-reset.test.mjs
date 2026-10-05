import test from "node:test";
import assert from "node:assert/strict";
import { initialProject } from "../src/types/project.ts";
import { parseProject } from "../src/lib/project.ts";
import { serializeLabel, parseClipboardLabel } from "../src/lib/clipboard.ts";
import { validLabelMedia, imageHeight } from "../src/lib/labelMedia.ts";
import { fontStack } from "../src/lib/labelLayout.ts";
import { parseTheme } from "../src/lib/theme.ts";
import { resetProject } from "../src/lib/resetProject.ts";
const picture={src:"data:image/png;base64,AA==",name:"image.png",naturalWidth:320,naturalHeight:200,x:-25,y:-150,width:180,opacity:0.6,shadow:{shadowEnabled:true,shadowBlur:10,shadowOffsetY:4}};
test("label images, multiline descriptions and font weight survive project save and copying",()=>{
  const project=initialProject();Object.assign(project.labels[0],{image:picture,description:"説明の1行目\nSecond line",fontSizeDescription:22,fontWeight:500});
  assert.deepEqual(parseProject(JSON.stringify({project,image:"data:image/png;base64,AA=="})).project,project);
  assert.deepEqual(parseClipboardLabel(serializeLabel(project.labels[0])),project.labels[0]);
  assert.equal(imageHeight(picture),112.5);
});
test("imports reject remote image sources and invalid media settings while old labels remain valid",()=>{
  const label=initialProject().labels[0];assert.equal(validLabelMedia(label),true);
  for(const changes of [{description:"a".repeat(1501)},{fontWeight:550},{fontSizeDescription:0},
    ...[{src:"https://example.com/image.png"},{width:0},{opacity:2},{naturalWidth:0},{x:Infinity},{shadow:{shadowBlur:-2}}].map(change=>({image:{...picture,...change}}))]) {
    const changed={...label,...changes};assert.equal(validLabelMedia(changed),false);assert.equal(parseClipboardLabel(serializeLabel(changed)),null);
    assert.throws(()=>parseProject(JSON.stringify({project:{...initialProject(),labels:[changed]},image:"data:image/png;base64,AA=="})));
  }
});
test("Inter and Montserrat explicitly use Noto Sans JP for Japanese",()=>{
  assert.equal(fontStack("Inter"),'"Inter", "Noto Sans JP", sans-serif');
  assert.equal(fontStack("Montserrat"),'"Montserrat", "Noto Sans JP", sans-serif');
  assert.match(fontStack("Zen Maru Gothic"),/Zen Maru Gothic/);
});
test("appearance settings validate stored values and retain both mode and main color",()=>{
  assert.deepEqual(parseTheme('{"mode":"dark","color":"purple"}'),{mode:"dark",color:"purple"});
  assert.deepEqual(parseTheme('{"mode":"system","color":"blue"}'),{mode:"system",color:"blue"});
  for(const value of [null,"broken",'{"mode":"invalid","color":"blue"}', '{"mode":"dark","color":"invalid"}']) assert.deepEqual(parseTheme(value),{mode:"light",color:"green"});
});
test("reset retains the chosen photo when requested and restores sample data otherwise",()=>{
  const current=initialProject();current.photo={...current.photo,id:"custom",name:"photo.png",width:1200,height:1600};current.adjustment.overlay=35;current.labels[0].image=picture;
  const keep=resetProject(current,false);assert.equal(keep.photo,current.photo);assert.deepEqual(keep.labels,[]);assert.equal(keep.canvas.height,1600);assert.equal(keep.adjustment.overlay,0);assert.equal(keep.numberStyle,"none");
  const sample=resetProject(current,true);assert.equal(sample.photo.id,"sample-user-photo");assert.equal(sample.labels.length,4);assert.equal(current.labels.length,4);assert.equal(current.labels[0].image,picture);
});
