import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

import en from '../../source/en.json';

const i18n = new VueI18n({
    locale: 'en',
    fallbackLocale: 'en', // 匹配不到语言时的返回
    messages: {
        'en': en
    }
});

export default i18n;
