/* ---------------------------------------------------------------------------
   The hunt cover.

   Every photograph in the repo is a hunt stop — the four postcard shots and all
   156 business heroes — so putting one here would hand a player the answer to a
   riddle they are about to be asked. This is drawn instead: the 9 Ave SE
   streetscape as Inglewood actually reads, brick shopfronts with deep awnings,
   the rail line it grew along, and the Bow behind it.

   Drop a photo at public/brand/inglewood-hero.jpg and the page will use that
   instead — see start/page.tsx.
--------------------------------------------------------------------------- */
export default function InglewoodHero() {
  return (
    <svg
      viewBox="0 0 402 296"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Illustration of Inglewood's shopfronts along 9 Avenue SE"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id="ih-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A4FD6" />
          <stop offset="42%" stopColor="#7D9DF0" />
          <stop offset="78%" stopColor="#C3D5FA" />
          <stop offset="100%" stopColor="#E8EFFD" />
        </linearGradient>
        <linearGradient id="ih-river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8FB4F5" />
          <stop offset="100%" stopColor="#B9CFF9" />
        </linearGradient>
      </defs>

      <rect width="402" height="296" fill="url(#ih-sky)" />

      {/* the Rockies, a long way west */}
      <path d="M0 96 L34 70 L58 88 L86 58 L118 92 L146 74 L172 96 L402 96 Z" fill="#fff" opacity=".16" />
      <path d="M0 104 L26 86 L52 104 L78 80 L104 106 L134 88 L164 108 L402 108 Z" fill="#fff" opacity=".1" />

      {/* the Bow */}
      <path d="M0 120 Q 120 108 220 122 T 402 116 L402 136 Q 240 142 120 132 T 0 140 Z" fill="url(#ih-river)" opacity=".85" />

      {/* the rail embankment the street grew along */}
      <rect y="140" width="402" height="7" fill="#14161A" opacity=".18" />
      {Array.from({ length: 34 }, (_, i) => (
        <rect key={i} x={i * 12} y="139" width="5" height="9" fill="#14161A" opacity=".12" />
      ))}

      {/* the shopfront row — brick, with the deep awnings the strip is known for */}
      <g>
        <rect x="-4" y="150" width="74" height="110" fill="#B4623F" />
        <rect x="70" y="162" width="66" height="98" fill="#8E4F38" />
        <rect x="136" y="146" width="58" height="114" fill="#C9764C" />
        <rect x="194" y="168" width="70" height="92" fill="#9A5940" />
        <rect x="264" y="152" width="62" height="108" fill="#B4623F" />
        <rect x="326" y="164" width="80" height="96" fill="#874B36" />
      </g>

      {/* cornices */}
      <g fill="#14161A" opacity=".2">
        <rect x="-4" y="150" width="74" height="7" />
        <rect x="70" y="162" width="66" height="7" />
        <rect x="136" y="146" width="58" height="7" />
        <rect x="194" y="168" width="70" height="7" />
        <rect x="264" y="152" width="62" height="7" />
        <rect x="326" y="164" width="80" height="7" />
      </g>

      {/* upper windows */}
      <g fill="#F4F5F7" opacity=".78">
        <rect x="8" y="168" width="16" height="22" rx="2" />
        <rect x="34" y="168" width="16" height="22" rx="2" />
        <rect x="84" y="180" width="15" height="20" rx="2" />
        <rect x="108" y="180" width="15" height="20" rx="2" />
        <rect x="148" y="162" width="16" height="22" rx="2" />
        <rect x="172" y="162" width="14" height="22" rx="2" />
        <rect x="206" y="186" width="16" height="18" rx="2" />
        <rect x="232" y="186" width="16" height="18" rx="2" />
        <rect x="276" y="170" width="16" height="20" rx="2" />
        <rect x="300" y="170" width="16" height="20" rx="2" />
        <rect x="340" y="182" width="16" height="18" rx="2" />
        <rect x="366" y="182" width="16" height="18" rx="2" />
      </g>

      {/* awnings, in the brand accents */}
      <g>
        <path d="M-4 206 L70 206 L62 224 L-4 224 Z" fill="#DCF23C" />
        <path d="M70 214 L136 214 L128 232 L70 232 Z" fill="#F9BFD0" />
        <path d="M136 200 L194 200 L186 218 L136 218 Z" fill="#CFDCFF" />
        <path d="M194 220 L264 220 L256 238 L194 238 Z" fill="#DCF23C" />
        <path d="M264 208 L326 208 L318 226 L264 226 Z" fill="#F9BFD0" />
        <path d="M326 216 L406 216 L398 234 L326 234 Z" fill="#CFDCFF" />
      </g>

      {/* shop windows glowing under the awnings */}
      <g fill="#FFF7E2" opacity=".92">
        <rect x="6" y="228" width="52" height="32" rx="3" />
        <rect x="80" y="236" width="44" height="24" rx="3" />
        <rect x="144" y="222" width="40" height="38" rx="3" />
        <rect x="204" y="242" width="46" height="18" rx="3" />
        <rect x="274" y="230" width="42" height="30" rx="3" />
        <rect x="336" y="238" width="58" height="22" rx="3" />
      </g>

      {/* window mullions */}
      <g stroke="#C9BFA6" strokeWidth="1.2" opacity=".7">
        <path d="M32 228 L32 260 M6 244 L58 244" />
        <path d="M102 236 L102 260" />
        <path d="M164 222 L164 260 M144 240 L184 240" />
        <path d="M295 230 L295 260" />
        <path d="M365 238 L365 260" />
      </g>

      {/* hanging signs, deliberately blank: a legible name here would be an answer */}
      <g>
        <rect x="46" y="212" width="26" height="13" rx="2.5" fill="#14161A" opacity=".72" />
        <rect x="170" y="206" width="24" height="12" rx="2.5" fill="#14161A" opacity=".72" />
        <rect x="300" y="214" width="26" height="13" rx="2.5" fill="#14161A" opacity=".72" />
      </g>

      {/* shade cast by the awnings */}
      <g fill="#14161A" opacity=".1">
        <rect x="6" y="228" width="52" height="6" />
        <rect x="144" y="222" width="40" height="6" />
        <rect x="274" y="230" width="42" height="6" />
      </g>

      {/* doorways */}
      <g fill="#4A2C22" opacity=".75">
        <rect x="60" y="238" width="12" height="22" rx="1.5" />
        <rect x="128" y="244" width="11" height="16" rx="1.5" />
        <rect x="186" y="234" width="12" height="26" rx="1.5" />
        <rect x="254" y="248" width="12" height="12" rx="1.5" />
        <rect x="318" y="240" width="12" height="20" rx="1.5" />
      </g>

      {/* pavement */}
      <rect y="260" width="402" height="36" fill="#E7E4DC" />
      <rect y="260" width="402" height="3" fill="#14161A" opacity=".08" />

      {/* street lamps */}
      <g stroke="#14161A" strokeWidth="2" opacity=".5" fill="none">
        <path d="M96 260 L96 224" /><path d="M262 260 L262 228" />
      </g>
      <circle cx="96" cy="221" r="4" fill="#FFF3D0" />
      <circle cx="262" cy="225" r="4" fill="#FFF3D0" />

      {/* three walkers, kept simple — silhouettes, not portraits */}
      <g opacity=".88">
        <g fill="#14161A">
          <circle cx="150" cy="266" r="4.2" />
          <path d="M146.5 271 h7 l1.6 12 -2.6 0 -1 -7 -1 7 -2.6 0 z" />
        </g>
        <g fill="#0B47E8">
          <circle cx="164" cy="268" r="3.8" />
          <path d="M161 272.5 h6 l1.4 11 -2.3 0 -0.9 -6.4 -0.9 6.4 -2.3 0 z" />
        </g>
        <g fill="#C2296B">
          <circle cx="300" cy="268" r="3.8" />
          <path d="M297 272.5 h6 l1.4 11 -2.3 0 -0.9 -6.4 -0.9 6.4 -2.3 0 z" />
        </g>
      </g>

      {/* a bike at the kerb, because the strip is full of them */}
      <g stroke="#14161A" strokeWidth="1.6" fill="none" opacity=".5">
        <circle cx="228" cy="282" r="6" /><circle cx="246" cy="282" r="6" />
        <path d="M228 282 L236 272 L246 282 M236 272 L241 272" />
      </g>

    </svg>
  );
}
