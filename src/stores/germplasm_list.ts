import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { UniStorage } from './storage';
import { uuid } from '@/utils';
import dayjs from 'dayjs';
import { uploadService, noUploadService } from '@/service';
// @Getter
// @Setter
// public class CreateGermplasmResourcesCollectBaseInfoRequest {
//   @NotBlank(message = "codeNumber cannot be blank")
//   @Schema(description = "挂牌编号")
//   private String codeNumber;

//   @NotNull(message = "collectTime cannot be null")
//   @Schema(description = "采集日期")
//   private Instant collectTime;

//   @NotBlank(message = "weather cannot be blank")
//   @Schema(description = "天气状况")
//   private String weather;

//   @NotBlank(message = "collectTeam cannot be blank")
//   @Schema(description = "采集单位/团队")
//   private String collectTeam;

//   @NotBlank(message = "collectPersonnel cannot be blank")
//   @Schema(description = "采集人员")
//   private String collectPersonnel;

//   @NotBlank(message = "parentHealthStatus cannot be blank")
//   @Schema(description = "母树健康状况")
//   private String parentHealthStatus;

//   @NotBlank(message = "hasPestsDiseases cannot be blank")
//   @Schema(description = "有无明显病虫害")
//   private String hasPestsDiseases;

//   @NotBlank(message = "phenotypeDescription cannot be null")
//   @Schema(description = "表型特征描述")
//   private String phenotypeDescription;

//   @NotBlank(message = "communityEnvironment cannot be null")
//   @Schema(description = "群落环境描述")
//   private String communityEnvironment;

//   @Schema(description = "签字时间")
//   private LocalDate signatureDate;

//   @Schema(description = "现场影像-母树全貌")
//   private List<MultipartFile> fieldImageParentTree;

//   @Schema(description = "现场影像-树干基部")
//   private List<MultipartFile> fieldImageTrunkBase;

//   @Schema(description = "现场影像-树冠")
//   private List<MultipartFile> fieldImageCrown;

//   @Schema(description = "现场影像-生境环境")
//   private List<MultipartFile> fieldImageHabitat;

//   @Schema(description = "采集人签字")
//   private List<MultipartFile> collectorSignature;

//   @Schema(description = "记录人签字")
//   private List<MultipartFile> recorderSignature;

//   @Schema(description = "采集详情")
//   private List<CreateGermplasmResourcesCollectDetailInfoRequest>  details;
// }

export interface Germplasm {
  tempId?: string;
  notTempData?: boolean; // 非临时数据  保存按钮点击或者完成采集按钮点击之后，改为 true
  status?: 'saved' | 'done' | 'syncError' | 'synced'; // saved 已保存  done 采集完成
  syncErrorMessage?: string; // 同步失败的错误信息
  /*****以上为本地缓存用到的扩展字段，不参与接口请求******/
  codeNumber?: string;
  collectTime?: string;
  weather?: string;
  collectTeam?: string;
  collectPersonnel?: string;
  parentHealthStatus?: string;
  hasPestsDiseases?: string;
  phenotypeDescription?: string;
  communityEnvironment?: string;
  signatureDate?: string;
  fieldImageParentTree?: string[];
  fieldImageTrunkBase?: string[];
  fieldImageCrown?: string[];
  fieldImageHabitat?: string[];
  collectorSignature?: string[];
  recorderSignature?: string[];
  details?: any[];
}

