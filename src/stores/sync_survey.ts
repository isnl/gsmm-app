import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UniStorage } from './storage';
import { useSurveyListStore } from './survey_list';
import { uuid } from '@/utils';
import { getSurveyList } from '@/hooks/useSync';
import { useGlobalStore } from '@/stores/global';
import { service, uploadService, noUploadService } from '@/service';
import { LogCat } from '@/utils/logger';
export interface SyncItem {
  id: string;
  syncType: 'survey' | 'germplasm';
  type: 'NORMAL' | 'UPLOAD';
  methods: 'PUT' | 'POST';
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
  createdAt?: number;
  url: string;
  data: any;
}

export const useSyncSurveyStore = defineStore(
  'sync_survey',
  () => {
    const syncList = ref<SyncItem[]>([]);

    const syncSuccessList = computed(() => syncList.value.filter(item => item.status === 'success'));
    const syncPendingAndErrorList = computed(() => syncList.value.filter(item => item.status !== 'success'));
    const syncPendingList = computed(() => syncList.value.filter(item => item.status === 'pending'));
    const syncErrorList = computed(() => syncList.value.filter(item => item.status === 'error'));

    /**
     * 调查新增/编辑
     * @param item 添加同步数据
     */
    const _addSyncItemSurvey = (syncItem: SyncItem, isNewData: boolean) => {
      const { addNewSurvey, updateSurvey } = useSurveyListStore();
      // 如果是新增数据，则不牵扯，添加一个tempId直接push即可
      if (isNewData) {
        syncItem.data.tempId = uuid();
        syncList.value.push(syncItem);
        addNewSurvey({
          ...syncItem.data,
        });
      } else {
        let type = '';
        const { tempId, id } = syncItem.data;
        // 如果为编辑，需要判断队列中是否已经有当前数据了
        let findIndex = -1;
        if (tempId) {
          type = 'tempId';
          findIndex = syncList.value.findIndex(item => item.data.tempId && item.data.tempId === tempId);
        } else if (id) {
          type = 'id';
          findIndex = syncList.value.findIndex(item => item.data.id && item.data.id === id);
        }
        if (findIndex > -1) {
          // 找到了一样id的  更新替换、状态重置为 pending
          syncList.value[findIndex].data = {
            ...syncItem.data,
          };
          syncList.value[findIndex].status = 'pending';
          syncList.value[findIndex].errorMessage = undefined;
        } else {
          // 没找到， push
          syncList.value.push(syncItem);
        }
        // 更新缓存的列表数据
        updateSurvey(
          {
            ...syncItem.data,
          },
          type as 'id' | 'tempId',
        );
      }
    };

    /**
     * 调查新增 对外
     * @param param0
     */
    const addSyncItemSurvey = ({ url, data, isNewData }: { url: string; data: any; isNewData: boolean }) => {
      // 只需要判断是否有新的文件上传
      const uploadFiles = data.multimedia.filter(item => !item.id);
      _addSyncItemSurvey(
        {
          id: uuid(),
          syncType: 'survey',
          type: uploadFiles.length ? 'UPLOAD' : 'NORMAL',
          methods: 'POST',
          url,
          data,
          status: 'pending',
          createdAt: Date.now(),
        },
        isNewData,
      );
    };

    const addSyncItemGermplasm = ({ url, data, isNewData }: { url: string; data: any; isNewData: boolean }) => {};

    /**
     * 删除同步数据 并 删除列表中的数据
     * @param id
     */
    const removeSyncItem = (id: string) => {
      const { removeSurvey } = useSurveyListStore();
      const syncItem = syncList.value.find(item => item.id === id);
      if (syncItem) {
        const type = syncItem.data.id ? 'id' : 'tempId';
        const surveyId = type === 'id' ? syncItem.data.id : syncItem.data.tempId;
        syncList.value = syncList.value.filter(item => item.id !== id);
        removeSurvey(surveyId as string, type);
      }
    };

    // 同步数据并移出队列
    const onHandleSyncUploadData = async (selectedIds?: string[]) => {
      const globalStore = useGlobalStore();
      let has401 = false;

      // 如果提供了选中的ID列表，只同步选中的数据；否则同步所有数据
      const itemsToSync = selectedIds
        ? syncList.value.filter(item => selectedIds.includes(item.id) && item.status === 'pending')
        : syncList.value.filter(item => item.status === 'pending');

      LogCat.info(`开始同步数据，当前待同步数据总数：${itemsToSync.length}`);
      for (let i = 0; i < itemsToSync.length; i++) {
        LogCat.info(`正在同步第${i + 1}条数据`);
        const syncItem = itemsToSync[i];
        const { data, url, id } = syncItem;
        let params: any = {};
        for (const key in data) {
          if (key !== 'multimedia' && key !== 'tempId' && key !== 'investigatorId' && key !== 'coverId') {
            if (key === 'location') {
              params['location.x'] = data.location.x;
              params['location.y'] = data.location.y;
            } else {
              // 有值才添加
              if (data[key]) {
                params[key] = data[key];
              }
            }
          }
        }
        const realPhotoFiles = data.multimedia.filter(item => !item.id);
        const oldPhotos = data.multimedia.filter(item => item.id);
        // 转换文件列表为uploadService所需格式
        let uploadPhotoFiles = [];
        // #ifdef H5
        uploadPhotoFiles = realPhotoFiles.map((file: any, index: number) => ({
          name: `multimedia[${index}]`, // 文件对应的key
          file,
        }));
        // #endif
        // #ifdef APP-PLUS
        uploadPhotoFiles = realPhotoFiles.map((file: any, index: number) => ({
          name: `multimedia[${index}]`, // 文件对应的key
          file: file.tempFilePath,
          uri: file.tempFilePath,
        }));
        // #endif
        let oldPhotoFiles = {};
        oldPhotos.forEach((item, index) => {
          // @ts-ignore
          oldPhotoFiles[`multimedia_[${index}].id`] = item.id;
          // @ts-ignore
          oldPhotoFiles[`multimedia_[${index}].name`] = item.name;
          // @ts-ignore
          oldPhotoFiles[`multimedia_[${index}].path`] = item.path;
          // @ts-ignore
          oldPhotoFiles[`multimedia_[${index}].url`] = item.url;
          // @ts-ignore
          oldPhotoFiles[`multimedia_[${index}].screenshotPath`] = item.screenshotPath;
          // @ts-ignore
          oldPhotoFiles[`multimedia_[${index}].type`] = item.type;
        });
        // 调用完成调查接口
        // TODO: 如果是编辑的，需要更新列表数据
        let res;
        console.log('files', uploadPhotoFiles);
        LogCat.info(`第${i + 1}条数据上传文件信息：`, uploadPhotoFiles);
        console.log('params', params);
        LogCat.info(`第${i + 1}条数据上传参数params信息：`, params);

        if (uploadPhotoFiles.length) {
          res = await uploadService({
            url,
            files: uploadPhotoFiles,
            formData: { ...params, ...oldPhotoFiles },
          });
          LogCat.info(`第${i + 1}条数据上传响应信息：`, res);
        } else {
          res = await noUploadService({
            url,
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded',
            },
            params: { ...params, ...oldPhotoFiles },
          });
          LogCat.info(`第${i + 1}条数据（无文件上传的）响应信息：`, res);
        }

        if (res.statusCode === 200) {
          syncItem.status = 'success';
          syncItem.errorMessage = undefined;
          LogCat.info(`第${i + 1}条数据上传成功`);
        } else {
          if (res.statusCode === 401) {
            has401 = true;
            break;
          }
          LogCat.error(`第${i + 1}条数据上传失败，响应数据为：`, res.data);
          // 接口409的时候，走编号重复校验
          if (res.statusCode === 409) {
            const { code, message } = res.data;
            if (code && message) {
              // 609编号已存在  611无权调查   612当前古树名木不存在调查任务  613 任务已完成  614 水印生成抛出的异常
              if ([609, 611, 612, 613, 614].includes(code)) {
                syncItem.errorMessage = message;
              } else if (code === 610) {
                // 已存在数据，但可覆盖
                syncItem.errorMessage = message;
                syncItem.data.coverId = id;
              }
            } else {
              // 只有message 或者 code
              syncItem.errorMessage = '唯一键冲突，请联系管理员';
            }
          }
          if ([403, 404, 413, 500].includes(res.statusCode)) {
            syncItem.errorMessage = res.data;
          }
          // 401的时候是token过期，可不能添加进失败列表
          if (res.statusCode !== 401) {
            syncItem.status = 'error';
          }
        }
      }

      globalStore.setDataSyncUploadTime();
      return {
        has401,
      };
    };

    const clearSyncList = () => {
      const { removeSurvey } = useSurveyListStore();
      syncList.value.forEach(item => {
        const type = item.data.id ? 'id' : 'tempId';
        const id = type === 'id' ? item.data.id : item.data.tempId;
        removeSurvey(id as string, type);
      });

      syncList.value = [];
    };
    const clearErrorSyncList = () => {
      const { removeSurvey } = useSurveyListStore();
      syncErrorList.value.forEach(item => {
        const type = item.data.id ? 'id' : 'tempId';
        const id = type === 'id' ? item.data.id : item.data.tempId;
        removeSurvey(id as string, type);
      });

      syncList.value = syncList.value.filter(item => item.status !== 'error');
    };

    /**
     * 重置同步状态为pending
     * @param id 同步项ID
     */
    const resetSyncItemStatus = (id: string) => {
      const syncItem = syncList.value.find(item => item.id === id);
      if (syncItem) {
        syncItem.status = 'pending';
        syncItem.errorMessage = undefined;
      }
    };

    return {
      syncList,
      syncSuccessList,
      syncPendingAndErrorList,
      syncPendingList,
      syncErrorList,
      addSyncItemSurvey,
      removeSyncItem,
      clearSyncList,
      clearErrorSyncList,
      resetSyncItemStatus,
      onHandleSyncUploadData,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_sync_survey',
    },
  },
);
