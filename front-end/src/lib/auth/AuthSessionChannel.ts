const CHANNEL_NAME = 'lingopro-app-auth';

/**
 * Cross-tab auth notifications (port of the original BroadcastChannel 'lingopro-app-auth'):
 * when one tab signs in/out, every other tab re-validates its session.
 */
export class AuthSessionChannel {
  private channel: BroadcastChannel | null = null;

  public constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
    }
  }

  public notifyInvalidate(): void {
    this.channel?.postMessage({ type: 'invalidate' });
  }

  public onInvalidate(listener: () => void): void {
    if (this.channel) {
      this.channel.onmessage = () => listener();
    }
  }
}
