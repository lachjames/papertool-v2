import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import getBaseURL from '../getBaseURL';

/**
 * Session keep-alive.
 *
 * The server stores one-hour Cognito tokens in httpOnly cookies and a 30-day refresh
 * token beside them. Until now nothing ever called /auth/refresh, so every request
 * started failing with 401 about an hour after sign-in. This module:
 *
 *  - installs a global axios interceptor that, on a 401, calls /auth/refresh once and
 *    retries the original request (concurrent 401s share a single refresh call);
 *  - schedules a refresh a couple of minutes before the known expiry, so the cookies
 *    are usually renewed before anything fails;
 *  - dispatches SESSION_EXPIRED_EVENT on window when the server definitively rejects
 *    the refresh (401: refresh token revoked/expired), so the auth context can drop to
 *    the signed-out state. Transient failures (503, network) never end the session.
 */

export const SESSION_EXPIRED_EVENT = 'papertool:session-expired';

const REFRESH_LEAD_SECONDS = 120;
const MIN_REFRESH_DELAY_MS = 15_000;
const RETRY_DELAY_MS = 30_000;
const MAX_RETRY_DELAY_MS = 5 * 60_000;

interface SessionRequestConfig extends InternalAxiosRequestConfig {
    /** Set on a request that has already been retried after a refresh. */
    __sessionRetried?: boolean;
    /** Set on the refresh call itself (and anything else that must never trigger a refresh). */
    __skipSessionRefresh?: boolean;
}

let refreshUrlOverride: string | null = null;
let inflightRefresh: Promise<number> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelayMs = RETRY_DELAY_MS;
let installed = false;

function refreshUrl(): string {
    return refreshUrlOverride || getBaseURL('auth/refresh');
}

function isAuthEndpoint(url?: string): boolean {
    return !!url && /\/auth\/(token|refresh|logout)(\?|$)/.test(url);
}

/** The server answers 401 only when Cognito rejected the refresh token; anything else is transient. */
export function isDefinitiveRefreshFailure(error: unknown): boolean {
    return axios.isAxiosError(error) && error.response?.status === 401;
}

function notifySessionExpired(): void {
    cancelScheduledRefresh();
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
}

/**
 * Call /auth/refresh. Concurrent callers share one in-flight request. Resolves with the
 * new token lifetime in seconds and schedules the next proactive refresh.
 */
export function refreshSession(): Promise<number> {
    if (!inflightRefresh) {
        const config = { withCredentials: true, __skipSessionRefresh: true } as AxiosRequestConfig;
        inflightRefresh = axios
            .post(refreshUrl(), {}, config)
            .then(response => {
                const expiresIn = Number(response.data?.expiresIn) || 3600;
                retryDelayMs = RETRY_DELAY_MS;
                scheduleRefresh(expiresIn);
                return expiresIn;
            })
            .finally(() => {
                inflightRefresh = null;
            });
    }
    return inflightRefresh;
}

function attemptScheduledRefresh(): void {
    refreshTimer = null;
    refreshSession().catch(error => {
        if (isDefinitiveRefreshFailure(error)) {
            notifySessionExpired();
            return;
        }
        // Transient: try again later with backoff. A 401 on any ordinary request in the
        // meantime goes through the interceptor and refreshes immediately.
        refreshTimer = setTimeout(attemptScheduledRefresh, retryDelayMs);
        retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
    });
}

/** Arrange a silent refresh shortly before a token that lives `expiresInSeconds` expires. */
export function scheduleRefresh(expiresInSeconds: number): void {
    cancelScheduledRefresh();
    if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) return;

    const delay = Math.max((expiresInSeconds - REFRESH_LEAD_SECONDS) * 1000, MIN_REFRESH_DELAY_MS);
    refreshTimer = setTimeout(attemptScheduledRefresh, delay);
}

export function cancelScheduledRefresh(): void {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}

/**
 * Install the global 401 interceptor. Safe to call more than once. `refreshUrl` exists
 * for tests; in the app the URL comes from getBaseURL.
 */
export function installSessionRefresh(options: { refreshUrl?: string } = {}): void {
    if (options.refreshUrl) refreshUrlOverride = options.refreshUrl;
    if (installed) return;
    installed = true;

    axios.interceptors.response.use(
        response => response,
        async (error: unknown) => {
            if (!axios.isAxiosError(error)) throw error;

            const config = error.config as SessionRequestConfig | undefined;
            if (
                !config ||
                error.response?.status !== 401 ||
                config.__sessionRetried ||
                config.__skipSessionRefresh ||
                isAuthEndpoint(config.url)
            ) {
                throw error;
            }

            config.__sessionRetried = true;
            try {
                await refreshSession();
            } catch (refreshError) {
                if (isDefinitiveRefreshFailure(refreshError)) {
                    notifySessionExpired();
                }
                throw error;
            }
            return axios(config);
        }
    );
}
