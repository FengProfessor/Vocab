import { useMutation } from '@tanstack/react-query';
import { ListeningApi } from '@/features/listening/api';

export function useSynthesizeTtsMutation() {
  return useMutation({
    mutationFn: (payload: unknown) => ListeningApi.synthesizeTts(payload),
  });
}
