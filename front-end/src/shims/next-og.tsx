import type React from 'react';

export class ImageResponse extends Response {
  constructor(_element: React.ReactElement, options?: ResponseInit & { width?: number; height?: number }) {
    super(null, {
      status: options?.status ?? 200,
      headers: {
        'content-type': 'image/png',
        ...(options?.headers as Record<string, string>),
      },
    });
  }
}
