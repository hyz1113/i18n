const fs = require('fs');
const path = require('path');
const unescapeJs = require('unescape-js');
const { Command } = require('commander');
const program = new Command();
const XLSX = require('xlsx');
const { exec } = require('child_process');
// 读取文件基本配置
let config = {
    version: '0.0.1', // 导出的词条的版本号
    paths: ["./src"], // 读取文件的目录
    sourcePath: "./src/source", // 旧的词条文件目录
    outputPath: "./src/en/output", // 新的输入的词条文件目录
    outputXlsxPath: "./src/en/excel", // 导出xlsx文件目录
    fileTypes: [".ts", ".js",'.tsx','.jsx', '.vue'], // 读取的文件类型
    exclude: ['assets', 'node_modules', 'tradingView'], // 忽略的目录
    sourceLanguage: 'en', // 默认读取的词条key 源语言
    supportLanguage: ['en', 'ar', 'ru', 'de', 'es', 'fr','hi', 'id','it', 'ja', 'ko', 'kk', 'mn', 'my', 'nl', 'pl','pt', 'th', 'vn', 'zh-CN', 'zh-TW']
}

function exists (path) {
    let has;
    try{
        has = !!fs.statSync(path);
    }catch (e) {
        has = false;
    }
    return has;
}


class CollectWords {
    constructor(config, args = {}) {
        const {
            outputPath,
            paths,
            fileTypes,
            exclude,
            sourcePath,
            sourceLanguage,
            reSitePath,
            outputXlsxPath,
            version,
            supportLanguage,
        } = config;
        this.outputPath = outputPath;
        this.paths = paths;
        this.fileTypes = fileTypes;
        this.exclude = exclude;
        this.sourcePath = sourcePath;
        this.sourceLanguage = sourceLanguage;
        this.supportLanguage = supportLanguage;
        this.outputXlsxPath = outputXlsxPath;
        this.brand = args;
        this.version = version;
        if (reSitePath) { // 有需要动态重置path
            const {nPaths,nSourcePath, nOutputPath, nOutputXlsxPath} = reSitePath(args);
            this.outputPath = `${nOutputPath}`;
            this.paths = nPaths;
            this.sourcePath = nSourcePath;
            this.outputXlsxPath = nOutputXlsxPath;
        }
    }


    // 创建表头
    getBooksHeader(args, supportLanguage, version) {
        // 表头内容
        const header = supportLanguage;
        // 表格数据
        const data = args.map((item, index) => {
            const rowData = {
                key: item,
                version: version,
            }
            header.forEach(headerItem => {
                rowData[headerItem] = ''
            })
            return rowData;
        });
        return [...data]; // 表头和表格数据合并
    }

    // 导出表
    async createBooksData(args, brand, {outputXlsxPath, supportLanguage, version}) {
        const data = this.getBooksHeader(args, supportLanguage, version);
        // 将数组转换为工作表
        const worksheet = XLSX.utils.json_to_sheet(data);

        // 创建一个新的工作簿
        const workbook = XLSX.utils.book_new();

        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // 导出为 Excel 文件
        const branchName = await this.getBrandName(); // 测试的文件名
        const fileName = branchName.split('_');
        let xlsFilePath = `${outputXlsxPath}/`;
        if (Object.keys(brand).length ) {
            xlsFilePath += `keys_${fileName[1] || branchName}_${brand}.xlsx`;
        } else {
            xlsFilePath += `keys_${fileName[1] || branchName}.xlsx`;
        }


        if(this.mkDirs(this.outputXlsxPath)) { // 目录存在 || 创建目录完成
            XLSX.writeFile(workbook, xlsFilePath);
            console.log('create XLSX success! file path: ' + xlsFilePath);
        } else {
            console.log('create xlsx fail !');
        }
    }


    getBrandName () {
        return new Promise((resolve, reject) => {
            exec('git symbolic-ref --short -q HEAD', function(error, stdout, stderr){
                if(error) {
                    reject(error);
                }else{
                    resolve(stdout.split('\n')[0]);
                }
            });
        });
    };

    checkFileType (fileName, types) {
        for(const index in types) {
            const type = types[index];
            if(fileName.endsWith(type)){
                return true;
            }
        }
        return false;
    };

