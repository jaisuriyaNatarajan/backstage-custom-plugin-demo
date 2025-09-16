// src/plugins/playPlugin.ts
import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { playRouteRef } from '../routes';

export const playPlugin = createPlugin({ id: 'play' });

export const PlayPageExtension = playPlugin.provide(
  createRoutableExtension({
    name: 'PlayPageExtension',
    component: () => import('../components/PlayPage').then(m => m.PlayPage),
    mountPoint: playRouteRef,
  }),
);
