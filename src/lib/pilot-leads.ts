import type { PilotLead } from './pilot-sales';

/**
 * Strips all Vietnamese combining tone marks / diacritics and replaces 'đ'/'Đ' with 'd'/'D'.
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Checks if a lead requested consulting assistance from message content.
 */
export function parseNeedConsulting(lead: PilotLead): boolean {
  if (!lead.message) return false;
  const lower = lead.message.toLowerCase();
  return (
    lower.includes('cần tư vấn') ||
    lower.includes('can tu van') ||
    lower.includes('needconsulting: true') ||
    lower.includes('needconsulting:true') ||
    lower.includes('"needconsulting": true') ||
    lower.includes('"needconsulting":true')
  );
}
