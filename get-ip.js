
const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    let ips = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({
                    interface: name,
                    address: iface.address
                });
            }
        }
    }
    
    return ips;
}

const localIPs = getLocalIP();

console.log('本机 IP 地址列表：');
console.log('====================');

localIPs.forEach((ip, index) => {
    console.log(`${index + 1}. ${ip.interface} - ${ip.address}`);
    console.log(`   局域网访问地址: http://${ip.address}:3000`);
    console.log('');
});

if (localIPs.length === 0) {
    console.log('未找到可用的 IP 地址，请检查网络连接。');
} else {
    console.log('选择其中一个 IP 地址，供局域网内其他设备访问！');
}
