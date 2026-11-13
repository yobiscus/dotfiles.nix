// node --experimental-vm-modules config/herdr-app/tests/focus.mjs
import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync, mkdtempSync, writeFileSync, rmSync, lstatSync, realpathSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const root = fileURLToPath(new URL("../mods/focus/", import.meta.url));
const plain = value => JSON.parse(JSON.stringify(value));

async function setup() {
  const env = { data: {}, props: {}, calls: [], overlays: [], timers: [], focused: "t1", clipboard: "", sp: [
    { id: "a", name: "Auth", machine: null, folder: "/repo/auth", tabs: [], active: true, status: "blocked" },
    { id: "remote/a", name: "Research", machine: "remote", folder: "/repo/lab", tabs: [], status: "working" },
    { id: "c", name: "CLI", machine: null, folder: "/repo/cli", tabs: [], status: "done" },
  ], agents: [
    { address: "t1", space: "a", pane: "p1", status: "blocked", title: "Needs approval" },
    { address: "remote/t1", space: "remote/a", pane: "remote/p1", status: "working", title: "Compare results" },
    { address: "t3", space: "c", pane: "p3", status: "done", title: "CLI results" },
  ], terminals: [], machines: [{ name: null, layout: "ready" }, { name: "remote", layout: "ready" }] };
  const cx = {
    notify() {}, stop_propagation() {}, focus_handle: () => ({
      focused: false, focus() { this.focused = true; }, is_focused() { return this.focused; },
    }),
    timer: { every() {}, after(ms, fn) { env.timers.push(fn); } }, spawn() {},
    write_to_clipboard(text) { env.clipboard = text; },
  };
  function element() {
    const node = { children: [], handlers: {}, id: null };
    let builder;
    builder = new Proxy(node, { get(node, key) {
      if (key === "node") return node;
      if (key === "when") return (yes, fn) => yes ? fn(builder) : builder;
      if (key === "child") return child => { node.children.push(child); return builder; };
      if (key === "children") return children => { node.children.push(...children); return builder; };
      if (key === "id") return id => { node.id = id; return builder; };
      if (key.startsWith("on_")) return (...args) => { node.handlers[`${key}${args.length === 2 ? `:${args[0]}` : ""}`] = args.at(-1); return builder; };
      return () => builder;
    } });
    return builder;
  }
  const input = options => ({
    text: options?.value ?? "", events: {},
    value() { return this.text; },
    set_value(text) { this.text = text; },
    on(event, fn) { this.events[event] = fn; }, focus() {}, set_selected_range() {},
  });
  const hosts = {
    "gpui-kit": { View: class {}, div: element, svg: element },
    "gpui-base": { h_flex: element, v_flex: element, InputState: { new: input }, Input: { new: element },
      TextareaState: { new: input }, Textarea: { new: element },
      VirtualListScrollHandle: { new: () => ({ scroll_to_item() {}, scroll_to_bottom() {} }) },
      v_virtual_list(id, count, sizes, key, render) { return element().id(id).children(render({ start: 0, end: count }, cx)); },
    },
    herdr: {
      shared: key => env.data[key], setShared: (key, value) => { env.data[key] = value; },
      spaces: () => env.sp, agents: () => env.agents, terminals: () => env.terminals, panes: () => [],
      focused: () => ({ terminal: env.focused }), props: () => env.props,
      machines: () => env.machines,
      theme: () => new Proxy({}, { get: (_, key) => `#${String(key)}` }), window: () => ({ active: true }),
      run(name, args) {
        env.calls.push([name, plain(args ?? {})]);
        if (name === "space.select") for (const s of env.sp) s.active = s.id === args.id;
        if (name === "pane.focus") env.focused = args.terminal;
      },
      openOverlay(spec) { env.overlays.push(spec); return "overlay"; }, closeOverlay() {},
      nextCommand: () => new Promise(() => {}), exec: async (...args) => {
        (env.execCalls ??= []).push(args);
        return env.execResult ?? { code: 0, stdout: "", stderr: "" };
      },
    },
  };
  const context = vm.createContext({});
  const cache = new Map();
  const load = (name, from) => {
    const key = name.startsWith(".") ? path.resolve(path.dirname(from.identifier), name) : name;
    if (cache.has(key)) return cache.get(key);
    let mod;
    if (hosts[key]) mod = new vm.SyntheticModule(Object.keys(hosts[key]), function () {
      for (const [name, value] of Object.entries(hosts[key])) this.setExport(name, value);
    }, { context, identifier: key });
    else mod = new vm.SourceTextModule(readFileSync(key, "utf8"), { context, identifier: key });
    cache.set(key, mod); return mod;
  };
  const mod = load(path.join(root, "main.js"));
  await mod.link(load); await mod.evaluate();
  const model = cache.get(path.join(root, "model.js")).namespace;
  const view = new mod.namespace.default(); view.init({}, cx);
  const find = (id, tree = view.render(cx)) => {
    if (!tree || typeof tree !== "object") return null;
    if (tree.node.id === id) return tree;
    for (const child of tree.node.children) { const result = find(id, child); if (result) return result; }
    return null;
  };
  const fire = (id, event, value) => {
    const node = find(id); assert.ok(node, `Missing ${id}`);
    assert.equal(typeof node.node.handlers[event], "function", `Missing ${event} on ${id}`);
    node.node.handlers[event](value, cx);
  };
  const event = (x, y, modifiers = {}, localY = 10) => ({ position: { x, y }, local_position: { x: 10, y: localY }, modifiers });
  return { env, view, model, cx, find, fire, event, View: mod.namespace.default };
}