    mkDirs(dirname) {
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (this.mkDirs(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    };

    writeJSON(path, data) {
        let json = JSON.stringify(data, '', '\t');
        // 提取词条的时候，"" 做字符串转义 \"\" , '' 转义  \'\'
        json = json.replace(/_u0022/g,'\\u0022').replace(/_u0027/g,'\\u0027');
        console.log("this.outputPath ===" + this.outputPath);
        if(this.mkDirs(this.outputPath)) { // 目录存在 || 创建目录完成
            fs.writeFileSync(path, json);
            console.log('-----success!--');
        }
    };

    // 异步读取文件
    readDirSync (path, types, exclude = []) {
        const dirTemp = [];
        const _readDirSync = (path) => {
            let pa = fs.readdirSync(path);
            for(let ele of pa) {
                const readFilePath = `${path}/${ele}`;
                let info = fs.statSync(readFilePath);
                if(info.isDirectory()){
                    if(exclude.includes(ele)) continue;
                    _readDirSync(readFilePath);
                }else{
                    if(types && types.length) {
                        const checked = this.checkFileType(ele, types);
                        if(checked) {
                            // console.log('符合条件的文件 ' + readFilePath);
                            dirTemp.push(readFilePath);
                        }
                    }else{
                        dirTemp.push(readFilePath);
                    }
                }
            }
        };
        _readDirSync(path);
        return dirTemp;
    }

    async start() {
        const branchName = await this.getBrandName(); // 分支号
        const files = [];
        const root = path.resolve(process.cwd(), '');

        console.log(this.paths);
        this.paths.forEach((d) => {
            const dir = path.resolve(root, `${d}`);
            const pathFiles = this.readDirSync(dir, this.fileTypes, this.exclude);
            files.push(...pathFiles);
        });

        const words = []; // 文件中的词条
        let oldWords = []; // 以前提上去的词条
        const newWords = []; //  新的词条

        const pushWord = (key) => {
            if(['(.+?)','(.*?)'].includes(key) || words.includes(key)) return;
            words.push(key);
        }

        // 获取项目中所有的词条
        files.forEach((file) => {
            const data = fs.readFileSync(file);
            data.toString().replace(/\$t\('([^']*)'\)/g, (_, $1, $2) => {
                pushWord(unescapeJs($1));
            });
        });

        // 旧词条【之前提交的提条】
        const oldKeysPath = `${this.sourcePath}/${this.sourceLanguage}.json`;
        fs.readFile(oldKeysPath, 'utf8', (err, data) => {
            if (err) {
                console.error('读取文件出错:', err);
                return;
            }
            try {
                // 解析 JSON 数据
                const jsonData = JSON.parse(data);

                // 获取所有键值
                oldWords = Object.keys(jsonData);
                console.log('旧词条个数:', oldWords.length);

                // 本地新增的词条
                words.forEach((word) => {
                    if(!oldWords.includes(word)) { // 对比之前的词条，去重
                        newWords.push(word);
                    }
                });

                // 需要添加的词条
                let newAllKey = [];
                newWords.forEach((word) => {
                    newAllKey.push(word);
                });

                // 导出新增的词条json文件
                // 导出文件命名： keys_分支号
                const fileName = branchName.split('_');
                const newKeysFilePath = `${this.outputPath}/keys_${fileName[1] || branchName}.json`;

                console.log('新词条个数: ' + newAllKey.length);
                console.log('生成文件路径:' + newKeysFilePath);

                this.writeJSON(newKeysFilePath, newAllKey);
                // 导出xlsx 文件
                this.createBooksData(newAllKey, this.brand, {
                    outputXlsxPath: this.outputXlsxPath,
                    supportLanguage: this.supportLanguage,
                    version: this.version
                });
            } catch (parseErr) {
                console.error('解析JSON 时出错:', parseErr);
            }
        });

    }
}

program
    .version('1.0.0')
    .description('收集品牌对应词条的命令行工具')
    .option('-n, --name <type>', '品牌名')
    .action((options) => {
        const brand = options.name || {}; // 获取需要查询的品牌名
        console.log(`------- 品牌 ${ Object.keys(brand).length ? brand : '--'} ------`);
        // 检测自定义配置文件是否存在
        const rc = path.resolve(process.cwd(), "./i18n-words-config.js");
        let readConfig;
        if (exists(rc)) {
            readConfig = require(rc) || {};
            readConfig = readConfig.config;
            config = readConfig;
        }
        const collect = new CollectWords(config, brand);
        collect.start();
    });

program.parse(process.argv);