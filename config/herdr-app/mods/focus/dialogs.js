import { div } from "gpui-kit";
import { h_flex, v_flex, InputState, Input, TextareaState, Textarea } from "gpui-base";
import { shared, setShared, spaces, machines, props, closeOverlay, openOverlay, run, theme, agents, terminals } from "herdr";
import { KEY, ICONS, COLORS, normalize, owner, move, removePanel, summary, LABEL, RANK } from "./model.js";
import { icon, stock, label, button, status, inputStyle } from "./ui.js";

const read = () => normalize(shared(KEY), spaces());
const save = data => setShared(KEY, data);
const close = () => closeOverlay(props().overlay);

export function initDialog(view, cx) {
  const p = props(), data = read();
  view.handle = cx.focus_handle();
  view.error = "";
  if (p.mode === "new-space") {
    view.machineIndex = 0;
    view.handle.focus();
  } else if (p.mode === "note") {
    view.text = TextareaState.new({ value: data.notes[p.space] ?? "", placeholder: "What should you remember when you return?", rows: 7 });
    view.text.on("change", (_e, cx) => cx.notify());
    view.text.on("submit", (_e, cx) => { submit(view); cx.notify(); });
    view.text.focus();
  } else if (p.mode === "panel") {
    const panel = data.panels.find(x => x.id === p.panel);
    view.name = InputState.new({ value: panel?.name ?? "", placeholder: "Panel name" });
    view.chosenIcon = panel?.icon ?? "folder";
    view.color = panel?.color ?? "ansi4";
    view.makeDefault = data.defaultPanel === p.panel;
    view.name.on("change", (_e, cx) => { view.error = ""; cx.notify(); });
    view.name.on("submit", (_e, cx) => { submit(view); cx.notify(); });
    view.name.focus();
    view.destination = data.panels.find(x => x.id !== p.panel)?.id;
  }
}

