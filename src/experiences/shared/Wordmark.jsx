// Fictionalised wordmarks for each experience. These are original drawings
// that evoke each service's visual identity without reproducing official
// logos or artwork.

const Netflix = ({ height = 28 }) => (
      <svg viewBox="0 0 220 60" height={height} role="img" aria-label="Notflix">
            <defs>
                  <path id="nfx-arc" d="M4 46 Q110 58 216 46" />
            </defs>
            <text fill="#e50914" fontFamily="'Arial Narrow','Helvetica Neue',Impact,sans-serif" fontWeight="900" fontSize="54" letterSpacing="-1" textLength="212" lengthAdjust="spacingAndGlyphs">
                  <textPath href="#nfx-arc">NOTFLIX</textPath>
            </text>
      </svg>
);

const NetflixMark = ({ height = 32 }) => (
      <svg viewBox="0 0 40 60" height={height} role="img" aria-label="Notflix">
            <text x="20" y="52" textAnchor="middle" fill="#e50914" fontFamily="'Arial Narrow',Impact,sans-serif" fontWeight="900" fontSize="64" transform="scale(1 0.92)">N</text>
      </svg>
);

const Prime = ({ height = 28 }) => (
      <svg viewBox="0 0 170 48" height={height} role="img" aria-label="prima video">
            <text x="0" y="30" fill="#fff" fontFamily="Inter,Arial,sans-serif" fontWeight="700" fontSize="30" letterSpacing="-0.5">prima</text>
            <text x="86" y="30" fill="#fff" fontFamily="Inter,Arial,sans-serif" fontWeight="400" fontSize="30" letterSpacing="-0.5">video</text>
            <path d="M6 37 Q40 50 74 37" stroke="#1a98ff" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M66 33 L76 36 L69 43" stroke="#1a98ff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
);

const Max = ({ height = 26 }) => (
      <svg viewBox="0 0 170 44" height={height} role="img" aria-label="HBX max">
            <text x="0" y="34" fill="#fff" fontFamily="Montserrat,Arial,sans-serif" fontWeight="800" fontSize="34" letterSpacing="1">HBX</text>
            <text x="86" y="34" fill="#fff" fontFamily="Montserrat,Arial,sans-serif" fontWeight="600" fontSize="34" letterSpacing="-1">max</text>
      </svg>
);

const Disney = ({ height = 44 }) => (
      <svg viewBox="0 0 150 80" height={height} role="img" aria-label="Dizney+">
            <defs>
                  <linearGradient id="dz-arc" x1="0" x2="1">
                        <stop offset="0" stopColor="#0d1a52" stopOpacity="0" />
                        <stop offset="0.45" stopColor="#3ab7ff" />
                        <stop offset="1" stopColor="#ffffff" />
                  </linearGradient>
            </defs>
            <path d="M14 56 Q70 -4 140 34" stroke="url(#dz-arc)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <text x="8" y="60" fill="#fff" fontFamily="'Brush Script MT','Segoe Script','Lucida Handwriting',cursive" fontSize="44" fontStyle="italic">Dizney</text>
            <text x="118" y="62" fill="#fff" fontFamily="Arial,sans-serif" fontWeight="300" fontSize="34">+</text>
      </svg>
);

const Hulu = ({ height = 26 }) => (
      <svg viewBox="0 0 96 36" height={height} role="img" aria-label="hulo">
            <text x="0" y="29" fill="#1ce783" fontFamily="Inter,'Arial Rounded MT Bold',Arial,sans-serif" fontWeight="800" fontSize="36" letterSpacing="-1.5">hulo</text>
      </svg>
);

const Paramount = ({ height = 36 }) => (
      <svg viewBox="0 0 200 56" height={height} role="img" aria-label="Paramont+">
            <path d="M8 46 L26 18 L34 28 L42 16 L60 46 Z" fill="#fff" opacity="0.95" />
            {[...Array(9)].map((_, index) => {
                  const angle = Math.PI * (0.95 + (index / 8) * 1.1);
                  return <circle key={index} cx={34 + Math.cos(angle) * 28} cy={34 + Math.sin(angle) * 26} r="2" fill="#fff" />;
            })}
            <text x="70" y="40" fill="#fff" fontFamily="Montserrat,Arial,sans-serif" fontWeight="700" fontSize="22">Paramont</text>
            <text x="176" y="38" fill="#0064ff" fontFamily="Montserrat,Arial,sans-serif" fontWeight="800" fontSize="26">+</text>
      </svg>
);

