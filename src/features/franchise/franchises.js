// Featured franchises: TMDB collection ids with their names and artwork,
// verified against the TMDB API on 2026-11-13. Keeping them here means the
// franchise index costs no requests; each franchise page loads its own
// collection (one request, CDN-cached for a day). Any movie that belongs to
// another TMDB collection links to the same page from its details page.
//
// TMDB has no single "Marvel Cinematic Universe" collection, so the closest
// real collections are listed under their actual TMDB names.

export const FEATURED_FRANCHISES = [
      { id: 10, name: "Star Wars Collection", poster: "/pWVLFh4OuejTpUaDQbB1C4zoS2p.jpg", backdrop: "/iY2ujEY2m68OTTlPFTiHub9joHS.jpg" },
      { id: 86311, name: "The Avengers Collection", poster: "/yFSIUVTCvgYrpalUktulvk3Gi5Y.jpg", backdrop: "/2UNUv4NJdC36E5myDHACBJ99EwL.jpg" },
      { id: 531241, name: "Spider-Man (MCU) Collection", poster: "/nogV4th2P5QWYvQIMiWHj4CFLU9.jpg", backdrop: "/kPzNNNvdcXfQHqa8wf2pHT5rYs5.jpg" },
      { id: 1241, name: "Harry Potter Collection", poster: "/eVPs2Y0LyvTLZn6AP5Z6O2rtiGB.jpg", backdrop: "/4gV0rKUjB1nLUdZB4zIltLvNZZr.jpg" },
      { id: 119, name: "The Lord of the Rings Collection", poster: "/oENY593nKRVL2PnxXsMtlh8izb4.jpg", backdrop: "/bccR2CGTWVVSZAG0yqmy3DIvhTX.jpg" },
      { id: 121938, name: "The Hobbit Collection", poster: "/hQghXOjSS2xfzx9XnMyZqt8brCF.jpg", backdrop: "/7wO7MSnP5UcwR2cTHdJFF1vP4Ie.jpg" },
      { id: 404609, name: "John Wick Collection", poster: "/sm7rZZivZm2NhJDucFf3gpfFdVt.jpg", backdrop: "/fSwYa5q2xRkBoOOjueLpkLf3N1m.jpg" },
      { id: 9485, name: "The Fast and the Furious Collection", poster: "/zOCnMPoUxgJK1RFPfN4PcnT16gr.jpg", backdrop: "/z5A5W3WYJc3UVEWljSGwdjDgQ0j.jpg" },
      { id: 328, name: "Jurassic Park Collection", poster: "/qIm2nHXLpBBdMxi8dvfrnDkBUDh.jpg", backdrop: "/njFixYzIxX8jsn6KMSEtAzi4avi.jpg" },
      { id: 313086, name: "The Conjuring Collection", poster: "/z5VKhNSQKQyxm0co68HAkCqHnmX.jpg", backdrop: "/kHZaX0vuhZdbuq0WKU3BpA9WIQ0.jpg" },
      { id: 87359, name: "Mission: Impossible Collection", poster: "/geEjCGfdmRAA1skBPwojcdvnZ8A.jpg", backdrop: "/mroWh717g0Ah2c0rrPGW6f3EWMM.jpg" },
      { id: 295, name: "Pirates of the Caribbean Collection", poster: "/zRBaZxS5YauLvRYjAdL4AUCwlht.jpg", backdrop: "/wxgD3fB5lQ2sGJLog0rvXW049Pf.jpg" },
      { id: 173710, name: "Planet of the Apes (Reboot) Collection", poster: "/afGkMC4HF0YtXYNkyfCgTDLFe6m.jpg", backdrop: "/iMhm0g555HgQNIXAMvnlgOiW5Rz.jpg" },
      { id: 645, name: "James Bond Collection", poster: "/ofwSiqOFShhunAIYYdSMHMJQSx2.jpg", backdrop: "/dOSECZImeyZldoq0ObieBE0lwie.jpg" },
      { id: 263, name: "The Dark Knight Collection", poster: "/ogyw5LTmL53dVxsppcy8Dlm30Fu.jpg", backdrop: "/xyhrCEdB4XRkelfVsqXeUZ6rLHi.jpg" },
      { id: 948485, name: "The Batman Collection", poster: "/jauF9NsYc97khPSENLLHGXT09bg.jpg", backdrop: "/6IX81STHKPsSFVCN57sJ3ljwXI5.jpg" },
      { id: 2344, name: "The Matrix Collection", poster: "/bV9qTVHTVf0gkW0j7p7M0ILD4pG.jpg", backdrop: "/bRm2DEgUiYciDw3myHuYFInD7la.jpg" },
      { id: 84, name: "Indiana Jones Collection", poster: "/lpxDrACKJhbbGOlwVMNz5YCj6SI.jpg", backdrop: "/6kh59mZizZsttZPR0HAdXk6Ve2n.jpg" },
      { id: 264, name: "Back to the Future Collection", poster: "/5Xsu2o5IsZRuuxCEVZ9nVve21FP.jpg", backdrop: "/c9C9Pg2QctyjZHRmS0P8rZg1OTA.jpg" },
      { id: 10194, name: "Toy Story Collection", poster: "/rki5qLuwb0xnnE9seehxO9TlLhW.jpg", backdrop: "/hApclyB9NEZEQujAVajzi5iWE4a.jpg" },
      { id: 2150, name: "Shrek Collection", poster: "/g1Kcbi5zSelArzR5UYkxKvG6K2a.jpg", backdrop: "/lhsd1zCsq5UquvcNalmhuddV3tI.jpg" },
      { id: 86066, name: "Despicable Me Collection", poster: "/xIXhIlZDRmSSfNbpN7kBCm5hg39.jpg", backdrop: "/37xamYKRUGCRux532lKcZdVGYuR.jpg" },
      { id: 131635, name: "The Hunger Games Collection", poster: "/cEBNDEMGqvSvU0knEv9Wl3dk5kv.jpg", backdrop: "/Ipp7cegtub4t0mu7xaKLQkYoGc.jpg" },
      { id: 8650, name: "Transformers Collection", poster: "/nnFgBA6nR0pHorxdFaDvdY4nVHL.jpg", backdrop: "/zvZBNNDWd5LcsIBpDhJyCB2MDT7.jpg" },
      { id: 748, name: "X-Men Collection", poster: "/31rqs6ZxFdi5nWZZaFPIr17q8jt.jpg", backdrop: "/ykVHlrE3aSvHYeIXOrWDsYZ18vv.jpg" },
      { id: 8091, name: "Alien Collection", poster: "/gWFHIY77cRVoBRGERwMHqpD27gc.jpg", backdrop: "/6X42JnSMdo3dPAswOHUuvebdTq7.jpg" },
      { id: 528, name: "The Terminator Collection", poster: "/kpZxdNsAV7qTdTLwKM5NLqa7GEo.jpg", backdrop: "/sCnBEw2Yu6foEjs4Xb4eMddYHRo.jpg" },
      { id: 1575, name: "Rocky Collection", poster: "/fKe9y1AJHEzoiHwSrjfwyinuCE8.jpg", backdrop: "/yaXXemxz3ePNSrqNtc4ZAbuxJRv.jpg" },
];
