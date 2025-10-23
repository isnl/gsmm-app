const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const dayjs = require('dayjs');

// 下载配置
const downloads = [
  {
    url: 'http://47.92.103.246:9390/proxy_api/common/dict_all/download',
    filename: 'dictionary.json',
    description: '字典数据',
  },
  {
    url: 'http://47.92.103.246:9390/proxy_api/app/query/common_plants_info/download',
    filename: 'common_plants_info.json',
    description: '常见植物信息',
  },
  {
    url: 'http://47.92.103.246:9390/proxy_api/app/query/family_genus/download',
    filename: 'family_genus_species.json',
    description: '科属种信息',
  },
];

const outputDir = path.join(__dirname, '../src/stores');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 下载单个文件的函数
function downloadFile(config) {
  return new Promise((resolve, reject) => {
    const { url, filename, description } = config;
    const outputFile = path.join(outputDir, filename);

    console.log(`开始下载${description}...`);

    // 根据 URL 选择 http 或 https 模块
    const client = url.startsWith('https') ? https : http;

    client
      .get(url, response => {
        if (response.statusCode !== 200) {
          const error = `下载${description}失败，状态码: ${response.statusCode}`;
          console.error(error);
          reject(new Error(error));
          return;
        }

        let data = '';

        // 接收数据片段
        response.on('data', chunk => {
          data += chunk;
        });

        // 数据接收完成
        response.on('end', () => {
          try {
            // 验证 JSON 格式
            const jsonData = JSON.parse(data);

            // 写入文件
            fs.writeFileSync(outputFile, JSON.stringify(jsonData));
            console.log(`${description}已成功下载并保存到: ${outputFile}`);
            resolve();
          } catch (error) {
            const errorMsg = `解析或保存${description}时出错: ${error.message}`;
            console.error(errorMsg);
            reject(new Error(errorMsg));
          }
        });
      })
      .on('error', error => {
        const errorMsg = `下载${description}过程中发生错误: ${error.message}`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      });
  });
}

// 依次下载所有文件
async function downloadAll() {
  console.log('开始下载所有数据文件...');

  for (const config of downloads) {
    try {
      await downloadFile(config);
    } catch (error) {
      console.error(`下载失败: ${error.message}`);
      // 继续下载其他文件，不中断整个流程
    }
  }

  console.log('所有下载任务完成！');
}

// 生成版本信息文件
function generateVersionInfo() {
  const versionInfo = {
    version: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };

  const versionFile = path.join(outputDir, 'version.json');

  try {
    fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));
    console.log(`版本信息已生成并保存到: ${versionFile}`);
  } catch (error) {
    console.error(`生成版本信息时出错: ${error.message}`);
  }
}

// 执行下载和生成版本信息
async function main() {
  await downloadAll();
  generateVersionInfo();
}

main();
