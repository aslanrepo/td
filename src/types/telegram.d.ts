/**
 * Telegram WebApp API Type Definitions
 * Based on Telegram WebApp SDK v3.11.5
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  isVerticalSwipesEnabled: boolean;
  isHorizontalSwipesEnabled: boolean;
  isHapticFeedbackEnabled: boolean;
  isClosingConfirmationEnabled: boolean;
  
  // Methods
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  enableVerticalSwipes(): void;
  disableVerticalSwipes(): void;
  enableHorizontalSwipes(): void;
  disableHorizontalSwipes(): void;
  onEvent(eventType: string, eventHandler: () => void): void;
  offEvent(eventType: string, eventHandler: () => void): void;
  sendData(data: string): void;
  switchInlineQuery(query: string, choose_chat_types?: string[]): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  openInvoice(url: string, callback?: (status: string) => void): void;
  showPopup(params: TelegramPopupParams, callback?: (buttonId: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  showScanQrPopup(params: TelegramScanQrPopupParams, callback?: (text: string) => void): void;
  closeScanQrPopup(): void;
  readTextFromClipboard(callback?: (text: string) => void): void;
  requestWriteAccess(callback?: (granted: boolean) => void): void;
  requestContact(callback?: (granted: boolean) => void): void;
  hapticFeedback: TelegramHapticFeedback;
  cloudStorage: TelegramCloudStorage;
  biometricManager: TelegramBiometricManager;
  backButton: TelegramBackButton;
  mainButton: TelegramMainButton;
  settingsButton: TelegramSettingsButton;
}

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramPopupParams {
  title?: string;
  message: string;
  buttons?: TelegramPopupButton[];
}

export interface TelegramPopupButton {
  id?: string;
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  text?: string;
}

export interface TelegramScanQrPopupParams {
  text?: string;
}

export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

export interface TelegramCloudStorage {
  setItem(key: string, value: string, callback?: (error: string | null, result: boolean) => void): void;
  getItem(key: string, callback?: (error: string | null, result: string | null) => void): void;
  getItems(keys: string[], callback?: (error: string | null, result: Record<string, string>) => void): void;
  removeItem(key: string, callback?: (error: string | null, result: boolean) => void): void;
  removeItems(keys: string[], callback?: (error: string | null, result: boolean) => void): void;
  getKeys(callback?: (error: string | null, result: string[]) => void): void;
}

export interface TelegramBiometricManager {
  isInited: boolean;
  isBiometricAvailable: boolean;
  biometricType: 'finger' | 'face' | 'unknown';
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  isBiometricTokenSaved: boolean;
  isBiometricTokenValid: boolean;
  deviceId: string;
  
  init(callback?: (success: boolean) => void): void;
  requestAccess(params: TelegramBiometricRequestAccessParams, callback?: (granted: boolean) => void): void;
  authenticate(params: TelegramBiometricAuthenticateParams, callback?: (success: boolean) => void): void;
  updateBiometricToken(token: string, callback?: (success: boolean) => void): void;
  openSettings(): void;
}

export interface TelegramBiometricRequestAccessParams {
  reason?: string;
}

export interface TelegramBiometricAuthenticateParams {
  reason?: string;
}

export interface TelegramBackButton {
  isVisible: boolean;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
}

export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText(text: string): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
  showProgress(leaveActive?: boolean): void;
  hideProgress(): void;
  setParams(params: TelegramMainButtonParams): void;
}

export interface TelegramMainButtonParams {
  text?: string;
  color?: string;
  text_color?: string;
  is_active?: boolean;
  is_visible?: boolean;
}

export interface TelegramSettingsButton {
  isVisible: boolean;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
}

export {};
