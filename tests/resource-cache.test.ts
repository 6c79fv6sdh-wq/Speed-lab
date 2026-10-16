import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
const source = readFileSync('public/coi.js', 'utf8');

function setup(version = 'new') {
  const stores = new Map<string, Map<string, Response>>();
  const scope = 'https://example.org/lab/';
  const events: Record<string, (event: unknown) => void> = {};
  const fetch = vi.fn(async () => new Response('fresh resource'));
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name)!;
      return {
        match: async (request: Request) => entries.get(request.url)?.clone(),
        put: async (request: Request, response: Response) => { entries.set(request.url, response); },
        keys: async () => [...entries.keys()].map(url => new Request(url)),
        delete: async (request: Request) => entries.delete(request.url),
      };
    },
  };
  runInNewContext(source, {
    self: { registration: { scope }, location: { origin: 'https://example.org' }, LAB_RESOURCE_VERSION: version,
      addEventListener: (name: string, handler: (event: unknown) => void) => { events[name] = handler; } },
    caches, fetch, URL, Headers, Response,
  });
  const resource = (path: string) => {
    let response: Promise<Response> | undefined;
    events.fetch({ request: new Request(`https://example.org${path}`), respondWith: (value: Promise<Response>) => { response = value; } });
    return response;
  };
  return { stores, scope, events, fetch, resource, caches };
}

it('uses a content-versioned cache and leaves another installation alone', async () => {
  const { stores, scope, events, fetch, resource } = setup();
  stores.set(`sciencechess:${scope}:old:engine`, new Map());
  stores.set('sciencechess:https://example.org/other/:old:engine', new Map());
  let activation!: Promise<unknown>;
  events.activate({ waitUntil: (promise: Promise<unknown>) => { activation = promise; } });
  await activation;
  expect(stores.has(`sciencechess:${scope}:old:engine`)).toBe(false);
  expect(stores.has('sciencechess:https://example.org/other/:old:engine')).toBe(true);
  expect(await (await resource('/lab/engine/stockfish.js'))!.text()).toBe('fresh resource');
  expect(stores.has(`sciencechess:${scope}:new:engine`)).toBe(true);
  await resource('/lab/engine/stockfish.js');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(resource('/other/engine/stockfish.js')).toBeUndefined();
});

it('preserves Maia worker isolation headers on network and cached responses', async () => {
  const { resource, fetch } = setup();
  for (let i = 0; i < 2; i++) {
    const response = await resource('/lab/lc0/worker.js');
    expect(response?.headers.get('Cross-Origin-Embedder-Policy')).toBe('require-corp');
    expect(response?.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    expect(await response?.text()).toBe('fresh resource');
  }
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('loads fresh resources when browser cache storage is unavailable', async () => {
  const { resource, caches } = setup();
  vi.spyOn(caches, 'open').mockRejectedValue(new Error('storage disabled'));
  expect(await (await resource('/lab/engine/stockfish.js'))?.text()).toBe('fresh resource');
});
