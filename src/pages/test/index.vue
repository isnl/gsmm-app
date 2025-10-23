<script lang="ts" setup>
import { useTileCacheStore } from '@/stores/tile_cache';
import { ref, onMounted } from 'vue';
import { toRefs } from 'vue';
import { useSyncResultStore } from '@/stores/sync_result';

const tileCacheStore = useTileCacheStore();
const { areaCaches } = toRefs(tileCacheStore);

const syncResultStore = useSyncResultStore();
const { syncResultList } = toRefs(syncResultStore);

let imgSrc = ref('');
let imgList = ref([]);

onMounted(() => {
  console.log('areaCaches', areaCaches.value);
  syncResultList.value.forEach(item => {
    item.multimedia?.forEach(media => {
      console.log('media.url', media.url);
      imgList.value.push(media.url);
    });
  });

  // for (let key in areaCaches.value) {
  //   if (areaCaches.value[key].areaId) {
  //     for (let tileKey in areaCaches.value[key].tiles) {
  //       console.log(areaCaches.value[key].tiles[tileKey].data);
  //       const src = areaCaches.value[key].tiles[tileKey].data;
  //       imgList.value.push(plus.io.convertLocalFileSystemURL(src));
  //     }
  //   }
  // }
});
</script>
<template>
  <view class="w-full h-full flex flex-col">
    <view class="w-200px h-200px b-(1px solid red) mb-20px">
      <image :src="src" v-for="src in imgList" :key="src" class="w-200px h-200px" />
    </view>
  </view>
</template>
