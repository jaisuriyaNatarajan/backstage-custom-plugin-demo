import { todoPlugin } from './plugin';

describe('todo', () => {
  it('should export plugin', () => {
    expect(todoPlugin).toBeDefined();
  });
});
