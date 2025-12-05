import type { DamlContract, TemplateId } from './types';

interface QueryResponse<T> {
  status: number;
  result: Array<DamlContract<T>>;
}

interface CreateResponse<T> {
  status: number;
  result: DamlContract<T>;
}

interface ExerciseResponse<R> {
  status: number;
  result: {
    exerciseResult: R;
  };
}

export class DamlClient {
  private readonly baseUrl: string;
  readonly party: string;
  private readonly token: string;

  constructor(options: { baseUrl: string; party: string; token: string }) {
    this.baseUrl = options.baseUrl;
    this.party = options.party;
    this.token = options.token;
  }

  async query<T>(
    templateId: TemplateId,
    query: Record<string, unknown> = {}
  ): Promise<Array<DamlContract<T>>> {
    const payload = {
      templateIds: [this.normalizeTemplateId(templateId)],
      query
    };
    const response = await this.post<QueryResponse<T>>('/query', payload);
    return response.result;
  }

  async create<T>(
    templateId: TemplateId,
    payload: Record<string, unknown>
  ): Promise<DamlContract<T>> {
    const body = {
      templateId: this.normalizeTemplateId(templateId),
      payload
    };
    const response = await this.post<CreateResponse<T>>('/create', body);
    return response.result;
  }

  async exercise<R>(
    templateId: TemplateId,
    contractId: string,
    choice: string,
    argument: Record<string, unknown> = {}
  ): Promise<R> {
    const body = {
      templateId: this.normalizeTemplateId(templateId),
      contractId,
      choice,
      argument
    };
    const response = await this.post<ExerciseResponse<R>>('/exercise', body);
    return response.result.exerciseResult;
  }

  private async post<R>(path: string, body: unknown): Promise<R> {
    const url = this.resolveUrl(path);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `JSON API error (${res.status} ${res.statusText}): ${errorBody}`
      );
    }

    return res.json();
  }

  private resolveUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (!this.baseUrl) {
      return normalizedPath;
    }
    if (this.baseUrl.startsWith('http')) {
      const trimmedBase = this.baseUrl.replace(/\/+$/, '');
      return `${trimmedBase}${normalizedPath}`;
    }
    const normalizedBase = this.baseUrl.replace(/\/+$/, '');
    if (!normalizedBase) {
      return normalizedPath;
    }
    return `${normalizedBase}${normalizedPath}`;
  }

  private normalizeTemplateId(templateId: TemplateId): TemplateId {
    const moduleName = templateId.moduleName?.trim();
    const entityName = templateId.entityName?.trim();
    if (!moduleName || !entityName) {
      throw new Error('Invalid template identifier');
    }
    const normalized: TemplateId = { moduleName, entityName };
    const pkg = templateId.packageId?.trim();
    if (pkg) {
      normalized.packageId = pkg;
    }
    return normalized;
  }
}


