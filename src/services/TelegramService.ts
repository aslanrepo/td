import { TelegramThemeParams } from '@/types';

/**
 * Telegram WebApp Integration Service
 * Handles theme parameters, haptic feedback, and cloud storage
 */
export class TelegramService {
    public isTelegram: boolean;
    public themeParams: TelegramThemeParams;

    constructor() {
        this.isTelegram = false;
        this.themeParams = {
            bg_color: '#1a1a1a',
            button_color: '#3390EC',
            text_color: '#ffffff'
        };
    }

    /**
     * Initialize Telegram WebApp SDK
     */
    public async initialize(): Promise<void> {
        try {
            // Check if running in Telegram
            if (window.Telegram && window.Telegram.WebApp) {
                this.isTelegram = true;
                const webApp = window.Telegram.WebApp;
                
                // Enable closing confirmation
                webApp.enableClosingConfirmation();
                
                // Get theme parameters
                this.themeParams = webApp.themeParams || this.themeParams;
                
                // Listen for theme changes
                webApp.onEvent('themeChanged', () => {
                    this.themeParams = webApp.themeParams || this.themeParams;
                    this.onThemeChanged();
                });
                
                // Expand the app
                webApp.expand();
                
                console.log('Telegram WebApp initialized successfully');
            } else {
                console.log('Running outside Telegram - using fallback mode');
            }
        } catch (error) {
            console.error('Failed to initialize Telegram WebApp:', error);
            throw error;
        }
    }

    /**
     * Get current theme parameters
     */
    public getThemeParams(): TelegramThemeParams {
        return this.themeParams;
    }

    /**
     * Trigger haptic feedback
     */
    public hapticFeedback(type: 'impact' | 'notification' | 'selection' = 'impact'): void {
        if (this.isTelegram && window.Telegram?.WebApp?.hapticFeedback) {
            try {
                switch (type) {
                    case 'impact':
                        window.Telegram.WebApp.hapticFeedback.impactOccurred('medium');
                        break;
                    case 'notification':
                        window.Telegram.WebApp.hapticFeedback.notificationOccurred('success');
                        break;
                    case 'selection':
                        window.Telegram.WebApp.hapticFeedback.selectionChanged();
                        break;
                }
            } catch (error) {
                console.warn('Haptic feedback failed:', error);
            }
        }
    }

    /**
     * Show main button
     */
    public showMainButton(text: string, callback: () => void): void {
        if (this.isTelegram && window.Telegram?.WebApp?.mainButton) {
            const mainButton = window.Telegram.WebApp.mainButton;
            mainButton.setText(text);
            mainButton.onClick(callback);
            mainButton.show();
        }
    }

    /**
     * Hide main button
     */
    public hideMainButton(): void {
        if (this.isTelegram && window.Telegram?.WebApp?.mainButton) {
            window.Telegram.WebApp.mainButton.hide();
        }
    }

    /**
     * Save data to Telegram cloud storage
     * Returns a Promise that resolves when save is complete
     */
    public saveToCloud(key: string, data: any): Promise<void> {
        return new Promise((resolve) => {
            if (this.isTelegram && window.Telegram?.WebApp?.cloudStorage) {
                // Use callback-based API for Telegram cloud storage
                window.Telegram.WebApp.cloudStorage.setItem(key, JSON.stringify(data), (error: string | null, _result: boolean) => {
                    if (error) {
                        console.warn('Cloud storage save failed:', error);
                        // Fallback to localStorage
                        localStorage.setItem(key, JSON.stringify(data));
                    } else {
                        console.log('Data saved to cloud storage successfully');
                    }
                    resolve();
                });
            } else {
                // Fallback to localStorage when not in Telegram
                localStorage.setItem(key, JSON.stringify(data));
                resolve();
            }
        });
    }

    /**
     * Load data from Telegram cloud storage
     * Returns a Promise that resolves with the loaded data
     */
    public loadFromCloud(key: string): Promise<any> {
        return new Promise((resolve) => {
            if (this.isTelegram && window.Telegram?.WebApp?.cloudStorage) {
                // Use callback-based API for Telegram cloud storage
                window.Telegram.WebApp.cloudStorage.getItem(key, (error: string | null, result: string | null) => {
                    if (error) {
                        console.warn('Cloud storage load failed:', error);
                        // Fallback to localStorage
                        const localData = localStorage.getItem(key);
                        resolve(localData ? JSON.parse(localData) : null);
                    } else {
                        resolve(result ? JSON.parse(result) : null);
                    }
                });
            } else {
                // Fallback to localStorage when not in Telegram
                const localData = localStorage.getItem(key);
                resolve(localData ? JSON.parse(localData) : null);
            }
        });
    }

    /**
     * Handle theme change events
     */
    public onThemeChanged(): void {
        // Emit custom event for game to handle theme changes
        window.dispatchEvent(new CustomEvent('telegramThemeChanged', {
            detail: this.themeParams
        }));
    }

    /**
     * Check if running in Telegram
     */
    public isRunningInTelegram(): boolean {
        return this.isTelegram;
    }
}
