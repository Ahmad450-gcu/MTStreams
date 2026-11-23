import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useExperience } from "./shared/ExperienceContext";
import { SERVICES, SERVICE_ORDER } from "./shared/services";
import Wordmark from "./shared/Wordmark";

const TILE_BACKGROUNDS = {
      netflix: "#000",
      prime: "linear-gradient(135deg,#0f171e,#00050d)",
      max: "linear-gradient(135deg,#0026a8 0%,#000 75%)",
      disney: "radial-gradient(circle at 70% 10%,#1f3a8a 0,#1a1d29 60%)",
      hulu: "#0b0c0f",
      paramount: "linear-gradient(135deg,#0064ff 0%,#0a0f1e 70%)",
      apple: "linear-gradient(135deg,#1c1c1e,#000)",
      mgm: "linear-gradient(135deg,#1a1408,#000)",
      peacock: "linear-gradient(135deg,#111 0%,#000 100%)",
      crunchyroll: "linear-gradient(135deg,#1a0e05,#000)",
      hotstar: "radial-gradient(circle at 80% 0%,#3a1f6b 0,#0f1014 65%)",
};

export default function ExperiencePicker() {
      const { experience, setExperience } = useExperience();
      const navigate = useNavigate();

      useEffect(() => {
            document.title = "Choose your experience | MTStreams";
      }, []);

      const choose = (key) => {
            setExperience(key);
            navigate("/", { replace: false });
      };

      return (
            <main className="xp-picker">
                  <header className="xp-picker__head">
                        <span className="xp-picker__eyebrow">MTSTREAMS EXPERIENCES</span>
                        <h1>Choose how you browse.</h1>
                        <p>
                              Switch MTStreams into a different streaming-service interface. Each experience shows only titles
                              associated with that service in any country, with its own home, search, catalogue and detail pages.
                        </p>
                  </header>

                  <div className="xp-picker__grid">
                        <button
                              type="button"
                              className={`xp-picker__tile ${!experience ? "is-active" : ""}`}
                              style={{ "--tile-bg": "linear-gradient(135deg,#10231f,#08090d)" }}
                              onClick={() => choose(null)}
                        >
                              <span className="xp-picker__mark">
                                    <img src="/logo-512.png" alt="" width="40" height="40" />
                                    <span style={{ marginLeft: 10, fontWeight: 800, letterSpacing: "0.12em" }}>MTSTREAMS</span>
                              </span>
                              <span className="xp-picker__label">
                                    Original experience
                                    {!experience && <span className="xp-picker__check"><Check size={12} /> Active</span>}
                              </span>
                        </button>

                        {SERVICE_ORDER.map((key) => {
                              const service = SERVICES[key];
                              const active = experience === key;
                              return (
                                    <button
                                          key={key}
                                          type="button"
                                          className={`xp-picker__tile ${active ? "is-active" : ""}`}
                                          style={{ "--tile-bg": TILE_BACKGROUNDS[key] }}
                                          onClick={() => choose(key)}
                                          aria-pressed={active}
                                    >
                                          <span className="xp-picker__mark">
                                                <Wordmark service={key} height={key === "disney" ? 52 : 34} />
                                          </span>
                                          <span className="xp-picker__label">
                                                {service.brand}
                                                {active && <span className="xp-picker__check"><Check size={12} /> Active</span>}
                                          </span>
                                    </button>
                              );
                        })}
                  </div>

                  <p className="xp-picker__note">
                        Experiences are fan-made interface recreations with fictionalised names and are not affiliated with, or
                        endorsed by, any streaming service. Titles are grouped using TMDB watch-provider data; playback always uses
                        MTStreams&apos; own players.
                  </p>
            </main>
      );
}
