import { initialProject, type ProjectData } from "../types/project.ts";
export function resetProject(current: ProjectData, sample: boolean): ProjectData {
  const initial=initialProject();
  return sample?initial:{...initial,photo:current.photo,labels:[],canvas:{width:1200,height:Math.round(1200*current.photo.height/current.photo.width),aspectRatio:"Original"}};
}
