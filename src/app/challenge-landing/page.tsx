import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Zap, TrendingDown, CheckCircle2, RefreshCcw, Award, ArrowRight, Play, MessageSquareQuote, XCircle, Flame, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Thử Thách Tiếng Anh 180 Ngày | LingoPro',
  description: 'Thử thách học tiếng Anh dành cho sinh viên và người đi làm. Xây dựng thói quen, luyện thi TOEIC, học từ vựng tiếng Anh với phương pháp ôn tập thông minh. Hoàn tiền 100% khi hoàn thành!',
  keywords: ['học tiếng Anh', 'luyện thi TOEIC', 'từ vựng tiếng Anh', 'phương pháp ôn tập thông minh', 'ứng dụng học tiếng Anh', 'sinh viên'],
};

const chang1 = [
  { id: 1, vi: "Gia đình & Bản thân", en: "Family & Self", count: 75, icon: "👨‍👩‍👧‍👦" },
  { id: 2, vi: "Thời gian & Lịch trình", en: "Time & Calendar", count: 75, icon: "⏰" },
  { id: 3, vi: "Đồ ăn & Thức uống", en: "Food & Drinks", count: 75, icon: "🍳" },
  { id: 4, vi: "Nhà cửa & Đồ gia dụng", en: "Home & Appliances", count: 75, icon: "🏠" },
  { id: 5, vi: "Trường học & Học tập", en: "School & Study", count: 75, icon: "📚" },
  { id: 6, vi: "Cơ thể & Sức khỏe căn bản", en: "Body & Basic Health", count: 75, icon: "💪" },
  { id: 7, vi: "Quần áo & Thời trang", en: "Clothes & Daily Wear", count: 75, icon: "👕" },
  { id: 8, vi: "Động vật & Thiên nhiên", en: "Animals & Nature", count: 75, icon: "🐾" },
  { id: 9, vi: "Mua sắm & Tiền bạc cơ bản", en: "Shopping & Money", count: 75, icon: "🛒" },
];

const chang2 = [
  { id: 1, vi: "Công sở & Nghề nghiệp", en: "Office & Careers", count: 84, icon: "💼" },
  { id: 2, vi: "Công nghệ số & Thiết bị", en: "Digital Tech & Devices", count: 84, icon: "💻" },
  { id: 3, vi: "Du lịch, Sân bay & Khách sạn", en: "Travel, Airport & Hotel", count: 84, icon: "✈️" },
  { id: 4, vi: "Nhà hàng, Ẩm thực & Nấu nướng", en: "Restaurant & Culinary", count: 84, icon: "🍽️" },
  { id: 5, vi: "Cảm xúc & Tính cách", en: "Feelings & Personality", count: 83, icon: "🧠" },
  { id: 6, vi: "Môi trường & Khí hậu", en: "Environment & Climate", count: 83, icon: "🌍" },
  { id: 7, vi: "Thể thao & Thể hình", en: "Sports & Fitness", count: 83, icon: "🏆" },
  { id: 8, vi: "Mối quan hệ & Giao tiếp", en: "Relationships & Socializing", count: 83, icon: "🤝" },
  { id: 9, vi: "Dịch vụ & Mua sắm trực tuyến", en: "Online Shopping & Services", count: 83, icon: "📦" },
  { id: 10, vi: "Sức khỏe, Bệnh viện & Y tế", en: "Healthcare & Medicine", count: 83, icon: "🏥" },
];

const chang3 = [
  { id: 1, vi: "Kinh doanh & Thương mại", en: "Business, Trade & Markets", count: 84, icon: "📈" },
  { id: 2, vi: "Giáo dục đại học & Đào tạo", en: "Higher Education & Training", count: 84, icon: "🎓" },
  { id: 3, vi: "Khoa học, Đổi mới & AI", en: "Science, Innovation & AI", count: 84, icon: "🔬" },
  { id: 4, vi: "Xã hội học & Đô thị hóa", en: "Sociology & Urban Life", count: 84, icon: "🏙️" },
  { id: 5, vi: "Văn hóa, Lịch sử & Nghệ thuật", en: "Culture, History & Arts", count: 83, icon: "🎭" },
  { id: 6, vi: "Tâm lý học & Động lực", en: "Psychology & Human Behavior", count: 83, icon: "🧘" },
  { id: 7, vi: "Tài chính cá nhân & Đầu tư", en: "Personal Finance & Investment", count: 83, icon: "💎" },
  { id: 8, vi: "Pháp luật & Chính sách", en: "Law, Rights & Policy", count: 83, icon: "⚖️" },
  { id: 9, vi: "Kỹ năng thuyết trình & Tranh biện", en: "Presentation & Debating", count: 83, icon: "🎤" },
  { id: 10, vi: "Tư duy phản biện", en: "Critical Thinking & Problem Solving", count: 83, icon: "🧩" },
];

