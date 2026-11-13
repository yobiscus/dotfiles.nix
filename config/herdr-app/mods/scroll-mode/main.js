import { View, div } from "gpui-kit";
import { closeOverlay, focused, props, run, theme } from "herdr";

const SCROLL = {
  j: { lines: 1 },
  k: { lines: -1 },
  down: { lines: 1 },
  up: { lines: -1 },
  "ctrl-d": { pages: 0.5 },
  "ctrl-u": { pages: -0.5 },
  "ctrl-f": { pages: 1 },
  "ctrl-b": { pages: -1 },
  pagedown: { pages: 1 },
  pageup: { pages: -1 },
  "shift-g": { to: "bottom" },
};

export default class ScrollMode extends View {
  init(_props, cx) {
    const target = focused();
    this.terminal = target?.shown ?? target?.terminal;
    this.pendingG = false;
    this.handle = cx.focus_handle();
    this.handle.focus();
  }

  navigate(direction, cx) {
    cx.stop_propagation();
    closeOverlay(props().overlay);
    run("pane.go", { direction });
  }

  onKey(event, cx) {
    cx.stop_propagation();
    const key = event.keystroke;
    if (key === "q" || key === "escape") {
      closeOverlay(props().overlay);
      return;
    }
    const terminal = this.terminal;
    if (!terminal) return;

    let scroll = SCROLL[key];
    if (key === "g") {
      if (this.pendingG) scroll = { to: "top" };
      this.pendingG = !this.pendingG;
    } else {
      this.pendingG = false;
    }
    if (scroll) run("terminal.scroll", { ...scroll, terminal });
  }

  render() {
    const t = theme();
    const terminal = this.terminal;
    let element = div()
      .id("scroll-mode")
      .track_focus(this.handle)
      .px(12)
      .py(9)
      .text_size(12)
      .text_color(t.foreground)
      .on_key_down((event, cx) => this.onKey(event, cx))
      .child(terminal
        ? `Scroll ${terminal} · j/k · Ctrl+d/u · gg/G · q/Esc`
        : "No terminal to scroll · q/Esc exit");
    for (const direction of ["left", "down", "up", "right"]) {
      element = element.on_action(`pane.go:${direction}`, (_event, cx) => this.navigate(direction, cx));
    }
    return element;
  }
}