test("All is a view; every space has exactly one real owner, including offline spaces", async () => {
  const { model: m } = await setup();
  const data = m.normalize(null, [{ id: "a" }, { id: "remote/a" }]);
  assert.equal(data.members.a, "work"); assert.equal(data.members["remote/a"], "work");
  assert.throws(() => m.move(data, ["a"], "all"));
  const moved = m.move(data, ["remote/a"], "parked");
  assert.equal(m.normalize(moved, [{ id: "a" }]).members["remote/a"], "parked");
  assert.equal(m.panelSpaces(moved, [{ id: "a" }, { id: "remote/a" }], "all").length, 2);
});

test("bulk moves and Undo preserve notes and hosts; All reordering preserves ownership", async () => {
  const { model: m, env } = await setup();
  let data = m.normalize(null, env.sp); data.notes.a = "Waiting for review";
  const order = plain(data.order);
  data = m.move(data, ["a", "remote/a"], "parked");
  assert.deepEqual(plain(data.order), order);
  assert.equal(data.members.a, "parked"); assert.equal(data.members["remote/a"], "parked");
  data.notes.a = "A newer note";
  const restored = m.undoMove(data);
  assert.equal(restored.members.a, "work"); assert.equal(restored.notes.a, "A newer note");
  const reordered = m.reorder(data, ["a"], "c", true);
  assert.equal(reordered.members.a, "parked"); assert.equal(reordered.order[reordered.order.indexOf("c") + 1], "a");
  assert.equal(env.sp[1].machine, "remote");
});

test("deleting panels rehomes spaces and keeps a valid default", async () => {
  const { model: m, env } = await setup();
  const data = m.normalize(null, env.sp), next = m.removePanel(data, "work", "research");
  assert.equal(next.members.a, "research"); assert.equal(next.defaultPanel, "research");
  assert.throws(() => m.removePanel(data, "work", "work"));
});

test("space rows expose status and metadata with machine groups and no Agents section", async () => {
  const { find } = await setup();
  for (const id of ["focus-panel-all", "focus-panel-work", "focus-space-all-a", "focus-machine-all-local", "focus-machine-all-remote-remote", "focus-status-all-a", "focus-details"]) assert.ok(find(id));
  assert.equal(find("agents"), null);
});

test("dragging multiple spaces to an icon changes membership, including cross-host selections", async () => {
  const { view, env, fire, event } = await setup();
  const order = plain(view.data.order);
  view.selected = new Set(["a", "remote/a"]);
  fire("focus-space-all-a", "on_mouse_down:left", event(60, 160));
  fire("focus-panel-parked", "on_mouse_move", event(210, 70));
  fire("focus-panel-parked", "on_mouse_up:left", event(210, 70));
  assert.equal(env.data["focus.workspace.v1"].members.a, "parked");
  assert.equal(env.data["focus.workspace.v1"].members["remote/a"], "parked");
  assert.deepEqual(plain(view.data.order), order);
  assert.ok(!env.calls.some(([name]) => /close|kill|move/.test(name)));
  view.selected.clear();
  fire("focus-space-all-a", "on_mouse_down:left", event(60, 160));
  fire("focus-space-all-c", "on_mouse_move", event(60, 195, {}, 16));
  fire("focus-space-all-c", "on_mouse_up:left", event(60, 195, {}, 16));
  assert.equal(view.data.order[view.data.order.indexOf("c") + 1], "a");
  assert.equal(view.data.members.a, "parked");
});

