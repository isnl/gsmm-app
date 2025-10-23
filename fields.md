**三北项目工程管理数据库设计**

**初版v0.1**

  

第一章 系统数据表
=========

1.1. 门户项目管理模块
-------------

建设内容：人工造林、飞播造林、飞播种草、人工种草、退化林修复、退化林修复、退化草原修复、封山（沙）育林育草、工程固沙、湿地保护修复/退化湿地修复、配套设施、沙化土地封禁保护补偿项目、巩固防沙治沙成果。

### 1.1.1. 二级项目基础数据表

二级项目表记录二级项目的基本信息。

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键（类型）**

**备注**

id

二级项目ID

  

是

  

yi\_ji\_xiang\_mu\_id

一级项目id

关联一级项目id

bigint

  

xiang\_mu\_bian_hao

项目编号

  

varchar(255)

  

jian\_she\_xing_zhi

建设性质

  

varchar(255)

  

xiang\_mu\_xing_zhi

项目性质

  

varchar(255)

  

zi\_jin\_lai_yuan

资金来源

  

jsonb

  

jian\_she\_gui_mo

建设规模

  

numeric(16,2)

  

jian\_she\_di_dian

建设地点，多县政区编码英文逗号分隔

  

varchar(300)

  

ian\_she\_kai\_shi\_nian_fen

建设开始时间

  

bigint

  

ian\_she\_jie\_shu\_nian_fen

建设结束时间

  

bigint

  

xia\_da\_pi_ci

下达批次

  

varchar(255)

  

xiang\_mu\_fa_ren

项目法人

  

varchar(255)

  

fa\_ren\_dan_wei

法人单位

  

varchar(255)

  

fa\_ren\_dian_hua

法人电话

  

varchar(20)

  

ri\_chang\_jian\_guan\_fu\_ze\_ren

日常监管责任人

  

varchar(255)

  

fu\_ze\_ren\_dan\_wei

负责人单位

  

varchar(255)

  

fu\_ze\_ren\_dian\_hua

负责人电话

  

varchar(20)

  

xiang\_mu\_zhao_pian

项目照片

  

geometry

  

created_at

填表人

  

bigint

  

created_by

填报时间

  

timestamp(6) with time zone

  

xiang\_mu\_ming_cheng

项目名称

  

varchar

  

dang\_an\_gui\_dang\_lv

档案归档率

  

double precision

  

jian\_she\_nei_rong

建设内容

  

jsonb

  

xiang\_mu\_fan_wei

项目范围

  

geometry

  

annexes

附件

  

jsonb

  

### 1.1.2. 二级项目审批表

记录二级项目审批记录

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键**

**备注**

id

审批表ID

  

是

  

er\_ji\_id

二级项目ID

关联二级项目ID

bigint

  

zhuang_tai

状态

  

varchar(255)

  

wen\_jian\_hao

文件号

  

varchar(255)

  

shen\_pi\_shi_jian

审批时间

  

date

  

annexes

附件

  

jsonb

  

created_at

填表人

  

bigint

  

created_by

填报时间

  

timestamp(6) with time zone

  

### 1.1.3. 项目可研表

记录二级项目可研记录

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键**

**备注**

id

可研表ID

  

是

  

er\_ji\_id

二级项目ID

关联二级项目ID

bigint

  

zhuang_tai

状态：1.已批复

  

integer

  

ke\_yan\_pi\_fu\_shi_jian

可研批复时间

  

date

  

ke\_yan\_pi\_fu\_dan_wei

可研批复单位

  

varchar(255)

  

ke\_yan\_pi\_fu\_wen\_jian\_hao

可研批复文件号

  

varchar(255)

  

annexes

附件

  

jsonb

  

created_at

填表人

  

timestamp(6) with time zone

  

created_by

填报时间

  

bigint

  

jian\_she\_di_dian

建设地点，多县政区编码英文逗号分隔

  

text

  

### 1.1.4. 项目初设表

记录二级项目初设记录

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键**

**备注**

id

初设表ID

  

是

  

