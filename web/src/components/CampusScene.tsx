/** Pastel campus illustration: an institution, a student group, and an industry office linked through a Joviq hub. */
const people = [
  { x: 488, y: 336, body: "#7fb5f5", skin: "#f3c8a5", hair: "#3b2f4a" },
  { x: 522, y: 326, body: "#f590b5", skin: "#e9b48f", hair: "#2a2135" },
  { x: 556, y: 332, body: "#6fd3a2", skin: "#f1c29c", hair: "#4a3324" },
  { x: 590, y: 324, body: "#ffad7f", skin: "#d9a07a", hair: "#241c2e" },
  { x: 624, y: 336, body: "#9d92f0", skin: "#f3c8a5", hair: "#3b2f4a" }
];
const trees = [{ x: 62, s: 1 }, { x: 392, s: .8 }, { x: 712, s: .9 }, { x: 1052, s: 1.1 }];

export function CampusScene() {
  return <svg className="campus-scene" viewBox="0 0 1100 440" role="presentation" aria-hidden="true">
    <defs>
      <linearGradient id="cs-hub" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9d92f0" /><stop offset=".55" stopColor="#5d58a2" /><stop offset="1" stopColor="#201b59" /></linearGradient>
      <linearGradient id="cs-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a72d0" /><stop offset="1" stopColor="#504b91" /></linearGradient>
      <linearGradient id="cs-tower" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eaf3ff" /><stop offset="1" stopColor="#cfe3fb" /></linearGradient>
      <linearGradient id="cs-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d4f1e1" /><stop offset="1" stopColor="#e9f8ef" /></linearGradient>
    </defs>

    <circle cx="930" cy="92" r="48" fill="#fff2cc" /><circle cx="930" cy="92" r="32" fill="#ffe6a3" />
    <g className="campus-cloud"><ellipse cx="170" cy="86" rx="54" ry="20" fill="#fff" /><ellipse cx="200" cy="72" rx="34" ry="22" fill="#fff" /><ellipse cx="146" cy="76" rx="24" ry="16" fill="#fff" /></g>
    <g className="campus-cloud campus-cloud--slow"><ellipse cx="760" cy="60" rx="46" ry="16" fill="#fff" /><ellipse cx="786" cy="48" rx="28" ry="18" fill="#fff" /></g>

    <path d="M0 352 Q 270 312 560 340 T 1100 330 V440 H0Z" fill="url(#cs-ground)" />
    <path d="M0 392 Q 300 362 600 384 T 1100 376 V440 H0Z" fill="#c4ebd5" opacity=".7" />
    <path d="M232 362 C 300 372, 420 360, 470 352 S 560 350, 580 356" fill="none" stroke="#f6eedd" strokeWidth="16" strokeLinecap="round" />

    {/* Institution */}
    <g>
      <rect x="128" y="226" width="208" height="134" rx="4" fill="#f4f1ff" />
      <rect x="120" y="214" width="224" height="16" rx="3" fill="#504b91" />
      <path d="M112 216 L232 156 L352 216Z" fill="url(#cs-roof)" />
      <circle cx="232" cy="194" r="11" fill="#fff2cc" />
      {[148, 180, 212, 244, 276, 308].map(x => <rect key={x} x={x} y="238" width="12" height="104" rx="5" fill="#fff" />)}
      <rect x="216" y="300" width="32" height="44" rx="16" fill="#504b91" />
      <rect x="120" y="342" width="224" height="10" rx="3" fill="#e3def9" /><rect x="110" y="352" width="244" height="10" rx="3" fill="#d6d0f6" />
      <line x1="232" y1="156" x2="232" y2="110" stroke="#504b91" strokeWidth="3" />
      <path className="campus-flag" d="M234 110 C 254 104, 262 122, 284 114 L 284 138 C 262 146, 254 128, 234 134Z" fill="#ffad7f" />
    </g>

    {/* Industry offices */}
    <g>
      <rect x="806" y="168" width="136" height="192" rx="8" fill="url(#cs-tower)" />
      {Array.from({ length: 15 }, (_, i) => <rect key={i} x={824 + (i % 3) * 38} y={188 + Math.floor(i / 3) * 32} width="26" height="18" rx="3" fill="#9cc3f2" opacity={i % 4 === 0 ? .55 : .9} />)}
      <rect x="944" y="236" width="96" height="124" rx="8" fill="#ffeadc" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={958 + (i % 2) * 38} y={254 + Math.floor(i / 2) * 30} width="28" height="16" rx="3" fill="#ffc9a8" />)}
      <rect x="860" y="322" width="30" height="38" rx="4" fill="#2d6cc7" opacity=".8" />
    </g>

    {trees.map(({ x, s }) => <g key={x} transform={`translate(${x} 0) scale(${s})`} style={{ transformOrigin: `${x}px 360px` }}><rect x="-5" y="300" width="10" height="56" rx="4" fill="#c9a27a" /><circle cx="0" cy="292" r="30" fill="#8fdab2" /><circle cx="-16" cy="304" r="20" fill="#6fd3a2" /><circle cx="17" cy="306" r="18" fill="#7cd4aa" /></g>)}

    {/* Students */}
    {people.map(({ x, y, body, skin, hair }, i) => <g key={x} className="campus-person" style={{ animationDelay: `${i * .25}s` }}>
      <rect x={x - 15} y={y - 6} width="30" height="44" rx="15" fill={body} />
      <circle cx={x} cy={y - 18} r="13" fill={skin} />
      <path d={`M${x - 13} ${y - 20} a13 13 0 0 1 26 0 c-6 -4 -18 -4 -26 0z`} fill={hair} />
    </g>)}

    {/* Links to the Joviq hub */}
    <g className="campus-links" fill="none" strokeWidth="2.5" strokeLinecap="round">
      <path d="M520 150 C 400 130, 300 140, 250 168" stroke="#9d92f0" />
      <path d="M556 196 C 556 240, 556 260, 556 286" stroke="#6fd3a2" />
      <path d="M592 150 C 700 128, 800 140, 860 166" stroke="#7fb5f5" />
    </g>
    <circle cx="556" cy="146" r="66" fill="#fff" opacity=".6" />
    <circle cx="556" cy="146" r="52" fill="url(#cs-hub)" />
    <path d="M556 118 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5z" fill="#fff" />
    <text x="556" y="178" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700" fontFamily="Poppins, sans-serif">Joviq</text>
  </svg>;
}
