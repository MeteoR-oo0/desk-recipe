import { initialProject, type ProjectData } from "../types/project.ts";
export function resetProject(current: ProjectData, sample: boolean): ProjectData {
  const initial=initialProject();
  return sample?initial:{...initial,photo:current.photo,background:current.background,labels:[],canvas:{width:current.canvas.width,height:Math.round(current.canvas.width*current.photo.height/current.photo.width),aspectRatio:"Original"}};
}