er\_ji\_id

二级项目ID

关联二级项目ID

bigint

  

zhuang_tai

状态：1.已批复

  

integer

  

chu\_she\_pi\_fu\_shi_jian

初设批复时间

  

date

  

chu\_she\_pi\_fu\_dan_wei

初设批复单位

  

varchar(255)

  

chu\_she\_pi\_fu\_wen\_jian\_hao

初设批复文件号

  

varchar(255)

  

annexes

附件

  

jsonb

  

created_at

填表人

  

timestamp(6) with time zone

  

created_by

填报时间

  

bigint

  

jian\_she\_di_dian

建设地点，多县政区编码英文逗号分隔

  

text

  

### 1.1.5. 项目施工表

记录二级项目施工记录

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键**

**备注**

id

初设表ID

  

是

  

er\_ji\_id

二级项目ID

关联二级项目ID

```
bigint
```

  

shi\_fou\_qian\_ding\_shi\_gong\_he_tong

施工合同：1.签订

  

integer

  

shi\_gong\_qian\_ding\_shi_jian

施工签订时间

  

date

  

shi\_gong\_dan_wei

施工单位

  

varchar(255)

  

shi\_gong\_wen_jian

施工文件

  

jsonb

  

shi\_fou\_you\_jian\_li

是否有监理

  

integer

  

shi\_gong\_qian\_ding\_shi_jian

监理签订时间

  

date

  

jian\_li\_dan_wei

监理单位

  

varchar(255)

  

jian\_li\_wen_jian

监理文件

  

jsonb

  

created_at

填表人

  

timestamp(6) with time zone

  

created_by

填报时间

  

bigint

  

jian\_she\_di_dian

建设地点，多县政区编码英文逗号分隔

  

text

  

### 1.1.6. 项目年度计划任务表

记录二级项目年度计划任务记录

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键**

**备注**

ID

初设表ID

  

是

  

er\_ji\_id

二级项目ID

关联二级项目ID

bigint

  

nian_fen

年份

  

integer

  

jian\_she\_nei_rong

建设内容

  

varchar(255)

  

jian\_she\_gui_mo

建设规模

  

numeric(16,2)

  

jian\_she\_zi_jin

建设资金

  

numeric(16,2)

  

duo\_xian\_zheng\_qu\_bian_ma

多县政区编码

  

jsonb

  

created_at

填表人

  

timestamp(6) with time zone

  

created_by

填报时间

  

bigint

  

jian\_she\_di_dian

建设地点，多县政区编码英文逗号分隔

  

text

  

### 1.1.7. 项目进度表

记录二级项目进度记录

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键（类型）**

**备注**

ID

初设表ID

  

是

  

er\_ji\_id

二级项目ID

关联二级项目ID

bigint

  

created_at

填表人

  

timestamp(6) with time zone

  

created_by

填报时间

  

bigint

  

yue_fen

月份

  

date

  

jian\_she\_nei_rong

建设内容

  

varchar(2550)

  

jian\_she\_mian_ji

建设面积

  

numeric(16,2)

  

wan\_cheng\_bai\_fen\_bi

完成百分比

  

numeric(16,2)

  

jian\_she\_jin\_du\_nei_rong

建设进度内容

  

text

  

annexes

附件

  

jsonb

  

yi\_luo\_shi\_yong\_di\_mian\_ji

已落实项目用地面积

  

double precision

（亩）

yong\_di\_zong\_mian\_ji

项目用地总面积

  

double precision

（亩）

sha\_zhang\_cai\_liao\_chu_bei

沙障材料储备

  

double precision

（千克）

sha\_zhang\_cai\_liao\_xu\_yong\_liang

沙障材料需用量

  

double precision

（千克）

ti\_gong\_zhong\_miao\_liang

本地能提供本项目使用的种苗量

  

double precision

