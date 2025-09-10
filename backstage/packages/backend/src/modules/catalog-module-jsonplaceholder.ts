import {
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { JsonPlaceholderEntityProvider } from '../plugins/jsonPlaceholderProvider';

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'jsonplaceholder-provider',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        catalog: catalogProcessingExtensionPoint,
      },
      async init({ logger, scheduler, catalog }) {
        logger.info('[jsonplaceholder] catalog module init');
        const provider = JsonPlaceholderEntityProvider.create({
          logger,
          scheduler,
        });
        catalog.addEntityProvider(provider);
      },
    });
  },
});