test("All rejects assignment; leaving the sidebar cancels hover previews", async () => {
  const { view, env, fire, event, cx } = await setup();
  fire("focus-space-all-a", "on_mouse_down:left", event(60, 160));
  fire("focus-panel-research", "on_mouse_move", event(150, 70));
  for (const fn of env.timers) fn(cx);
  assert.equal(view.preview, "research"); assert.equal(view.data.active, "all");
  fire("focus-sidebar", "on_hover", false);
  assert.equal(view.preview, null); assert.equal(view.drag, null);
  fire("focus-space-all-a", "on_mouse_down:left", event(60, 160));
  fire("focus-panel-all", "on_mouse_move", event(20, 70));
  fire("focus-panel-all", "on_mouse_up:left", event(20, 70));
  assert.equal(view.data.members.a, "work");
});

test("space navigation crosses machine sections, wraps, and stays inside the active panel", async () => {
  const { view, env, model: m, cx } = await setup();
  view.command("space-next", cx);
  assert.equal(env.sp.find(s => s.active).id, "c");
  view.updateView({ folded: { remote: true } });
  view.command("space-next", cx);
  assert.equal(env.sp.find(s => s.active).id, "remote/a");
  assert.equal(view.data.views.all.folded.remote, false);
  view.command("space-next", cx);
  assert.equal(env.sp.find(s => s.active).id, "a");
  view.command("space-prev", cx);
  assert.equal(env.sp.find(s => s.active).id, "remote/a");
  view.commit(m.move(view.data, ["remote/a"], "research"));
  view.selectPanel("work", cx); view.render(cx); env.calls.length = 0;
  view.command("space-prev", cx);
  assert.deepEqual(env.calls.at(-1), ["space.select", { id: "c" }]);
  view.command("space1", cx);
  assert.deepEqual(env.calls.at(-1), ["space.select", { id: "a" }]);
  view.command("space-next", cx);
  assert.deepEqual(env.calls.at(-1), ["space.select", { id: "c" }]);
  assert.ok(!env.calls.some(([, args]) => args.id === "remote/a"));
});

test("panel picking numbers All first and follows icon order, including empty panels", async () => {
  const { view, env, cx, find, fire } = await setup();
  assert.equal(find("focus-panel-number-all"), null);
  const data = view.data;
  data.panels.unshift(data.panels.pop());
  view.commit(data);
  view.command("panel-pick", cx);
  assert.ok(find("focus-panel-number-all").node.children.includes("1"));
  assert.ok(find("focus-panel-number-parked").node.children.includes("2"));
  assert.ok(find("focus-panel-alert-all"));
  fire("focus-sidebar", "on_key_down", { key: "2", keystroke: "2" });
  assert.equal(view.data.active, "parked");
  assert.equal(view.content, "focus-empty");
  assert.equal(find("focus-panel-number-all"), null);
  view.command("panel-pick", cx);
  fire("focus-sidebar", "on_key_down", { key: "1", keystroke: "1" });
  assert.equal(view.data.active, "all");
  assert.equal(view.content, "focus-terminal");
  assert.ok(!env.calls.some(([name]) => name === "terminal.send"));
});

test("Escape and focus loss dismiss panel numbers without clearing search or bulk selection", async () => {
  const { view, cx, find, fire } = await setup();
  view.query = "review"; view.updateView({ query: "review" });
  view.selected = new Set(["a", "c"]);
  view.command("panel-pick", cx);
  fire("focus-sidebar", "on_key_down", { key: "9", keystroke: "9" });
  assert.ok(find("focus-panel-number-all"));
  fire("focus-sidebar", "on_key_down", { key: "escape", keystroke: "escape" });
  assert.equal(find("focus-panel-number-all"), null);
  assert.equal(view.query, "review");
  assert.deepEqual([...view.selected], ["a", "c"]);
  view.command("panel-pick", cx);
  view.handle.focused = false;
  assert.equal(find("focus-panel-number-all"), null);
});

