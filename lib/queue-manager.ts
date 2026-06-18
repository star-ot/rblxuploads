interface QueueOptions<T> {
  items: T[];
  concurrency: number;
  worker: (item: T) => Promise<void>;
}

export async function runQueue<T>({
  items,
  concurrency,
  worker,
}: QueueOptions<T>): Promise<void> {
  if (!items.length) {
    return;
  }

  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: safeConcurrency }, () => runWorker()),
  );
}
