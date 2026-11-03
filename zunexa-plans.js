/* zunexa-plans.js — SINGLE SOURCE OF TRUTH for plans & prices.
   Decision: cheaper individual plans (Pro $7 / Max $35). */
(function (global) {
  'use strict';
  var plans = {
    individual: [
      { id: 'free', name: 'Free', monthly: 0, yearly: 0,
        features: ['استعمال محدود يومياً', 'نموذج أساسي واحد', 'دعم عبر المجتمع'] },
      { id: 'pro', name: 'Pro', monthly: 7, yearly: 6, featured: true, tag: 'الأكثر طلباً',
        features: ['استعمال موسّع', 'كل نماذج Zunexa', 'أولوية فالاستجابة', 'دعم عبر الإيميل'] },
      { id: 'max', name: 'Max', monthly: 35, yearly: 28,
        features: ['استعمال بلا حدود تقريباً', 'أعلى جودة نماذج', 'أولوية قصوى', 'دعم مخصص'] }
    ],
    team: [
      { id: 'standard', name: 'Standard', monthly: 15, yearly: 12,
        features: ['من 5 إلى 150 مستخدم', 'لوحة تحكم للفريق', 'دعم عبر الإيميل'] },
      { id: 'premium', name: 'Premium', monthly: 70, yearly: 56, featured: true, tag: 'مُوصى بها',
        features: ['من 5 إلى 150 مستخدم', 'كل الميزات ديال Max لكل عضو', 'مدير حساب مخصص', 'SLA'] }
    ]
  };
  plans.individual.forEach(Object.freeze); plans.team.forEach(Object.freeze);
  Object.freeze(plans.individual); Object.freeze(plans.team);
  global.ZX_PLANS = Object.freeze(plans);
  global.zxPlanPrice = function (planId, cycle) {
    var all = plans.individual.concat(plans.team);
    for (var i = 0; i < all.length; i++) if (all[i].id === planId) return cycle === 'yearly' ? all[i].yearly : all[i].monthly;
    return null;
  };
})(window);
