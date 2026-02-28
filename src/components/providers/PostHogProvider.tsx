import posthog from 'posthog-js';
import { PostHogProvider as PostHogProviderLib } from 'posthog-js/react';
import { useEffect } from 'react';

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Only initialize in production
    if (import.meta.env.PROD) {
      posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
        api_host: 'https://eu.i.posthog.com',
        capture_pageview: false, // We'll handle this with posthog.capture('$pageview') if needed, or let posthog-js/react handle it
        persistence: 'localStorage',
        autocapture: true,
      });
    }
  }, []);

  // In development, we still wrap but PostHog won't be initialized
  return <PostHogProviderLib client={posthog}>{children}</PostHogProviderLib>;
};
