import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
export function PanelSection({title,children,defaultOpen=false,collapsible=true,hidden=false,guide}:{title:string;children:ReactNode;defaultOpen?:boolean;collapsible?:boolean;hidden?:boolean;guide?:string}) {
  const [open,setOpen]=useState(defaultOpen);
  if(!collapsible) return <section className="form-section" hidden={hidden} data-guide={guide}><h3>{title}</h3>{children}</section>;
  return <details className="settings-section" open={open} hidden={hidden} data-guide={guide} onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary><span>{title}</span><ChevronDown size={16}/></summary><div className="form-section">{children}</div>
  </details>;
}