test("native navigation replaces mouse selection without clearing deliberate bulk selection on redraw", async () => {
  const { view, env, fire, event, cx } = await setup();
  fire("focus-space-all-c", "on_mouse_down:left", event(70, 210));
  fire("focus-space-all-c", "on_mouse_up:left", event(70, 210));
  view.render(cx);
  assert.deepEqual([...view.selected], ["c"]);
  for (const s of env.sp) s.active = s.id === "remote/a";
  view.render(cx);
  assert.deepEqual([...view.selected], ["remote/a"]);
  assert.equal(view.anchor, "remote/a");
  fire("focus-space-all-a", "on_mouse_down:left", event(70, 160, { control: true }));
  fire("focus-space-all-a", "on_mouse_up:left", event(70, 160, { control: true }));
  view.render(cx);
  assert.deepEqual([...view.selected], ["remote/a", "a"]);
  view.selectSpace("a");
  for (const s of env.sp) s.active = s.id === "c";
  view.render(cx);
  assert.deepEqual([...view.selected], ["c"]);
});

test("move destinations match existing panels and omit an already shared owner", async () => {
  const { view, env, find, fire } = await setup();
  const data = view.data;
  data.panels = data.panels.filter(p => ["work", "research"].includes(p.id));
  view.commit(data);
  env.props = { mode: "space-menu", space: "a", ids: ["a"] };
  assert.ok(find("move-research"));
  const order = plain(view.data.order);
  for (const id of ["work", "all", "priority", "blocked", "parked"]) assert.equal(find(`move-${id}`), null);
  fire("move-research", "on_click");
  assert.deepEqual(plain(view.data.order), order);
  assert.equal(view.data.members.a, "research");
  env.props.ids = ["a", "c"];
  assert.ok(find("move-work")); assert.ok(find("move-research"));
});

test("an empty or disconnected model renders and creates on the default local machine", async () => {
  const { env, View, cx, find } = await setup();
  env.sp = []; env.agents = [];
  const empty = new View(); empty.init({}, cx);
  assert.ok(find("focus-panel-all", empty.render(cx)));
  empty.newSpace();
  assert.deepEqual(env.calls.at(-1), ["space.new", { machine: "" }]);
});

test("new spaces inherit the panel and active machine, including creation in All", async () => {
  const { view, env, model: m, cx } = await setup();
  view.commit(m.move(view.data, ["remote/a"], "research"));
  view.selectPanel("research", cx); view.render(cx); view.newSpace();
  assert.deepEqual(env.calls.at(-1), ["space.new", { machine: "remote" }]);
  for (const s of env.sp) s.active = false;
  env.sp.push({ id: "remote/new", name: "New", machine: "remote", tabs: [], active: true });
  view.render(cx); assert.equal(view.data.members["remote/new"], "research");
  view.selectPanel("all", cx);
  assert.equal(m.creation(view.data, env.sp[1]).panel, "research");
});

test("closing the last space retains its machine and a working creation button in All", async () => {
  const { view, env, find, fire, cx } = await setup();
  view.commit({ ...view.data, defaultPanel: "priority" });
  view.commit({ ...view.data, members: { ...view.data.members, a: "research" } });
  env.sp = env.sp.filter(s => s.machine !== "remote");
  assert.ok(find("focus-machine-all-remote-remote"));
  assert.equal(find("focus-machine-work-remote-remote"), null);
  fire("focus-machine-new-remote", "on_click");
  assert.deepEqual(env.calls.at(-1), ["space.new", { machine: "remote" }]);
  assert.equal(view.pendingCreations.at(-1).panel, "research");
  env.sp = []; env.agents = [];
  assert.ok(find("focus-machine-all-local"));
  assert.ok(find("focus-machine-all-remote-remote"));
  assert.equal(find("focus-list-empty"), null);
  fire("focus-machine-new-remote", "on_click");
  assert.equal(view.pendingCreations.at(-1).panel, "priority");
  view.selectPanel("work", cx);
  assert.equal(find("focus-machine-work-remote-remote"), null);
  assert.ok(find("focus-list-empty"));
  view.selectPanel("all", cx); view.query = "missing";
  assert.equal(find("focus-machine-all-remote-remote"), null);
  assert.ok(find("focus-list-empty"));
});

