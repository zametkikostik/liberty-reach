/**
 * DID Manager - Direct Inward Dialing number management
 */

/**
 * DID number info
 */
interface DIDNumber {
  number: string;
  country: string;
  region: string;
  type: 'local' | 'toll_free' | 'mobile';
  monthlyPrice: number;
  setupPrice: number;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
}

/**
 * DIDManager - Manage DID numbers
 */
export class DIDManager {
  private availableNumbers: DIDNumber[] = [];
  private assignedNumbers: Map<string, {
    number: DIDNumber;
    assignedTo: string;
    assignedAt: number;
  }> = new Map();

  constructor() {
    // Load available numbers from provider
    this.loadAvailableNumbers();
  }

  /**
   * Search available DID numbers
   */
  searchDIDs(options: {
    country?: string;
    region?: string;
    type?: 'local' | 'toll_free' | 'mobile';
    pattern?: string;
  }): DIDNumber[] {
    let results = [...this.availableNumbers];

    if (options.country) {
      results = results.filter(n => n.country === options.country);
    }

    if (options.region) {
      results = results.filter(n => n.region === options.region);
    }

    if (options.type) {
      results = results.filter(n => n.type === options.type);
    }

    if (options.pattern) {
      const pattern = options.pattern.replace(/[^0-9*]/g, '');
      results = results.filter(n => {
        const digits = n.number.replace(/[^0-9]/g, '');
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(digits);
        }
        return digits.includes(pattern);
      });
    }

    return results;
  }

  /**
   * Purchase/assign a DID number
   */
  assignDID(number: string, userId: string): boolean {
    const did = this.availableNumbers.find(n => n.number === number);
    if (!did) return false;

    // Remove from available
    this.availableNumbers = this.availableNumbers.filter(n => n.number !== number);

    // Add to assigned
    this.assignedNumbers.set(number, {
      number: did,
      assignedTo: userId,
      assignedAt: Date.now(),
    });

    return true;
  }

  /**
   * Release a DID number
   */
  releaseDID(number: string): boolean {
    const assigned = this.assignedNumbers.get(number);
    if (!assigned) return false;

    // Add back to available
    this.availableNumbers.push(assigned.number);

    // Remove from assigned
    this.assignedNumbers.delete(number);

    return true;
  }

  /**
   * Get assigned numbers for user
   */
  getUserDIDs(userId: string): DIDNumber[] {
    return Array.from(this.assignedNumbers.values())
      .filter(a => a.assignedTo === userId)
      .map(a => a.number);
  }

  /**
   * Get all assigned numbers
   */
  getAllAssignedDIDs(): Array<{
    number: string;
    assignedTo: string;
    assignedAt: number;
  }> {
    return Array.from(this.assignedNumbers.entries()).map(([number, data]) => ({
      number,
      assignedTo: data.assignedTo,
      assignedAt: data.assignedAt,
    }));
  }

  /**
   * Get monthly cost for all numbers
   */
  getMonthlyCost(): {
    total: number;
    currency: string;
    breakdown: Array<{ number: string; cost: number }>;
  } {
    const breakdown = Array.from(this.assignedNumbers.values()).map(a => ({
      number: a.number.number,
      cost: a.number.monthlyPrice,
    }));

    const total = breakdown.reduce((sum, b) => sum + b.cost, 0);

    return {
      total,
      currency: 'USD',
      breakdown,
    };
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private loadAvailableNumbers(): void {
    // In production, load from provider API
    // Sample numbers for demo
    this.availableNumbers = [
      {
        number: '+1 (555) 123-4567',
        country: 'US',
        region: 'California',
        type: 'local',
        monthlyPrice: 2.0,
        setupPrice: 0,
        capabilities: { voice: true, sms: true, mms: true, fax: false },
      },
      {
        number: '+1 (800) 555-1234',
        country: 'US',
        region: 'Nationwide',
        type: 'toll_free',
        monthlyPrice: 5.0,
        setupPrice: 0,
        capabilities: { voice: true, sms: false, mms: false, fax: true },
      },
      {
        number: '+44 20 1234 5678',
        country: 'GB',
        region: 'London',
        type: 'local',
        monthlyPrice: 3.0,
        setupPrice: 0,
        capabilities: { voice: true, sms: true, mms: false, fax: false },
      },
    ];
  }
}
