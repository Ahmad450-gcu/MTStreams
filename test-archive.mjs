const url = "https://archive.org/download/nightofthelivingdead_201910/Night%20Of%20The%20Living%20Dead.mp4";

const response = await fetch(url, { method: "HEAD" });

console.log("HTTP status:", response.status);
console.log("Content-Type:", response.headers.get("content-type"));
console.log("Content-Length:", response.headers.get("content-length"));
console.log("Accept-Ranges:", response.headers.get("accept-ranges"));
