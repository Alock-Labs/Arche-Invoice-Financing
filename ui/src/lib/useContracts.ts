import { useQuery } from '@tanstack/react-query';
import type { TemplateId } from './types';
import { DamlClient } from './damlClient';
import type { DamlContract } from './types';

export function useContracts<T>(
  client: DamlClient | undefined,
  templateId: TemplateId,
  query: Record<string, unknown> = {}
) {
  return useQuery<Array<DamlContract<T>>>({
    queryKey: [
      client?.party ?? 'anonymous',
      templateId.moduleName,
      templateId.entityName,
      JSON.stringify(query)
    ],
    queryFn: () =>
      client?.query<T>(templateId, query) ??
      Promise.resolve([] as Array<DamlContract<T>>),
    enabled: Boolean(client),
    refetchInterval: 5_000
  });
}


