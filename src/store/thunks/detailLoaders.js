import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axios";

// A stalled network request must not leave a detail page loading forever.
const DETAIL_REQUEST_TIMEOUT_MS = 12000;

const requestConfig = (signal) => ({
      signal,
      timeout: DETAIL_REQUEST_TIMEOUT_MS,
});

const getOptionalData = async (path, fallback, signal) => {
      try {
            const response = await api.get(path, requestConfig(signal));
            return response.data ?? fallback;
      } catch (error) {
            if (signal.aborted) throw error;
            return fallback;
      }
};

const getErrorMessage = (error, fallback) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
            return "You're offline. Reconnect to the internet and try again.";
      }

      if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
            return "The request took too long. Please check your connection and try again.";
      }

      if (!error?.response) {
            return "We couldn't reach TMDB. Check your internet connection and try again.";
      }

      return error.response.data?.status_message || fallback;
};

export const asyncMovieLoader = createAsyncThunk(
      "movie/load",
      async (id, { signal, rejectWithValue }) => {
            try {
                  const detailsResponse = await api.get(
                        `/movie/${id}`,
                        requestConfig(signal)
                  );

                  const [castBy, recommendations, videos, reviews] = await Promise.all([
                        getOptionalData(`/movie/${id}/credits`, { cast: [], crew: [] }, signal),
                        getOptionalData(`/movie/${id}/recommendations`, { results: [] }, signal),
                        getOptionalData(`/movie/${id}/videos`, { results: [] }, signal),
                        getOptionalData(`/movie/${id}/reviews`, { results: [] }, signal),
                  ]);

                  return {
                        detail: detailsResponse.data,
                        castBy: {
                              cast: Array.isArray(castBy.cast) ? castBy.cast : [],
                              crew: Array.isArray(castBy.crew) ? castBy.crew : [],
                        },
                        recommendedMovies: Array.isArray(recommendations.results)
                              ? recommendations.results
                              : [],
                        videoLink: Array.isArray(videos.results)
                              ? videos.results.find((link) => link.type === "Trailer")
                              : undefined,
                        reviews: Array.isArray(reviews.results) ? reviews.results : [],
                  };
            } catch (error) {
                  if (signal.aborted) throw error;
                  return rejectWithValue(
                        getErrorMessage(
                              error,
                              "We couldn't load this movie. Check your connection and try again."
                        )
                  );
            }
      }
);

export const asyncTvLoader = createAsyncThunk(
      "tv/load",
      async (id, { signal, rejectWithValue }) => {
            try {
                  const detailsResponse = await api.get(
                        `/tv/${id}`,
                        requestConfig(signal)
                  );

                  const [castBy, recommendations, videos, reviews] = await Promise.all([
                        getOptionalData(`/tv/${id}/credits`, { cast: [], crew: [] }, signal),
                        getOptionalData(`/tv/${id}/recommendations`, { results: [] }, signal),
                        getOptionalData(`/tv/${id}/videos`, { results: [] }, signal),
                        getOptionalData(`/tv/${id}/reviews`, { results: [] }, signal),
                  ]);

                  return {
                        detail: detailsResponse.data,
                        castBy: {
                              cast: Array.isArray(castBy.cast) ? castBy.cast : [],
                              crew: Array.isArray(castBy.crew) ? castBy.crew : [],
                        },
                        recommendedTv: Array.isArray(recommendations.results)
                              ? recommendations.results
                              : [],
                        videoLink: Array.isArray(videos.results)
                              ? videos.results.find((link) => link.type === "Trailer")
                              : undefined,
                        reviews: Array.isArray(reviews.results) ? reviews.results : [],
                  };
            } catch (error) {
                  if (signal.aborted) throw error;
                  return rejectWithValue(
                        getErrorMessage(
                              error,
                              "We couldn't load this series. Check your connection and try again."
                        )
                  );
            }
      }
);