const Apple = ({ height = 26 }) => (
      <svg viewBox="0 0 92 36" height={height} role="img" aria-label="Pear TV+">
            <path d="M14 10 C6 10 3 17 4 23 C5 30 10 34 14 34 C18 34 23 30 24 23 C25 17 22 10 14 10 Z" fill="#fff" />
            <path d="M14 10 C14 5 17 2 21 1 C20 5 18 8 14 10 Z" fill="#fff" />
            <text x="31" y="29" fill="#fff" fontFamily="-apple-system,'SF Pro Display','Segoe UI',Inter,sans-serif" fontWeight="600" fontSize="27" letterSpacing="-0.5">tv+</text>
      </svg>
);

const Mgm = ({ height = 30 }) => (
      <svg viewBox="0 0 120 40" height={height} role="img" aria-label="MGN+">
            <text x="0" y="32" fill="#f2e6c9" fontFamily="'Playfair Display',Georgia,serif" fontWeight="700" fontSize="34" letterSpacing="2">MGN</text>
            <text x="94" y="31" fill="#c8a45d" fontFamily="'Playfair Display',Georgia,serif" fontWeight="700" fontSize="32">+</text>
      </svg>
);

const PEACOCK_DOTS = ["#fccc12", "#ef8f16", "#ee2c4a", "#6e55dc", "#069de0", "#05ac3f"];
const Peacock = ({ height = 28, dark = false }) => (
      <svg viewBox="0 0 150 40" height={height} role="img" aria-label="peacoq">
            <text x="0" y="31" fill={dark ? "#000" : "#fff"} fontFamily="'DM Sans',Inter,Arial,sans-serif" fontWeight="800" fontSize="34" letterSpacing="-1.2">peacoq</text>
            {PEACOCK_DOTS.map((color, index) => (
                  <circle key={color} cx="140" cy={5 + index * 5.4} r="2.6" fill={color} />
            ))}
      </svg>
);

const Crunchyroll = ({ height = 30, iconOnly = false }) => (
      <svg viewBox={iconOnly ? "0 0 40 40" : "0 0 210 40"} height={height} role="img" aria-label="crunchyreel">
            <circle cx="20" cy="20" r="17" fill="#f47521" />
            <circle cx="24" cy="17" r="9" fill="#000" />
            <circle cx="26" cy="15.5" r="4" fill="#f47521" />
            {!iconOnly && (
                  <text x="45" y="28" fill="#f47521" fontFamily="Lato,Arial,sans-serif" fontWeight="900" fontSize="24" letterSpacing="-0.3">crunchyreel</text>
            )}
      </svg>
);

// Four-point sparkle used by the JioHotster wordmark and its intro.
const HotstarSpark = ({ x = 0, y = 0, size = 16, id = "jh-spark" }) => (
      <g transform={`translate(${x} ${y}) scale(${size / 20})`}>
            <defs>
                  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#4c8dff" />
                        <stop offset="0.55" stopColor="#b44dff" />
                        <stop offset="1" stopColor="#ff4f9a" />
                  </linearGradient>
            </defs>
            <path d="M10 0 C11 6.5 13.5 9 20 10 C13.5 11 11 13.5 10 20 C9 13.5 6.5 11 0 10 C6.5 9 9 6.5 10 0 Z" fill={`url(#${id})`} />
      </g>
);

const Hotstar = ({ height = 30 }) => (
      <svg viewBox="0 0 196 44" height={height} role="img" aria-label="JioHotster">
            <text x="0" y="33" fill="#fff" fontFamily="Inter,Arial,sans-serif" fontWeight="800" fontSize="31" letterSpacing="-1" textLength="170" lengthAdjust="spacingAndGlyphs">
                  Jio<tspan fontWeight="700">Hotster</tspan>
            </text>
            <HotstarSpark x={173} y={2} size={18} />
      </svg>
);

const MARKS = {
      netflix: Netflix,
      prime: Prime,
      max: Max,
      disney: Disney,
      hulu: Hulu,
      paramount: Paramount,
      apple: Apple,
      mgm: Mgm,
      peacock: Peacock,
      crunchyroll: Crunchyroll,
      hotstar: Hotstar,
};

export default function Wordmark({ service, ...props }) {
      const Mark = MARKS[service];
      return Mark ? <Mark {...props} /> : null;
}

export { NetflixMark, PEACOCK_DOTS, HotstarSpark };