(株、千克）

suo\_xu\_zhong_miao

项目所需种苗

  

double precision

(株、千克）

yi\_luo\_shi\_guan\_gai\_xu\_shui_liang

已落实的灌溉需水量

  

double precision

（立方米）

guan\_gai\_xu\_shui\_zong_liang

灌溉需水总量

  

double precision

（立方米）

cai\_liao\_tou_ru

材料投入

  

jsonb

（元）

ji\_xie\_she\_bei\_tou_ru

机械设备投入

  

double precision

（元）

ji\_chu\_she\_shi\_tou_ru

基础设施投入

  

double precision

（元）

yong\_gong\_liang

用工量

  

double precision

（工日）

yi\_gong\_dai\_zhen\_can\_yu\_ren_shu

以工代赈参与人数

  

integer

(人）

xian\_jian\_hou\_bu\_mian_ji

先建后补面积

  

double precision

（亩）

yi\_gong\_dai\_zhen\_mian_ji

以工代赈面积

  

double precision

（亩）

can\_yu\_mian_ji

参与面积

  

jsonb

（亩）

lian\_fang\_lian\_zhi\_ming_cheng

联防联治区名称

  

varchar

  

lian\_fang\_lian\_zhi\_zhi\_li\_mian_ji

联防联治治理面积

  

double precision

（亩）

lian\_fang\_lian\_zhi\_tou\_zi\_e

联防联治投资额

  

double precision

（万元）

yi\_lu\_zhi\_sha\_zuo\_ye\_dao\_chang\_du

以路治沙作业道长度

  

double precision

(米）

yi\_lu\_zhi\_sha\_bei\_hui\_fu\_mian\_ji

以路治沙植被恢复面积

  

double precision

（亩）

jian\_she\_di_dian

建设地点，多县政区编码英文逗号分隔

  

text

  

### 1.1.8. 项目资金表

记录二级项目资金记录

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键**

**备注**

id

初设表ID

  

是

  

er\_ji\_id

二级项目ID

关联二级项目ID

bigint

  

lai_yuan

来源

  

varchar(255)

  

jin_e

金额

  

numeric(16,2)

  

miao_shu

描述

  

varchar(2550)

  

shi_jian

时间

  

date

  

annexes

附件

  

jsonb

  

created_at

填表人

  

timestamp(6) with time zone

  

created_by

填报时间

  

bigint

  

jian\_she\_di_dian

建设地点，多县政区编码英文逗号分隔

  

text

  

zi\_jin\_liu_xiang

资金流向

  

varchar

  

1.2. 运维管理
---------

### 1.2.1. 一级项目管理

一级项目在运维管理的一级项目管理中进行增删改查。一级项目表在项目使用开始前需先进行上传。

一级项目字段表如下所示：

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键**

**备注**

id      

项目id

  

是

  

xiang\_mu\_ming_cheng

项目名称

  

varchar(255)

  

xiang\_mu\_bian_hao

项目编号

  

varchar(255)

  

suo\_shu\_zhan_qu

所属战区

  

varchar(255)

  

kai\_shi\_nian_fen

开始年份

  

bigint

  

jie\_shu\_nian_fen

结束年份

  

bigint

  

zi\_jin\_lai_yuan

资金来源

  

jsonb

  

jian\_she\_di_dian

建设地点，多县政区编码英文逗号分隔

  

varchar(300)

  

annexes

附件

  

jsonb

  

created_at

填表人

  

timestamp(6) with time zone

  

created_by

填报时间

  

bigint

  

### 1.2.2. 规划指标管理

规划指标表在运维管理的规划指标管理中进行增删改查。规划指标表在项目使用开始前需先进行上传。

规划指标字段表如下所示：

**项目字段**

**字段名称**

**是否关联其他表**

**是否为主键**

**备注**

id

规划表ID

  

是

  

kai\_shi\_nian_fen

开始时间

  

bigint

  

jie\_shu\_nian_fen

结束时间

  

bigint

  

zi\_jin\_lai_yuan

资金来源

  

jsonb

  

gui_mo

建设规模（单位：万亩）

  

numeric(16,2)

  

annexes

附件

  

jsonb

  

created_at

填表人

  

timestamp(6) with time zone

  

created_by

填报时间

  

bigint