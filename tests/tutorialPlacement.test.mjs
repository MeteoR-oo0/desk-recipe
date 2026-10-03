import test from "node:test";
import assert from "node:assert/strict";
import {placeTutorial} from "../src/lib/tutorialPlacement.ts";
test("mobile guide sits beside the target without covering it",()=>{
  const target={left:18,top:500,width:354,height:70},card={width:300,height:180};
  const p=placeTutorial(target,card,{width:390,height:844});
  assert.equal(target.top-(p.top+card.height),14);
  assert.ok(p.left>=12 && p.left+card.width<=378);
});
test("desktop guide is adjacent to the sidebar target",()=>{
  const target={left:20,top:175,width:196,height:120},card={width:340,height:200};
  const p=placeTutorial(target,card,{width:1280,height:720});
  assert.equal(p.left-target.left-target.width,14);
});
test("header targets place the guide below and keep it inside the viewport",()=>{
  const target={left:240,top:8,width:68,height:42},card={width:296,height:180};
  const p=placeTutorial(target,card,{width:320,height:568});
  assert.equal(p.top-target.top-target.height,14);
  assert.ok(p.left>=12 && p.left+card.width<=308);
});
test("large canvas targets and missing targets keep the guide onscreen",()=>{
  for(const target of [{left:0,top:106,width:390,height:600},null]) {
    const p=placeTutorial(target,{width:300,height:180},{width:390,height:844});
    assert.ok(p.left>=12 && p.top>=12 && p.left+300<=378 && p.top+180<=832);
  }
});