export const useGermplasmLisStore = defineStore(
  'germplasm_list',
  () => {
    // 待同步列表
    const germplasmList = ref<Germplasm[]>([]);
    const localGermplasmList = computed(() => {
      return germplasmList.value.filter(item => item.notTempData && (item.status === 'saved' || item.status === 'done'));
    });

    // 添加一条空的  待采集数据
    const addEmptyGermplasm = () => {
      const tempId = uuid();
      germplasmList.value.push({
        tempId,
      });
      return tempId;
    };

    /**
     * 更新数据状态
     * @param id
     * @param data
     */
    const updateGermplasmById = (id: string, data: Germplasm) => {
      const index = germplasmList.value.findIndex(item => item.tempId === id);
      if (index > -1) {
        germplasmList.value[index] = {
          ...germplasmList.value[index],
          ...data,
          notTempData: true,
        };
      }
    };
    /**
     * 给指定 id 的添加 details 项
     * @param id
     * @param data
     */
    const addGermplasmDetailById = (id: string, data: any) => {
      const index = germplasmList.value.findIndex(item => item.tempId === id);
      if (index > -1) {
        germplasmList.value[index].details = [
          ...(germplasmList.value[index].details || []),
          {
            ...data,
            tempId: uuid(),
          },
        ];
      }
    };
    /**
     * 给指定 id 的删除 details 项
     * @param id
     * @param detailId
     */
    const removeGermplasmDetailById = (id: string, detailId: string) => {
      const index = germplasmList.value.findIndex(item => item.tempId === id);
      if (index > -1) {
        germplasmList.value[index].details = germplasmList.value[index].details?.filter(item => item.tempId !== detailId);
      }
    };

    /**
     * 更新指定 id 的 details 项
     * @param id
     * @param detailId
     * @param data
     */
    const updateGermplasmDetailById = (id: string, detailId: string, data: any) => {
      const index = germplasmList.value.findIndex(item => item.tempId === id);
      if (index > -1 && germplasmList.value[index].details) {
        const detailIndex = germplasmList.value[index].details!.findIndex(item => item.tempId === detailId);
        if (detailIndex > -1) {
          germplasmList.value[index].details![detailIndex] = {
            ...germplasmList.value[index].details![detailIndex],
            ...data,
          };
        }
      }
    };

    const addGermplasm = (data: Germplasm) => {
      const tempId = uuid();
      germplasmList.value.push({
        ...data,
        tempId,
      });
      return tempId;
    };
    const removeGermplasm = (id: string) => {
      germplasmList.value = germplasmList.value.filter(item => item.tempId !== id);
    };
    const getInfoById = (id: string, isHistory: boolean): Germplasm | undefined => {
      return isHistory ? germplasmListHistory.value.find(item => item.id === id) : germplasmList.value.find(item => item.tempId === id);
    };

    // 历史记录列表
    const germplasmListHistory = ref<Germplasm[]>([]);
    const setGermplasmListHistory = (list: Germplasm[]) => {
      germplasmListHistory.value = list;
    };

    /**
     * 处理种质资源数据同步上传
     * @param selectedIds 选中的种质资源ID数组
     */
    const onHandleSyncUploadData = async (selectedIds: string[]) => {
      const results = {
        successCount: 0,
        errorCount: 0,
        has401: false,
      };

      for (const id of selectedIds) {
        const germplasmItem = germplasmList.value.find(item => item.tempId === id);
        if (!germplasmItem) continue;

        try {
          // 准备基础参数，移除临时扩展字段
          let params: any = {};
          // 收集所有文件
          let allFiles: any[] = [];

          // 基础字段
          if (germplasmItem.codeNumber) params.codeNumber = germplasmItem.codeNumber;
          if (germplasmItem.collectTime) params.collectTime = germplasmItem.collectTime;
          if (germplasmItem.weather) params.weather = germplasmItem.weather;
          if (germplasmItem.collectTeam) params.collectTeam = germplasmItem.collectTeam;
          if (germplasmItem.collectPersonnel) params.collectPersonnel = germplasmItem.collectPersonnel;
          if (germplasmItem.parentHealthStatus) params.parentHealthStatus = germplasmItem.parentHealthStatus;
          if (germplasmItem.hasPestsDiseases) params.hasPestsDiseases = germplasmItem.hasPestsDiseases;
          if (germplasmItem.phenotypeDescription) params.phenotypeDescription = germplasmItem.phenotypeDescription;
          if (germplasmItem.communityEnvironment) params.communityEnvironment = germplasmItem.communityEnvironment;
          if (germplasmItem.signatureDate) params.signatureDate = germplasmItem.signatureDate;

          // 处理details数组
          if (germplasmItem.details && germplasmItem.details.length > 0) {
            germplasmItem.details.forEach((detail: any, detailIndex: number) => {
              if (detail.germplasmResourcesCode) params[`details[${detailIndex}].germplasmResourcesCode`] = detail.germplasmResourcesCode;
              if (detail.germplasmType) params[`details[${detailIndex}].germplasmType`] = detail.germplasmType;
              if (detail.collectPart) params[`details[${detailIndex}].collectPart`] = detail.collectPart;
              if (detail.collectMethod) params[`details[${detailIndex}].collectMethod`] = detail.collectMethod;
              if (detail.collectQuantity) params[`details[${detailIndex}].collectQuantity`] = detail.collectQuantity;
              if (detail.collectUnit) params[`details[${detailIndex}].collectUnit`] = detail.collectUnit;
              if (detail.sampleQualityAssessment) params[`details[${detailIndex}].sampleQualityAssessment`] = detail.sampleQualityAssessment;
              if (detail.collectMaturity) params[`details[${detailIndex}].collectMaturity`] = detail.collectMaturity;
              if (detail.appearanceDescription) params[`details[${detailIndex}].appearanceDescription`] = detail.appearanceDescription;
              if (detail.pestDiseaseSituation) params[`details[${detailIndex}].pestDiseaseSituation`] = detail.pestDiseaseSituation;
              if (detail.preliminaryTreatment) params[`details[${detailIndex}].preliminaryTreatment`] = detail.preliminaryTreatment;
              if (detail.containerPackaging) params[`details[${detailIndex}].containerPackaging`] = detail.containerPackaging;
              if (detail.packagingSpecQuantity) params[`details[${detailIndex}].packagingSpecQuantity`] = detail.packagingSpecQuantity;
              if (detail.labelCheckConfirmation !== undefined) params[`details[${detailIndex}].labelCheckConfirmation`] = detail.labelCheckConfirmation;
              if (detail.remarks) params[`details[${detailIndex}].remarks`] = detail.remarks;

              // 处理germplasmSampleCloseup文件
              if (detail.germplasmSampleCloseup && detail.germplasmSampleCloseup.length > 0) {
                detail.germplasmSampleCloseup.forEach((image: any, imageIndex: number) => {
                  if (image.tempFilePath) {
                    allFiles.push({
                      name: `details[${detailIndex}].germplasmSampleCloseup[${imageIndex}]`,
                      file: image.tempFilePath,
                      uri: image.tempFilePath,
                    });
                  }
                });
              }
            });
          }

          // 转成 new Date().toISOString()
          params.collectTime = germplasmItem.collectTime ? new Date(germplasmItem.collectTime).toISOString() : undefined;
          params.signatureDate = dayjs(germplasmItem.signatureDate).format('YYYY-MM-DD');

          // 处理图片文件
          const imageFields = ['fieldImageParentTree', 'fieldImageTrunkBase', 'fieldImageCrown', 'fieldImageHabitat'];
          imageFields.forEach(fieldName => {
            const images = (germplasmItem as any)[fieldName] || [];
            images.forEach((image: any, index: number) => {
              if (image.tempFilePath) {
                allFiles.push({
                  name: `${fieldName}[${index}]`,
                  file: image.tempFilePath,
                  uri: image.tempFilePath,
                });
              } else if (typeof image === 'string') {
                // 如果是字符串，直接添加到params
                if (!params[fieldName]) params[fieldName] = [];
                params[fieldName].push(image);
              }
            });
          });

          // 处理签名文件
          const signatureFields = ['collectorSignature', 'recorderSignature'];
          signatureFields.forEach(fieldName => {
            const signatures = (germplasmItem as any)[fieldName] || [];
            signatures.forEach((signature: any, signatureIndex: number) => {
              if (signature.imageUrl && signature.imageUrl.startsWith('file://')) {
                allFiles.push({
                  name: `${fieldName}[${signatureIndex}]`,
                  file: signature.imageUrl,
                  uri: signature.imageUrl,
                });
              } else if (typeof signature === 'string') {
                if (signature.startsWith('file://')) {
                  allFiles.push({
                    name: `${fieldName}[${signatureIndex}]`,
                    file: signature,
                    uri: signature,
                  });
                }
              }
            });
          });

          let response;
          if (allFiles.length > 0) {
            // 有文件，使用uploadService
            response = await uploadService({
              url: '/app/germplasm_resources_collect',
              files: allFiles,
              formData: params,
            });
          } else {
            // 无文件，使用noUploadService
            response = await noUploadService({
              url: '/app/germplasm_resources_collect',
              method: 'POST',
              header: {
                'content-type': 'application/x-www-form-urlencoded',
              },
              params: params,
            });
          }

          if (response.statusCode === 200) {
            // 同步成功，更新状态
            updateGermplasmById(id, { status: 'synced' });
            results.successCount++;
          } else {
            if (response.statusCode === 401) {
              results.has401 = true;
              break;
            }
            // 同步失败
            updateGermplasmById(id, {
              status: 'syncError',
              syncErrorMessage: response.data?.message || '同步失败',
            });
            results.errorCount++;
          }
        } catch (error: any) {
          console.log('error:', error.message);
          // 处理401错误
          if (error.statusCode === 401) {
            results.has401 = true;
            break;
          }

          // 同步失败，更新状态
          updateGermplasmById(id, {
            status: 'syncError',
            syncErrorMessage: error.message || '网络错误',
          });
          results.errorCount++;
        }
      }

      return results;
    };

    return {
      germplasmList,
      localGermplasmList,
      germplasmListHistory,
      addGermplasm,
      setGermplasmListHistory,
      removeGermplasm,
      addEmptyGermplasm,
      getInfoById,
      updateGermplasmById,
      addGermplasmDetailById,
      removeGermplasmDetailById,
      updateGermplasmDetailById,
      onHandleSyncUploadData,
    };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_germplasm_list',
    },
  },
);
