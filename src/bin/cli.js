const fs = require('fs');
const path = require('path');
const unescapeJs = require('unescape-js');
const git =  require('../lib/utils/git.js');
const config = require('../lib/config.js');

const { Command } = require('commander');
const program = new Command();

class CollectWords {
    constructor(args = {}) {
        const {
            outputPath,
            paths,
            fileTypes,
            exclude,
            sourcePath,
            sourceLanguage,
            reSitePath,
        } = config.config;
        this.outputPath = outputPath;
        this.paths = paths;
        this.fileTypes = fileTypes;
        this.exclude = exclude;
        this.sourcePath = sourcePath;
        this.sourceLanguage = sourceLanguage;
        if (reSitePath) { // 有需要动态重置path
            const {nPaths,nSourcePath, nOutputPath} = reSitePath(args);
            this.outputPath = nOutputPath;
            this.paths = nPaths;
            this.sourcePath = nSourcePath;
        }
    }

    checkFileType (fileName, types) {
        for(const index in types) {
            const type = types[index];
            if(fileName.endsWith(type)){
                return true;
            }
        }
        return false;
    };

    writeJSON(path, data) {
        let json = JSON.stringify(data, '', '\t');
        // 提取词条的时候，"" 做字符串转义 \"\" , '' 转义  \'\'
        json = json.replace(/_u0022/g,'\\u0022').replace(/_u0027/g,'\\u0027');
        fs.writeFileSync(path, json);
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
        const branchName = await git.getBrandName(); // 测试的文件名
        console.log(`branchName== ${branchName}`);
        const files = [];
        const root = path.resolve(process.cwd(), '');

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
                    if(!oldWords.includes(word)) {
                        newWords.push(word);
                    }
                });

                // 需要添加的词条
                let newAllKey = [];
                newWords.forEach((word) => {
                    // console.log('word==' + word);
                    newAllKey.push(word);
                });

                // 导出新增的词条json文件
                // 导出文件命名： keys_分支号
                const fileName = branchName.split('_');
                const newKeysFilePath = `${this.outputPath}/keys_${fileName[1] || branchName}.json`;

                console.log('新词条个数: ' + newAllKey.length);
                console.log('生成文件路径:' + newKeysFilePath);

                this.writeJSON(newKeysFilePath, newAllKey);
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
        const brand = options.name || ''; // 获取需要查询的品牌名
        console.log(`------- ${options.name} ------`);
        const collect = new CollectWords(brand);
        collect.start();
    });

program.parse(process.argv);