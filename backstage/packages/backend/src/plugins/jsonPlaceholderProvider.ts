import { Logger } from 'winston';
import { SchedulerService } from '@backstage/backend-plugin-api';
import { PluginTaskScheduler } from '@backstage/backend-tasks';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { Entity, GroupEntity, UserEntity } from '@backstage/catalog-model';

type AnyScheduler = SchedulerService | PluginTaskScheduler;

const toName = (s: string) =>
  (s || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);

interface PlaceholderUser {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  company?: { name: string };
}

type Options = {
  logger: Logger;
  scheduler: AnyScheduler;
  target?: string;
};

export class JsonPlaceholderEntityProvider implements EntityProvider {
  static providerName = 'jsonplaceholder';

  private readonly logger: Logger;
  private readonly target: string;
  private readonly scheduler: AnyScheduler;
  private connection?: EntityProviderConnection;

  private constructor(opts: Options) {
    this.logger = opts.logger;
    this.scheduler = opts.scheduler;
    this.target = opts.target ?? 'https://jsonplaceholder.typicode.com/users';
    this.logger.info(
      `[jsonplaceholder] provider constructed; target=${this.target}`,
    );
  }

  static create(deps: { logger: Logger; scheduler: AnyScheduler }) {
    return new JsonPlaceholderEntityProvider({
      logger: deps.logger,
      scheduler: deps.scheduler,
    });
  }

  getProviderName() {
    return JsonPlaceholderEntityProvider.providerName;
  }

  async connect(connection: EntityProviderConnection) {
    this.connection = connection;
    console.log('Connection established', connection);
    this.logger.info('[jsonplaceholder] connect() called');

    try {
      await this.run();
    } catch (e) {
      this.logger.error(`[jsonplaceholder] initial run failed: ${String(e)}`);
    }

    await (this.scheduler as PluginTaskScheduler).scheduleTask?.({
      id: 'jsonplaceholder-refresh',
      frequency: { minutes: 30 },
      timeout: { minutes: 3 },
      initialDelay: { seconds: 5 },
      fn: async () => {
        try {
          await this.run();
        } catch (e) {
          this.logger.error(
            `[jsonplaceholder] scheduled run failed: ${String(e)}`,
          );
        }
      },
    });
  }

  private async fetchUsers(): Promise<PlaceholderUser[]> {
    const res = await fetch(this.target);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as PlaceholderUser[];
  }

  async run(): Promise<void> {
    if (!this.connection) throw new Error('Provider not connected');
    this.logger.info(`[jsonplaceholder] running sync from ${this.target}`);

    const users = await this.fetchUsers();

    const managedByAnnotations = {
      'backstage.io/managed-by-location':
        JsonPlaceholderEntityProvider.providerName,
      'backstage.io/managed-by-origin-location':
        JsonPlaceholderEntityProvider.providerName,
    };

    const companyNames = new Set(
      users.map(u => u.company?.name).filter(Boolean) as string[],
    );

    const groups: GroupEntity[] = [...companyNames].map(name => ({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Group',
      metadata: {
        name: toName(name),
        title: name,
        annotations: managedByAnnotations,
      },
      spec: {
        type: 'company',
        profile: { displayName: name },
        children: [],
      },
    }));

    if (!companyNames.has('Unknown')) {
      groups.push({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Group',
        metadata: {
          name: 'unknown',
          title: 'Unknown',
          annotations: managedByAnnotations,
        },
        spec: {
          type: 'company',
          profile: { displayName: 'Unknown' },
          children: [],
        },
      });
    }

    const groupNameByTitle = new Map(
      groups.map(g => [String(g.metadata.title), String(g.metadata.name)]),
    );

    const userEntities: UserEntity[] = users.map(u => {
      const displayName = u.name || u.username || `User ${u.id}`;
      const groupName =
        (u.company?.name && groupNameByTitle.get(u.company.name)) || 'unknown';

      const url =
        u.website && /^https?:\/\//i.test(u.website)
          ? u.website
          : u.website
          ? `http://${u.website}`
          : undefined;

      return {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'User',
        metadata: {
          name: toName(u.username || u.name || `user-${u.id}`),
          title: displayName,
          links: url ? [{ url, title: 'Website' }] : undefined,
          annotations: managedByAnnotations,
        },
        spec: {
          profile: { displayName, email: u.email },
          memberOf: [groupName],
        },
      };
    });

    const componentEntities: Entity[] = users.map(u => {
      const name = toName(u.username || u.name || `user-${u.id}`);
      const ownerGroup =
        (u.company?.name && groupNameByTitle.get(u.company.name)) || 'unknown';

      return {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: `svc-${name}`,
          description: `${u.name ?? u.username} sample service`,
          tags: ['jsonplaceholder', 'demo'],
          annotations: {
            'backstage.io/managed-by-location': `url:${this.target}`,
            'backstage.io/managed-by-origin-location': `url:${this.target}`,
          },
        },
        spec: {
          type: 'service',
          lifecycle: 'experimental',
          owner: `group:default/${ownerGroup}`,
        },
      };
    });

    const allEntities: Entity[] = [
      ...groups,
      ...userEntities,
      ...componentEntities,
    ];

    await this.connection.applyMutation({
      type: 'full',
      entities: allEntities.map(entity => ({
        entity,
        locationKey: JsonPlaceholderEntityProvider.providerName,
      })),
    });

    this.logger.info(
      `[jsonplaceholder] emitted ${groups.length} groups, ${userEntities.length} users, ${componentEntities.length} components`,
    );
  }
}
