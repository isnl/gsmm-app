pinia 的安装

package.json 中先移除掉 pinia 跟持久化插件：pinia-plugin-persistedstate

再安装依赖

然后单独安装 npm install pinia pinia-plugin-persistedstate

再 npm i pinia@2.3.1 安装 uniapp 可用的 pinia 版本

这里是最终的版本情况：
"pinia": "^2.3.1",
"pinia-plugin-persistedstate": "^4.4.1",

离线缓存需要考虑多用户的问题

首次进入页面或者登录后，所有页面的离线数据先缓存下来？

根据 investigatorId 调查人 id 判断是否为已调查

首页底部定位到当前位置？

定位古树

证书密码
treeapp

证书别名
treeapp

移栽 TODO:

移栽任务部分，将完成按钮改为点亮 任务要求改为节点内容

移栽任务部分，完成移栽或者保存的时候，如果有未点亮的节点，给用户提示一下有未完成

移栽任务部分的列表中的状态为真实状态

完成移栽后，就不能再进行点亮节点以及修改了，这两个按钮都去掉

新增古树 叫新增

丰富首页筛选条件
行政区、时间段、调查状态

预览下载：已有下载记录 是否重新下载
下载：调用 byid 获取到 media , 遍历下载存入本地

拍摄的视频
{
"type": "video",
"tempFiles": [
{
"height": 1080,
"thumbTempFilePath": "/storage/emulated/0/Android/data/com.tree.app/apps/__UNI__753D3B4/temp/uni-media/video_thumb_1754386761246.jpg",
"fileType": "video",
"duration": 2.9,
"width": 1920,
"tempFilePath": "file:///storage/emulated/0/Android/data/com.tree.app/apps/__UNI__753D3B4/temp/uni-media/1754386753394.mp4",
"byteSize": 6423699,
"size": 6273.144
}
]
}
拍摄的照片
{
"type": "image",
"tempFiles": [
{
"fileType": "image",
"tempFilePath": "file:///storage/emulated/0/Android/data/com.tree.app/apps/__UNI__753D3B4/temp/uni-media/1754386764144.jpg",
"size": 2794037
}
]
}

选择的图片、视频

{
"type": "video,image",
"tempFiles": [
{
"height": 2160,
"thumbTempFilePath": "/storage/emulated/0/Android/data/com.tree.app/apps/__UNI__753D3B4/temp/uni-media/video_thumb_1754386790636.jpg",
"fileType": "video",
"duration": 5.87,
"width": 3840,
"tempFilePath": "content://media/picker/0/com.android.providers.media.photopicker/media/1000007013",
"byteSize": 38239442,
"size": 37343.203
},
{
"fileType": "image",
"tempFilePath": "file:///storage/emulated/0/Android/data/com.tree.app/apps/__UNI__753D3B4/temp/uni-media/1754386790485_1000007124.jpg",
"size": 2723485
}
]
}

文件存相册？

tif 地图影像加载

快速填充表单信息：

vm.value = {
"type": "巨柏",
"treeSpecies": "巨柏",
"treeCode": "50049",
"commonName": "雅鲁藏布江柏木",
"latinName": "Cupressus gigantea",
"family": "柏科",
"genus": "柏木属",
"species": "",
"estimatedAge": "",
"ownershipUnit": "",
"batch": "",
"location": {
"x": "82.136386",
"y": "44.104582"
},
"areaCode": "",
"town": "",
"village": "",
"smallPlaceName": "",
"altitude": "20",
"healthStatus": "濒危",
"protectionLevel": "",
"protectionType": "国家一级",
"isRareSpecies": "false",
"treeHeight": "10",
"crownWidth": "10",
"underBranchHeight": "",
"area": "",
"quantity": "",
"transplantPlan": "",
"measurementDimensionType": "胸径",
"measurementInfo": {
"chestDiameter": "10",
"groundDiameter": "",
"distributionDiameter": "",
"branchCount": "",
"farthestDiameter": ""
},
"specs": "60",
"growthEnvironment": "中等",
"isTransplant": "",
"notTransplant": "",
"landType": "",
"soilTexture": "",
"slope": "急坡(35°〜44°)",
"aspect": "西坡",
"slopePosition": "山谷",
"siteConditionDesc": "",
"protectionMeasureType": "",
"team": "张泽、张欢",
"relocationProtection": "",
"managementMeasures": "",
"relocationPlace": "",
"projectSchedule": "",
"laborStatistics": "",
"investmentEstimate": "",
"historicalAnecdotes": "",
"discoveryDate": "2025-08-12",
"remarks": "",
"multimedia": [
{}
]
}

```高德返回的数据
{
    "coordsType": "gcj02",
    "address": {
        "country": "中国",
        "province": "陕西省",
        "city": "西安市",
        "district": "长安区",
        "street": "航飞路",
        "streetNum": "4455号",
        "poiName": "中天引控科技股份有限公司",
        "cityCode": "029"
    },
    "addresses": "陕西省西安市长安区航飞路4455号靠近中天引控科技股份有限公司",
    "coords": {
        "latitude": 34.135196,
        "longitude": 108.98654,
        "accuracy": 30,
        "altitude": 0,
        "heading": null,
        "speed": 0,
        "altitudeAccuracy": 0
    },
    "timestamp": 1755682573538
}
```

测试经纬度：
93.834042
29.121374

服务器 id

codeNumber 挂牌编号
下发任务带有这个 002

上传成功列表数据： 删除静态数据、删除图片视频数据

业务分区的列表缓存状态是否需要显示

业务分区的分区显示开关？？？

下载 startAll 替换掉并发那种方式？

图片、视频下载调研

marker 性能优化

下载 + 解压缩到指定文件夹

```js
uni.downloadFile({
  url: 'http://192.168.0.182:5000/tile_cache.zip',
  success(res) {
    console.log('下载成功');
    console.log('临时文件地址', res.tempFilePath);
    plus.zip.decompress(res.tempFilePath, plus.io.convertLocalFileSystemURL('_downloads/uni_downloadFile'), () => {
      console.log('解压缩成功');
    });
  },
});
```

清空缓存：上传之后清空图片、视频缓存

不用质地类型了！
表型特征描述：输入

种质资源唯一编号自己填

标签编号改为种质资源唯一编号 用户填

采集列表中的列表 用这三个拼接
资源类型 + 采集数量 + 采集单位

唯一编号必填、类型必填、数量、单位必填

签名维护：
采集人
记录人

采集人签字
可以选择多个，可以点击应用

记录人签字
只有单个、当前登录账号、不用点击应用
账号 - 保存签名

负责人 默认置灰 只默认显示，不走新增的时候的参数

土壤质地 是 土壤类型 原来数据就有
地貌 是系统要加一个字段，也属于原来的数据
健康状况、有无明显病虫害、表型特征描述、群落环境描述必填

把那俩预估字段加上

胸径预估：默认填充
计算器动态生成计算过程填充到预估类型字段中

添加地貌字段

看一下这个文件还用不用 UploadFailedPopup.vue



提取表单类型

输入框类型的 placeholder 从下面的附属信息自行提取
c1 c2 c3 c4 c5 c9  c13 c14 c18
c6 c7 年份选择器
c8 从附属信息中提取数据，select 选择的方式
c10 c11 c16 c19 数字输入框  后面跟上对应的单位
c12 c17 提取数据，select 选择
c15 c21 文本域输入框
c20  提取数据，自己封装多项选择器，按照下文提示
