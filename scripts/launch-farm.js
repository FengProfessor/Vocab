/**
 * LingoPro Bot Farm Launcher
 * Tự động mở hàng loạt tài khoản Chrome để cào AI Studio.
 * Cách dùng: node scripts/launch-farm.js
 */
const { exec } = require('child_process');
const path = require('path');

// Danh sách các Profile bạn muốn chạy (Tên thư mục trong User Data)
const PROFILES = [
    'Default',
    'Profile 1',
    'Profile 5',
    'Profile 7',
    'Profile 14',
    'Profile 15',
    'Profile 16',
    'Profile 17',
    'Profile 19',
    'Profile 20',
    'Profile 21',
    'Profile 23',
    'Profile 25'
];

// Cấu hình URL (AI Studio mới với cờ tự chạy)
const TARGET_URL = 'https://aistudio.google.com/app/prompts/new#autostart';

// Đường dẫn Chrome (Mặc định Windows)
const CHROME_PATH = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';

function launchProfile(profileName, delay) {
    setTimeout(() => {
        console.log(`🚀 Đang mở tài khoản: ${profileName}...`);
        
        // Lệnh mở Chrome với Profile cụ thể
        const cmd = `${CHROME_PATH} --profile-directory="${profileName}" "${TARGET_URL}"`;
        
        exec(cmd, (error) => {
            if (error) {
                console.error(`❌ Lỗi khi mở ${profileName}:`, error.message);
            }
        });
    }, delay);
}

console.log("=== LINGOPRO BOT FARM STARTING ===");
console.log(`Phát hiện ${PROFILES.length} tài khoản chuẩn bị kích hoạt.`);

// Mở lần lượt mỗi cửa sổ cách nhau 5 giây để tránh treo máy
PROFILES.forEach((profile, index) => {
    launchProfile(profile, index * 5000);
});

console.log("\n[!] Lưu ý: Hãy chắc chắn bạn đã cài Tampermonkey và Script LingoPro trên các Profile này.");
console.log("[!] Nhấn Ctrl+C để dừng script launcher (Các cửa sổ Chrome đã mở vẫn sẽ tiếp tục chạy).");
