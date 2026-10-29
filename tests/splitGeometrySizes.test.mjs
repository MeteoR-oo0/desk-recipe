import test from "node:test";
import assert from "node:assert/strict";
import { splitGeometry } from "../src/lib/splitImage.ts";

// Independent reconstruction check: when the preview gap has the chosen ratio
// to a saved tile, all visible source coordinates must share one global affine
// mapping, even when the saved tile width has to be rounded to a whole pixel.
test("saved 2/3/4-column layouts align under one global transform across aspect ratios and odd sizes", () => {
  const dimensions = [[1920,1080],[1600,1200],[1080,1920],[1200,1200],[1001,667],[1919,1279],[3841,2161],[853,1517],[101,100],[12000,7999]];
  for (const [width,height] of dimensions) for (const count of [2,3,4]) for (const gapPercent of [0,0.1,1.5,3.7,6]) {
    const geometry=splitGeometry(width,{count,gapPercent,showGuides:true});
    const rasterWidth=Math.max(1,Math.round(geometry.tileWidth)), displayGap=rasterWidth*gapPercent/100, horizontalScale=rasterWidth/geometry.tileWidth;
    assert.ok(Math.abs(rasterWidth-geometry.tileWidth)<=0.5);
    assert.ok(Math.abs(count*rasterWidth+(count-1)*displayGap-width*horizontalScale)<1e-7);
    for (const [index,slice] of geometry.slices.entries()) {
      for (const fraction of [0,0.125,0.5,0.875,1]) {
        const sourceX=slice.x+fraction*slice.width;
        const reconstructedX=index*(rasterWidth+displayGap)+fraction*rasterWidth;
        assert.ok(Math.abs(reconstructedX-sourceX*horizontalScale)<1e-7, `${width}×${height}, ${count} slices, ${gapPercent}%`);
        // A diagonal marker must have the same slope/intercept in every tile.
        const markerY=height*(0.2+0.6*sourceX/width);
        const expectedY=height*(0.2+0.6*reconstructedX/(width*horizontalScale));
        assert.ok(Math.abs(markerY-expectedY)<1e-7);
      }
    }
  }
});

test("guide omission strips scale with the actual decoded export width, independent of canvas and display size", () => {
  for (const documentWidth of [1001,1200,1567]) for (const rasterWidth of [853,1080,1919,1920,3841]) for (const count of [2,3,4]) {
    const settings={count,gapPercent:1.5,showGuides:true};
    const document=splitGeometry(documentWidth,settings),raster=splitGeometry(rasterWidth,settings);
    for (let i=0;i<count-1;i++) {
      assert.ok(Math.abs(document.seams[i].x/documentWidth-raster.seams[i].x/rasterWidth)<1e-12);
      assert.ok(Math.abs(document.seams[i].width/documentWidth-raster.seams[i].width/rasterWidth)<1e-12);
      assert.ok(Math.abs(document.seams[i].center/documentWidth-raster.seams[i].center/rasterWidth)<1e-12);
    }
  }
});
