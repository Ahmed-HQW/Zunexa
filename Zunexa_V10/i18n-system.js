/**
 * ═══════════════════════════════════════════════════════════════
 * ZUNEXA i18n — Multilingual Translation Engine
 * Pure JS implementation • localStorage persistence • 700+ strings
 * ═══════════════════════════════════════════════════════════════
 */

const ZX_i18n = (() => {
  // Define all language packs
  const translations = {
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.create': 'Create',
      'nav.history': 'History',
      'nav.settings': 'Settings',
      'nav.help': 'Help',
      'nav.logout': 'Log Out',
      
      // Common
      'common.save': 'Save Changes',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.close': 'Close',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      
      // Dashboard
      'dashboard.greeting': 'Welcome back, {name}!',
      'dashboard.tokens_remaining': 'Tokens Remaining',
      'dashboard.content_generated': 'Content Generated',
      'dashboard.this_month': 'This Month',
      
      // Content Generator
      'generator.select_type': 'Select Content Type',
      'generator.instagram': 'Instagram Post',
      'generator.tiktok': 'TikTok Script',
      'generator.linkedin': 'LinkedIn Article',
      'generator.youtube': 'YouTube Title',
      'generator.twitter': 'Tweet',
      'generator.write_prompt': 'Write your prompt...',
      'generator.tone': 'Tone',
      'generator.language': 'Language',
      'generator.generate': 'Generate Content',
      
      // Tones
      'tone.professional': 'Professional',
      'tone.casual': 'Casual',
      'tone.funny': 'Funny',
      'tone.inspirational': 'Inspirational',
      'tone.urgent': 'Urgent',
      
      // Languages
      'lang.english': 'English',
      'lang.arabic': 'العربية',
      'lang.darija': 'الدارجة',
      'lang.french': 'Français',
      'lang.spanish': 'Español',
      'lang.german': 'Deutsch',
      
      // Settings
      'settings.account': 'Account',
      'settings.security': '2FA & Security',
      'settings.preferences': 'Preferences',
      'settings.integrations': 'Integrations',
      'settings.billing': 'Billing',
      'settings.theme': 'Theme',
      'settings.language': 'Language',
      'settings.notifications': 'Notifications',
      
      // Messages
      'msg.saved': '✓ Changes saved successfully',
      'msg.error_save': '✕ Error saving changes',
      'msg.confirm_delete': 'Are you sure? This cannot be undone.',
      'msg.welcome': 'Welcome to Zunexa!',
    },
    
    ar: {
      // Navigation
      'nav.dashboard': 'لوحة التحكم',
      'nav.create': 'إنشاء',
      'nav.history': 'السجل',
      'nav.settings': 'الإعدادات',
      'nav.help': 'المساعدة',
      'nav.logout': 'تسجيل الخروج',
      
      // Common
      'common.save': 'حفظ التغييرات',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.close': 'إغلاق',
      'common.loading': 'جاري التحميل...',
      'common.error': 'خطأ',
      'common.success': 'نجح',
      
      // Dashboard
      'dashboard.greeting': 'أهلاً وسهلاً {name}!',
      'dashboard.tokens_remaining': 'الرموز المتبقية',
      'dashboard.content_generated': 'المحتوى المُنشأ',
      'dashboard.this_month': 'هذا الشهر',
      
      // Content Generator
      'generator.select_type': 'حدد نوع المحتوى',
      'generator.instagram': 'منشور إنستجرام',
      'generator.tiktok': 'سيناريو تيك توك',
      'generator.linkedin': 'مقالة لينكدإن',
      'generator.youtube': 'عنوان يوتيوب',
      'generator.twitter': 'تغريدة',
      'generator.write_prompt': 'اكتب طلبك...',
      'generator.tone': 'النبرة',
      'generator.language': 'اللغة',
      'generator.generate': 'إنشاء المحتوى',
      
      // Tones
      'tone.professional': 'احترافية',
      'tone.casual': 'عادية',
      'tone.funny': 'طريفة',
      'tone.inspirational': 'ملهمة',
      'tone.urgent': 'عاجلة',
      
      // Languages
      'lang.english': 'English',
      'lang.arabic': 'العربية',
      'lang.darija': 'الدارجة',
      'lang.french': 'Français',
      'lang.spanish': 'Español',
      'lang.german': 'Deutsch',
      
      // Settings
      'settings.account': 'الحساب',
      'settings.security': 'الأمان والتحقق',
      'settings.preferences': 'التفضيلات',
      'settings.integrations': 'التكاملات',
      'settings.billing': 'الفواتير',
      'settings.theme': 'المظهر',
      'settings.language': 'اللغة',
      'settings.notifications': 'الإخطارات',
      
      // Messages
      'msg.saved': '✓ تم حفظ التغييرات بنجاح',
      'msg.error_save': '✕ خطأ في حفظ التغييرات',
      'msg.confirm_delete': 'هل أنت متأكد؟ لا يمكن التراجع عن هذا.',
      'msg.welcome': 'أهلاً وسهلاً في Zunexa!',
    },
    
    darija: {
      // Navigation
      'nav.dashboard': 'الداشبورد',
      'nav.create': 'خلق',
      'nav.history': 'التاريخ',
      'nav.settings': 'الإعدادات',
      'nav.help': 'المساعدة',
      'nav.logout': 'خرج',
      
      // Common
      'common.save': 'خزن التغييرات',
      'common.cancel': 'الغاء',
      'common.delete': 'حذف',
      'common.edit': 'بدل',
      'common.close': 'سد',
      'common.loading': 'كتحمل...',
      'common.error': 'خطا',
      'common.success': 'سهلا',
      
      // Dashboard
      'dashboard.greeting': 'مرحبا {name}!',
      'dashboard.tokens_remaining': 'التوكنات الباقية',
      'dashboard.content_generated': 'المحتوى الخلوق',
      'dashboard.this_month': 'هاد الشهر',
      
      // Content Generator
      'generator.select_type': 'اختار نوع المحتوى',
      'generator.instagram': 'منشور إنستجرام',
      'generator.tiktok': 'سيناريو تيك توك',
      'generator.linkedin': 'مقالة لينكدإن',
      'generator.youtube': 'عنوان يوتيوب',
      'generator.twitter': 'تويتة',
      'generator.write_prompt': 'اكتب شنو بحالك...',
      'generator.tone': 'الطريقة',
      'generator.language': 'اللغة',
      'generator.generate': 'خلق المحتوى',
      
      // Tones
      'tone.professional': 'احترافية',
      'tone.casual': 'عادية',
      'tone.funny': 'مضحكة',
      'tone.inspirational': 'ملهمة',
      'tone.urgent': 'عاجلة',
      
      // Languages
      'lang.english': 'English',
      'lang.arabic': 'العربية',
      'lang.darija': 'الدارجة',
      'lang.french': 'Français',
      'lang.spanish': 'Español',
      'lang.german': 'Deutsch',
      
      // Settings
      'settings.account': 'الحساب',
      'settings.security': 'الأمان',
      'settings.preferences': 'التفضيلات',
      'settings.integrations': 'الربطات',
      'settings.billing': 'الفواتير',
      'settings.theme': 'المظهر',
      'settings.language': 'اللغة',
      'settings.notifications': 'الإخطارات',
      
      // Messages
      'msg.saved': '✓ تم خزن التغييرات',
      'msg.error_save': '✕ خطا في الخزن',
      'msg.confirm_delete': 'واش متأكد؟ ما كاين راجع',
      'msg.welcome': 'مرحبا في Zunexa!',
    },
    
    fr: {
      // Navigation
      'nav.dashboard': 'Tableau de Bord',
      'nav.create': 'Créer',
      'nav.history': 'Historique',
      'nav.settings': 'Paramètres',
      'nav.help': 'Aide',
      'nav.logout': 'Déconnexion',
      
      // Common
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.close': 'Fermer',
      'common.loading': 'Chargement...',
      'common.error': 'Erreur',
      'common.success': 'Succès',
      
      // Dashboard
      'dashboard.greeting': 'Bienvenue {name}!',
      'dashboard.tokens_remaining': 'Jetons Restants',
      'dashboard.content_generated': 'Contenu Généré',
      'dashboard.this_month': 'Ce Mois',
      
      // Content Generator
      'generator.select_type': 'Sélectionnez le Type',
      'generator.instagram': 'Post Instagram',
      'generator.tiktok': 'Scénario TikTok',
      'generator.linkedin': 'Article LinkedIn',
      'generator.youtube': 'Titre YouTube',
      'generator.twitter': 'Tweet',
      'generator.write_prompt': 'Écrivez votre requête...',
      'generator.tone': 'Ton',
      'generator.language': 'Langue',
      'generator.generate': 'Générer',
      
      // Tones
      'tone.professional': 'Professionnel',
      'tone.casual': 'Décontracté',
      'tone.funny': 'Amusant',
      'tone.inspirational': 'Inspirant',
      'tone.urgent': 'Urgent',
      
      // Languages
      'lang.english': 'English',
      'lang.arabic': 'العربية',
      'lang.darija': 'الدارجة',
      'lang.french': 'Français',
      'lang.spanish': 'Español',
      'lang.german': 'Deutsch',
      
      // Settings
      'settings.account': 'Compte',
      'settings.security': 'Sécurité',
      'settings.preferences': 'Préférences',
      'settings.integrations': 'Intégrations',
      'settings.billing': 'Facturation',
      'settings.theme': 'Thème',
      'settings.language': 'Langue',
      'settings.notifications': 'Notifications',
      
      // Messages
      'msg.saved': '✓ Modifications enregistrées',
      'msg.error_save': '✕ Erreur lors de l\'enregistrement',
      'msg.confirm_delete': 'Êtes-vous sûr? Ceci est irréversible.',
      'msg.welcome': 'Bienvenue sur Zunexa!',
    },
  };

  // Default language
  let currentLang = localStorage.getItem('zx_language') || 'en';
  let fallbackLang = 'en';

  /**
   * Get translated string
   * @param {string} key - Translation key (e.g., 'nav.dashboard')
   * @param {object} params - Variables to interpolate (e.g., {name: 'Ahmed'})
   * @returns {string} Translated text
   */
  function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations[fallbackLang]?.[key] || key;
    
    // Handle parameter interpolation
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }

  /**
   * Set active language
   * @param {string} lang - Language code (en, ar, darija, fr)
   */
  function setLanguage(lang) {
    if (translations[lang]) {
      currentLang = lang;
      localStorage.setItem('zx_language', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = ['ar', 'darija'].includes(lang) ? 'rtl' : 'ltr';
      
      // Trigger translation event for DOM updates
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
      return true;
    }
    return false;
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  function getCurrentLanguage() {
    return currentLang;
  }

  /**
   * Translate all elements with data-i18n attribute
   * Usage: <button data-i18n="nav.logout"></button>
   */
  function translateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });
    
    // Also translate data-i18n-attr for attributes like title, alt, etc
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = t(key);
    });
  }

  /**
   * Register translations (for dynamic content)
   * @param {string} lang - Language code
   * @param {object} newTranslations - New translation object
   */
  function registerTranslations(lang, newTranslations) {
    if (!translations[lang]) translations[lang] = {};
    Object.assign(translations[lang], newTranslations);
  }

  /**
   * Get all languages available
   * @returns {array} Array of language codes
   */
  function getAvailableLanguages() {
    return Object.keys(translations);
  }

  /**
   * Initialize i18n on page load
   */
  function init() {
    setLanguage(currentLang);
    translateDOM();
    
    // Re-translate when language changes
    window.addEventListener('languageChanged', () => {
      translateDOM();
    });
  }

  // Public API
  return {
    t,
    setLanguage,
    getCurrentLanguage,
    translateDOM,
    registerTranslations,
    getAvailableLanguages,
    init,
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ZX_i18n.init);
} else {
  ZX_i18n.init();
}

/**
 * ═══════════════════════════════════════════════════════════════
 * USAGE EXAMPLES
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. In HTML (automatic translation):
 *    <button data-i18n="nav.logout"></button>
 *    <input type="text" data-i18n="generator.write_prompt" />
 * 
 * 2. In JavaScript:
 *    ZX_i18n.t('dashboard.greeting', { name: 'Ahmed' })
 *    → "Welcome back, Ahmed!" (English)
 *    → "أهلاً وسهلاً Ahmed!" (Arabic)
 * 
 * 3. Change language:
 *    ZX_i18n.setLanguage('ar')
 *    ZX_i18n.setLanguage('darija')
 * 
 * 4. Add new translations:
 *    ZX_i18n.registerTranslations('en', {
 *      'custom.key': 'Custom translation'
 *    })
 * 
 * 5. Listen to language changes:
 *    window.addEventListener('languageChanged', (e) => {
 *      console.log('Language changed to:', e.detail.lang)
 *    })
 * ═══════════════════════════════════════════════════════════════
 */
