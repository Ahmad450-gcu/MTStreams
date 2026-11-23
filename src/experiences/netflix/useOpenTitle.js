import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { typeOf } from "../shared/hooks";

export const watchPathFor = (item, season = 1, episode = 1) => {
      const type = typeOf(item);
      return type === "tv" ? `/tv/details/${item.id}/watch/${season}/${episode}` : `/movie/details/${item.id}/watch`;
};

/**
 * Opens a title the Notflix way: the details "jaw-bone" modal over the
 * current page (desktop), keeping the current page as background location.
 */
export function useOpenTitle() {
      const navigate = useNavigate();
      const location = useLocation();
      return useCallback((item, { play = false, season, episode } = {}) => {
            const background = location.state?.backgroundLocation || location;
            const isMobile = window.matchMedia?.("(max-width: 740px)").matches;
            const state = isMobile ? undefined : { backgroundLocation: background };
            if (play) navigate(watchPathFor(item, season || item.season || 1, episode || item.episode || 1), { state });
            else navigate(`/${typeOf(item)}/details/${item.id}`, { state });
      }, [navigate, location]);
}
