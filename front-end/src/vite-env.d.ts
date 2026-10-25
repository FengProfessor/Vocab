/// <reference types="vite/client" />
import 'react';

declare module 'react' {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

declare module '@vitalets/google-translate-api' {
  export function translate(
    text: string,
    options?: { from?: string; to?: string; fetchOptions?: Record<string, unknown> }
  ): Promise<{ text: string; raw?: unknown }>;
}

declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: {
      model: string;
      generationConfig?: Record<string, unknown>;
      systemInstruction?: string;
    }): {
      generateContent: (prompt: unknown) => Promise<{
        response: { text: () => string };
      }>;
    };
  }
}

declare module '@mudbill/duckduckgo-images-api' {
  export function image_search(options: {
    query: string;
    moderate?: boolean;
    iterations?: number;
    retries?: number;
  }): Promise<Array<{ image?: string; thumbnail?: string; title?: string; width?: number; height?: number }>>;
}

declare module 'firebase-admin' {
  interface MessagingResponse {
    success: boolean;
    messageId?: string;
    error?: { code?: string; message?: string };
  }
  interface BatchResponse {
    successCount: number;
    failureCount: number;
    responses: MessagingResponse[];
  }
  const admin: {
    apps: unknown[];
    initializeApp: (config?: Record<string, unknown>) => unknown;
    credential: {
      cert: (serviceAccount: Record<string, unknown>) => unknown;
    };
    messaging: () => {
      send: (message: Record<string, unknown>) => Promise<string>;
      sendEachForMulticast: (message: Record<string, unknown>) => Promise<BatchResponse>;
    };
  };
  export default admin;
  export const apps: unknown[];
  export const initializeApp: (config?: Record<string, unknown>) => unknown;
  export const credential: { cert: (serviceAccount: Record<string, unknown>) => unknown };
  export const messaging: () => {
    send: (message: Record<string, unknown>) => Promise<string>;
    sendEachForMulticast: (message: Record<string, unknown>) => Promise<BatchResponse>;
  };
}
