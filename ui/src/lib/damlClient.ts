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
      templateIds: [this.cleanTemplateId(templateId)],
      query
    };
    const response = await this.post<QueryResponse<T>>('/v1/query', payload);
    return response.result;
  }

  async create<T>(
    templateId: TemplateId,
    payload: Record<string, unknown>
  ): Promise<DamlContract<T>> {
    const body = {
      templateId: this.cleanTemplateId(templateId),
      payload
    };
    const response = await this.post<CreateResponse<T>>('/v1/create', body);
    return response.result;
  }

  async exercise<R>(
    templateId: TemplateId,
    contractId: string,
    choice: string,
    argument: Record<string, unknown> = {}
  ): Promise<R> {
    const body = {
      templateId: this.cleanTemplateId(templateId),
      contractId,
      choice,
      argument
    };
    const response = await this.post<ExerciseResponse<R>>(
      '/v1/exercise',
      body
    );
    return response.result.exerciseResult;
  }

  private async post<R>(path: string, body: unknown): Promise<R> {
    const res = await fetch(`${this.baseUrl}${path}`, {
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

  private cleanTemplateId(templateId: TemplateId) {
    if (!templateId.packageId) {
      const { packageId: _, ...rest } = templateId;
      return rest;
    }
    return templateId;
  }
}


