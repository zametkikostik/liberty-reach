/**
 * Internal Number - SIP extension management
 */

/**
 * Number configuration
 */
export interface NumberConfig {
  /** Extension length */
  extensionLength: number;
  /** Number prefix */
  prefix: string;
  /** Enable auto-attendant */
  enableAutoAttendant: boolean;
  /** Auto-attendant greeting */
  attendantGreeting?: string;
  /** Business hours */
  businessHours: {
    start: string;
    end: string;
    days: number[];
  };
  /** After-hours number */
  afterHoursNumber?: string;
}

/**
 * InternalNumber - Manages internal SIP extensions
 */
export class InternalNumber {
  private config: NumberConfig;
  private numbers: Map<string, {
    extension: string;
    userId: string;
    displayName: string;
    registered: boolean;
    lastRegistered?: number;
  }> = new Map();

  constructor(config: Partial<NumberConfig> = {}) {
    this.config = {
      extensionLength: 4,
      prefix: '',
      enableAutoAttendant: true,
      businessHours: {
        start: '09:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5], // Mon-Fri
      },
      ...config,
    };
  }

  /**
   * Generate new extension number
   */
  generateExtension(): string {
    const min = Math.pow(10, this.config.extensionLength - 1);
    const max = Math.pow(10, this.config.extensionLength) - 1;
    
    let extension: string;
    do {
      extension = Math.floor(Math.random() * (max - min + 1) + min).toString();
    } while (this.isExtensionTaken(extension));

    return this.config.prefix + extension;
  }

  /**
   * Assign extension to user
   */
  assignExtension(userId: string, displayName: string, extension?: string): string {
    if (extension) {
      if (this.isExtensionTaken(extension)) {
        throw new Error('Extension already taken');
      }
    } else {
      extension = this.generateExtension();
    }

    this.numbers.set(extension, {
      extension,
      userId,
      displayName,
      registered: false,
    });

    return extension;
  }

  /**
   * Release extension
   */
  releaseExtension(extension: string): boolean {
    return this.numbers.delete(extension);
  }

  /**
   * Get extension by user ID
   */
  getExtensionByUserId(userId: string): string | null {
    for (const [ext, data] of this.numbers.entries()) {
      if (data.userId === userId) {
        return ext;
      }
    }
    return null;
  }

  /**
   * Get user by extension
   */
  getUserByExtension(extension: string): { userId: string; displayName: string } | null {
    const data = this.numbers.get(extension);
    if (!data) return null;

    return {
      userId: data.userId,
      displayName: data.displayName,
    };
  }

  /**
   * Register extension (when user comes online)
   */
  registerExtension(extension: string): boolean {
    const data = this.numbers.get(extension);
    if (!data) return false;

    data.registered = true;
    data.lastRegistered = Date.now();
    return true;
  }

  /**
   * Unregister extension (when user goes offline)
   */
  unregisterExtension(extension: string): boolean {
    const data = this.numbers.get(extension);
    if (!data) return false;

    data.registered = false;
    return true;
  }

  /**
   * Check if extension is registered (online)
   */
  isExtensionRegistered(extension: string): boolean {
    const data = this.numbers.get(extension);
    return data?.registered ?? false;
  }

  /**
   * Check if extension is taken
   */
  isExtensionTaken(extension: string): boolean {
    return this.numbers.has(extension);
  }

  /**
   * Get all extensions
   */
  getAllExtensions(): Array<{
    extension: string;
    userId: string;
    displayName: string;
    registered: boolean;
  }> {
    return Array.from(this.numbers.values());
  }

  /**
   * Search extensions by display name
   */
  searchExtensions(query: string): Array<{
    extension: string;
    userId: string;
    displayName: string;
    registered: boolean;
  }> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.numbers.values()).filter(data =>
      data.displayName.toLowerCase().includes(lowerQuery) ||
      data.extension.includes(lowerQuery)
    );
  }

  /**
   * Check if within business hours
   */
  isBusinessHours(): boolean {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    if (!this.config.businessHours.days.includes(day)) {
      return false;
    }

    const [startHours, startMinutes] = this.config.businessHours.start.split(':').map(Number);
    const [endHours, endMinutes] = this.config.businessHours.end.split(':').map(Number);

    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Get auto-attendant menu
   */
  getAutoAttendantMenu(): {
    enabled: boolean;
    greeting?: string;
    options: Array<{
      digit: string;
      action: 'extension' | 'voicemail' | 'operator' | 'custom';
      target?: string;
    }>;
  } {
    return {
      enabled: this.config.enableAutoAttendant,
      greeting: this.config.attendantGreeting,
      options: [
        { digit: '0', action: 'operator' },
        { digit: '1', action: 'extension' },
        { digit: '2', action: 'voicemail' },
      ],
    };
  }
}
