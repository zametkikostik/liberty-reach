/**
 * SIP Registrar - Handle SIP registrations
 */

/**
 * SIP Registration record
 */
interface SIPRegistration {
  username: string;
  extension: string;
  contact: string;
  expires: number;
  registeredAt: number;
  userAgent?: string;
}

/**
 * SIPRegistrar - Manages SIP user registrations
 */
export class SIPRegistrar {
  private registrations: Map<string, SIPRegistration> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRegistrations();
    }, 60000); // Every minute
  }

  /**
   * Register user
   */
  register(
    username: string,
    extension: string,
    contact: string,
    expires: number,
    userAgent?: string
  ): void {
    const registration: SIPRegistration = {
      username,
      extension,
      contact,
      expires: Date.now() + expires * 1000,
      registeredAt: Date.now(),
      userAgent,
    };

    this.registrations.set(extension, registration);
    console.log('Registered:', extension, '->', contact);
  }

  /**
   * Unregister user
   */
  unregister(extension: string): boolean {
    return this.registrations.delete(extension);
  }

  /**
   * Get contact for extension
   */
  getContact(extension: string): string | null {
    const registration = this.registrations.get(extension);
    if (!registration) return null;

    if (Date.now() > registration.expires) {
      this.registrations.delete(extension);
      return null;
    }

    return registration.contact;
  }

  /**
   * Check if extension is registered
   */
  isRegistered(extension: string): boolean {
    const contact = this.getContact(extension);
    return contact !== null;
  }

  /**
   * Get all registered extensions
   */
  getAllExtensions(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get registration info
   */
  getRegistration(extension: string): SIPRegistration | null {
    return this.registrations.get(extension) || null;
  }

  /**
   * Get count of registered users
   */
  getRegisteredCount(): number {
    return this.registrations.size;
  }

  /**
   * Cleanup expired registrations
   */
  private cleanupExpiredRegistrations(): void {
    const now = Date.now();
    for (const [extension, registration] of this.registrations.entries()) {
      if (now > registration.expires) {
        this.registrations.delete(extension);
        console.log('Expired registration removed:', extension);
      }
    }
  }

  /**
   * Destroy registrar
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.registrations.clear();
  }
}
