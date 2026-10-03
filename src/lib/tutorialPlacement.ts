export type GuideRect = { left:number;top:number;width:number;height:number };
export function placeTutorial(target: GuideRect | null, card: {width:number;height:number}, viewport: {width:number;height:number}) {
  const margin=12, gap=14;
  const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(Math.max(min,max),n));
  const maxLeft=viewport.width-card.width-margin, maxTop=viewport.height-card.height-margin;
  if (!target) return {left:clamp(viewport.width-card.width-margin,margin,maxLeft),top:clamp(80,margin,maxTop)};
  const cx=target.left+target.width/2, cy=target.top+target.height/2;
  const candidates={
    above:{left:clamp(cx-card.width/2,margin,maxLeft),top:target.top-card.height-gap},
    below:{left:clamp(cx-card.width/2,margin,maxLeft),top:target.top+target.height+gap},
    right:{left:target.left+target.width+gap,top:clamp(cy-card.height/2,margin,maxTop)},
    left:{left:target.left-card.width-gap,top:clamp(cy-card.height/2,margin,maxTop)},
  };
  const order=viewport.width<=800 ? ["above","below","right","left"] as const : ["right","left","below","above"] as const;
  for(const side of order) {
    const p=candidates[side];
    if(p.left>=margin && p.top>=margin && p.left<=maxLeft && p.top<=maxTop) return p;
  }
  // A canvas can occupy almost the entire viewport. Keep the guide beside
  // its upper edge in that case instead of covering the header or leaving the screen.
  return {left:clamp(target.left+gap,margin,maxLeft),top:clamp(target.top+gap,margin,maxTop)};
}
