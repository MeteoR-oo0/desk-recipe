import type {ProjectData} from "../types/project";
import {crossesSplit,splitSettings} from "./splitImage";
import {labelLayout,formatPrice} from "./labelLayout";
import {formatLabelNumber} from "./labelOrder";
export function splitWarnings(p:ProjectData) {
  const settings=splitSettings(p.exportSplit);
  if(settings.count===1)return [];
  return p.labels.filter((label,index)=>{
    if(label.hidden)return false;
    const layout=labelLayout({...label,labelNumber:formatLabelNumber(index+1,p.numberStyle),price:formatPrice(label.price,p.priceFormat)},p.priceMode==="show"||(p.priceMode==="individual"&&label.showPrice));
    const pad=label.frame&&label.frame.style!=="none"?14:0;
    const boxes=[{x:label.x-pad,y:label.y-pad,width:layout.width+pad*2,height:layout.height+pad*2}];
    if(label.image)boxes.push({x:label.x+label.image.x,y:label.y+label.image.y,width:label.image.width,height:label.image.width*label.image.naturalHeight/label.image.naturalWidth});
    return boxes.some(box=>crossesSplit(box,p.canvas.width,p.canvas.height,settings));
  });
}
