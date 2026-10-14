/**
 * Smart Network Detection & Tiered Pre-cache Policy.
 * Differentiates between Wi-Fi/Ethernet and Cellular (4G/5G) / Data-Saver connections
 * so LingoPro achieves 100% Frame-0 instant rendering without draining mobile data.
 */

export interface NetworkInformationLike {
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

export interface NetworkPolicy {
  isOnline: boolean;
  isCellular: boolean;
  isWifiOrEthernet: boolean;
  isSaveData: boolean;
  isSlowConnection: boolean;
  /** Lightweight JSON payloads (<50KB) for Frame-0 tab & dashboard snapshots */
  canPrefetchJson: boolean;
  /** Next.js route bundle prefetches for primary navigation tabs */
  canPrefetchRoutes: boolean;
  /** Bulk media/MP3 pre-caching (e.g. 25 words at once on dashboard mount) */
  canBulkPrefetchMedia: boolean;
  canBatchPrefetchMedia: boolean;
  /** Rolling 3-5 word study window prefetch during active study sessions */
  canPrefetchStudyWindow: boolean;
}

export function getNavigatorConnection(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
  return /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
}

export function getNetworkPolicy(): NetworkPolicy {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isOnline: true,
      isCellular: false,
      isWifiOrEthernet: true,
      isSaveData: false,
      isSlowConnection: false,
      canPrefetchJson: false,
      canPrefetchRoutes: false,
      canBulkPrefetchMedia: false,
      canBatchPrefetchMedia: false,
      canPrefetchStudyWindow: false,
    };
  }

  const isOnline = navigator.onLine !== false;
  const conn = getNavigatorConnection();
  const isSaveData = Boolean(conn?.saveData);
  const effectiveType = conn?.effectiveType;
  const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g';
  const connType = conn?.type;

  const isExplicitCellular = connType === 'cellular' || effectiveType === '3g';
  const isExplicitWifi = connType === 'wifi' || connType === 'ethernet';

  // On iOS Safari, navigator.connection.type is not exposed.
  // Treat mobile devices without explicit 'wifi'/'ethernet' as potentially cellular for heavy media bursts.
  const isMobileUnknownNetwork = !isExplicitWifi && !isExplicitCellular && isMobileUserAgent();
  const isCellular = isExplicitCellular || isMobileUnknownNetwork;
  const isWifiOrEthernet = isExplicitWifi || (!isExplicitCellular && !isMobileUserAgent());

  // Tier 1 & 2: Lightweight JSON (~50KB) runs on Wi-Fi and 4G/5G unless Offline, Save-Data, or 2G
  const canPrefetchJson = isOnline && !isSaveData && !isSlowConnection;

  // Route bundle prefetching: allow on Wi-Fi / unknown non-cellular; skip on explicit cellular, Save-Data, or slow 2G
  const canPrefetchRoutes = isOnline && !isSaveData && !isSlowConnection && !isExplicitCellular;

  // Tier 3: Bulk background MP3/Media prefetch (25+ files) ONLY on confirmed Wi-Fi/Ethernet
  const canBulkPrefetchMedia = isOnline && !isSaveData && !isSlowConnection && isWifiOrEthernet;

  // Rolling 3-5 word study window prefetch: allowed on Wi-Fi and 4G/5G, blocked on Offline, Save-Data, or 2G
  const canPrefetchStudyWindow = isOnline && !isSaveData && !isSlowConnection;

  return {
    isOnline,
    isCellular,
    isWifiOrEthernet,
    isSaveData,
    isSlowConnection,
    canPrefetchJson,
    canPrefetchRoutes,
    canBulkPrefetchMedia,
    canBatchPrefetchMedia: canBulkPrefetchMedia,
    canPrefetchStudyWindow,
  };
}
