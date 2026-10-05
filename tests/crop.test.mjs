import test from "node:test";
import assert from "node:assert/strict";
import {croppedProject,validCrop} from "../src/lib/crop.ts";
import {initialProject} from "../src/types/project.ts";
import {parseProject} from "../src/lib/project.ts";
import {validCanvasBackground} from "../src/lib/canvasBackground.ts";
import {parseTheme} from "../src/lib/theme.ts";
test("crop translates labels, arrows and loop centers without changing their styling or data",()=>{
  const p=initialProject();p.labels[0].loopPosition={x:200,y:300};p.labels[0].description="Description";
  const rect={x:100,y:80,width:600,height:400},bg={mode:"color",color:"#223344",blur:20};
  const next=croppedProject(p,rect,bg);
  assert.deepEqual(next.canvas,{width:600,height:400,aspectRatio:"Custom"});
  assert.equal(next.labels[0].x,p.labels[0].x-100);assert.equal(next.labels[0].arrowTargetY,p.labels[0].arrowTargetY-80);assert.deepEqual(next.labels[0].loopPosition,{x:100,y:220});
  assert.equal(next.labels[0].fontSizeProduct,p.labels[0].fontSizeProduct);assert.equal(next.labels[0].description,"Description");assert.equal(p.canvas.width,1200);
  assert.deepEqual(parseProject(JSON.stringify({project:next,image:"data:image/png;base64,AA=="})).project,next);
});
test("extending the canvas retains blur background settings through project files",()=>{
  const p=initialProject(),bg={mode:"blur",color:"#ffffff",blur:32,image:"data:image/jpeg;base64,AA=="};
  const next=croppedProject(p,{x:-200,y:-150,width:1600,height:1100},bg);
  assert.equal(next.labels[0].x,p.labels[0].x+200);assert.equal(next.labels[0].y,p.labels[0].y+150);
  assert.deepEqual(parseProject(JSON.stringify({project:next,image:"data:image/png;base64,AA=="})).project.background,bg);
  assert.equal(validCanvasBackground({mode:"blur",color:"#ffffff",blur:20}),false);
  assert.equal(validCanvasBackground({...bg,image:"https://example.com/image.jpg"}),false);
  assert.equal(validCanvasBackground({...bg,blur:100}),false);
  assert.equal(validCanvasBackground({mode:"transparent",color:"#ffffff",blur:20}),true);
});
test("invalid crop frames are rejected and default theme follows the device",()=>{
  assert.equal(validCrop({x:0,y:0,width:0,height:100}),false);assert.equal(validCrop({x:NaN,y:0,width:100,height:100}),false);
  assert.equal(validCrop({x:-200,y:-200,width:1600,height:1100}),true);
  assert.deepEqual(parseTheme(null),{mode:"system",color:"green"});assert.deepEqual(parseTheme('{"mode":"light","color":"blue"}'),{mode:"light",color:"blue"});
});
