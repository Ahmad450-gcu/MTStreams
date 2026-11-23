import { useEffect, useRef, useState } from "react";
import Wordmark, { PEACOCK_DOTS } from "../Wordmark";
import "./splash.css";

// Original launch intros for each OTT experience, built only from the
// experience's fictional wordmark, its colours and CSS/SVG effects (no image
// or video assets, no network requests). Each runs ~2.3s, then fades out.

const DURATION = 2300;
const EXIT = 520;

// Deterministic pseudo-random so particles look scattered but never jump.
const rnd = (index, seed) => {
      const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
      return value - Math.floor(value);
};
const range = (count) => Array.from({ length: count }, (_, index) => index);

const SCENES = {
      netflix: {
            mark: 96,
            layers: () => (
                  <>
                        <div className="xsp-ribbons">
                              {range(14).map((index) => (
                                    <span key={index} style={{ "--i": index, "--x": `${(index / 13) * 100}%`, "--h": `${55 + rnd(index, 1) * 45}%`, "--d": `${rnd(index, 2) * 0.35}s`, "--hue": rnd(index, 3) > 0.5 ? "#e50914" : "#b20710" }} />
                              ))}
                        </div>
                        <div className="xsp-bloom" />
                  </>
            ),
      },
      prime: {
            mark: 92,
            layers: () => (
                  <>
                        <div className="xsp-haze" />
                        <svg className="xsp-arc" viewBox="0 0 400 120" aria-hidden="true">
                              <path d="M20 40 Q200 150 380 40" pathLength="1" />
                        </svg>
                        <span className="xsp-comet" />
                  </>
            ),
      },
      max: {
            mark: 84,
            layers: () => (
                  <>
                        <div className="xsp-aurora"><span /><span /><span /></div>
                        <div className="xsp-grain" />
                  </>
            ),
      },
      disney: {
            mark: 120,
            layers: () => (
                  <>
                        <div className="xsp-stars">
                              {range(70).map((index) => (
                                    <span key={index} style={{ left: `${rnd(index, 4) * 100}%`, top: `${rnd(index, 5) * 100}%`, "--s": `${1 + rnd(index, 6) * 2.4}px`, "--d": `${rnd(index, 7) * 1.6}s` }} />
                              ))}
                        </div>
                        <svg className="xsp-castle-arc" viewBox="0 0 400 200" aria-hidden="true">
                              <path d="M30 170 Q200 -40 370 170" pathLength="1" />
                        </svg>
                        <span className="xsp-sparkle" />
                  </>
            ),
      },
      hulu: {
            mark: 96,
            layers: () => (
                  <div className="xsp-rings">{range(3).map((index) => <span key={index} style={{ "--i": index }} />)}</div>
            ),
      },
      paramount: {
            mark: 104,
            layers: () => (
                  <>
                        <div className="xsp-glow-blue" />
                        <div className="xsp-orbit">
                              {range(22).map((index) => {
                                    const angle = 200 + (index / 21) * 140;
                                    return <span key={index} style={{ "--a": `${angle}deg`, "--from": `${(rnd(index, 8) - 0.5) * 900}px`, "--fromy": `${(rnd(index, 9) - 0.5) * 700}px`, "--d": `${index * 0.025}s` }}>✦</span>;
                              })}
                        </div>
                  </>
            ),
      },
      apple: {
            mark: 92,
            layers: () => <span className="xsp-line" />,
      },
      mgm: {
            mark: 94,
            layers: () => (
                  <>
                        <div className="xsp-spotlight" />
                        <div className="xsp-dust">
                              {range(36).map((index) => (
                                    <span key={index} style={{ left: `${10 + rnd(index, 10) * 80}%`, "--s": `${1 + rnd(index, 11) * 3}px`, "--d": `${rnd(index, 12) * 1.4}s`, "--t": `${1.6 + rnd(index, 13) * 1.4}s` }} />
                              ))}
                        </div>
                  </>
            ),
      },
      peacock: {
            mark: 86,
            layers: () => (
                  <div className="xsp-feathers">
                        {PEACOCK_DOTS.map((color, index) => <span key={color} style={{ "--c": color, "--a": `${-75 + index * 30}deg`, "--i": index }} />)}
                  </div>
            ),
      },
      hotstar: {
            mark: 84,
            layers: () => (
                  <>
                        <div className="xsp-jhglow" />
                        <div className="xsp-jhhalo" />
                        <svg className="xsp-jhspark" viewBox="0 0 20 20" aria-hidden="true">
                              <defs>
                                    <linearGradient id="xsp-jh" x1="0" y1="0" x2="1" y2="1">
                                          <stop offset="0" stopColor="#4c8dff" />
                                          <stop offset="0.55" stopColor="#b44dff" />
                                          <stop offset="1" stopColor="#ff4f9a" />
                                    </linearGradient>
                              </defs>
                              <path d="M10 0 C11 6.5 13.5 9 20 10 C13.5 11 11 13.5 10 20 C9 13.5 6.5 11 0 10 C6.5 9 9 6.5 10 0 Z" fill="url(#xsp-jh)" />
                        </svg>
                  </>
            ),
      },
      crunchyroll: {
            mark: 82,
            layers: () => (
                  <>
                        <div className="xsp-flash" />
                        <svg className="xsp-swirl" viewBox="0 0 200 200" aria-hidden="true">
                              <circle cx="100" cy="100" r="70" pathLength="1" />
                              <circle cx="100" cy="100" r="48" pathLength="1" />
                        </svg>
                  </>
            ),
      },
};

