const { spawn, exec } = require('child_process');
const readline = require('readline');

console.log('🚀 启动聊天应用...\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function startServer() {
    return new Promise((resolve, reject) => {
        console.log('📡 启动聊天服务器 (端口 3000)...');
        const server = spawn('node', ['server.js'], {
            cwd: __dirname,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        server.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);
            if (output.includes('服务器运行')) {
                setTimeout(() => resolve(server), 1000);
            }
        });

        server.stderr.on('data', (data) => {
            console.error('服务器错误:', data.toString());
        });

        setTimeout(() => resolve(server), 2000);
    });
}

async function startLocaltunnel(serverProcess) {
    return new Promise((resolve) => {
        console.log('\n🌐 启动内网穿透 (localtunnel)...');
        console.log('⏳ 等待生成公网地址...\n');

        const tunnel = spawn('lt', ['--port', '3000'], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let urlFound = false;

        tunnel.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('your url is:')) {
                const url = output.match(/https:\/\/[^\s]+/)[0];
                console.log('\n' + '='.repeat(60));
                console.log('🎉 启动成功！');
                console.log('='.repeat(60));
                console.log('\n📱 公网访问地址:');
                console.log(`   ${url}\n`);
                console.log('💡 提示: 首次访问可能需要点击 "Click to Continue"');
                console.log('='.repeat(60) + '\n');
                urlFound = true;
                resolve(tunnel);
            }
        });

        tunnel.stderr.on('data', (data) => {
            const output = data.toString();
            if (output.includes('error') || output.includes('Error')) {
                console.error('❌ localtunnel 错误:', output);
            }
        });

        setTimeout(() => {
            if (!urlFound) {
                console.log('⏳ 正在等待 localtunnel 响应...');
            }
        }, 3000);
    });
}

async function cleanup(server, tunnel) {
    console.log('\n\n🛑 正在关闭服务...\n');
    
    if (tunnel) {
        tunnel.kill();
        console.log('✅ localtunnel 已关闭');
    }
    
    if (server) {
        server.kill();
        console.log('✅ 聊天服务器已关闭');
    }
    
    rl.close();
    process.exit(0);
}

async function main() {
    try {
        const server = await startServer();
        const tunnel = await startLocaltunnel(server);

        console.log('📌 按 Ctrl+C 停止所有服务\n');

        process.on('SIGINT', () => cleanup(server, tunnel));
        process.on('SIGTERM', () => cleanup(server, tunnel));

    } catch (error) {
        console.error('❌ 启动失败:', error);
        rl.close();
        process.exit(1);
    }
}

main();
