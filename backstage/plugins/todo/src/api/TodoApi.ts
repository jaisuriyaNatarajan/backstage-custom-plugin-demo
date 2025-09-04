import {
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';

export type Todo = { id: string; title: string; done: boolean };

export interface TodoApi {
  list(): Promise<Todo[]>;
  add(title: string): Promise<Todo>;
  toggle(id: string, done: boolean): Promise<Todo>;
  remove(id: string): Promise<void>;
}

export const todoApiRef = createApiRef<TodoApi>({ id: 'plugin.todo.api' });

export class TodoClient implements TodoApi {
  constructor(
    private readonly deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi },
  ) {}

  private async baseUrl() {
    // Matches your backend pluginId: "todo"
    return await this.deps.discoveryApi.getBaseUrl('todo');
  }

  /** Normalize list response: either [] or { items: [] } */
  private normalizeList(json: any): Todo[] {
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.items)) return json.items;
    return [];
  }

  /** Normalize single response: either {...} or { item: {...} } */
  private normalizeItem(json: any): Todo {
    if (json?.item) return json.item;
    return json as Todo;
  }

  async list() {
    const res = await this.deps.fetchApi.fetch(`${await this.baseUrl()}/todos`);
    if (!res.ok) throw new Error(`Failed to load todos (${res.status})`);
    const json = await res.json();
    return this.normalizeList(json);
  }

  async add(title: string) {
    const res = await this.deps.fetchApi.fetch(
      `${await this.baseUrl()}/todos`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title }),
      },
    );
    if (!res.ok) throw new Error(`Failed to add (${res.status})`);
    const json = await res.json();
    return this.normalizeItem(json);
  }

  async toggle(id: string, done: boolean) {
    const res = await this.deps.fetchApi.fetch(
      `${await this.baseUrl()}/todos/${id}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ done }),
      },
    );
    if (!res.ok) throw new Error(`Failed to toggle (${res.status})`);
    const json = await res.json();
    return this.normalizeItem(json);
  }

  async remove(id: string) {
    const res = await this.deps.fetchApi.fetch(
      `${await this.baseUrl()}/todos/${id}`,
      { method: 'DELETE' },
    );
    if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
  }
}
