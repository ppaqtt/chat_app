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

        let ready = false;

        server.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);
            if (output.includes('服务器运行')) {
                ready = true;
                setTimeout(() => resolve(server), 500);
            }
        });

        server.stderr.on('data', (data) => {
            console.error('服务器错误:', data.toString());
        });

        server.on('error', (err) => {
            reject(err);
        });

        server.on('exit', (code) => {
            if (!ready) {
                console.error('\n❌ 聊天服务器启动失败 (退出码: ' + code + ')');
                console.error('💡 常见原因：尚未安装依赖。请在项目目录运行：');
                console.error('   npm install\n');
                rl.close();
                process.exit(1);
            }
        });

        // 兜底：若长时间未输出启动日志则继续，避免卡住
        setTimeout(() => {
            if (!ready) resolve(server);
        }, 5000);
    });
}

async function startTunnel(serverProcess) {
    console.log('\n🌐 启动内网穿透 (localtunnel)...');
    console.log('⏳ 等待生成公网地址...\n');

    let localtunnel;
    try {
        localtunnel = require('localtunnel');
    } catch (e) {
        console.log('⚠️  未安装 localtunnel，已跳过内网穿透。');
        console.log('   如需公网访问，请运行: npm install');
        console.log('   或使用 Cloudflare Tunnel: cloudflared tunnel --url http://localhost:3000\n');
        return null;
    }

    try {
        const tunnel = await Promise.race([
            localtunnel({ port: 3000 }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('连接超时（可能是网络问题）')), 20000)
            )
        ]);

        console.log('\n' + '='.repeat(60));
        console.log('🎉 启动成功！');
        console.log('='.repeat(60));
        console.log('\n📱 公网访问地址:');
        console.log(`   ${tunnel.url}\n`);
        console.log('💡 提示: 首次访问可能需要点击 "Click to Continue"');
        console.log('='.repeat(60) + '\n');

        tunnel.on('close', () => {
            console.log('ℹ️  内网穿透已关闭');
        });

        tunnel.on('error', (err) => {
            console.error('❌ localtunnel 错误:', err.message);
        });

        return tunnel;
    } catch (err) {
        console.error('❌ 内网穿透启动失败:', err.message);
        console.log('   （聊天服务器仍在运行，可仅使用局域网访问）\n');
        return null;
    }
}

async function cleanup(server, tunnel) {
    console.log('\n\n🛑 正在关闭服务...\n');
    
    if (tunnel) {
        tunnel.close();
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
        const tunnel = await startTunnel(server);

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
