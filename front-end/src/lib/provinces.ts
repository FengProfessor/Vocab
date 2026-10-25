/**
 * Standardized Vietnamese Provinces & Municipalities Catalog.
 * Shared across /nhan-qua funnel, student profile settings, and campaign onboarding modal.
 */

export const POPULAR_PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nghệ An',
  'Thanh Hóa',
  'Nam Định',
  'Thái Bình',
  'Hải Dương',
  'Bắc Ninh',
  'Vĩnh Phúc',
  'Phú Thọ',
  'Quảng Ninh',
  'Bình Dương',
  'Đồng Nai',
  'Khánh Hòa',
  'Huế',
  'Tỉnh/Thành khác',
] as const;

export const PROVINCES = [
  // Major cities & top campaign provinces
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nghệ An',
  'Thanh Hóa',
  'Nam Định',
  'Thái Bình',
  'Hải Dương',
  'Bắc Ninh',
  'Vĩnh Phúc',
  'Phú Thọ',
  'Quảng Ninh',
  'Bình Dương',
  'Đồng Nai',
  'Khánh Hòa',
  'Huế',
  // All other provinces
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bến Tre',
  'Bình Định',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Nguyên',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Yên Bái',
  // Catch-all
  'Tỉnh/Thành khác',
] as const;

export const VIETNAM_PROVINCES = PROVINCES;

export type Province = (typeof PROVINCES)[number];

export function isKnownProvince(province: string): boolean {
  return PROVINCES.includes(province.trim() as Province);
}
