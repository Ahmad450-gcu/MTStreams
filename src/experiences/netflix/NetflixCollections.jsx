import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CatalogueRow } from "./NetflixHome";
import NetflixGrid, { GridView } from "./components/NetflixGrid";
import { useMyList } from "../shared/hooks";

const LANGUAGES = [
      ["ja", "Japanese"], ["ko", "Korean"], ["es", "Spanish"], ["hi", "Hindi"], ["fr", "French"], ["de", "German"],
      ["it", "Italian"], ["pt", "Portuguese"], ["tr", "Turkish"], ["zh", "Mandarin"], ["th", "Thai"], ["en", "English"],
];

function NewAndPopular() {
      return (
            <div className="nfx-page nfx-page--plain">
                  <h1 className="nfx-pagetitle">New &amp; Popular</h1>
                  <CatalogueRow title="New on Notflix" spec={{ types: ["movie", "tv"], sort: "new", windowDays: 120 }} />
                  <CatalogueRow title="Top 10 TV Shows Today" spec={{ types: ["tv"], sort: "trending" }} variant="top10" limit={10} />
                  <CatalogueRow title="Top 10 Movies Today" spec={{ types: ["movie"], sort: "trending" }} variant="top10" limit={10} />
                  <CatalogueRow title="Worth the Wait" spec={{ types: ["movie", "tv"], sort: "upcoming" }} />
                  <CatalogueRow title="New Episodes This Week" spec={{ types: ["tv"], sort: "airing", windowDays: 10 }} />
            </div>
      );
}

function Languages() {
      const [language, setLanguage] = useState("ja");
      const [sort, setSort] = useState("popular");
      return (
            <div className="nfx-page nfx-page--plain">
                  <div className="nfx-langbar">
                        <h1 className="nfx-pagetitle">Browse by Languages</h1>
                        <div className="nfx-langbar__controls">
                              <label>
                                    <span>Select Your Preferences</span>
                                    <select value="original" onChange={() => {}} aria-label="Language type">
                                          <option value="original">Original Language</option>
                                    </select>
                              </label>
                              <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language">
                                    {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                              </select>
                              <label>
                                    <span>Sort by</span>
                                    <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort">
                                          <option value="popular">Suggestions For You</option>
                                          <option value="new">Year Released</option>
                                          <option value="alpha">A-Z</option>
                                    </select>
                              </label>
                        </div>
                  </div>
                  <NetflixGrid key={`${language}-${sort}`} spec={{ types: ["movie", "tv"], sort, language }} />
            </div>
      );
}

function Kids() {
      return (
            <div className="nfx-page nfx-page--plain nfx-page--kids">
                  <h1 className="nfx-pagetitle">Kids</h1>
                  <CatalogueRow title="Popular with Kids" spec={{ types: ["movie", "tv"], sort: "popular", genres: "10751" }} />
                  <CatalogueRow title="Animated Movies" spec={{ types: ["movie"], sort: "popular", genres: "16" }} />
                  <CatalogueRow title="Kids' TV" spec={{ types: ["tv"], sort: "popular", genres: "10762" }} />
                  <CatalogueRow title="Family Comedies" spec={{ types: ["movie"], sort: "popular", genres: "10751,35" }} />
                  <CatalogueRow title="Animal Adventures" spec={{ types: ["movie", "tv"], sort: "popular", genres: "10751,12" }} />
            </div>
      );
}

export function NetflixMyList() {
      const { list } = useMyList("netflix");
      return (
            <div className="nfx-page nfx-page--plain">
                  <h1 className="nfx-pagetitle">My List</h1>
                  {list.length ? (
                        <GridView items={list} loading={false} hasMore={false} loadMore={() => {}} />
                  ) : (
                        <p className="nfx-empty">You haven&apos;t added any titles to your list yet.</p>
                  )}
            </div>
      );
}

export default function NetflixCollections() {
      const { slug } = useParams();
      useEffect(() => {
            document.title = "Notflix";
      }, [slug]);
      if (slug === "languages") return <Languages />;
      if (slug === "kids") return <Kids />;
      return <NewAndPopular />;
}