function submit(view) {
  if (view.saved) return;
  const p = props(), data = read();
  if (view.deleting) { const next = removePanel(data, p.panel, view.destination); view.saved = true; save(next); close(); return; }
  if (p.mode === "note") data.notes[p.space] = view.text.value();
  else {
    const name = view.name.value().trim();
    if (!name) { view.error = "Give this panel a name."; return; }
    const id = p.panel ?? `panel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const panel = { id, name, icon: view.chosenIcon, color: view.color };
    const at = data.panels.findIndex(x => x.id === id);
    if (at < 0) data.panels.push(panel); else data.panels[at] = panel;
    if (view.makeDefault) data.defaultPanel = id;
  }
  view.saved = true;
  save(data); close();
}

function menuRow(id, text, action, glyph = null, enabled = true, selected = false) {
  const t = theme();
  return h_flex().id(id).h(26).flex_none().px(6).gap(6).rounded(5).items_center().text_size(12)
    .text_color(enabled ? t.foreground : t.dim).bg(selected ? t.selected : "#00000000")
    .when(enabled, el => el.cursor_pointer().hover(el => el.bg(t.hover)))
    .on_click((e, cx) => { if (enabled) action(e, cx); })
    .when(glyph, el => el.child(glyph)).child(div().flex_1().truncate().child(text));
}

export function renderDialog(view) {
  const p = props(), t = theme(), data = read();
  if (p.mode === "new-space") {
    const choices = machines().slice().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    const ready = choices.filter(m => m.layout === "ready");
    view.machineIndex = Math.min(view.machineIndex, Math.max(0, ready.length - 1));
    const choose = machine => {
      if (!machine || machine.layout !== "ready") return;
      close(); run(`focus.new:${machine.name ?? ""}`);
    };
    return v_flex().id("focus-new-space-menu").w_full().h(Math.min(320, 38 + choices.length * 28)).min_h(0)
      .p(4).gap(1).bg(t.popover).track_focus(view.handle)
      .on_key_down((e, cx) => {
        if (e.key === "escape") { close(); cx.stop_propagation(); }
        else if (e.key === "enter") { choose(ready[view.machineIndex]); cx.stop_propagation(); }
        else if (e.key === "down" || e.key === "up") {
          view.machineIndex = (view.machineIndex + (e.key === "down" ? 1 : -1) + ready.length) % (ready.length || 1);
          cx.stop_propagation(); cx.notify();
        }
      })
      .child(div().px(6).py(4).text_size(10.5).text_color(t.dim).child("New space on"))
      .child(v_flex().flex_1().min_h(0).overflow_y_scrollbar().children(choices.map(machine =>
        menuRow(`new-space-${machine.name ?? ""}`, machine.name ?? "This computer", () => choose(machine),
          stock(machine.name ? "server" : "monitor", 12), machine.layout === "ready", ready[view.machineIndex] === machine)
          .when(machine.layout !== "ready", el => el.child(label(machine.layout))))));
  }
  const title = text => h_flex().w_full().items_center().justify_between()
    .child(div().text_size(17).font_semibold().child(text)).child(label("Esc to cancel"));
  const frame = () => v_flex().id(`focus-dialog-${p.mode}`).track_focus(view.handle).w_full().p(20).gap(14).min_h(0)
    .bg(t.popover).text_color(t.foreground).text_size(13)
    .on_key_down((e, cx) => {
      if (e.key === "escape") { close(); cx.stop_propagation(); }
      if (e.keystroke === "ctrl-enter" || e.keystroke === "cmd-enter") { submit(view); cx.stop_propagation(); cx.notify(); }
    });
  if (p.mode === "note") {
    const space = spaces().find(s => s.id === p.space);
    return frame().child(title(space?.name ?? "Space note"))
      .child(label("Shown in the space's details pane."))
      .child(inputStyle(Textarea.new(view.text), 190).py(9))
      .child(h_flex().w_full().gap(8).justify_end().child(button("note-cancel", "Cancel", close))
        .child(button("note-save", "Save note", () => submit(view), true)));
  }
  if (p.mode === "panel") {
    const panel = data.panels.find(x => x.id === p.panel);
    const deleting = view.deleting;
    return frame().child(title(deleting ? `Delete ${panel?.name}?` : panel ? "Edit panel" : "Create panel"))
      .when(!deleting, el => el
        .child(inputStyle(Input.new(view.name)))
        .child(label("Icon"))
        .child(h_flex().gap(6).children(ICONS.map(name => h_flex().id(`choose-icon-${name}`).size(35).items_center().justify_center().rounded(7)
          .bg(view.chosenIcon === name ? t.selected : t.raised).text_color(view.chosenIcon === name ? t[view.color] : t.muted)
          .border_1().border_color(view.chosenIcon === name ? t[view.color] : "#00000000").cursor_pointer().tooltip(name)
          .on_click((_e, cx) => { view.chosenIcon = name; cx.notify(); }).child(icon(name)))))
        .child(label("Color"))
        .child(h_flex().gap(8).children(COLORS.map(color => div().id(`choose-color-${color}`).size(24).rounded(12).bg(t[color])
          .border_2().border_color(view.color === color ? t.foreground : t.popover).cursor_pointer()
          .on_click((_e, cx) => { view.color = color; cx.notify(); }))))
        .child(menuRow("panel-default", "Default for unassigned spaces", (_e, cx) => {
          view.makeDefault = p.panel === data.defaultPanel ? true : !view.makeDefault; cx.notify();
        }, div().size(14).rounded(3).border_1().border_color(view.makeDefault ? t.accent : t.input)
          .text_size(11).text_color(t.accent).child(view.makeDefault ? "✓" : ""))))
      .when(deleting, el => el
        .child(div().text_color(t.muted).child("Move its spaces to another panel. Their terminals keep running."))
        .child(v_flex().max_h(170).overflow_y_scrollbar().children(data.panels.filter(x => x.id !== p.panel)
          .map(x => menuRow(`destination-${x.id}`, `${view.destination === x.id ? "✓ " : ""}${x.name}`, (_e, cx) => { view.destination = x.id; cx.notify(); }, icon(x.icon))))))
      .when(view.error, el => el.child(div().text_color(t.blocked).child(view.error)))
      .child(h_flex().w_full().gap(8).justify_between()
        .child(h_flex().gap(5)
          .when(panel && !deleting && data.panels.length > 1, el => el.child(button("panel-delete", "Delete…", (_e, cx) => { view.deleting = true; cx.notify(); })))
          .when(panel && !deleting, el => el
            .child(button("panel-left", "←", () => reorder(data, p.panel, -1)))
            .child(button("panel-right", "→", () => reorder(data, p.panel, 1)))))
        .child(h_flex().gap(8).child(button("panel-cancel", "Cancel", close))
          .child(button("panel-save", deleting ? "Move spaces and delete" : "Save", (_e, cx) => {
            if (deleting) { save(removePanel(data, p.panel, view.destination)); close(); }
            else { submit(view); cx.notify(); }
          }, true))));
  }
  if (p.mode === "space-menu") {
    const ids = p.ids ?? [p.space];
    const destinations = data.panels.filter(panel => ids.some(id => owner(data, id) !== panel.id));
    return v_flex().p(4).gap(1).bg(t.popover)
      .when(!destinations.length, el => el.child(div().px(6).py(4).text_size(11).text_color(t.dim).child("No other panels")))
      .when(destinations.length, el => el
        .child(div().px(6).py(4).text_size(10.5).text_color(t.dim).child(`Move ${ids.length === 1 ? "space" : `${ids.length} spaces`} to`))
        .child(v_flex().max_h(170).overflow_y_scrollbar().children(destinations.map(panel => menuRow(`move-${panel.id}`, panel.name,
          () => { save(move(read(), ids, panel.id)); close(); }, icon(panel.icon, 14).text_color(t[panel.color]))))))
      .when(ids.length === 1, el => el
        .when(destinations.length, el => el.child(div().h(1).my(3).bg(t.border)))
        .child(menuRow("context-note", "Edit note", () => {
          close(); openOverlay({ mod: "focus", kind: "dialog", width: 520, height: 350, props: { mode: "note", space: p.space } });
        }, icon("note", 14)))
        .child(menuRow("space-more", "More space actions…", () => {
          close(); openOverlay({ mod: "menu", kind: "popup", width: 220, height: 300, props: { tab: "space", target: { id: p.space } } });
        }, stock("chevron-right", 14))));
  }
  if (p.mode === "agents") {
    const space = spaces().find(s => s.id === p.space);
    const info = space ? summary(space, agents(), terminals()) : { list: [] };
    return frame().child(title(space?.name ?? "Agents"))
      .when(!info.list.length, el => el.child(label("No agents in this space")))
      .child(v_flex().max_h(250).overflow_y_scrollbar().gap(3).children([...info.list].sort((a, b) => (RANK[b.status] ?? 0) - (RANK[a.status] ?? 0))
        .map(a => menuRow(`agent-${a.address}`, `${a.program?.name ?? a.app ?? "Agent"} · ${a.title || LABEL[a.status] || a.status}`, () => {
          close(); run(a.pane ? "pane.focus" : "terminal.peek", a.pane ? { terminal: a.address } : { terminal: a.address });
        }, status(a.status)))));
  }
  return div();
}

function reorder(data, id, delta) {
  const i = data.panels.findIndex(p => p.id === id), at = i + delta;
  if (at < 0 || at >= data.panels.length) return;
  [data.panels[i], data.panels[at]] = [data.panels[at], data.panels[i]];
  save(data);
}
