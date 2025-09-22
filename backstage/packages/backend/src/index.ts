import { createBackend } from '@backstage/backend-defaults';
import { log } from './logger';
import { winstonLoggerServiceFactory } from './logger/serviceFactory';

const backend = createBackend();

backend.add(winstonLoggerServiceFactory);

// ✅ Use dynamic import (same as your other lines). Do NOT call it.
backend.add(import('./plugins/teamBWebhookModule'));
// If you moved the file, update the path consistently.

console.log('🟥 Backend booting (raw console)');
log.info('Backstage backend starting', { service: 'backstage-backend' });
log.info('Scheduled job executed', { job: 'sync:entities', count: 42 });

// Standard modules…
backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(
  import('@backstage/plugin-scaffolder-backend-module-notifications'),
);
backend.add(import('@backstage/plugin-techdocs-backend'));
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));
backend.add(import('./modules/catalog-module-jsonplaceholder'));
backend.add(import('@backstage/plugin-permission-backend'));
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-pg'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));
backend.add(import('@backstage/plugin-notifications-backend'));
backend.add(import('@backstage/plugin-signals-backend'));
backend.add(import('@internal/plugin-todo-backend'));

backend.start();
