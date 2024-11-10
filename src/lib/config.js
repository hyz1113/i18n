const path = require('path');
const utils = require('./utils');

// 读取文件基本配置
let config = {
    version: '0.0.1', // 导出的词条的版本号
    paths: ["./src/"], // 读取文件的目录
    sourcePath: "./src/source", // 旧的词条文件目录
    outputPath: "./src/output", // 新的输入的词条文件目录
    outputXlsxPath: "./src/excel", // 导出xlsx文件目录
    fileTypes: [".ts", ".js",'.tsx','.jsx', '.vue'], // 读取的文件类型
    exclude: ['assets', 'node_modules', 'tradingView'], // 忽略的目录
    sourceLanguage: 'en', // 默认读取的词条key 源语言
    supportLanguage: ['en', 'ar', 'ru', 'de', 'es', 'fr','hi', 'id','it', 'ja', 'ko', 'kk', 'mn', 'my', 'nl', 'pl','pt', 'th', 'vn', 'zh-CN', 'zh-TW']
}

// 检测自定义配置文件是否存在
const rc = path.resolve(process.cwd(), "./i18n-words-config.js");

if (utils.exists(rc)) {
    config = require(rc) || {};
}

module.exports = {
    config,
}