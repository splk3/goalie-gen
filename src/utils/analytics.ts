export {};

declare global {
  interface Window {
    gtag?: (
      command: 'event',
      action: string,
      params?: Record<string, any>
    ) => void;
  }
}

type EventType =
  | 'generate_plan'
  | 'generate_journal'
  | 'download_drill'
  | 'download_material';

interface AnalyticsParams extends Record<string, any> {
  event_category?: string;
  event_label?: string;
  value?: number;
}

export const trackEvent = (
  action: EventType,
  params?: AnalyticsParams
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  } else {
    // Log to console in development if gtag is missing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Event: ${action}`, params);
    }
  }
};
