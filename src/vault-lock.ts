// Serialize structural changes within one vault. A rejected operation must not block the queue.
const queues = new WeakMap<object, Promise<unknown>>();

export async function withVaultLock<T>(vault: object, operation: () => Promise<T>): Promise<T> {
  const previous = queues.get(vault) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(operation);
  queues.set(vault, next);
  try {
    return await next;
  } finally {
    if (queues.get(vault) === next) queues.delete(vault);
  }
}
