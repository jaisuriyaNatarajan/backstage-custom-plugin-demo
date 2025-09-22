// packages/backend/src/plugins/teamBWebhookModule.ts

import {
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

// --- helper to normalize entity names (DNS-1123-ish) ---
function toName(s: string) {
  return (s || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

// --- read raw body without express, classic callback style ---
function readRawBodyCb(
  req: any,
  done: (err: Error | null, text?: string) => void,
) {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: any) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  req.on('end', () => {
    try {
      done(null, Buffer.concat(chunks).toString('utf8'));
    } catch (e: any) {
      done(e);
    }
  });
  req.on('error', (err: Error) => done(err));
}

// --- minimal provider that can upsert into the Catalog ---
class TeamBProvider implements EntityProvider {
  static providerName = 'team-b-webhook';
  private connection?: EntityProviderConnection;

  getProviderName() {
    return TeamBProvider.providerName;
  }

  async connect(c: EntityProviderConnection) {
    this.connection = c;
  }

  async upsert(entities: any[]) {
    if (!this.connection) throw new Error('Provider not connected');
    await this.connection.applyMutation({
      type: 'delta',
      added: entities.map(e => ({
        entity: e,
        locationKey: this.getProviderName(), // stable key so re-posts update
      })),
      updated: [],
      removed: [],
    });
  }
}

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'team-b-webhook',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        catalog: catalogProcessingExtensionPoint,
      },
      async init({ httpRouter, logger, catalog }) {
        const provider = new TeamBProvider();
        catalog.addEntityProvider(provider);

        // ONE plain middleware function; no Express import required
        httpRouter.use((req: any, res: any, next: any) => {
          if (!req.url?.startsWith('/webhooks/team-b')) return next();

          // Only handle POST
          if ((req.method || 'GET').toUpperCase() !== 'POST') {
            res.statusCode = 405;
            res.setHeader('allow', 'POST');
            res.end('Method Not Allowed');
            return;
          }

          readRawBodyCb(req, async (err, raw) => {
            try {
              if (err) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ error: 'invalid body stream' }));
                return;
              }

              const ct = String(
                req.headers['content-type'] || '',
              ).toLowerCase();
              let payload: any = {};
              if (ct.includes('application/json')) {
                try {
                  payload = raw ? JSON.parse(raw) : {};
                } catch {
                  res.statusCode = 400;
                  res.setHeader('content-type', 'application/json');
                  res.end(JSON.stringify({ error: 'invalid JSON' }));
                  return;
                }
              }

              if (!payload.serviceName) {
                res.statusCode = 400;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ error: 'serviceName is required' }));
                return;
              }

              const name = toName(String(payload.serviceName));
              const entity = {
                apiVersion: 'backstage.io/v1alpha1',
                kind: 'Component',
                metadata: {
                  name,
                  annotations: {
                    'team-b/id': String(payload.id ?? ''),
                    // 👇 makes the Catalog treat it as managed by a location
                    'backstage.io/managed-by-location': `url:webhook:team-b/${name}`,
                    'backstage.io/managed-by-origin-location': `url:webhook:team-b/${name}`,
                  },
                },
                spec: {
                  type: String(payload.type ?? 'service'),
                  owner: String(payload.owner ?? 'group:default/team-b'),
                  lifecycle: String(payload.lifecycle ?? 'production'),
                },
              };

              await provider.upsert([entity]);

              console.log(entity, 'Foxx');

              logger.info(
                `[team-b-webhook] Upserted: component:default/${name}`,
              );
              res.statusCode = 202;
              res.setHeader('content-type', 'application/json');
              res.end(
                JSON.stringify({
                  ok: true,
                  entityRef: `component:default/${name}`,
                }),
              );
            } catch (e: any) {
              logger.error(`[team-b-webhook] Error: ${e?.message}`);
              res.statusCode = 500;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ error: 'internal error' }));
            }
          });
        });

        logger.info('Team B webhook mounted at /api/webhooks/team-b');
      },
    });
  },
});