test("the split button chooses an empty machine without losing the named panel", async () => {
  const { view, env, View, cx, fire, find } = await setup();
  env.sp = env.sp.filter(s => s.machine !== "remote");
  view.selectPanel("research", cx);
  fire("focus-space-new", "on_click");
  assert.deepEqual(env.calls.at(-1), ["space.new", { machine: "" }]);
  fire("focus-space-new-machine", "on_click");
  assert.equal(env.overlays.at(-1).props.mode, "new-space");
  env.props = { ...env.overlays.at(-1).props, overlay: "new" };
  const menu = new View(); menu.init({}, cx);
  find("new-space-remote", menu.render(cx)).node.handlers.on_click({}, cx);
  assert.deepEqual(env.calls.at(-1), ["focus.new:remote", {}]);
  env.props = {};
  view.command(env.calls.at(-1)[0].slice("focus.".length), cx);
  assert.deepEqual(env.calls.at(-1), ["space.new", { machine: "remote" }]);
  assert.equal(view.pendingCreations.at(-1).panel, "research");
  for (const s of env.sp) s.active = false;
  env.sp.push({ id: "remote/new", name: "New", machine: "remote", tabs: [], active: true });
  view.render(cx);
  assert.equal(view.data.members["remote/new"], "research");
  view.newSpace("");
  assert.deepEqual(env.calls.at(-1), ["space.new", { machine: "" }]);
});

test("machine selection disables unavailable hosts, skips them by keyboard, and rechecks readiness", async () => {
  const { view, env, View, cx, find } = await setup();
  env.machines.splice(1, 0, { name: "loading", layout: "loading" }, { name: "offline", layout: "unavailable" });
  env.props = { mode: "new-space", overlay: "new" };
  const menu = new View(); menu.init({}, cx);
  const before = env.calls.length;
  for (const name of ["loading", "offline"]) find(`new-space-${name}`, menu.render(cx)).node.handlers.on_click({}, cx);
  assert.equal(env.calls.length, before);
  find("focus-new-space-menu", menu.render(cx)).node.handlers.on_key_down({ key: "down" }, cx);
  find("focus-new-space-menu", menu.render(cx)).node.handlers.on_key_down({ key: "enter" }, cx);
  assert.deepEqual(env.calls.at(-1), ["focus.new:remote", {}]);
  env.props = {}; env.machines.find(m => m.name === "remote").layout = "unavailable";
  view.render(cx);
  const pending = view.pendingCreations.length, calls = env.calls.length;
  view.command("new:remote", cx); view.newSpace("loading"); view.newSpace("unknown");
  find("focus-machine-new-offline").node.handlers.on_click({}, cx);
  assert.equal(view.pendingCreations.length, pending);
  assert.equal(env.calls.length, calls);
  env.machines = env.machines.map(m => ({ ...m, layout: "unavailable" }));
  env.props = { mode: "new-space", overlay: "new" };
  for (const key of ["down", "enter"]) find("focus-new-space-menu", menu.render(cx)).node.handlers.on_key_down({ key }, cx);
  assert.equal(env.calls.length, calls);
});

test("machine selection is available in the compact sidebar and empty content", async () => {
  const { view, env, View, cx, fire, find } = await setup();
  view.width = 44;
  fire("focus-space-new-machine", "on_click");
  assert.equal(env.overlays.at(-1).props.mode, "new-space");
  env.props = { mode: "empty" };
  const empty = new View(); empty.init({}, cx);
  find("empty-new-machine", empty.render(cx)).node.handlers.on_click({}, cx);
  assert.deepEqual(env.calls.at(-1), ["focus.new-menu", {}]);
});

test("scoped/global search includes notes and selecting a global result reveals its owner", async () => {
  const { view, model: m, cx, env } = await setup();
  let data = m.move(view.data, ["remote/a"], "research"); data.notes["remote/a"] = "DuckDB comparison"; view.commit(data);
  view.selectPanel("work", cx); view.query = "DuckDB";
  assert.equal(view.visible().length, 0);
  view.searchAll = true; assert.equal(view.visible()[0].id, "remote/a");
  view.selectSpace("remote/a", true); view.render(cx);
  assert.equal(view.data.active, "research"); assert.ok(env.sp[1].active);
});