const TopicCard = ({ topic }: { topic: any }) => (
  <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 mb-3 hover:shadow-md transition-shadow cursor-default">
    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-xl shrink-0">
      {topic.icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-slate-800 text-[13px] leading-tight truncate mb-0.5">{topic.id}. {topic.vi}</div>
      <div className="text-slate-500 text-[11px] truncate">{topic.en}</div>
    </div>
    <div className="text-[11px] font-bold text-slate-500 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md shrink-0">
      {topic.count} từ
    </div>
  </div>
);

export default function ChallengeLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="absolute inset-0 z-0">
          {/* Nửa trên (Top-Right): Thành tích, đỗ đạt */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          >
            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop" 
              alt="Thành tích, đỗ đạt" 
              className="w-full h-full object-cover blur-[2px] opacity-40 scale-105"
            />
          </div>

          {/* Nửa dưới góc trái (Bottom-Left): Góc chụp từ trên xuống bàn học */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
          >
            <img 
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop" 
              alt="Bàn học từ trên xuống" 
              className="w-full h-full object-cover blur-[2px] opacity-40 scale-105"
            />
          </div>
          
          {/* Đường chéo phân cách mờ */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(245,158,11,0.2)" strokeWidth="0.3" />
            </svg>
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900 z-10"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs tracking-widest uppercase mb-8 animate-fade-in-up">
            <Flame className="w-4 h-4" />
            <span>Đăng ký hôm nay - Bắt đầu học từ 00:00 ngày mai</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            Kiên Trì Mỗi Ngày.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Bứt Phá Tiếng Anh.
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Thử thách giúp sinh viên và người mới học duy trì thói quen học tiếng Anh mỗi ngày qua <strong className="text-white">sự cam kết mục tiêu</strong>. Hoàn thành 100% lộ trình, nhận lại toàn bộ tiền tham gia + Tặng thêm tài khoản Premium.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="#pricing">
              <Button size="lg" className="h-14 px-10 text-lg font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-600 text-white rounded-full shadow-lg shadow-orange-900/50 transition-all hover:-translate-y-1 border-0 uppercase tracking-wide">
                Đăng ký ngay <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#roadmap">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-full border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm transition-all">
                Xem lộ trình
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. PAIN POINTS & SOLUTION */}
      <section className="py-16 bg-white relative -mt-10 rounded-t-[40px] z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Nỗi đau */}
            <div>
              <div className="inline-block bg-red-100 text-red-600 font-bold text-xs tracking-widest uppercase px-3 py-1 rounded-full mb-4">
                Bạn có thấy quen không?
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-6 leading-tight">
                Tại sao chúng ta thường dễ nản chí khi học từ vựng tiếng Anh?
              </h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-base mb-1 text-slate-800">Thiếu động lực duy trì</strong>
                    <p className="text-slate-600 text-sm">Đăng ký khoá học lúc hứng thú, nhưng bận rộn bài vở trên trường khiến bạn dễ lùi lịch học rồi... bỏ quên luôn.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-base mb-1 text-slate-800">Học trước quên sau</strong>
                    <p className="text-slate-600 text-sm">Cố gắng chép từ vựng kín cả trang giấy nhưng hôm sau lại quên sạch. Học nhiều nhưng thiếu phương pháp ôn tập hợp lý.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-base mb-1 text-slate-800">Khó giữ thói quen đều đặn</strong>
                    <p className="text-slate-600 text-sm">Luôn tự nhủ &quot;Để thi xong rồi học&quot;. Chờ đợi thời gian rảnh rỗi khiến việc nâng cao vốn từ vựng bị trì hoãn mãi.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Giải pháp */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[28px] text-white shadow-2xl relative overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="inline-block bg-indigo-500/30 text-indigo-200 font-bold text-[11px] tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-400/30 mb-5">
                  Giải pháp từ LingoPro
                </div>
                <h3 className="text-2xl font-black mb-4">Cam Kết Học Tập - Động Lực Từ Chính Bạn.</h3>
                <p className="text-indigo-100 text-base leading-relaxed mb-6">
                  LingoPro Challenge không bán những khoá học nhàm chán. Đây là thử thách giúp bạn xây dựng thói quen tự học. Bằng cách dùng một khoản tiền nhỏ để cam kết mục tiêu, bạn sẽ có thêm lý do mở app mỗi ngày. Học tiếng Anh đều đặn, bạn tiến gần hơn tới việc lấy lại 100% phần thưởng học phí!
                </p>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <Clock className="w-6 h-6 text-amber-400" />
                  <span className="font-bold text-sm">Chỉ cần 15 phút tập trung ôn luyện mỗi ngày.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ROADMAP: 3 COLUMNS ANIMATED (COMPACT) */}
      <section id="roadmap" className="py-16 bg-slate-50 relative overflow-hidden border-t border-slate-200">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scrollUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          @keyframes scrollDown {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0); }
          }
          .animate-scroll-up {
            animation: scrollUp 30s linear infinite;
          }
          .animate-scroll-down {
            animation: scrollDown 30s linear infinite;
          }
          .animate-scroll-up:hover, .animate-scroll-down:hover {
            animation-play-state: paused;
          }
        `}} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <span className="text-indigo-600 font-bold text-xs tracking-widest uppercase mb-2 block">Lộ trình học từ vựng thực tế</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
              Đọc hiểu &gt;80% nội dung Tiếng Anh<br/>với lộ trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">3000 Từ Vựng</span>
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Hệ thống phân chia 3000 từ vựng cốt lõi thành 3 chặng từ cơ bản đến nâng cao. 
              Bạn sẽ vượt qua hàng chục chủ đề thực tế trong 180 ngày.
            </p>
          </div>

          <div className="bg-slate-100/50 p-2 rounded-[24px] shadow-inner border border-slate-200/60">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Headers */}
              <div className="bg-white py-2.5 text-center rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
                <div className="font-black text-indigo-700 uppercase tracking-widest text-[12px]">Chặng 1: Nền Tảng</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">12 Chủ đề • 1000 Từ</div>
              </div>
              <div className="bg-white py-2.5 text-center rounded-xl shadow-sm border border-slate-200 relative overflow-hidden hidden md:block">
                <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
                <div className="font-black text-blue-700 uppercase tracking-widest text-[12px]">Chặng 2: Tăng Tốc</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">12 Chủ đề • 1000 Từ</div>
              </div>
              <div className="bg-white py-2.5 text-center rounded-xl shadow-sm border border-slate-200 relative overflow-hidden hidden md:block">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                <div className="font-black text-amber-700 uppercase tracking-widest text-[12px]">Chặng 3: Bứt Phá</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">10 Chủ đề • 1000 Từ</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 h-[380px] overflow-hidden relative mt-3">
              {/* Fade overlays for smooth scrolling illusion */}
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-slate-50 to-transparent z-20 pointer-events-none"></div>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent z-20 pointer-events-none"></div>

              {/* Col 1 */}
              <div className="relative px-1">
                <div className="animate-scroll-up">
                  {[...chang1, ...chang1].map((topic, i) => <TopicCard key={`c1-${i}`} topic={topic} />)}
                </div>
              </div>

              {/* Col 2 */}
              <div className="relative px-1 hidden md:block">
                <div className="animate-scroll-down">
                  {[...chang2, ...chang2].map((topic, i) => <TopicCard key={`c2-${i}`} topic={topic} />)}
                </div>
              </div>

              {/* Col 3 */}
              <div className="relative px-1 hidden md:block">
                <div className="animate-scroll-up" style={{ animationDuration: '35s' }}>
                  {[...chang3, ...chang3].map((topic, i) => <TopicCard key={`c3-${i}`} topic={topic} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHUỖI CƠ CHẾ "DEGRADING REWARD" */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[40px] p-8 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"></div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <span className="text-amber-400 font-bold text-sm tracking-widest uppercase mb-3 block">Cơ chế Bảo vệ chuỗi học</span>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">Nếu bận thi, lỡ quên 1 ngày thì sao?</h2>
                <p className="text-slate-300 mb-8 leading-relaxed">
                  Sinh viên đôi lúc sẽ bận rộn thi cử. Vì vậy, chúng tôi áp dụng <strong>Quyền Hồi Phục</strong>:
                </p>
                <ul className="space-y-6">
                  <li className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                      <TrendingDown className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <strong className="block text-xl text-amber-400 mb-1">Thưởng giảm nhẹ</strong>
                      <span className="text-slate-400 text-sm leading-relaxed">Mỗi ngày bạn quên học, số tiền thưởng (bonus) sẽ giảm đi một chút. Điều này nhắc nhở bạn cố gắng duy trì nhịp độ.</span>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                      <RefreshCcw className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <strong className="block text-xl text-blue-400 mb-1">3 Lần Hồi Phục (Gói 3 Tháng)</strong>
                      <span className="text-slate-400 text-sm leading-relaxed">Bạn được phép &quot;vắng mặt&quot; tối đa 3 lần. Nếu quên nhiều hơn, thử thách sẽ khép lại và không được hoàn tiền.</span>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700 shadow-inner">
                <h3 className="text-lg font-bold mb-6 text-center text-white uppercase tracking-wider">Minh họa Gói 3 Tháng (300k)</h3>
                <div className="space-y-3 font-medium text-sm">
                  <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <span className="text-white">0 lần quên</span>
                    <span className="text-green-400 font-bold">Hoàn 100k + 6 Tháng Pro</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                    <span className="text-slate-400">1 lần quên</span>
                    <span className="text-slate-300">Hoàn ~66k + 5 Tháng Pro</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                    <span className="text-slate-400">2 lần quên</span>
                    <span className="text-slate-300">Hoàn ~33k + 4 Tháng Pro</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900/50 border border-amber-500/30">
                    <span className="text-amber-500">3 lần quên</span>
                    <span className="text-amber-400">Hoàn 0k + 3 Tháng Pro</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-red-950/40 border border-red-500/40 mt-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                    <span className="text-red-400 relative z-10">Quên 4 lần</span>
                    <span className="text-red-400 font-black tracking-wider relative z-10">Dừng thử thách (Mất cọc)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WALL OF COMMITMENT (Social Proof) */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-100 text-green-700 text-sm font-bold mb-6 border border-green-200 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Live: Hàng chục người vừa đăng ký lên tàu hôm nay
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-800">Cộng Đồng Cùng Tiến Bước</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Khi bắt đầu, bạn sẽ viết một lời nhắn gửi bản thân của 90 ngày sau. Cùng xem những bạn học sinh, sinh viên khác đã nói gì nhé.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-xl border-2 border-white shadow-sm">T</div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Trần Tùng</p>
                  <p className="text-xs text-indigo-600 font-bold bg-indigo-50 inline-block px-2 py-1 rounded-md mt-1">Gói 6 Tháng • 2 phút trước</p>
                </div>
              </div>
              <div className="relative bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <MessageSquareQuote className="absolute -top-3 -right-2 w-8 h-8 text-indigo-200 bg-white rounded-full" />
                <p className="italic text-slate-600 text-[15px] leading-relaxed font-medium">
                  &quot;Gửi Tùng của 6 tháng sau. Mình hy vọng lúc đó đọc tài liệu tiếng Anh sẽ không còn phải dùng Google Dịch liên tục nữa. Phải cố gắng lấy lại 500k tiền tiết kiệm nha!&quot;
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-700 text-xl border-2 border-white shadow-sm">H</div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Hoàng Phương</p>
                  <p className="text-xs text-amber-600 font-bold bg-amber-50 inline-block px-2 py-1 rounded-md mt-1">Gói 3 Tháng • 12 phút trước</p>
                </div>
              </div>
              <div className="relative bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <MessageSquareQuote className="absolute -top-3 -right-2 w-8 h-8 text-amber-200 bg-white rounded-full" />
                <p className="italic text-slate-600 text-[15px] leading-relaxed font-medium">
                  &quot;Sắp thi cuối kỳ rồi mà tiếng Anh vẫn dở. Đăng ký để tự tạo động lực học mỗi ngày. Mong 3 tháng nữa đạt chuẩn đầu ra B1 để kịp xét tốt nghiệp. Cố lên!!&quot;
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-xl border-2 border-white shadow-sm">N</div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Nguyễn Anh L.</p>
                  <p className="text-xs text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-1 rounded-md mt-1">Gói 6 Tháng • 25 phút trước</p>
                </div>
              </div>
              <div className="relative bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <MessageSquareQuote className="absolute -top-3 -right-2 w-8 h-8 text-emerald-200 bg-white rounded-full" />
                <p className="italic text-slate-600 text-[15px] leading-relaxed font-medium">
                  &quot;Chào các bạn! Năm nhất đại học rồi, mình quyết tâm học từ vựng bài bản để luyện thi TOEIC sớm. Cố gắng duy trì 180 ngày để được hoàn học phí nhé mọi người.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING */}
      <section id="pricing" className="py-24 bg-white relative border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Sẵn Sàng Tham Gia Thử Thách Cùng Chúng Mình?</h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>Tham gia hôm nay - Bắt đầu học từ ngày mai.</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tier 1 */}
            <Card className="relative overflow-visible border border-slate-200 hover:border-indigo-400 transition-all shadow-xl hover:shadow-2xl bg-white flex flex-col rounded-[32px]">
              <CardHeader className="text-center border-b border-slate-100 pb-10 pt-12">
                <CardTitle className="text-2xl font-black text-slate-800 mb-2">Chặng Khởi Động</CardTitle>
                <CardDescription className="text-lg font-medium">Thử thách 3 Tháng</CardDescription>
                <div className="mt-8 flex justify-center items-baseline gap-1">
                  <span className="text-6xl font-black text-slate-900 tracking-tight">300k</span>
                  <span className="text-slate-500 font-bold">VNĐ</span>
                </div>
              </CardHeader>
              <CardContent className="pt-10 flex-1 px-8">
                <ul className="space-y-6">
                  <li className="flex gap-4 items-start">
                    <CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium text-lg">Cam kết học liên tục <strong>90 ngày</strong></span>
                  </li>
                  <li className="flex gap-4 items-start">
                    <RefreshCcw className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium text-lg"><strong>3 quyền</strong> hồi phục ngày lười</span>
                  </li>
                  <li className="flex gap-4 items-start font-bold text-emerald-700 bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 mt-4">
                    <Award className="w-6 h-6 shrink-0 mt-0.5" />
                    <span>Thưởng Max: Hoàn 100k + Tặng 6 Tháng Pro</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pb-10 pt-6 px-8">
                <Link href="/login?callbackUrl=/challenge" className="w-full">
                  <Button className="w-full h-16 text-xl font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl transition-transform hover:-translate-y-1 uppercase tracking-wide">
                    Đăng ký gói 3 Tháng
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Tier 2 */}
            <Card className="relative overflow-visible border-2 border-amber-400 shadow-[0_20px_50px_rgba(245,158,11,0.15)] bg-white flex flex-col transform md:-translate-y-6 rounded-[32px]">
              <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-[30px]" />
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-lg">
                Khuyên dùng
              </div>
              <CardHeader className="text-center border-b border-slate-100 pb-10 pt-12">
                <CardTitle className="text-2xl font-black text-slate-800 mb-2">Chặng Tăng Tốc</CardTitle>
                <CardDescription className="text-lg font-medium text-amber-700">Thử thách 6 Tháng</CardDescription>
                <div className="mt-8 flex justify-center items-baseline gap-1">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-orange-600 tracking-tight">500k</span>
                  <span className="text-slate-500 font-bold">VNĐ</span>
                </div>
              </CardHeader>
              <CardContent className="pt-10 flex-1 px-8">
                <ul className="space-y-6">
                  <li className="flex gap-4 items-start">
                    <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium text-lg">Cam kết học liên tục <strong>180 ngày</strong></span>
                  </li>
                  <li className="flex gap-4 items-start">
                    <RefreshCcw className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium text-lg"><strong>6 quyền</strong> hồi phục ngày lười</span>
                  </li>
                  <li className="flex gap-4 items-start font-bold text-emerald-700 bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 mt-4">
                    <Award className="w-6 h-6 shrink-0 mt-0.5" />
                    <span>Thưởng Max: Hoàn 200k + Tặng 1 Năm Pro</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pb-10 pt-6 px-8">
                <Link href="/login?callbackUrl=/challenge" className="w-full">
                  <Button className="w-full h-16 text-xl font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.3)] transition-transform hover:-translate-y-1 uppercase tracking-wide">
                    Đăng ký gói 6 Tháng
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="bg-slate-900 py-16 text-center text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="font-black text-3xl text-white mb-4 tracking-tight">LingoPro Challenge</div>
          <p className="mb-8 text-slate-500">Học tiếng Anh mỗi ngày, tự tin vươn xa.</p>
          <div className="flex gap-8 mb-10 text-sm font-bold uppercase tracking-wider">
            <Link href="/" className="hover:text-white transition-colors">Về trang chủ</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
            <Link href="/support" className="hover:text-white transition-colors">Zalo Hỗ Trợ</Link>
          </div>
          <p className="text-sm text-slate-600">© 2026 LingoPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
