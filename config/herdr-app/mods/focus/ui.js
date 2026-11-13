import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { theme } from "herdr";
import { LABEL } from "./model.js";

export const SPACE_ROW_HEIGHT = 28;

// Older running Herdr builds refuse SVGs behind out-of-tree symlinks.
// The installer copies these assets; JS stays linked for live edits.
export const icon = (name, size = 16) => svg(`focus-icons/${name}.svg`).size(size).flex_none();
export const stock = (name, size = 14) => svg(`mods/workspace-chrome/${name}.svg`).size(size).flex_none();
export const label = text => div().text_size(10.5).text_color(theme().muted).child(text);
export function button(id, text, action, primary = false) {
  const t = theme();
  return h_flex().id(id).h(32).px(12).gap(7).flex_none().items_center().justify_center().rounded(7)
    .bg(primary ? t.solid : t.raised).text_color(primary ? t.solid_foreground : t.foreground)
    .text_size(12).font_medium().cursor_pointer().hover(el => el.opacity(0.85)).on_click(action).child(text);
}
export function tool(id, glyph, hint, action) {
  const t = theme();
  return h_flex().id(id).size(26).flex_none().items_center().justify_center().rounded(6).text_color(t.dim)
    .cursor_pointer().hover(el => el.bg(t.hover).text_color(t.foreground)).tooltip(hint)
    .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
    .on_click((e, cx) => { cx.stop_propagation(); action(e, cx); }).child(glyph);
}
export function status(state, size = 16) {
  const t = theme();
  if (state === "working") return stock("spinner", size).text_color(t.working).spin(1000);
  if (state === "idle") return h_flex().size(size).flex_none().items_center().justify_center().tooltip(LABEL.idle)
    .child(div().size(9).rounded(5).border_1().border_color(t.muted));
  const symbol = { blocked: "!", done: "●", unknown: "?" }[state] ?? "?";
  return h_flex().size(size).flex_none().items_center().justify_center().text_size(state === "done" ? 10 : 14)
    .font_semibold().text_color(state === "idle" ? t.dim : t[state] ?? t.muted).tooltip(LABEL[state] ?? "No agent")
    .when(state === "blocked", el => el.rounded(5).border_1().border_color(t.blocked)).child(symbol);
}
export function inputStyle(el, height = 36) {
  const t = theme();
  return el.w_full().h(height).px(10).rounded(8).border_1().border_color(t.input).bg(t.background)
    .text_size(13).text_color(t.foreground);
}
