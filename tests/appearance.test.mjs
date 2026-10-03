import test from "node:test";
import assert from "node:assert/strict";
import { initialProject } from "../src/types/project.ts";
import { parseProject } from "../src/lib/project.ts";
import { serializeLabel, parseClipboardLabel } from "../src/lib/clipboard.ts";
import { textEffects, frameSettings, frameObstacles, arrowEffects, applyFrameToAll } from "../src/lib/labelAppearance.ts";
import { anchorPoint } from "../src/lib/arrowGeometry.ts";

test("old projects preserve the original shadow and frameless appearance", () => {
  const p = initialProject(), label = p.labels[0];
  assert.equal(textEffects(label).shadowEnabled,true);
  assert.equal(textEffects(label).shadowBlur,5);
  assert.equal(textEffects(label).outlineEnabled,false);
  assert.equal(frameSettings(label).style,"none");
  assert.equal(parseProject(JSON.stringify({project:p,image:"data:image/png;base64,AA=="})).project.adjustment.blur ?? 0,0);
});
test("effects, glass design, rounded corners and photo blur survive save and copy", () => {
  const p = initialProject();
  p.adjustment.blur = 12;
  p.labels[0].textEffects = {shadowEnabled:false,outlineEnabled:true,outlineColor:"#112233",outlineWidth:3};
  p.labels[0].frame = {style:"glass",fillColor:"#ffffff",opacity:0.3,borderColor:"#224466",borderWidth:2,radius:35,blur:18};
  const restored = parseProject(JSON.stringify({project:p,image:"data:image/png;base64,AA=="})).project;
  assert.deepEqual(restored,p);
  assert.deepEqual(parseClipboardLabel(serializeLabel(p.labels[0])),p.labels[0]);
});
test("import rejects invalid appearance and blur settings", () => {
  const p = initialProject();
  for (const patch of [{frame:{style:"unknown"}},{frame:{style:"fill",radius:-1}},{frame:{style:"glass",blur:100}},{frame:{style:"fill",fillColor:"red"}},{textEffects:{shadowEnabled:"yes"}},{textEffects:{outlineWidth:100}},{textEffects:{shadowOpacity:NaN}}]) {
    const label = {...p.labels[0],...patch};
    assert.throws(()=>parseProject(JSON.stringify({project:{...p,labels:[label]},image:"data:image/png;base64,AA=="})));
    assert.equal(parseClipboardLabel(serializeLabel(label)),null);
  }
  assert.throws(()=>parseProject(JSON.stringify({project:{...p,adjustment:{...p.adjustment,blur:-10}},image:"data:image/png;base64,AA=="})));
});
test("arrow obstacles cover other frames while keeping the own border attachment", () => {
  const boxes = [{id:"own",x:100,y:100,width:200,height:60,framePadding:14},{id:"other",x:500,y:100,width:200,height:60,framePadding:16}];
  assert.deepEqual(frameObstacles(boxes,"own"),[{x:100,y:100,width:200,height:60},{x:484,y:84,width:232,height:92}]);
});
test("arrow attachments follow rounded corners rather than floating outside them", () => {
  const box = {x:100,y:100,width:200,height:60,cornerRadius:25};
  assert.deepEqual(anchorPoint(box,{edge:"top",t:0}),{x:86,y:111});
  assert.deepEqual(anchorPoint(box,{edge:"top",t:0.5}),{x:200,y:86});
  assert.deepEqual(anchorPoint(box,{edge:"right",t:0}),{x:289,y:86});
});
test("arrow effects retain compatibility and survive save and copying",()=>{
  const p=initialProject();assert.equal(arrowEffects(p.labels[0]).shadowEnabled,false);
  p.labels[0].arrowEffects={shadowEnabled:true,shadowBlur:12,shadowOffsetY:3,outlineEnabled:true,outlineWidth:2,outlineColor:"#102030"};
  assert.deepEqual(parseProject(JSON.stringify({project:p,image:"data:image/png;base64,AA=="})).project,p);
  assert.deepEqual(parseClipboardLabel(serializeLabel(p.labels[0])).arrowEffects,p.labels[0].arrowEffects);
  assert.equal(parseClipboardLabel(serializeLabel({...p.labels[0],arrowEffects:{shadowBlur:100}})),null);
});
test("bulk frame application changes frame settings and size while preserving label data",()=>{
  const p=initialProject(),before=structuredClone(p.labels);
  const source={...p.labels[0],frame:{style:"glass",radius:30,blur:15,opacity:0.3},boxWidth:420,boxExtraHeight:40};
  const after=applyFrameToAll(p.labels,source);
  after.forEach((label,i)=>{
    assert.deepEqual(label.frame,frameSettings(source));assert.equal(label.boxWidth,420);assert.equal(label.boxExtraHeight,40);
    const {frame,boxWidth,boxExtraHeight,...rest}=label;assert.deepEqual(rest,before[i]);
  });
  assert.deepEqual(p.labels,before);assert.notEqual(after[0].frame,after[1].frame);
});
test("end markers round trip through project files and clipboard while legacy labels keep arrows",()=>{
  for(const end of ["arrow","open-circle","filled-circle","none"]) {
    const p=initialProject();p.labels[0].arrowEnd=end;p.labels[0].arrowEndSize=36;
    assert.equal(parseProject(JSON.stringify({project:p,image:"data:image/png;base64,AA=="})).project.labels[0].arrowEnd,end);
    assert.equal(parseClipboardLabel(serializeLabel(p.labels[0])).arrowEnd,end);
    assert.equal(parseClipboardLabel(serializeLabel(p.labels[0])).arrowEndSize,36);
  }
  assert.equal(parseClipboardLabel(serializeLabel({...initialProject().labels[0],arrowEnd:"invalid"})),null);
  assert.equal(parseClipboardLabel(serializeLabel({...initialProject().labels[0],arrowEndSize:1000})),null);
});
