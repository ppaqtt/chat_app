const { spawn } = require('child_process');
const readline = require('readline');

const PORT = 3000;

console.log('🚀 启动聊天应用...\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startServer() {
    return new Promise((resolve, reject) => {
        console.log('📡 启动聊天服务器 (端口 ' + PORT + ')...');
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

function commandExists(cmd) {
    return new Promise((resolve) => {
        let done = false;
        const child = spawn(cmd, ['--version'], { stdio: 'ignore' });
        child.on('error', () => {
            if (!done) { done = true; resolve(false); }
        });
        child.on('exit', (code) => {
            if (!done) { done = true; resolve(code === 0); }
        });
    });
}

function printSuccess(url, note) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 启动成功！');
    console.log('='.repeat(60));
    console.log('\n📱 公网访问地址:');
    console.log(`   ${url}\n`);
    console.log('💡 提示: ' + note);
    console.log('='.repeat(60) + '\n');
}

// 方案一：Cloudflare Tunnel（推荐，优先使用）
async function startCloudflareTunnel() {
    console.log('\n🌐 启动内网穿透 (Cloudflare Tunnel)...');
    console.log('⏳ 等待生成公网地址...\n');

    const installed = await commandExists('cloudflared');
    if (!installed) {
        console.log('ℹ️  未检测到 cloudflared，改用 localtunnel...');
        console.log('   （安装后可自动使用：winget install --id Cloudflare.cloudflared）');
        return null;
    }

    return new Promise((resolve) => {
        const proc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${PORT}`], {
            cwd: __dirname,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let settled = false;
        const urlRe = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

        const onData = (data) => {
            const match = data.toString().match(urlRe);
            if (match && !settled) {
                settled = true;
                printSuccess(match[0], '该地址为临时地址，重启后会变化');
                resolve({ close: () => proc.kill(), kind: 'cloudflare' });
            }
        };

        proc.stdout.on('data', onData);
        proc.stderr.on('data', onData);

        proc.on('error', () => {
            if (!settled) { settled = true; resolve(null); }
        });

        proc.on('exit', (code) => {
            if (!settled) {
                settled = true;
                console.log('⚠️  Cloudflare Tunnel 已退出 (退出码: ' + code + ')，尝试其他方式...');
                resolve(null);
            }
        });

        // 超时保护，避免网络不通时一直卡住
        setTimeout(() => {
            if (!settled) {
                settled = true;
                console.log('⚠️  Cloudflare Tunnel 连接超时，尝试其他方式...');
                proc.kill();
                resolve(null);
            }
        }, 25000);
    });
}

// 方案二：localtunnel（备用）
async function startLocaltunnel() {
    console.log('\n🌐 启动内网穿透 (localtunnel)...');
    console.log('⏳ 等待生成公网地址...\n');

    let localtunnel;
    try {
        localtunnel = require('localtunnel');
    } catch (e) {
        console.log('⚠️  未安装 localtunnel，已跳过。');
        return null;
    }

    try {
        const tunnel = await Promise.race([
            localtunnel({ port: PORT }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('连接超时（可能是网络问题）')), 20000)
            )
        ]);

        printSuccess(tunnel.url, '首次访问可能需要点击 "Click to Continue"');

        tunnel.on('close', () => {
            console.log('ℹ️  内网穿透已关闭');
        });

        tunnel.on('error', (err) => {
            console.error('❌ localtunnel 错误:', err.message);
        });

        return { close: () => tunnel.close(), kind: 'localtunnel' };
    } catch (err) {
        console.error('❌ localtunnel 启动失败:', err.message);
        return null;
    }
}

async function startTunnel() {
    const cloudflare = await startCloudflareTunnel();
    if (cloudflare) return cloudflare;

    const localtunnel = await startLocaltunnel();
    if (localtunnel) return localtunnel;

    console.log('\n⚠️  未能建立公网访问，聊天服务器仍在运行。');
    console.log('   可仅使用局域网访问，或参考 README 手动配置 Cloudflare Tunnel。\n');
    return null;
}

async function cleanup(server, tunnel) {
    console.log('\n\n🛑 正在关闭服务...\n');

    if (tunnel) {
        try { tunnel.close(); } catch (e) { /* ignore */ }
        console.log('✅ 内网穿透已关闭');
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
        const tunnel = await startTunnel();

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