/** The MTStreams intro, re-using the launch intro's markup and styles from index.html. */
function MTStreamsSplash({ leaving }) {
      return (
            <div id="mt-splash" className={leaving ? "is-leaving" : ""} aria-hidden="true">
                  <div className="mt-splash__streak" />
                  <div className="mt-splash__glow" />
                  <div className="mt-splash__stage">
                        <svg className="mt-splash__mark" viewBox="0 0 512 512" role="presentation">
                              <defs>
                                    <linearGradient id="mtSplashMintR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a2f0e3" /><stop offset="1" stopColor="#43aa9b" /></linearGradient>
                                    <linearGradient id="mtSplashSurfaceR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#17252c" /><stop offset="1" stopColor="#080d12" /></linearGradient>
                              </defs>
                              <rect className="mt-splash__surface" width="512" height="512" rx="112" fill="url(#mtSplashSurfaceR)" />
                              <rect className="mt-splash__frame" pathLength="1" x="9" y="9" width="494" height="494" rx="103" fill="none" stroke="#d8f7f1" strokeOpacity=".5" strokeWidth="7" />
                              <path className="mt-splash__m" pathLength="1" d="M105 347V164l74 108 77-108v183" fill="none" stroke="url(#mtSplashMintR)" strokeWidth="39" strokeLinecap="round" strokeLinejoin="round" />
                              <path className="mt-splash__t" pathLength="1" d="M287 166h120M347 166v181" fill="none" stroke="#f2f7f6" strokeWidth="35" strokeLinecap="round" />
                              <path className="mt-splash__play" pathLength="1" d="m352 245 68 40-68 40" fill="none" stroke="url(#mtSplashMintR)" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-splash__word"><b>MT</b>STREAMS</p>
                        <p className="mt-splash__tag">Movies &amp; Series</p>
                  </div>
            </div>
      );
}

export default function ExperienceSplash({ experience, onDone }) {
      const [leaving, setLeaving] = useState(false);
      const done = useRef(false);

      useEffect(() => {
            // The launch cover from index.html (if any) can go now that the intro is painted.
            const cover = document.getElementById("mt-splash-cover");
            if (cover) requestAnimationFrame(() => cover.remove());
            const total = experience ? DURATION : 2350;
            const leave = () => {
                  if (done.current) return;
                  done.current = true;
                  setLeaving(true);
                  setTimeout(onDone, experience ? EXIT : 680);
            };
            const timer = setTimeout(leave, total);
            const onKey = () => leave();
            window.addEventListener("keydown", onKey, { once: true });
            window.__mtSplashSkip = leave;
            return () => {
                  clearTimeout(timer);
                  window.removeEventListener("keydown", onKey);
            };
      }, [experience, onDone]);

      if (!experience) {
            return <div className="xsp-click" onClick={() => window.__mtSplashSkip?.()}><MTStreamsSplash leaving={leaving} /></div>;
      }

      const scene = SCENES[experience];
      if (!scene) return null;
      return (
            <div className={`xsp xsp--${experience} ${leaving ? "is-leaving" : ""}`} aria-hidden="true" onClick={() => window.__mtSplashSkip?.()}>
                  {scene.layers()}
                  <div className="xsp-mark" style={{ "--h": `${scene.mark}px` }}>
                        <Wordmark service={experience} height={scene.mark} />
                  </div>
            </div>
      );
}
