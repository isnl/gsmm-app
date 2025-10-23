import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UniStorage } from './storage';

export interface InvestigateStats {
  dai_diao_cha: number;
  wo_de_dai_diao_cha: number;
  yi_diao_cha: number;
}

export const useSurveyStore = defineStore(
  'survey',
  () => {
    const investigateStatsInfo = ref<InvestigateStats>({
      dai_diao_cha: 0,
      wo_de_dai_diao_cha: 0,
      yi_diao_cha: 0,
    });

    const setInvestigateStats = (stats: InvestigateStats) => {
      investigateStatsInfo.value = stats;
    };

    return { investigateStatsInfo, setInvestigateStats };
  },
  {
    persist: {
      storage: UniStorage,
      key: 'tree_survey',
    },
  }
);
