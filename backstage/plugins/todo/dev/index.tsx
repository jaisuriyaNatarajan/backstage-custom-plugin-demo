import { createDevApp } from '@backstage/dev-utils';
import { todoPlugin, TodoPage } from '../src/plugin';

createDevApp()
  .registerPlugin(todoPlugin)
  .addPage({
    element: <TodoPage />,
    title: 'Root Page',
    path: '/todo',
  })
  .render();
