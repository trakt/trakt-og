class LazyPromise<T> extends Promise<T> {
  // Chained promises are plain ones, not another lazy one.
  static override get [Symbol.species]() {
    return Promise;
  }

  #start: () => Promise<T>;
  #started: Promise<T> | undefined;

  constructor(start: () => Promise<T>) {
    super(() => {});
    this.#start = start;
  }

  override then<Fulfilled = T, Rejected = never>(
    onfulfilled?: ((value: T) => Fulfilled | PromiseLike<Fulfilled>) | null,
    onrejected?: ((reason: unknown) => Rejected | PromiseLike<Rejected>) | null,
  ): Promise<Fulfilled | Rejected> {
    return (this.#started ??= this.#start()).then(onfulfilled, onrejected);
  }
}

/** A promise that starts `start` on the first `.then` or `await`, and shares that one run with every later one. */
export function lazy<T>(start: () => Promise<T>): Promise<T> {
  return new LazyPromise(start);
}
