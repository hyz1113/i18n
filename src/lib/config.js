// 读取文件基本配置
const config = {
    paths: ["./src/"], // 读取文件的目录
    sourcePath: "./src/source/", // 旧的词条文件路径
    outputPath: "./src/output/", // 新的输入的词条文件路径
    fileTypes: [".ts", ".js",'.tsx','.jsx', '.vue'], // 读取的文件类型
    exclude: ['assets', 'node_modules', 'tradingView'], // 忽略的路径
    sourceLanguage: 'en', // 默认读取的词条key 源语言
}

module.exports = {
    config,
}