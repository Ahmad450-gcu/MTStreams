import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactPlayer from "react-player";
import { Volume2, VolumeX } from "lucide-react";
import StarIcon from "./Icons/StarIcon";
import GlisseSurface from "./GlisseSurface";

export default function DetailHero({ detail, mediaType = "movie", videoLink, children }) {
      const isTV = mediaType === "tv";
      const { pathname } = useLocation();
      const isPlaybackOverlay = /\/(?:watch|trailer)(?:\/|$)/.test(pathname);
      const title = isTV ? detail.name || detail.original_name : detail.title || detail.original_title;
      const imagePath = detail.backdrop_path || detail.poster_path;
      const runtime = Number(detail.runtime);
      const rating = Number(detail.vote_average) || 0;
      const previewUrl = videoLink?.site === "YouTube" && videoLink?.key
            ? `https://www.youtube.com/watch?v=${videoLink.key}`
            : null;
      const [isMuted, setIsMuted] = useState(true);
      const [previewReady, setPreviewReady] = useState(false);
      const [previewFailed, setPreviewFailed] = useState(false);

      useEffect(() => {
            setIsMuted(true);
            setPreviewReady(false);
            setPreviewFailed(false);
      }, [videoLink?.key]);

useEffect(() => {
            setIsMuted(true);
      }, [isPlaybackOverlay]);

      return (
            <header className={`detail-hero ${previewUrl && !previewFailed ? "detail-hero--preview" : ""}`}>
                  <div className="hero-artwork detail-hero__artwork" data-glisse-backdrop>
                        <img
                              className="detail-hero__image"
                              src={imagePath ? `https://image.tmdb.org/t/p/original${imagePath}` : "/noImage.jpg"}
                              srcSet={imagePath ? `https://image.tmdb.org/t/p/w780${imagePath} 780w, https://image.tmdb.org/t/p/w1280${imagePath} 1280w, https://image.tmdb.org/t/p/original${imagePath} 1920w` : undefined}
                              sizes="100vw"
                              onError={(event) => { event.currentTarget.removeAttribute("srcset"); event.currentTarget.src = "/noImage.jpg"; }}
                              alt=""
                              decoding="async"
                        />
                        {previewUrl && !previewFailed && (
                              <div className={`detail-hero__preview ${previewReady ? "is-ready" : ""}`} aria-hidden="true">
                                    <ReactPlayer
                                          url={previewUrl}
                                          width="100%"
                                          height="100%"
                                          playing={!isPlaybackOverlay}
                                          muted={isMuted || isPlaybackOverlay}
                                          loop
                                          controls={false}
                                          playsinline
                                          onReady={() => setPreviewReady(true)}
                                          onError={() => setPreviewFailed(true)}
                                          config={{
                                                youtube: {
                                                      playerVars: {
                                                            autoplay: 1,
                                                            mute: 1,
                                                            controls: 0,
                                                            rel: 0,
                                                            modestbranding: 1,
                                                            playsinline: 1,
                                                            iv_load_policy: 3,
                                                      },
                                                },
                                          }}
                                    />
                              </div>
                        )}
                  </div>
                  <div className="detail-hero__content">
                        <span className="detail-hero__eyebrow">{isTV ? "SERIES SPOTLIGHT" : previewUrl ? "FEATURED TRAILER PREVIEW" : "MOVIE SPOTLIGHT"}</span>
                        <h1 className="detail-hero__title" data-length={title?.length > 24 ? "long" : title?.length > 14 ? "medium" : undefined}>{title}</h1>
                        <p className="detail-hero__tagline">{detail.tagline || detail.status}</p>
                        <div className="detail-hero__tags">
                              {isTV ? (
                                    <GlisseSurface className="detail-hero__tag">Total Seasons: {detail.number_of_seasons}</GlisseSurface>
                              ) : runtime > 0 ? (
                                    <GlisseSurface className="detail-hero__tag">
                                          {Math.floor(runtime / 60)}h {runtime % 60}min
                                    </GlisseSurface>
                              ) : null}
                              {detail.genres?.map((genre) => (
                                    <GlisseSurface className="detail-hero__tag" key={genre.id}>
                                          {genre.name}
                                    </GlisseSurface>
                              ))}
                        </div>
                        <div className="detail-hero__rating">
                              <span className="detail-hero__score">
                                    <StarIcon className="shrink-0" />
                                    {rating.toFixed(0)}/10
                              </span>
                              <span className="detail-hero__votes">{(detail.vote_count || 0).toLocaleString()} votes</span>
                        </div>
                        {previewUrl && !previewFailed && (
                              <div className="detail-hero__preview-tools">
                                    <span><i /> TRAILER PREVIEW</span>
                                    <button type="button" onClick={() => setIsMuted((muted) => !muted)} aria-label={isMuted ? "Unmute trailer preview" : "Mute trailer preview"}>
                                          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                                          {isMuted ? "Sound off" : "Sound on"}
                                    </button>
                              </div>
                        )}
                        {children}
                  </div>
            </header>
      );
}
