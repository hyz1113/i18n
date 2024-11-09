const XLSX = require('xlsx');
const config = require('../config.js');
const git = require("./git");


// 创建表头
function getBooksHeader(args) {
    // 表头内容
    const header = config.config.supportLanguage;
    // 表格数据
    const data = args.map((item, index) => {
        const rowData = {
            key: item,
            version: config.config.version,
        }
        header.forEach(headerItem => {
            rowData[headerItem] = ''
        })
        return rowData;
    });
    return [...data]; // 表头和表格数据合并
}


// 导出表
async function createBooksData(args, brand) {
    const data = getBooksHeader(args);
    // 将数组转换为工作表
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 创建一个新的工作簿
    const workbook = XLSX.utils.book_new();

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // 导出为 Excel 文件
    const branchName = await git.getBrandName(); // 测试的文件名
    const fileName = branchName.split('_');
    const xlsFilePath = `${config.config.outputXlsx}/keys_${fileName[1] || branchName}_${brand}_.xlsx`;

    XLSX.writeFile(workbook, xlsFilePath);
    console.log('create XLSX success! file path: ' + xlsFilePath);
}


module.exports = {
    createBooksData,
}