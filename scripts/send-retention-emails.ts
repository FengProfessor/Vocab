import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local for local testing
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { createServiceClient, fetchAllRows, Profile, UserGamification } from '../src/lib/supabase';
import { sendEmail, activeUserHtml, lowEngagementHtml, churningUserHtml, registeredOnlyHtml } from '../src/lib/email';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('🚀 Bắt đầu kịch bản phân loại người dùng và gửi email retention...');
  if (DRY_RUN) console.log('⚠️ ĐANG CHẠY Ở CHẾ ĐỘ DRY-RUN (không gửi email thực sự).');

  const supabase = createServiceClient();

  // Lấy tất cả Profiles
  console.log('📦 Đang tải dữ liệu profiles...');
  const profiles = await fetchAllRows<Profile>((from, to) =>
    supabase.from('profiles').select('*').range(from, to)
  );
  console.log(`✅ Lấy được ${profiles.length} profiles.`);

  // Lấy tất cả User Gamification
  console.log('📦 Đang tải dữ liệu gamification...');
  const gamifications = await fetchAllRows<UserGamification>((from, to) =>
    supabase.from('user_gamification').select('*').range(from, to)
  );
  console.log(`✅ Lấy được ${gamifications.length} bản ghi gamification.`);

  // Tạo map để tra cứu nhanh gamification theo user_id
  const gamiMap = new Map<string, UserGamification>();
  for (const g of gamifications) {
    gamiMap.set(g.user_id, g);
  }

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const segments = {
    active: [] as Profile[],
    low_engagement: [] as Profile[],
    churning: [] as Profile[],
    registered_only: [] as Profile[],
  };

  // Phân loại user
  for (const profile of profiles) {
    if (!profile.email) continue; // Bỏ qua nếu không có email

    const gami = gamiMap.get(profile.id);
    let lastActiveDays = Infinity;
    
    if (gami && gami.last_active_date) {
      const lastActive = new Date(gami.last_active_date);
      lastActiveDays = (now.getTime() - lastActive.getTime()) / dayMs;
    }

    const totalXp = gami?.total_xp || 0;

    if (totalXp === 0 || !gami) {
      segments.registered_only.push(profile);
    } else if (lastActiveDays <= 3 && totalXp > 0) {
      segments.active.push(profile);
    } else if (lastActiveDays > 3 && lastActiveDays <= 7 && totalXp > 0) {
      segments.low_engagement.push(profile);
    } else if (lastActiveDays > 7 && lastActiveDays <= 30 && totalXp > 0) {
      segments.churning.push(profile);
    }
  }

  console.log('\n📊 KẾT QUẢ PHÂN LOẠI:');
  console.log(`- Đang học (Active): ${segments.active.length}`);
  console.log(`- Ôn ít (Low Engagement): ${segments.low_engagement.length}`);
  console.log(`- Sắp rời (Churning): ${segments.churning.length}`);
  console.log(`- Chỉ đăng ký (Registered Only): ${segments.registered_only.length}`);

  if (DRY_RUN) {
    console.log('\n✅ Hoàn tất DRY-RUN. Thoát.');
    return;
  }

  console.log('\n✉️ BẮT ĐẦU GỬI EMAIL...');
  
  // Hàm trợ giúp để gửi email có trễ (tránh limit của Resend: 10 emails/sec)
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function processSegment(name: string, users: Profile[], subject: string, htmlGenerator: (name: string) => string) {
    console.log(`\n⏳ Đang xử lý nhóm: ${name} (${users.length} users)`);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const html = htmlGenerator(user.full_name);
      
      const res = await sendEmail(user.email, subject, html);
      
      if (res.error) {
        console.error(`❌ Lỗi gửi ${user.email}: ${res.error}`);
        failed++;
      } else {
        success++;
      }

      // Delay 100ms giữa mỗi email -> tối đa 10 email / giây
      await delay(100);
    }
    console.log(`✅ Nhóm ${name}: Gửi thành công ${success}, thất bại ${failed}.`);
  }

  await processSegment('Active', segments.active, 'Tuyệt vời! Bạn đang học rất tốt cùng LingoPro 🔥', activeUserHtml);
  await processSegment('Low Engagement', segments.low_engagement, 'LingoPro nhớ bạn quá! Ôn 5 phút mỗi ngày nhé 🥺', lowEngagementHtml);
  await processSegment('Churning', segments.churning, 'Đừng bỏ cuộc nhé! Tặng bạn mã giảm giá 30% gói Pro 🚀', churningUserHtml);
  await processSegment('Registered Only', segments.registered_only, 'Chào mừng đến với LingoPro! Bắt đầu bài học đầu tiên 🎉', registeredOnlyHtml);

  console.log('\n🎉 Hoàn tất toàn bộ chiến dịch gửi email chăm sóc người dùng!');
}

main().catch((err) => {
  console.error('❌ Bị lỗi:', err);
  process.exit(1);
});
