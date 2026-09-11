import "fake-indexeddb/auto";

const entries = new Map<string, string>();
const localStorage = {
  get length() { return entries.size; },
  clear: () => entries.clear(),
  getItem: (key: string) => entries.get(key) ?? null,
  key: (index: number) => Array.from(entries.keys())[index] ?? null,
  removeItem: (key: string) => { entries.delete(key); },
  setItem: (key: string, value: string) => { entries.set(key, value); },
} as Storage;

const documentElement = {} as HTMLElement;
Object.defineProperty(documentElement, "dataset", { value: {}, configurable: true });
Object.defineProperty(documentElement, "style", { value: { colorScheme: "" }, configurable: true });
documentElement.setAttribute = (name: string, value: string) => {
  if (name.startsWith("data-")) documentElement.dataset[name.slice(5)] = value;
};
documentElement.getAttribute = (name: string) =>
  name.startsWith("data-") ? documentElement.dataset[name.slice(5)] ?? null : null;

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage,
    navigator: { serviceWorker: {}, standalone: false },
    matchMedia: () => ({ matches: false }),
  },
});
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: { documentElement },
});
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: { randomUUID: () => `00000000-0000-4000-8000-${Math.random().toString().slice(2, 14).padEnd(12, "0")}` },
});
