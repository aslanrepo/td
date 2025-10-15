/// <reference types="vite/client" />

declare global {
    interface TelegramThemeParams {
        bg_color?: string;
        button_color?: string;
        text_color?: string;
    }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