test("clearing search persists even though programmatic input changes do not emit change", async () => {
  const { view, cx } = await setup();
  view.selectPanel("work", cx);
  view.input.set_value("Auth"); view.input.events.change({}, cx);
  assert.equal(view.data.views.work.query, "Auth");
  view.onKey({ key: "escape" }, cx);
  view.selectPanel("research", cx); view.selectPanel("work", cx);
  assert.equal(view.query, ""); assert.equal(view.data.views.work.query, "");
});

test("drag preview shows the destination independently of the source search", async () => {
  const { env, view, model: m, cx, fire, event } = await setup();
  view.commit(m.move(view.data, ["remote/a"], "research"));
  view.query = "Auth"; view.searchAll = true;
  fire("focus-space-all-a", "on_mouse_down:left", event(60, 160));
  fire("focus-panel-research", "on_mouse_move", event(150, 70));
  for (const fn of env.timers) fn(cx);
  assert.equal(view.visible()[0].id, "remote/a");
  view.onKey({ key: "escape" }, cx);
  assert.equal(view.query, "Auth"); assert.equal(view.data.active, "all");
});

test("queued creation retains each request's chosen panel", async () => {
  const { env, view, cx } = await setup();
  view.selectPanel("priority", cx); view.newSpace();
  view.selectPanel("work", cx); view.newSpace();
  for (const s of env.sp) s.active = false;
  env.sp.push({ id: "new1", name: "Priority task", tabs: [], machine: null },
    { id: "new2", name: "Work task", tabs: [], machine: null, active: true });
  view.render(cx);
  assert.equal(view.data.members.new1, "priority"); assert.equal(view.data.members.new2, "work");
});

test("panel switches retain selection and independent machine folds", async () => {
  const { view, model: m, cx } = await setup();
  view.commit(m.move(view.data, ["remote/a"], "research"));
  view.selectPanel("work", cx); view.selectSpace("c"); view.toggleMachine(null);
  view.selectPanel("research", cx); view.selectPanel("work", cx);
  assert.equal(view.current().id, "c");
  assert.equal(m.viewOf(view.data, "work").folded[""], true);
  assert.equal(m.viewOf(view.data, "research").folded[""], undefined);
});

test("sub-agent input requests reach their space's summary without duplicating agents", async () => {
  const { model: m, env } = await setup();
  env.terminals = [{ address: "child", parent: "remote/t1", state: "live", status: "error" }];
  const info = m.summary(env.sp[1], env.agents, env.terminals);
  assert.equal(info.status, "blocked"); assert.equal(info.counts.blocked, 1); assert.equal(info.counts.working, 1);
});

test("notes save against the explicitly targeted space and cancel leaves them unchanged", async () => {
  const { env, view, View, cx, find } = await setup();
  env.props = { mode: "note", space: "remote/a", overlay: "note" };
  const editor = new View(); editor.init({}, cx);
  editor.text.set_value("Waiting for review\nCompare the lab results");
  find("note-save", editor.render(cx)).node.handlers.on_click({}, cx);
  assert.equal(view.data.notes["remote/a"], "Waiting for review\nCompare the lab results");
  assert.equal(view.data.notes.a, undefined);
  const cancel = new View(); cancel.init({}, cx); cancel.text.set_value("Discard this draft");
  find("note-cancel", cancel.render(cx)).node.handlers.on_click({}, cx);
  assert.equal(view.data.notes["remote/a"], "Waiting for review\nCompare the lab results");
});

test("custom panels can be created and renamed without changing existing ownership", async () => {
  const { env, view, View, cx, find } = await setup();
  env.props = { mode: "panel", overlay: "panel" };
  const editor = new View(); editor.init({}, cx); editor.name.set_value("Reviews");
  find("panel-save", editor.render(cx)).node.handlers.on_click({}, cx);
  find("panel-save", editor.render(cx)).node.handlers.on_click({}, cx);
  const panel = view.data.panels.find(p => p.name === "Reviews"); assert.ok(panel);
  assert.equal(view.data.members.a, "work");
  env.props = { mode: "panel", panel: panel.id, overlay: "panel" };
  const rename = new View(); rename.init({}, cx); rename.name.set_value("Waiting on reviews");
  find("panel-save", rename.render(cx)).node.handlers.on_click({}, cx);
  assert.equal(view.data.panels.find(p => p.id === panel.id).name, "Waiting on reviews");
  assert.equal(view.data.panels.length, 6);
});

