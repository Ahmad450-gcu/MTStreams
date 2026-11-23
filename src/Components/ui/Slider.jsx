import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import Card from "./Card";

function Slider({ trendingMovie, type = "movie" }) {
      const [width, setWidth] = useState(0);
      const carousel = useRef(null);
      const shell = useRef(null);
      const x = useMotionValue(0);

      useEffect(() => {
            const rail = carousel.current;
            if (!rail) return;
            const updateWidth = () => setWidth(Math.max(0, rail.scrollWidth - rail.clientWidth));
            updateWidth();
            const observer = new ResizeObserver(updateWidth);
            observer.observe(rail);
            return () => observer.disconnect();
      }, [trendingMovie]);

      // Keep the row in range when it gets narrower (resize, fewer items).
      useEffect(() => {
            if (x.get() < -width) x.set(-width);
      }, [width, x]);

      // Sideways touchpad swipes and Shift+wheel move the row. Vertical
      // scrolling is left alone so the page still scrolls over a row.
      useEffect(() => {
            const node = shell.current;
            if (!node) return;
            const onWheel = (event) => {
                  if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || width <= 0) return;
                  const next = Math.min(0, Math.max(-width, x.get() - event.deltaX));
                  if (next === x.get()) return;
                  x.stop();
                  x.set(next);
                  event.preventDefault();
                  // Tell Lenis (page smooth scroll) not to treat this as page scroll.
                  event.lenisStopPropagation = true;
            };
            node.addEventListener("wheel", onWheel, { passive: false });
            return () => node.removeEventListener("wheel", onWheel);
      }, [width, x]);

      return (
            <div className="media-rail-shell" ref={shell}>
                  <motion.div
                        ref={carousel}
                        drag="x"
                        style={{ x }}
                        dragElastic={0.12}
                        dragConstraints={{ right: 0, left: -width }}
                        dragTransition={{ bounceDamping: 30 }}
                        transition={{ duration: 0.1, ease: "easeInOut" }}
                        className="media-rail"
                  >
                        {trendingMovie?.map((eachMovie, index) => (
                              <motion.div key={eachMovie.id || index} className="media-rail__item">
                                    <Card type={type} eachMovie={eachMovie} />
                              </motion.div>
                        ))}
                  </motion.div>
            </div>
      );
}

export default Slider;
