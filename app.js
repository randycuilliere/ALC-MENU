
const PRIMARY = "#75000e";
const ORDER = ["Entrée","Plats","Accompagnement","Dessert"];

function classNames(...xs) { return xs.filter(Boolean).join(" "); }
function currency(amount) { if (amount == null || isNaN(amount)) return ""; try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "HKD", maximumFractionDigits: 0 }).format(amount); } catch (e) { return `${amount}`; } }
function toast(msg) { const el = document.createElement("div"); el.textContent = msg; el.className = "fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-3 py-2 rounded-md opacity-0 transition-opacity"; document.body.appendChild(el); requestAnimationFrame(() => { el.style.opacity = 1; }); setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 250); }, 1400); }
function copyToClipboard(text) { if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text); toast("Prompt copied"); } else { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Prompt copied"); } catch(e) {} ta.remove(); } }

function LangToggle({ lang, setLang }) {
  const options = [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "zh-hk", label: "粵語" }
  ];
  return (
    <div className="flex items-center bg-white rounded-xl border overflow-hidden border-primary">
      {options.map(opt => (
        <button key={opt.code} onClick={() => setLang(opt.code)} className={classNames("px-3 py-2 text-sm", lang === opt.code ? "font-semibold bg-primary text-white" : "opacity-80")}>{opt.label}</button>
      ))}
    </div>
  );
}

function DishCard({ item, lang }) {
  const name = lang === "fr" ? (item.name_fr || item.name) : lang === "zh-hk" ? (item.name_zh || item.name_fr || item.name) : (item.name);
  const desc = lang === "fr" ? (item.description_fr || item.description) : lang === "zh-hk" ? (item.description_zh || item.description_fr || item.description) : (item.description);
  const prompt = item.image_prompt || `${item.name}. Parisian bistro plating, appetizing.`;
  const hasPrice = item.price != null && !Number.isNaN(item.price);
  const img = item.image_url;

  return (
    <article className="bg-white/95 rounded-2xl shadow-soft border border-primary flex flex-col overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        {img ? <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy" /> : <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-50" />}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <h3 className="text-lg font-semibold leading-snug flex-1 primary">{name}</h3>
          {hasPrice && <span className="shrink-0 text-sm font-medium px-2 py-1 rounded-md border border-primary">{currency(item.price)}</span>}
        </div>
        {desc && <p className="text-sm text-gray-700 leading-relaxed">{desc}</p>}
      </div>
      <div className="px-4 pb-4 flex items-center gap-2">
        <button className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 border-primary primary" onClick={() => copyToClipboard(prompt)} title="Copy AI image prompt">{lang === "fr" ? "Générer l’image" : lang === "zh-hk" ? "生成圖片" : "Generate image"}</button>
        <button className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 border-primary primary" onClick={() => copyToClipboard(prompt)} title="Copy AI image prompt">{lang === "fr" ? "Copier le prompt" : lang === "zh-hk" ? "複製提示詞" : "Copy prompt"}</button>
      </div>
    </article>
  );
}

function App() {
  const [lang, setLang] = React.useState("en");
  const [q, setQ] = React.useState("");
  const [data, setData] = React.useState({});
  const categories = ORDER.filter(c => (data[c] || []).length > 0);
  const [activeCat, setActiveCat] = React.useState("Entrée");

  React.useEffect(() => {
    fetch("menu.json").then(r => r.json()).then(json => {
      // ensure only 4 categories in fixed order
      const filtered = {};
      ORDER.forEach(cat => { filtered[cat] = json[cat] || []; });
      setData(filtered);
      const first = categories[0] || "Entrée";
      setActiveCat(first);
    });
  }, []);

  const items = React.useMemo(() => {
    const all = [];
    ORDER.forEach(cat => (data[cat] || []).forEach(it => all.push({ ...it, category: cat })));
    return all;
  }, [data]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      const name = lang === "fr" ? (it.name_fr || it.name) : lang === "zh-hk" ? (it.name_zh || it.name_fr || it.name) : (it.name);
      const desc = lang === "fr" ? (it.description_fr || it.description) : lang === "zh-hk" ? (it.description_zh || it.description_fr || it.description) : (it.description);
      const hay = `${name} ${desc} ${it.category}`.toLowerCase();
      return needle ? hay.includes(needle) : true;
    });
  }, [items, q, lang]);

  const visibleByCategory = React.useMemo(() => {
    const map = new Map();
    for (const it of filtered) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category).push(it);
    }
    return map;
  }, [filtered]);

  React.useEffect(() => {
    if (!categories.includes(activeCat) && categories.length) setActiveCat(categories[0]);
  }, [categories, activeCat]);

  return (
    <div className="min-h-screen backdrop-brightness-95 backdrop-saturate-100">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/80 border-b border-primary">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-8 rounded-sm bg-primary" />
            <h1 className="text-2xl font-semibold tracking-tight primary">Nissa La Bella · Bistro Menu</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LangToggle lang={lang} setLang={setLang} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "fr" ? "Rechercher un plat…" : lang === "zh-hk" ? "搜尋菜式…" : "Search a dish…"} className="w-64 md:w-80 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 border-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <aside className="md:col-span-3 lg:col-span-2">
          <nav className="bg-white/90 rounded-2xl shadow-soft p-2 border border-primary">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCat(cat)} className={classNames("w-full text-left px-3 py-2 rounded-xl mb-1", activeCat === cat ? "text-white bg-primary" : "text-gray-800 hover:bg-gray-50")}>
                {cat}
                <span className="text-xs opacity-70 ml-2">{(visibleByCategory.get(cat) || []).length || (data[cat]?.length || 0)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="md:col-span-9 lg:col-span-10">
          {[activeCat].filter(Boolean).map((cat) => (
            <div key={cat} className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold primary">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {(visibleByCategory.get(cat) || data[cat] || []).map((it, idx) => (
                  <DishCard key={`${cat}-${idx}`} item={it} lang={lang} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-10 border-t py-6 text-center text-xs text-gray-600 bg-white/70 border-primary">
        <div className="max-w-6xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Nissa La Bella · Bistro theme · Burgundy #75000e</p>
          <p className="mt-1">Nice backdrop · Promenade vibes · Use the language toggle and copy prompts to generate photos.</p>
        </div>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
