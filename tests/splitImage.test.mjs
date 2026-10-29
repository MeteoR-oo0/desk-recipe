import test from "node:test";
import assert from "node:assert/strict";
import {splitGeometry,validSplit,splitSettings,crossesSplit} from "../src/lib/splitImage.ts";
import {initialProject} from "../src/types/project.ts";
import {parseProject} from "../src/lib/project.ts";
test("2/3/4 slices have equal visible spans and account for every omitted seam",()=>{
  for(const width of [100,1200,1567,1920,12000])for(const count of [2,3,4])for(const gapPercent of [0,1.5,6]) {
    const g=splitGeometry(width,{count,gapPercent,showGuides:true});
    assert.equal(g.slices.length,count);assert.equal(g.seams.length,count-1);
    assert.ok(Math.abs(g.tileWidth*count+g.gap*(count-1)-width)<1e-8);
    assert.equal(g.slices[0].x,0);assert.ok(Math.abs(g.slices.at(-1).x+g.tileWidth-width)<1e-8);
    for(let i=0;i<count-1;i++) {assert.ok(Math.abs(g.slices[i+1].x-(g.slices[i].x+g.tileWidth)-g.gap)<1e-8);assert.ok(Math.abs(g.seams[i].center-(g.slices[i].x+g.tileWidth+g.gap/2))<1e-8);}
  }
});
test("gap correction scales with resolution while hiding guides preserves output geometry",()=>{
  const a=splitGeometry(1200,{count:3,gapPercent:1.5,showGuides:true}),b=splitGeometry(1920,{count:3,gapPercent:1.5,showGuides:false});
  assert.ok(Math.abs(b.gap/a.gap-1.6)<1e-10);assert.ok(Math.abs(b.tileWidth/a.tileWidth-1.6)<1e-10);
  const whole=splitGeometry(1920,{count:1,gapPercent:6,showGuides:true});assert.equal(whole.tileWidth,1920);assert.equal(whole.gap,0);assert.deepEqual(whole.seams,[]);
});
test("warnings cover a cut even without compensation and ignore fully off-canvas labels",()=>{
  const s={count:2,gapPercent:0,showGuides:true};
  assert.equal(crossesSplit({x:490,y:30,width:30,height:40},1000,800,s),true);
  assert.equal(crossesSplit({x:400,y:30,width:100,height:40},1000,800,s),false);
  assert.equal(crossesSplit({x:490,y:810,width:30,height:40},1000,800,s),false);
});
test("split settings survive project files and legacy projects remain compatible",()=>{
  const p=initialProject();assert.equal(splitSettings(p.exportSplit).count,1);
  p.exportSplit={count:4,gapPercent:1.5,showGuides:false};
  assert.deepEqual(parseProject(JSON.stringify({project:p,image:"data:image/png;base64,AA=="})).project.exportSplit,p.exportSplit);
  for(const invalid of [{...p.exportSplit,count:5},{...p.exportSplit,gapPercent:-1},{...p.exportSplit,gapPercent:7},{...p.exportSplit,gapPercent:"1.5"},{...p.exportSplit,showGuides:1},null]) {
    assert.equal(validSplit(invalid),false);
    assert.throws(()=>parseProject(JSON.stringify({project:{...p,exportSplit:invalid},image:"data:image/png;base64,AA=="})));
  }
});
