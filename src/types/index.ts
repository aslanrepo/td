/**
 * Type definitions index
 * Only Telegram WebApp types - everything else uses built-in Phaser types
 */

// Telegram WebApp types
export * from './telegram';

// Re-export commonly used Telegram types
export type {
  TelegramWebApp,
  TelegramUser,
  TelegramThemeParams,
  TelegramHapticFeedback,
  TelegramCloudStorage,
  TelegramBiometricManager,
  TelegramBackButton,
  TelegramMainButton,
  TelegramSettingsButton
} from './telegram';
