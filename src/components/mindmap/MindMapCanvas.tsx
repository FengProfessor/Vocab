import React from 'react';

export type NlmInfographicData = any;

export function MindMapCanvas({ data }: { data: NlmInfographicData | null }) {
  return (
    <div className="p-6 border rounded-2xl bg-muted/20 text-center text-muted-foreground min-h-[400px] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">🗺️</div>
      <div>
        <p className="font-semibold text-foreground">MindMap Canvas (Mock Component)</p>
        <p className="text-xs text-muted-foreground mt-1">Đang chờ tích hợp thư viện vẽ mindmap chi tiết.</p>
      </div>
      {data && (
        <div className="w-full text-left text-xs mt-4 overflow-auto max-h-60 bg-background p-4 border rounded-lg">
          <p className="font-bold text-muted-foreground mb-2">Dữ liệu thô nhận được từ AI:</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
