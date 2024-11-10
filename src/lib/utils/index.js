const XLSX = require('xlsx');
const git = require("./git");
const fs = require('fs');

// 创建表头
function getBooksHeader(args, supportLanguage, version) {
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

function exists (path) {
    let has;
    try{
        has = !!fs.statSync(path);
    }catch (e) {
        has = false;
    }
    return has;
}

// 导出表
async function createBooksData(args, brand, {outputXlsxPath, supportLanguage, version}) {
    const data = getBooksHeader(args, supportLanguage, version);
    // 将数组转换为工作表
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 创建一个新的工作簿
    const workbook = XLSX.utils.book_new();

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // 导出为 Excel 文件
    const branchName = await git.getBrandName(); // 测试的文件名
    const fileName = branchName.split('_');
    let xlsFilePath = `${outputXlsxPath}/`;
    if (Object.keys(brand).length ) {
        xlsFilePath += `keys_${fileName[1] || branchName}_${brand}.xlsx`;
    } else {
        xlsFilePath += `keys_${fileName[1] || branchName}.xlsx`;
    }


    XLSX.writeFile(workbook, xlsFilePath);
    console.log('create XLSX success! file path: ' + xlsFilePath);
}


module.exports = {
    createBooksData,
    exists,
}