test("unknown agent status stays unknown and Shift-selection follows machine-grouped order", async () => {
  const { env, view, model: m, cx, event } = await setup();
  assert.equal(m.summary({ id: "x", tabs: [] }, [{ space: "x", address: "x1", status: "unknown" }], []).status, "unknown");
  view.anchor = "a";
  view.press(env.sp[2], event(50, 200, { shift: true }), cx);
  view.release(env.sp[2], event(50, 200, { shift: true }), cx);
  assert.deepEqual([...view.selected].sort(), ["a", "c"]);
});

test("Git metadata parser reads real staged/unstaged and newline-containing untracked paths", async () => {
  const { model: m } = await setup(), dir = mkdtempSync(path.join(os.tmpdir(), "focus-git-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  try {
    git("init", "-q", "-b", "feature/focus");
    writeFileSync(path.join(dir, "tracked"), "one\n"); git("add", "tracked");
    git("-c", "user.name=Focus test", "-c", "user.email=focus@example.invalid", "commit", "-qm", "initial");
    writeFileSync(path.join(dir, "tracked"), "two\n"); git("add", "tracked");
    writeFileSync(path.join(dir, "tracked"), "three\n");
    writeFileSync(path.join(dir, "new\nfile"), "test\n");
    const info = m.parseGit(git("status", "--porcelain=v2", "-z", "--branch", "--no-renames"));
    assert.equal(info.branch, "feature/focus"); assert.equal(info.dirty, 2);
    assert.equal(info.staged, 1); assert.equal(info.unstaged, 1); assert.equal(info.untracked, 1);
    const drift = m.parseGit("# branch.head fix/login\0# branch.upstream origin/fix/login\0# branch.ab +2 -3\0");
    assert.equal(drift.ahead, 2); assert.equal(drift.behind, 3); assert.equal(drift.upstream, "origin/fix/login");
  } finally { rmSync(dir, { recursive: true }); }
});

test("failed Git reads preserve known drift and changed-file counts as stale", async () => {
  const { env, view, cx } = await setup(), space = env.sp[0];
  let pending = [];
  cx.spawn = fn => pending.push(fn(cx));
  env.execResult = { code: 0, stdout: "# branch.head topic\0# branch.ab +2 -1\0? draft\0", stderr: "" };
  view.git.refresh([space], [], cx, space); await Promise.all(pending);
  assert.equal(view.git.get(space, []).ahead, 2); assert.equal(view.git.get(space, []).dirty, 1);
  env.execResult = { code: 1, stdout: "", stderr: "machine unavailable" };
  pending = []; view.git.invalidate(space, []); view.git.refresh([space], [], cx, space); await Promise.all(pending);
  const stale = view.git.get(space, []);
  assert.equal(stale.stale, true); assert.equal(stale.ahead, 2); assert.equal(stale.dirty, 1);
});

test("installation keeps module imports together and SVGs inside the app's asset boundary", () => {
  const home = mkdtempSync(path.join(os.tmpdir(), "focus-install-"));
  try {
    const installer = path.resolve(root, "../../install-focus.py");
    execFileSync("python3", [installer], { env: { ...process.env, HERDR_APP_HOME: home } });
    const installed = path.join(home, "mods/focus");
    assert.ok(lstatSync(installed).isSymbolicLink());
    assert.equal(realpathSync(installed), realpathSync(root));
    assert.equal(path.dirname(realpathSync(path.join(installed, "model.js"))), realpathSync(installed));
    const assets = path.join(home, "focus-icons");
    assert.ok(lstatSync(assets).isDirectory());
    assert.ok(!lstatSync(assets).isSymbolicLink());
    for (const name of readdirSync(path.join(root, "icons"))) {
      assert.ok(!lstatSync(path.join(assets, name)).isSymbolicLink());
      assert.deepEqual(readFileSync(path.join(assets, name)), readFileSync(path.join(root, "icons", name)));
    }
    writeFileSync(path.join(assets, "all.svg"), "old generated asset");
    execFileSync("python3", [installer], { env: { ...process.env, HERDR_APP_HOME: home } });
    assert.deepEqual(readFileSync(path.join(assets, "all.svg")), readFileSync(path.join(root, "icons/all.svg")));
    assert.ok(JSON.parse(readFileSync(path.join(home, "keys.json"), "utf8"))["layout:focus"]);
  } finally { rmSync(home, { recursive: true }); }
});
