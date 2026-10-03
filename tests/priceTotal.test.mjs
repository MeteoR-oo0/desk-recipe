import test from "node:test";
import assert from "node:assert/strict";
import { parseYenCents, priceTotal } from "../src/lib/priceTotal.ts";

test("yen totals accept input formats and full-width characters", () => {
  for (const price of ["¥19,800", "￥１９，８００", "19,800円", "19800", " 19 800 円 "])
    assert.equal(parseYenCents(price), 1980000);
});
test("ambiguous text, foreign currencies and malformed amounts are excluded", () => {
  for (const price of ["", "約2万円", "$100", "10〜20円", "1,2", "-100", "1.234", "Infinity", "999999999999999999999"])
    assert.equal(parseYenCents(price), null);
});
test("totals include hidden prices, handle decimals exactly and report exclusions", () => {
  assert.deepEqual(priceTotal([{price:"¥19,800", showPrice:false}, {price:"200円", showPrice:true}, {price:"0.10"}, {price:"0.20"}, {price:"未定"}]), { total:20000.3, included:4, excluded:1 });
  assert.deepEqual(priceTotal([]), {total:0, included:0, excluded:0});
});
