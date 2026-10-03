import test from "node:test";
import assert from "node:assert/strict";
import {moveLabel,numberedBrand,formatLabelNumber} from "../src/lib/labelOrder.ts";
import {tableRows,wrapTableText} from "../src/lib/productTable.ts";
import {initialProject} from "../src/types/project.ts";
import {parseProject} from "../src/lib/project.ts";
import {serializeLabel,parseClipboardLabel} from "../src/lib/clipboard.ts";
test("moving a label changes order without changing IDs, custom numbers or input data",()=>{
  const labels=[{id:"a",labelNumber:"09",price:"100"},{id:"b",labelNumber:"02",price:"200"},{id:"c",price:"300"}];
  const moved=moveLabel(labels,"a",2);
  assert.deepEqual(moved.map(l=>l.id),["b","c","a"]);
  assert.equal(moved[2],labels[0]);assert.equal(labels[0].id,"a");
  assert.equal(moveLabel(labels,"missing",0),labels);
  assert.equal(moveLabel(labels,"b",1),labels);
});
test("custom numbers and hidden total setting survive JSON and label copying",()=>{
  const p=initialProject();p.showTotalPrice=false;p.labels[0].labelNumber="0042";
  assert.deepEqual(parseProject(JSON.stringify({project:p,image:"data:image/png;base64,AA=="})).project,p);
  assert.equal(parseClipboardLabel(serializeLabel(p.labels[0])).labelNumber,"0042");
  assert.equal(numberedBrand(p.labels[0]),"0042 MY WORKSPACE");
  assert.throws(()=>parseProject(JSON.stringify({project:{...p,labels:[{...p.labels[0],labelNumber:"bad"}]},image:"data:image/png;base64,AA=="})));
});
test("table rows derive numbering from current order and preserve prices hidden on the photo",()=>{
  const p=initialProject();p.numberStyle="dot";p.labels[0].labelNumber="99";p.labels[0].price="￥１９，８００";
  const rows=tableRows(p);assert.equal(rows[0].number,"1.");assert.equal(rows[0].price,"¥19,800");assert.equal(rows[0].name,p.labels[0].productName);
  assert.equal(rows[1].number,"2.");
});
test("long table text wraps without losing characters or explicit line breaks",()=>{
  const text="長い製品名ABC\n２行目";
  const lines=wrapTableText(text,3,s=>Array.from(s).length);
  assert.equal(lines.join(""),text.replace("\n",""));assert.ok(lines.every(s=>Array.from(s).length<=3));
});

test("number styles automatically follow the current order",()=>{
  assert.equal(formatLabelNumber(1),"");
  assert.equal(initialProject().numberStyle,"none");
  assert.equal(formatLabelNumber(1,"plain"),"1");
  assert.equal(formatLabelNumber(2,"dot"),"2.");
  assert.equal(formatLabelNumber(3,"paren"),"3)");
  assert.equal(formatLabelNumber(1,"circle"),"①");
  assert.equal(formatLabelNumber(20,"circle"),"⑳");
  assert.equal(formatLabelNumber(21,"circle"),"㉑");
  assert.equal(formatLabelNumber(50,"circle"),"㊿");
  assert.equal(formatLabelNumber(1,"none"),"");
  const p=initialProject();p.numberStyle="circle";p.labels=[...moveLabel(p.labels,"keyboard",0)];
  const rows=tableRows(p);assert.equal(rows[0].name,"Mechanical Keyboard");assert.equal(rows[0].number,"①");assert.equal(rows[1].number,"②");
});
test("number style and table price visibility are retained without changing price data",()=>{
  const p=initialProject();p.numberStyle="circle";p.tableShowPrices=false;
  const restored=parseProject(JSON.stringify({project:p,image:"data:image/png;base64,AA=="})).project;
  assert.equal(restored.numberStyle,"circle");assert.equal(restored.tableShowPrices,false);assert.deepEqual(restored.labels,p.labels);
});