/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * 
 * Barrel export for all Daily Situations topics.
 */

import { AT_THE_PHARMACY_ITEMS } from './at-the-pharmacy';
import { AT_THE_BANK_ITEMS } from './at-the-bank';
import { AT_THE_POST_OFFICE_ITEMS } from './at-the-post-office';
import { AT_THE_HAIRDRESSER_ITEMS } from './at-the-hairdresser';
import { AT_THE_GYM_ITEMS } from './at-the-gym';
import { AT_THE_SUPERMARKET_ITEMS } from './at-the-supermarket';
import { AT_THE_LAUNDRY_ITEMS } from './at-the-laundry';
import { PUBLIC_TRANSPORT_ITEMS } from './public-transport';
import { DELIVERY_SERVICES_ITEMS } from './delivery-services';
import { HOME_REPAIRS_ITEMS } from './home-repairs';
import { PARKING_DRIVING_ITEMS } from './parking-driving';
import { MAKING_COMPLAINTS_ITEMS } from './making-complaints';
import { MAKING_APPOINTMENTS_ITEMS } from './making-appointments';
import { ASKING_FOR_HELP_ITEMS } from './asking-for-help';
import { PHONE_CALLS_ITEMS } from './phone-calls';
import { ONLINE_SHOPPING_ITEMS } from './online-shopping';
import { NEIGHBORS_COMMUNITY_ITEMS } from './neighbors-community';
import { CELEBRATIONS_HOLIDAYS_ITEMS } from './celebrations-holidays';
import { PETS_VET_ITEMS } from './pets-vet';
import { LOST_ITEMS_PROBLEMS_ITEMS } from './lost-items-problems';

export const allDailySituationsTopics = [
  ...AT_THE_PHARMACY_ITEMS,
  ...AT_THE_BANK_ITEMS,
  ...AT_THE_POST_OFFICE_ITEMS,
  ...AT_THE_HAIRDRESSER_ITEMS,
  ...AT_THE_GYM_ITEMS,
  ...AT_THE_SUPERMARKET_ITEMS,
  ...AT_THE_LAUNDRY_ITEMS,
  ...PUBLIC_TRANSPORT_ITEMS,
  ...DELIVERY_SERVICES_ITEMS,
  ...HOME_REPAIRS_ITEMS,
  ...PARKING_DRIVING_ITEMS,
  ...MAKING_COMPLAINTS_ITEMS,
  ...MAKING_APPOINTMENTS_ITEMS,
  ...ASKING_FOR_HELP_ITEMS,
  ...PHONE_CALLS_ITEMS,
  ...ONLINE_SHOPPING_ITEMS,
  ...NEIGHBORS_COMMUNITY_ITEMS,
  ...CELEBRATIONS_HOLIDAYS_ITEMS,
  ...PETS_VET_ITEMS,
  ...LOST_ITEMS_PROBLEMS_ITEMS
];

export const DAILY_SITUATIONS_SUBCATEGORIES = [
  { id: 'at_the_pharmacy', nameEn: 'At the Pharmacy', nameVi: 'Tại hiệu thuốc' },
  { id: 'at_the_bank', nameEn: 'At the Bank', nameVi: 'Tại ngân hàng' },
  { id: 'at_the_post_office', nameEn: 'At the Post Office', nameVi: 'Tại bưu điện' },
  { id: 'at_the_hairdresser', nameEn: 'At the Hairdresser', nameVi: 'Tại tiệm làm tóc' },
  { id: 'at_the_gym', nameEn: 'At the Gym', nameVi: 'Tại phòng gym' },
  { id: 'at_the_supermarket', nameEn: 'At the Supermarket', nameVi: 'Tại siêu thị' },
  { id: 'at_the_laundry', nameEn: 'At the Laundry', nameVi: 'Tại tiệm giặt ủi' },
  { id: 'public_transport', nameEn: 'Public Transport', nameVi: 'Phương tiện công cộng' },
  { id: 'delivery_services', nameEn: 'Delivery Services', nameVi: 'Dịch vụ giao hàng' },
  { id: 'home_repairs', nameEn: 'Home Repairs', nameVi: 'Sửa chữa nhà cửa' },
  { id: 'parking_driving', nameEn: 'Parking & Driving', nameVi: 'Đậu xe & Lái xe' },
  { id: 'making_complaints', nameEn: 'Making Complaints', nameVi: 'Khiếu nại' },
  { id: 'making_appointments', nameEn: 'Making Appointments', nameVi: 'Đặt lịch hẹn' },
  { id: 'asking_for_help', nameEn: 'Asking for Help', nameVi: 'Yêu cầu giúp đỡ' },
  { id: 'phone_calls', nameEn: 'Phone Calls', nameVi: 'Cuộc gọi điện thoại' },
  { id: 'online_shopping', nameEn: 'Online Shopping', nameVi: 'Mua sắm trực tuyến' },
  { id: 'neighbors_community', nameEn: 'Neighbors & Community', nameVi: 'Hàng xóm & Cộng đồng' },
  { id: 'celebrations_holidays', nameEn: 'Celebrations & Holidays', nameVi: 'Lễ kỷ niệm & Ngày lễ' },
  { id: 'pets_vet', nameEn: 'Pets & Vet', nameVi: 'Thú cưng & Bác sĩ thú y' },
  { id: 'lost_items_problems', nameEn: 'Lost Items & Problems', nameVi: 'Mất đồ & Vấn đề' }
];

export function getDailySituationsBySubcategory(slug: string) {
  return allDailySituationsTopics.filter(t => t.subcategory === slug);
}
