import { memo, useState } from "react";
import { tmdbImg } from "./hooks";

/**
 * TMDB image with a graceful fallback: if the path is missing or the image
 * fails, a neutral gradient tile with the title is shown instead of a broken
 * image icon. Each experience styles the wrapper via `className`.
 */
function Img({ path, size = "w500", alt = "", className = "", fallbackTitle, eager = false, style }) {
      const [failed, setFailed] = useState(false);
      const src = tmdbImg(path, size);

      if (!src || failed) {
            return (
                  <div className={`xp-img-fallback ${className}`} style={style} role="img" aria-label={alt || fallbackTitle || "Artwork unavailable"}>
                        <span>{fallbackTitle || alt}</span>
                  </div>
            );
      }

      return (
            <img
                  className={className}
                  style={style}
                  src={src}
                  alt={alt}
                  loading={eager ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  onError={() => setFailed(true)}
            />
      );
}

export default memo(Img);
