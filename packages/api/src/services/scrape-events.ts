/**
 * ============================================================================
 * SCRAPE EVENTS SERVICE
 * ============================================================================
 * Event emitter pour streamer les logs de scraping en temps réel
 */

export type ScrapeEvent = {
  type: "start" | "progress" | "success" | "error";
  message: string;
  timestamp: string;
  data?: {
    postsScraped?: number;
    totalPosts?: number;
    currentPost?: string;
  };
};

type Listener = (event: ScrapeEvent) => void;

class ScrapeEventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(sessionId: string, listener: Listener) {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, new Set());
    }
    this.listeners.get(sessionId)!.add(listener);

    // Cleanup après 1h
    setTimeout(
      () => {
        this.unsubscribe(sessionId, listener);
      },
      60 * 60 * 1000
    );
  }

  unsubscribe(sessionId: string, listener: Listener) {
    const sessionListeners = this.listeners.get(sessionId);
    if (sessionListeners) {
      sessionListeners.delete(listener);
      if (sessionListeners.size === 0) {
        this.listeners.delete(sessionId);
      }
    }
  }

  emit(sessionId: string, event: Omit<ScrapeEvent, "timestamp">) {
    const listeners = this.listeners.get(sessionId);
    if (!listeners) return;

    const fullEvent: ScrapeEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    listeners.forEach((listener) => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
  }

  hasListeners(sessionId: string): boolean {
    return this.listeners.has(sessionId) && this.listeners.get(sessionId)!.size > 0;
  }
}

export const scrapeEvents = new ScrapeEventEmitter();
