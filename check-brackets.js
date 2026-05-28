
const fs = require('fs');
const content = fs.readFileSync('/workspace/app.js', 'utf-8');

let balance = 0;
let lineCount = 0;
const lines = content.split('\n');
const problems = [];

for (let line of lines) {
    lineCount++;
    for (let char of line) {
        if (char === '{') {
            balance++;
        } else if (char === '}') {
            balance--;
        }
    }
    if (balance < 0) {
        problems.push({ line: lineCount, balance: balance, content: line.trim() });
    }
}

console.log(`Final balance: ${balance}`);
console.log(`Total lines: ${lineCount}`);

if (problems.length > 0) {
    console.log('\nNegative balance found at:');
    problems.forEach(p => {
        console.log(`Line ${p.line}: balance=${p.balance} - ${p.content}`);
    });
} else {
    console.log('\nNo negative balance found. Looking for unclosed braces...');
    
    // Find where balance increases but never decreases back
    balance = 0;
    lineCount = 0;
    for (let line of lines) {
        lineCount++;
        for (let char of line) {
            if (char === '{') {
                balance++;
            } else if (char === '}') {
                balance--;
            }
        }
        if (balance > 5) {
            console.log(`Line ${lineCount}: high balance ${balance}`);
        }
    }
}
