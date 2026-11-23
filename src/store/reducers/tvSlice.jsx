import { createSlice } from "@reduxjs/toolkit";

const initialState = {
      info: null,
      loading: false,
      error: null,
      currentRequestId: null,
};

export const tvSlicer = createSlice({
      name: "tv",
      initialState,
      reducers: {
            getTv: (state, action) => {
                  state.info = action.payload;
                  state.loading = false;
                  state.error = null;
                  state.currentRequestId = null;
            },
            removeTv: () => initialState,
      },
      extraReducers: (builder) => {
            builder
                  .addCase("tv/load/pending", (state, action) => {
                        state.info = null;
                        state.loading = true;
                        state.error = null;
                        state.currentRequestId = action.meta.requestId;
                  })
                  .addCase("tv/load/fulfilled", (state, action) => {
                        if (state.currentRequestId !== action.meta.requestId) return;
                        state.info = action.payload;
                        state.loading = false;
                        state.error = null;
                        state.currentRequestId = null;
                  })
                  .addCase("tv/load/rejected", (state, action) => {
                        if (state.currentRequestId !== action.meta.requestId) return;
                        state.loading = false;
                        state.currentRequestId = null;
                        state.error = action.meta.aborted
                              ? null
                              : action.payload || "We couldn't load this series. Please try again.";
                  });
      },
});

export const { getTv, removeTv } = tvSlicer.actions;
export default tvSlicer.reducer;
