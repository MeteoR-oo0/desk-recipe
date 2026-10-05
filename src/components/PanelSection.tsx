import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
export function PanelSection({title,children,defaultOpen=false,collapsible=true,hidden=false,guide}:{title:string;children:ReactNode;defaultOpen?:boolean;collapsible?:boolean;hidden?:boolean;guide?:string}) {
  const [open,setOpen]=useState(defaultOpen);
  const [expanded,setExpanded]=useState(defaultOpen);
  const panel=useRef<HTMLDetailsElement>(null),content=useRef<HTMLDivElement>(null),animation=useRef<Animation|null>(null),desired=useRef(defaultOpen);
  useEffect(()=>()=>{if(animation.current){animation.current.onfinish=null;animation.current.cancel();}},[]);
  const toggle=()=>{
    const element=panel.current,body=content.current;if(!element||!body)return;
    const expand=!desired.current,from=element.open?body.getBoundingClientRect().height:0;
    const opacity=element.open?getComputedStyle(body).opacity:"0";
    desired.current=expand;
    setExpanded(expand);
    if(animation.current){animation.current.onfinish=null;animation.current.cancel();animation.current=null;}
    if(!expand&&body.contains(document.activeElement))element.querySelector<HTMLElement>("summary")?.focus({preventScroll:true});
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){element.open=expand;setOpen(expand);body.style.height="";body.style.overflow="";return;}
    element.open=true;setOpen(true);body.style.height=`${from}px`;body.style.overflow="hidden";
    const active=body.animate({height:[`${from}px`,`${expand?body.scrollHeight:0}px`],opacity:[opacity,expand?"1":"0"]},{duration:220,easing:"cubic-bezier(0.2, 0, 0, 1)",fill:"both"});
    animation.current=active;
    active.onfinish=()=>{animation.current=null;active.onfinish=null;element.open=desired.current;setOpen(desired.current);body.style.height="";body.style.overflow="";active.cancel();};
  };
  if(!collapsible) return <section className="form-section" hidden={hidden} data-guide={guide}><h3>{title}</h3>{children}</section>;
  return <details ref={panel} className="settings-section" open={open} hidden={hidden} data-guide={guide} onToggle={event=>{if(!animation.current){desired.current=event.currentTarget.open;setExpanded(event.currentTarget.open);setOpen(event.currentTarget.open);}}}>
    <summary aria-expanded={expanded} onClick={event=>{event.preventDefault();toggle();}}><span>{title}</span><ChevronDown size={16}/></summary><div ref={content} className="settings-section-content"><div className="form-section">{children}</div></div>
  </details>;
}
