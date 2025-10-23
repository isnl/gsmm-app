import { defineStore } from "pinia";
import { ref } from "vue";
import { UniStorage } from "./storage";

export interface Coordinate {
  x: number;
  y: number;
}
export interface Multimedia {
  id: number;
  url: string;
  path: string;
  type: string;
  createdAt: string;
  updatedAt: string | null;

  tempFilePath?: string;
  fileType?: string;
  size?: number;
  thumbTempFilePath?: string;
}

export interface PlantTask {
  id?: number;
  //   createdAt: string;
  //   updatedAt: string | null;
  //   createdBy: number | null;
  //   updatedBy: number | null;
  treeSpecies: string;
  treeCode: string;
  areaName: string | null;
  areaCode: string | null;
  planDate: string | null;
  finishDate: string | null;
  isOverdue: string | null;
  fromLocation: Coordinate;
  toLocation: Coordinate;
  status: string | null;
  taskConfigNodeProgress?: any;
}

export const usePlantTaskListStore = defineStore(
  "plantTask_list",
  () => {
    const plantTaskList = ref<PlantTask[]>([]);

    const setplantTaskList = (list: PlantTask[]) => {
      console.log(list);
      plantTaskList.value = Array.isArray(list) ? list : [];
      console.log(plantTaskList.value);
    };

    const addNewplantTask = (PlantTask: PlantTask) => {
      plantTaskList.value.push(PlantTask);
    };

    const updateplantTask = (PlantTask: PlantTask, type: "id") => {
      let findIndex = -1;
      if (type === "id") {
        findIndex = plantTaskList.value.findIndex(
          (item) => item.id && item.id === PlantTask.id
        );
      }
      if (findIndex > -1) {
        plantTaskList.value[findIndex] = PlantTask;
      }
    };

    return {
      plantTaskList,
      setplantTaskList,
      addNewplantTask,
      updateplantTask,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: "tree_plantTask_list",
    },
  }
);
