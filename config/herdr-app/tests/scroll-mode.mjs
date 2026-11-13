// Run with: node --experimental-vm-modules config/herdr-app/tests/scroll-mode.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

let target = { terminal: "t1", shown: "remote/t2" };
const calls = [];
const closed = [];
const effects = [];
let focused = 0;
let stopped = 0;
const cx = {
  focus_handle: () => ({ focus: () => focused++ }),
  stop_propagation: () => stopped++,
};
const context = createContext({});
const exports = {
  "gpui-kit": { View: class {}, div: () => {} },
  herdr: {
    focused: () => target,
    props: () => ({ overlay: "mod-scroll-mode" }),
    run: (name, args) => {
      const call = [name, JSON.parse(JSON.stringify(args))];
      calls.push(call);
      effects.push(["run", ...call]);
    },
    closeOverlay: (id) => { closed.push(id); effects.push(["close", id]); },
    theme: () => ({}),
  },
};
const module = new SourceTextModule(
  readFileSync(new URL("../mods/scroll-mode/main.js", import.meta.url), "utf8"),
  { context },
);
await module.link((name) => new SyntheticModule(Object.keys(exports[name]), function () {
  for (const [key, value] of Object.entries(exports[name])) this.setExport(key, value);
}, { context }));
await module.evaluate();
const mode = new module.namespace.default();
mode.init(null, cx);
assert.equal(focused, 1);
function press(mode, keystroke) {
  const before = stopped;
  mode.onKey({ keystroke }, cx);
  assert.equal(stopped, before + 1);
}

for (const [key, args] of [
  ["j", { lines: 1 }], ["k", { lines: -1 }],
  ["down", { lines: 1 }], ["up", { lines: -1 }],
  ["ctrl-d", { pages: 0.5 }], ["ctrl-u", { pages: -0.5 }],
  ["ctrl-f", { pages: 1 }], ["ctrl-b", { pages: -1 }],
  ["pagedown", { pages: 1 }], ["pageup", { pages: -1 }],
  ["shift-g", { to: "bottom" }],
]) {
  press(mode, key);
  assert.deepEqual(calls.pop(), ["terminal.scroll", { ...args, terminal: "remote/t2" }]);
}

press(mode, "g");
assert.equal(calls.length, 0);
press(mode, "g");
assert.deepEqual(calls.pop(), ["terminal.scroll", { to: "top", terminal: "remote/t2" }]);

// Scrolling stays scoped to the terminal where the mode opened.
target = { terminal: "t3" };
press(mode, "k");
assert.deepEqual(calls.pop(), ["terminal.scroll", { lines: -1, terminal: "remote/t2" }]);
assert.equal(closed.length, 0);

for (const key of ["g", "a", "g", "ctrl-q"]) press(mode, key);
assert.equal(calls.length, 0);
assert.equal(closed.length, 0);
for (const key of ["q", "escape"]) press(mode, key);
assert.deepEqual(closed, ["mod-scroll-mode", "mod-scroll-mode"]);

// Plain terminals and missing terminal focus both work without guessing a target.
const plain = new module.namespace.default();
target = { terminal: "t3" };
plain.init(null, cx);
press(plain, "j");
assert.deepEqual(calls.pop(), ["terminal.scroll", { lines: 1, terminal: "t3" }]);
target = null;
const empty = new module.namespace.default();
empty.init(null, cx);
press(empty, "k");
assert.equal(calls.length, 0);
press(empty, "q");
assert.equal(closed.length, 3);

// Close the popup before navigating so the destination gets real keyboard focus.
// The only terminal command must be navigation, leaving scroll positions alone.
for (const direction of ["left", "down", "up", "right"]) {
  effects.length = 0;
  const before = stopped;
  mode.navigate(direction, cx);
  assert.equal(stopped, before + 1);
  assert.deepEqual(effects, [
    ["close", "mod-scroll-mode"],
    ["run", "pane.go", { direction }],
  ]);
}
console.log("PASS: scoped scrolling, exit before pane navigation, key consumption, gg, and missing focus");
