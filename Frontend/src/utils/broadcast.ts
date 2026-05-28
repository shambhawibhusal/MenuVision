const channel = new BroadcastChannel('menuvision-auth');

export const AUTH_EVENTS = {
    VERIFIED: 'email_verified',
    RESET: 'password_reset',
} as const;

export function notifyVerified() {
    channel.postMessage(AUTH_EVENTS.VERIFIED);
}

export function notifyReset() {
    channel.postMessage(AUTH_EVENTS.RESET);
}

export function onAuthBroadcast(callback: (event: string) => void) {
    const handler = (msg: MessageEvent) => callback(msg.data);
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
}
