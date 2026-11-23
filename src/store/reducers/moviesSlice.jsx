import { createSlice } from "@reduxjs/toolkit";

const initialState = {
      info: null,
      loading: false,
      error: null,
      currentRequestId: null,
};

export const movieSlicer = createSlice({
      name: "movie",
      initialState,
      reducers: {
            getMovie: (state, action) => {
                  state.info = action.payload;
                  state.loading = false;
                  state.error = null;
                  state.currentRequestId = null;
            },
            removeMovie: () => initialState,
      },
      extraReducers: (builder) => {
            builder
                  .addCase("movie/load/pending", (state, action) => {
                        state.info = null;
                        state.loading = true;
                        state.error = null;
                        state.currentRequestId = action.meta.requestId;
                  })
                  .addCase("movie/load/fulfilled", (state, action) => {
                        if (state.currentRequestId !== action.meta.requestId) return;
                        state.info = action.payload;
                        state.loading = false;
                        state.error = null;
                        state.currentRequestId = null;
                  })
                  .addCase("movie/load/rejected", (state, action) => {
                        if (state.currentRequestId !== action.meta.requestId) return;
                        state.loading = false;
                        state.currentRequestId = null;
                        state.error = action.meta.aborted
                              ? null
                              : action.payload || "We couldn't load this movie. Please try again.";
                  });
      },
});

export const { getMovie, removeMovie } = movieSlicer.actions;
export default movieSlicer.reducer;
