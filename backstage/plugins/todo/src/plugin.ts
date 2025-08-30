import {
  createPlugin,
  createRouteRef,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({ id: 'todo' });

export const todoPlugin = createPlugin({
  id: 'todo',
  routes: { root: rootRouteRef },
});

export const TodoPage = todoPlugin.provide(
  createRoutableExtension({
    name: 'TodoPage',
    mountPoint: rootRouteRef,
    component: () => import('./components/TodoPage').then(m => m.default),
  }),
);
