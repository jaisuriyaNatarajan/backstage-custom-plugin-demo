import {
  createPlugin,
  createRouteRef,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
import { todoApiRef, TodoClient } from './api/TodoApi';

export const rootRouteRef = createRouteRef({ id: 'todo' });

export const todoPlugin = createPlugin({
  id: 'todo',
  routes: { root: rootRouteRef },
  apis: [
    createApiFactory({
      api: todoApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new TodoClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const TodoPage = todoPlugin.provide(
  createRoutableExtension({
    name: 'TodoPage',
    mountPoint: rootRouteRef,
    component: () => import('./components/TodoPage').then(m => m.default),
  }),
);
