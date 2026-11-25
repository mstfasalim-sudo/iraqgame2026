import { DeveloperInfo } from '../types/game';

/**
 * Global test/developer mode flag.
 * AdMob testing diagnostics stay completely hidden unless VITE_TEST_MODE="true".
 */
export const TEST_MODE: boolean = import.meta.env.VITE_TEST_MODE === 'true';

/**
 * معلومات المطور الثابتة (لا يمكن للمستخدم تعديلها من داخل التطبيق).
 * يمكن للمطور فقط تعديل هذه القيم هنا مباشرة أو عبر متغيرات البيئة (VITE_DEV_*) قبل بناء التطبيق.
 */
export const DEVELOPER_INFO: Readonly<DeveloperInfo> = Object.freeze({
  name:
    (import.meta.env.VITE_DEV_NAME || '').trim() ||
    'مطور تطبيق المليون العراقي',
  role:
    (import.meta.env.VITE_DEV_ROLE || '').trim() ||
    'تصميم وتطوير التطبيقات العراقية',
  email:
    (import.meta.env.VITE_DEV_EMAIL || '').trim() ||
    'contact@iraqimillion.app',
  website:
    (import.meta.env.VITE_DEV_WEBSITE || '').trim() || 'iraqimillion.app',
  bio:
    (import.meta.env.VITE_DEV_BIO || '').trim() ||
    'مسابقة ثقافية عراقية للأمثال والتراث.',
  version: '1.0.0',
});
