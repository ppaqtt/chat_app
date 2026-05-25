
const fs = require('fs');
const content = fs.readFileSync('/workspace/app.js', 'utf-8');
const lines = content.split('\n');

const functionNames = new Map();
const duplicates = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    
    // 匹配函数声明
    match = line.match(/^\s*function\s+(\w+)\s*\(/);
    if (!match) {
        match = line.match(/^\s*async\s+function\s+(\w+)\s*\(/);
    }
    
    if (match) {
        const funcName = match[1];
        if (functionNames.has(funcName)) {
            duplicates.push({
                name: funcName,
                first: functionNames.get(funcName),
                second: i + 1
            });
        } else {
            functionNames.set(funcName, i + 1);
        }
    }
}

if (duplicates.length > 0) {
    console.log('发现重复的函数声明：');
    duplicates.forEach(dup => {
        console.log(`${dup.name}: 第 ${dup.first} 行和第 ${dup.second} 行`);
    });
} else {
    console.log('没有发现重复的函数声明');
}
