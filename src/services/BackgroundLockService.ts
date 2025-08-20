/**
 * Background Lock Service for Mind Lock Mode
 * Provides screen-off and background operation support for focus sessions
 */

interface LockSession {
  id: string;
  startTime: number;
  duration: number; // in minutes
  commitment: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
}

class BackgroundLockService {
  private static instance: BackgroundLockService;
  private lockSession: LockSession | null = null;
  private lockInterval: number | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private callbacks: {
    onLockViolation?: () => void;
    onSessionComplete?: () => void;
    onSessionAbandoned?: () => void;
  } = {};

  private constructor() {
    this.setupVisibilityHandlers();
    this.setupBeforeUnloadHandler();
  }

  static getInstance(): BackgroundLockService {
    if (!BackgroundLockService.instance) {
      BackgroundLockService.instance = new BackgroundLockService();
    }
    return BackgroundLockService.instance;
  }

  /**
   * Start a Mind Lock session with background monitoring
   */
  async startLockSession(session: Omit<LockSession, 'isActive'>): Promise<boolean> {
    try {
      // Request wake lock to prevent screen from turning off
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
      }

      this.lockSession = { ...session, isActive: true };
      
      // Store session in localStorage for persistence across page reloads
      localStorage.setItem('mindlock-active-session', JSON.stringify(this.lockSession));
      
      // Start monitoring interval
      this.startMonitoring();
      
      // Show lock UI overlay
      this.showLockOverlay();
      
      return true;
    } catch (error) {
      console.error('Failed to start lock session:', error);
      return false;
    }
  }

  /**
   * End the current lock session
   */
  endLockSession(completed: boolean = false): void {
    if (!this.lockSession) return;

    this.lockSession.isActive = false;
    
    // Clear monitoring
    if (this.lockInterval) {
      window.clearInterval(this.lockInterval);
      this.lockInterval = null;
    }

    // Release wake lock
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }

    // Remove from localStorage
    localStorage.removeItem('mindlock-active-session');
    
    // Hide lock overlay
    this.hideLockOverlay();

    // Trigger appropriate callback
    if (completed) {
      this.callbacks.onSessionComplete?.();
    } else {
      this.callbacks.onSessionAbandoned?.();
    }

    this.lockSession = null;
  }

  /**
   * Check if there's an active lock session
   */
  isLocked(): boolean {
    return this.lockSession?.isActive || false;
  }

  /**
   * Get current session info
   */
  getCurrentSession(): LockSession | null {
    return this.lockSession;
  }

  /**
   * Set callbacks for session events
   */
  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Restore session from localStorage (for page reloads)
   */
  restoreSession(): boolean {
    try {
      const savedSession = localStorage.getItem('mindlock-active-session');
      if (!savedSession) return false;

      const session: LockSession = JSON.parse(savedSession);
      const now = Date.now();
      const sessionEndTime = session.startTime + (session.duration * 60 * 1000);

      if (now >= sessionEndTime) {
        // Session should have completed
        localStorage.removeItem('mindlock-active-session');
        this.callbacks.onSessionComplete?.();
        return false;
      }

      // Restore active session
      this.lockSession = session;
      this.startMonitoring();
      this.showLockOverlay();
      return true;
    } catch (error) {
      console.error('Failed to restore session:', error);
      localStorage.removeItem('mindlock-active-session');
      return false;
    }
  }

  /**
   * Force abandon session (emergency override)
   */
  forceAbandon(): void {
    if (this.lockSession) {
      this.callbacks.onLockViolation?.();
      this.endLockSession(false);
    }
  }

  private startMonitoring(): void {
    if (this.lockInterval) {
      window.clearInterval(this.lockInterval);
    }

    this.lockInterval = window.setInterval(() => {
      if (!this.lockSession) return;

      const now = Date.now();
      const sessionEndTime = this.lockSession.startTime + (this.lockSession.duration * 60 * 1000);

      if (now >= sessionEndTime) {
        this.endLockSession(true);
      }
    }, 1000); // Check every second
  }

  private setupVisibilityHandlers(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (this.lockSession?.isActive) {
        if (document.hidden) {
          // Page is hidden (user switched tabs/apps)
          this.handleLockViolation('Page hidden during lock session');
        }
      }
    });

    // Handle focus/blur events
    window.addEventListener('blur', () => {
      if (this.lockSession?.isActive) {
        this.handleLockViolation('Window lost focus during lock session');
      }
    });
  }

  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', (event) => {
      if (this.lockSession?.isActive) {
        event.preventDefault();
        event.returnValue = 'You have an active Mind Lock session. Are you sure you want to leave?';
        return event.returnValue;
      }
    });
  }

  private handleLockViolation(reason: string): void {
    console.warn('Lock violation detected:', reason);
    
    // Show warning but don't immediately abandon
    this.showLockViolationWarning(reason);
    
    // Trigger violation callback
    this.callbacks.onLockViolation?.();
  }

  private showLockOverlay(): void {
    // Remove existing overlay
    this.hideLockOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'mindlock-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
    `;

    const content = `
      <div style="max-width: 400px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
        <h2 style="margin: 0 0 10px 0; font-size: 24px;">Mind Lock Active</h2>
        <p style="margin: 0 0 20px 0; opacity: 0.8; font-size: 16px;">
          "${this.lockSession?.commitment || 'Focus session in progress'}"
        </p>
        <div id="mindlock-timer" style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">
          ${this.formatRemainingTime()}
        </div>
        <p style="margin: 0; opacity: 0.6; font-size: 14px;">
          Stay focused! Your session is being monitored.
        </p>
        <button 
          id="mindlock-emergency-exit" 
          style="
            margin-top: 30px;
            padding: 10px 20px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            opacity: 0.7;
          "
        >
          Emergency Exit (Penalty Applied)
        </button>
      </div>
    `;

    overlay.innerHTML = content;

    // Add emergency exit handler
    const exitButton = overlay.querySelector('#mindlock-emergency-exit');
    exitButton?.addEventListener('click', () => {
      if (confirm('Are you sure you want to abandon your Mind Lock session? Penalties will be applied.')) {
        this.forceAbandon();
      }
    });

    document.body.appendChild(overlay);

    // Update timer display every second
    const updateTimer = () => {
      const timerElement = document.getElementById('mindlock-timer');
      if (timerElement && this.lockSession?.isActive) {
        timerElement.textContent = this.formatRemainingTime();
        setTimeout(updateTimer, 1000);
      }
    };
    updateTimer();
  }

  private hideLockOverlay(): void {
    const existing = document.getElementById('mindlock-overlay');
    if (existing) {
      existing.remove();
    }
  }

  private showLockViolationWarning(reason: string): void {
    // Create a warning toast that doesn't block the overlay
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc2626;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10001;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    warning.textContent = `⚠️ Lock Violation: ${reason}`;
    
    document.body.appendChild(warning);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      warning.remove();
    }, 3000);
  }

  private formatRemainingTime(): string {
    if (!this.lockSession) return '00:00';

    const now = Date.now();
    const sessionEndTime = this.lockSession.startTime + (this.lockSession.duration * 60 * 1000);
    const remainingMs = Math.max(0, sessionEndTime - now);
    const remainingSeconds = Math.floor(remainingMs / 1000);
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

export default BackgroundLockService;
