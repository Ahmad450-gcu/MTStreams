import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pin, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { GENRES } from "../discover/discoverConfig";
import { describeSection, genreKey, resetLayout, saveLayout, useHomeLayout } from "./homeLayout";
import "./home.css";

/** "Customize home" button and panel: reorder, hide, pin genres, density. */
export default function HomeCustomizer() {
      const layout = useHomeLayout();
      const [open, setOpen] = useState(false);
      const [genreType, setGenreType] = useState("movie");
      const closeRef = useRef(null);

      useEffect(() => {
            if (!open) return undefined;
            closeRef.current?.focus();
            const onKey = (event) => event.key === "Escape" && setOpen(false);
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
      }, [open]);

      const move = (index, direction) => {
            const order = [...layout.order];
            const target = index + direction;
            if (target < 0 || target >= order.length) return;
            [order[index], order[target]] = [order[target], order[index]];
            saveLayout({ ...layout, order });
      };
      const toggleHidden = (key) => saveLayout({ ...layout, hidden: layout.hidden.includes(key) ? layout.hidden.filter((entry) => entry !== key) : [...layout.hidden, key] });
      const togglePin = (type, id) => {
            const key = genreKey(type, id);
            saveLayout({ ...layout, order: layout.order.includes(key) ? layout.order.filter((entry) => entry !== key) : [...layout.order, key] });
      };
      // "Movies first" / "Series first": a stable sort by each row's media type.
      const prioritize = (kind) => {
            const rank = (key) => {
                  const section = describeSection(key);
                  return section.kind === kind ? 0 : section.kind === "mixed" ? 1 : 2;
            };
            saveLayout({ ...layout, order: [...layout.order].sort((a, b) => rank(a) - rank(b)) });
      };

      return (
            <>
                  <button type="button" className="hc-trigger" onClick={() => setOpen(true)}>
                        <SlidersHorizontal size={15} /> Customize home
                  </button>
                  {open && (
                        <div className="hc-overlay" role="dialog" aria-modal="true" aria-label="Customize home" onClick={() => setOpen(false)}>
                              <div className="hc-panel" onClick={(event) => event.stopPropagation()} data-lenis-prevent>
                                    <header>
                                          <h2>Customize home</h2>
                                          <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
                                    </header>
                                    <p className="hc-hint">Saved on this device. The featured banner always stays at the top.</p>

                                    <h3>Rows</h3>
                                    <ol className="hc-rows">
                                          {layout.order.map((key, index) => {
                                                const section = describeSection(key);
                                                const hidden = layout.hidden.includes(key);
                                                return (
                                                      <li key={key} className={hidden ? "is-hidden" : ""}>
                                                            <span>{section.label}{section.genre ? <Pin size={12} aria-label="Pinned genre" /> : null}</span>
                                                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${section.label} up`}><ArrowUp size={15} /></button>
                                                            <button type="button" onClick={() => move(index, 1)} disabled={index === layout.order.length - 1} aria-label={`Move ${section.label} down`}><ArrowDown size={15} /></button>
                                                            {section.genre ? (
                                                                  <button type="button" onClick={() => togglePin(section.type, section.genre)} aria-label={`Remove ${section.label}`}><X size={15} /></button>
                                                            ) : (
                                                                  <button type="button" onClick={() => toggleHidden(key)} aria-pressed={!hidden} aria-label={`${hidden ? "Show" : "Hide"} ${section.label}`}>{hidden ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                                                            )}
                                                      </li>
                                                );
                                          })}
                                    </ol>
                                    <div className="hc-quick">
                                          <button type="button" onClick={() => prioritize("movie")}>Movies first</button>
                                          <button type="button" onClick={() => prioritize("tv")}>Series first</button>
                                    </div>

                                    <h3>Pin a genre row</h3>
                                    <div className="hc-type" role="radiogroup" aria-label="Genre type">
                                          {[["movie", "Movies"], ["tv", "Series"]].map(([key, label]) => (
                                                <button key={key} type="button" role="radio" aria-checked={genreType === key} className={genreType === key ? "is-on" : ""} onClick={() => setGenreType(key)}>{label}</button>
                                          ))}
                                    </div>
                                    <div className="hc-genres">
                                          {GENRES[genreType].map(([id, name]) => {
                                                const pinned = layout.order.includes(genreKey(genreType, id));
                                                return <button key={id} type="button" aria-pressed={pinned} className={pinned ? "is-on" : ""} onClick={() => togglePin(genreType, id)}>{pinned && <Pin size={12} />} {name}</button>;
                                          })}
                                    </div>

                                    <h3>Layout</h3>
                                    <div className="hc-type" role="radiogroup" aria-label="Density">
                                          {[["spacious", "Spacious"], ["compact", "Compact"]].map(([key, label]) => (
                                                <button key={key} type="button" role="radio" aria-checked={layout.density === key} className={layout.density === key ? "is-on" : ""} onClick={() => saveLayout({ ...layout, density: key })}>{label}</button>
                                          ))}
                                    </div>

                                    <button type="button" className="hc-reset" onClick={resetLayout}><RotateCcw size={15} /> Restore default layout</button>
                              </div>
                        </div>
                  )}
            </>
      );
}
