const callbacks = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | undefined;

const shared = () =>
  (observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const callback = callbacks.get(entry.target);
        observer?.unobserve(entry.target);
        callbacks.delete(entry.target);
        callback?.();
      }
    },
    { rootMargin: '200px' },
  ));

/** Calls back once when the element comes within 200px of the viewport; one observer serves every element. */
export function onceInView(element: Element, callback: () => void) {
  callbacks.set(element, callback);
  shared().observe(element);
  return () => {
    callbacks.delete(element);
    observer?.unobserve(element);
  };
}
