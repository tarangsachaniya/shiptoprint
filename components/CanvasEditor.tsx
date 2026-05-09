'use client';

import {
  useCallback, useEffect, useRef, useState,
  type ChangeEvent, type KeyboardEvent as RKE, type ReactNode,
} from 'react';
import * as fabric from 'fabric';
import {
  ArrowLeft, Download, ImageIcon, Loader2,
  Palette, Redo2, Save, Trash2, Type, Undo2,
} from 'lucide-react';

/* ─── types ─────────────────────────────────────────────────── */

type StickerType = 'circle' | 'square' | 'rect';
type Unit        = 'in' | 'mm' | 'cm';
type HistEntry   = { json: string; w: number; h: number; stickerType: StickerType };

/* ─── unit math ─────────────────────────────────────────────── */

const DPI = 150; // 150 dpi on-screen → 2× export = 300 dpi print
const UNIT_PX: Record<Unit, number> = { in: DPI, cm: DPI / 2.54, mm: DPI / 25.4 };
const MIN_PX = 120;
const MAX_PX = 1800;

const toPx   = (v: number, u: Unit) => Math.min(MAX_PX, Math.max(MIN_PX, Math.round(v * UNIT_PX[u])));
const fromPx = (px: number, u: Unit) => +((px / UNIT_PX[u]).toFixed(2));

/* ─── fabric clip ───────────────────────────────────────────── */

function setClip(canvas: fabric.Canvas, w: number, h: number, type: StickerType) {
  if (type !== 'circle') { canvas.clipPath = undefined; return; }
  canvas.clipPath = new fabric.Circle({
    radius: Math.min(w, h) / 2,
    left: w / 2, top: h / 2,
    originX: 'center', originY: 'center',
    absolutePositioned: true,
  });
}

/* ─── constants ─────────────────────────────────────────────── */

const HEX_RE   = /^#[0-9a-fA-F]{6}$/;
const MAX_HIST = 10;
const DEFAULT_BG = '#ffffff';
const INIT_DIA   = 3; // 3 inches

/* ════════════════════════════════════════════════════════════════
   CanvasEditor
   ════════════════════════════════════════════════════════════════ */

export default function CanvasEditor() {
  /* refs */
  const canvasEl  = useRef<HTMLCanvasElement>(null);
  const fc        = useRef<fabric.Canvas | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const hist      = useRef<HistEntry[]>([]);
  const histIdx   = useRef(-1);
  const skip      = useRef(false);
  const typeRef   = useRef<StickerType>('circle');
  const unitRef   = useRef<Unit>('in');
  const designId  = useRef<string | null>(null);

  /* sticker config */
  const [stickerType, setStickerType] = useState<StickerType>('circle');
  const [unit,        setUnit]        = useState<Unit>('in');
  const [inputW,      setInputW]      = useState(String(INIT_DIA));
  const [inputH,      setInputH]      = useState(String(INIT_DIA));

  /* canvas size */
  const [cw, setCw] = useState(toPx(INIT_DIA, 'in'));
  const [ch, setCh] = useState(toPx(INIT_DIA, 'in'));

  /* bg color */
  const [bg,       setBg]       = useState(DEFAULT_BG);
  const [hexInput, setHexInput] = useState(DEFAULT_BG);
  const [showBg,   setShowBg]   = useState(false);

  /* editor state */
  const [canUndo,  setCanUndo]  = useState(false);
  const [canRedo,  setCanRedo]  = useState(false);
  const [hasSel,   setHasSel]   = useState(false);
  const [isSaved,      setIsSaved]      = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveLbl,      setSaveLbl]      = useState<'save' | 'saved' | 'error'>('save');
  const [imgUploading, setImgUploading] = useState(false);

  /* ════ history ════════════════════════════════════════════════ */

  const pushHist = useCallback(() => {
    if (!fc.current || skip.current) return;
    const e: HistEntry = {
      json:        JSON.stringify(fc.current.toJSON()),
      w:           fc.current.width!,
      h:           fc.current.height!,
      stickerType: typeRef.current,
    };
    hist.current = hist.current.slice(0, histIdx.current + 1);
    hist.current.push(e);
    if (hist.current.length > MAX_HIST) hist.current.shift();
    histIdx.current = hist.current.length - 1;
    setCanUndo(histIdx.current > 0);
    setCanRedo(false);
    setIsSaved(false);
  }, []);

  const jumpTo = useCallback(async (i: number) => {
    if (!fc.current || i < 0 || i >= hist.current.length) return;
    const e = hist.current[i];
    skip.current = true;
    fc.current.setDimensions({ width: e.w, height: e.h });
    await fc.current.loadFromJSON(JSON.parse(e.json));
    setClip(fc.current, e.w, e.h, e.stickerType);
    fc.current.renderAll();
    histIdx.current = i;
    typeRef.current = e.stickerType;
    setStickerType(e.stickerType);
    setCw(e.w); setCh(e.h);
    setInputW(String(fromPx(e.w, unitRef.current)));
    setInputH(String(fromPx(e.h, unitRef.current)));
    const col = fc.current.backgroundColor;
    if (typeof col === 'string') { setBg(col); setHexInput(col); }
    skip.current = false;
    setCanUndo(i > 0);
    setCanRedo(i < hist.current.length - 1);
    setIsSaved(false);
  }, []);

  /* ════ init ═══════════════════════════════════════════════════ */

  useEffect(() => {
    if (!canvasEl.current || fc.current) return;

    const px     = toPx(INIT_DIA, 'in');
    const canvas = new fabric.Canvas(canvasEl.current, {
      width: px, height: px, backgroundColor: DEFAULT_BG,
    });
    fc.current = canvas;

    canvas.on('object:added',      pushHist);
    canvas.on('object:modified',   pushHist);
    canvas.on('object:removed',    pushHist);
    canvas.on('selection:created', () => setHasSel(true));
    canvas.on('selection:updated', () => setHasSel(true));
    canvas.on('selection:cleared', () => setHasSel(false));

    setClip(canvas, px, px, 'circle');
    hist.current    = [{ json: JSON.stringify(canvas.toJSON()), w: px, h: px, stickerType: 'circle' }];
    histIdx.current = 0;

    return () => { canvas.dispose(); fc.current = null; };
  }, [pushHist]);

  /* ════ sticker type ═══════════════════════════════════════════ */

  const changeType = (t: StickerType) => {
    if (!fc.current) return;
    const w  = fc.current.width!, h = fc.current.height!;
    const sq = Math.min(w, h);
    const fw = t !== 'rect' ? sq : w;
    const fh = t !== 'rect' ? sq : h;
    fc.current.setDimensions({ width: fw, height: fh });
    setClip(fc.current, fw, fh, t);
    fc.current.renderAll();
    typeRef.current = t; setStickerType(t);
    setCw(fw); setCh(fh);
    setInputW(String(fromPx(fw, unitRef.current)));
    setInputH(String(fromPx(fh, unitRef.current)));
    pushHist();
  };

  /* ════ size ═══════════════════════════════════════════════════ */

  const applySize = useCallback(() => {
    if (!fc.current) return;
    const wv = parseFloat(inputW);
    const hv = parseFloat(inputH);
    if (isNaN(wv) || wv <= 0) return;
    const u  = unitRef.current;
    const t  = typeRef.current;
    const fw = toPx(wv, u);
    const fh = t === 'rect' ? (isNaN(hv) || hv <= 0 ? fw : toPx(hv, u)) : fw;
    fc.current.setDimensions({ width: fw, height: fh });
    setClip(fc.current, fw, fh, t);
    fc.current.renderAll();
    setCw(fw); setCh(fh);
    setInputW(String(fromPx(fw, u)));
    if (t === 'rect') setInputH(String(fromPx(fh, u)));
    else              setInputH(String(fromPx(fw, u)));
    pushHist();
  }, [inputW, inputH, pushHist]);

  const onEnter = (e: RKE<HTMLInputElement>) => { if (e.key === 'Enter') applySize(); };

  /* ════ unit ═══════════════════════════════════════════════════ */

  const changeUnit = (nu: Unit) => {
    const cur = unitRef.current;
    const wn  = parseFloat(inputW);
    const hn  = parseFloat(inputH);
    if (!isNaN(wn)) setInputW(String(fromPx(toPx(wn, cur), nu)));
    if (!isNaN(hn)) setInputH(String(fromPx(toPx(hn, cur), nu)));
    unitRef.current = nu;
    setUnit(nu);
  };

  /* ════ bg color ═══════════════════════════════════════════════ */

  const applyBg = (color: string) => {
    setBg(color); setHexInput(color);
    if (!fc.current) return;
    fc.current.backgroundColor = color;
    fc.current.renderAll(); pushHist();
  };

  const onHexChange = (raw: string) => {
    setHexInput(raw);
    const v = raw.startsWith('#') ? raw : `#${raw}`;
    if (HEX_RE.test(v)) applyBg(v);
  };

  /* ════ objects ════════════════════════════════════════════════ */

  const addText = () => {
    if (!fc.current) return;
    const t = new fabric.IText('Edit me', {
      left: fc.current.width!  / 2,
      top:  fc.current.height! / 2,
      originX: 'center', originY: 'center',
      fill: '#111111',
      fontSize: Math.max(16, Math.round(fc.current.width! * 0.07)),
      fontFamily: 'Inter, Arial, sans-serif',
    });
    fc.current.add(t); fc.current.setActiveObject(t); fc.current.renderAll();
  };

  const uploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fc.current) return;
    e.target.value = '';
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json() as { url: string };
      const cv = fc.current, fw = cv.width!, fh = cv.height!;
      fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        const s = Math.min((fw * .85) / (img.width ?? 1), (fh * .85) / (img.height ?? 1), 1);
        img.set({ left: fw / 2, top: fh / 2, originX: 'center', originY: 'center', scaleX: s, scaleY: s });
        cv.add(img); cv.setActiveObject(img); cv.renderAll();
      });
    } catch {
      // upload failed — silently ignore (could add a toast here)
    } finally {
      setImgUploading(false);
    }
  };

  const deleteSelected = useCallback(() => {
    if (!fc.current) return;
    const obj = fc.current.getActiveObject();
    if (!obj) return;
    skip.current = true;
    if (obj instanceof fabric.ActiveSelection) {
      obj.getObjects().forEach((o) => fc.current!.remove(o));
      fc.current.discardActiveObject();
    } else { fc.current.remove(obj); }
    skip.current = false;
    fc.current.renderAll(); pushHist();
  }, [pushHist]);

  const undo = useCallback(async () => { await jumpTo(histIdx.current - 1); }, [jumpTo]);
  const redo = useCallback(async () => { await jumpTo(histIdx.current + 1); }, [jumpTo]);

  /* ════ save ═══════════════════════════════════════════════════ */

  const save = async () => {
    if (!fc.current || isSaving) return;
    setIsSaving(true);
    try {
      // 1. Export canvas as 2× PNG
      const dataUrl = fc.current.toDataURL({ format: 'png', multiplier: 2 });
      const blob    = await (await fetch(dataUrl)).blob();
      const file    = new File([blob], 'sticker.png', { type: 'image/png' });

      // 2. Upload PNG to Cloudinary
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = (await uploadRes.json()) as { url: string };

      // 3. Persist Cloudinary URL in DB
      const dbRes = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:       designId.current ?? undefined,
          imageUrl: url,
          w:        fc.current.width!,
          h:        fc.current.height!,
          shape:    typeRef.current,
        }),
      });
      const json = await dbRes.json();
      if (dbRes.ok) {
        designId.current = json.id;
        setIsSaved(true); setSaveLbl('saved');
        setTimeout(() => setSaveLbl('save'), 2000);
      } else { setSaveLbl('error'); setTimeout(() => setSaveLbl('save'), 3000); }
    } catch { setSaveLbl('error'); setTimeout(() => setSaveLbl('save'), 3000); }
    finally  { setIsSaving(false); }
  };

  const exportPNG = () => {
    if (!fc.current || !isSaved) return;
    const url = fc.current.toDataURL({ format: 'png', multiplier: 2 });
    Object.assign(document.createElement('a'), { href: url, download: 'sticker.png' }).click();
  };

  /* ════ keyboard ═══════════════════════════════════════════════ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if (mod && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && fc.current) {
        const a = fc.current.getActiveObject();
        if (a && !(a instanceof fabric.IText && a.isEditing)) { e.preventDefault(); deleteSelected(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, deleteSelected]);

  /* ════ derived ════════════════════════════════════════════════ */

  const hexInvalid   = hexInput !== bg;
  const physW        = fromPx(cw, unit);
  const physH        = fromPx(ch, unit);
  const sizeLabel    = stickerType === 'circle'
    ? `Ø ${physW} ${unit}`
    : `${physW} × ${physH} ${unit}`;

  const canvasWrap   = stickerType === 'circle'
    ? { borderRadius: '50%' }
    : {};

  const saveCls =
    saveLbl === 'saved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
    saveLbl === 'error' ? 'bg-red-600    hover:bg-red-700    text-white' :
    'bg-black hover:bg-gray-800 text-white';

  /* ════ render ═════════════════════════════════════════════════ */

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-gray-200 bg-white">

        {/* Primary row — always visible */}
        <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">

          {/* back */}
          <a href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={15} />
            <span className="hidden text-xs font-medium sm:inline">Home</span>
          </a>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xs font-semibold tracking-tight text-gray-700">Sticker Studio</span>

          {/* Desktop controls (md+) */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-3">

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 mr-1">Shape</span>
              <div className="flex overflow-hidden rounded-lg border border-gray-200">
                <ShapeBtn active={stickerType === 'circle'} onClick={() => changeType('circle')} label="● Circle" />
                <ShapeBtn active={stickerType === 'square'} onClick={() => changeType('square')} label="■ Square" />
                <ShapeBtn active={stickerType === 'rect'}   onClick={() => changeType('rect')}   label="▬ Rect"   />
              </div>
            </div>

            <div className="h-4 w-px bg-gray-200" />

            <div className="flex items-center gap-1.5">
              {stickerType === 'rect' ? (
                <>
                  <span className="text-[10px] text-gray-400">W</span>
                  <SizeInput value={inputW} onChange={setInputW} onEnter={onEnter} onBlur={applySize} />
                  <span className="text-[10px] text-gray-400">H</span>
                  <SizeInput value={inputH} onChange={setInputH} onEnter={onEnter} onBlur={applySize} />
                </>
              ) : (
                <>
                  <span className="text-[10px] text-gray-400">
                    {stickerType === 'circle' ? 'Ø' : 'Size'}
                  </span>
                  <SizeInput value={inputW} onChange={(v) => { setInputW(v); setInputH(v); }} onEnter={onEnter} onBlur={applySize} />
                </>
              )}
              <select value={unit} onChange={(e) => changeUnit(e.target.value as Unit)}
                className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300">
                <option value="in">inch</option>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
              <button onClick={applySize}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors">
                Apply
              </button>
            </div>

            <div className="h-4 w-px bg-gray-200" />

            <BgPicker
              bg={bg} hexInput={hexInput} hexInvalid={hexInvalid}
              showBg={showBg} onToggle={() => setShowBg(p => !p)} onClose={() => setShowBg(false)}
              onColorChange={applyBg} onHexChange={onHexChange} onHexBlur={() => setHexInput(bg)}
            />
          </div>

          <div className="flex-1 md:hidden" />

          {/* Save + Export — always visible */}
          <button onClick={save} disabled={isSaving}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${saveCls}`}>
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            <span className="hidden sm:inline">
              {saveLbl === 'saved' ? 'Saved!' : saveLbl === 'error' ? 'Error' : 'Save'}
            </span>
          </button>

          <button onClick={exportPNG} disabled={!isSaved}
            title={isSaved ? 'Download PNG (2× resolution)' : 'Save first to enable download'}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30">
            <Download size={12} />
            <span className="hidden sm:inline">Export PNG</span>
          </button>
        </div>

        {/* Mobile controls row — scrollable, hidden on md+ */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto border-t border-gray-100 px-3 py-2 [&::-webkit-scrollbar]:hidden">

          <div className="flex shrink-0 items-center gap-1">
            <div className="flex overflow-hidden rounded-lg border border-gray-200">
              <ShapeBtn active={stickerType === 'circle'} onClick={() => changeType('circle')} label="● Circ" />
              <ShapeBtn active={stickerType === 'square'} onClick={() => changeType('square')} label="■ Sq"   />
              <ShapeBtn active={stickerType === 'rect'}   onClick={() => changeType('rect')}   label="▬ Rect"  />
            </div>
          </div>

          <div className="h-4 w-px bg-gray-200 shrink-0 self-center" />

          <div className="flex shrink-0 items-center gap-1">
            {stickerType === 'rect' ? (
              <>
                <span className="text-[10px] text-gray-400">W</span>
                <SizeInput value={inputW} onChange={setInputW} onEnter={onEnter} onBlur={applySize} />
                <span className="text-[10px] text-gray-400">H</span>
                <SizeInput value={inputH} onChange={setInputH} onEnter={onEnter} onBlur={applySize} />
              </>
            ) : (
              <>
                <span className="text-[10px] text-gray-400">
                  {stickerType === 'circle' ? 'Ø' : 'S'}
                </span>
                <SizeInput value={inputW} onChange={(v) => { setInputW(v); setInputH(v); }} onEnter={onEnter} onBlur={applySize} />
              </>
            )}
            <select value={unit} onChange={(e) => changeUnit(e.target.value as Unit)}
              className="rounded-md border border-gray-200 bg-white px-1.5 py-1.5 text-xs text-gray-700 focus:outline-none">
              <option value="in">in</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
            </select>
            <button onClick={applySize}
              className="rounded-md bg-gray-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-gray-700">
              Apply
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200 shrink-0 self-center" />

          <BgPicker
            bg={bg} hexInput={hexInput} hexInvalid={hexInvalid}
            showBg={showBg} onToggle={() => setShowBg(p => !p)} onClose={() => setShowBg(false)}
            onColorChange={applyBg} onHexChange={onHexChange} onHexBlur={() => setHexInput(bg)}
          />
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      {/* flex-col-reverse: on mobile aside sits at bottom, canvas at top */}
      <div className="flex flex-1 flex-col-reverse overflow-hidden md:flex-row">

        {/* ── Sidebar / bottom toolbar ── */}
        <aside className="flex shrink-0 items-center justify-around border-t border-gray-200 bg-white px-2 py-1 md:w-[72px] md:flex-col md:items-center md:justify-start md:gap-1 md:border-r md:border-t-0 md:py-4">

          <SideBtn onClick={addText} icon={<Type size={20} />} label="Text" />
          <SideBtn
            onClick={() => !imgUploading && fileInput.current?.click()}
            icon={imgUploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
            label="Image"
            disabled={imgUploading}
          />
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={uploadImage} />

          <div className="hidden md:my-1 md:block md:h-px md:w-10 md:bg-gray-100" />

          <SideBtn onClick={deleteSelected} icon={<Trash2 size={20} />} label="Delete" disabled={!hasSel} danger />

          <div className="hidden md:mt-auto md:block" />

          <SideBtn onClick={undo} icon={<Undo2 size={16} />} label="Undo" disabled={!canUndo} />
          <SideBtn onClick={redo} icon={<Redo2 size={16} />} label="Redo" disabled={!canRedo} />
        </aside>

        {/* ── Canvas stage ── */}
        <main
          className="flex flex-1 items-center justify-center overflow-auto p-4 md:p-10"
          style={{ background: 'radial-gradient(circle at center, #e5e7eb 1px, transparent 1px) 0 0 / 24px 24px, #f3f4f6' }}
          onClick={() => setShowBg(false)}
        >
          <div className="flex flex-col items-center gap-4 md:gap-5">

            <div
              className="overflow-hidden transition-all duration-200"
              style={{
                ...canvasWrap,
                boxShadow: '0 4px 6px -1px rgb(0 0 0/.08), 0 20px 40px -8px rgb(0 0 0/.18)',
                backgroundImage:
                  'linear-gradient(45deg,#d1d5db 25%,transparent 25%),' +
                  'linear-gradient(-45deg,#d1d5db 25%,transparent 25%),' +
                  'linear-gradient(45deg,transparent 75%,#d1d5db 75%),' +
                  'linear-gradient(-45deg,transparent 75%,#d1d5db 75%)',
                backgroundSize: '14px 14px',
                backgroundPosition: '0 0,0 7px,7px -7px,-7px 0',
              }}
            >
              <canvas ref={canvasEl} />
            </div>

            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 shadow-sm">
              <span className="text-xs font-medium text-gray-700">{sizeLabel}</span>
              <span className="text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">{cw} × {ch} px</span>
            </div>
          </div>
        </main>
      </div>

      {/* ── Status bar — hidden on small screens ────────────── */}
      <footer className="hidden sm:flex shrink-0 items-center justify-between border-t border-gray-100 bg-white px-5 py-1">
        <span className={`text-[10px] font-medium ${isSaved ? 'text-emerald-600' : 'text-gray-400'}`}>
          {isSaved ? '✓ Saved to database' : 'Unsaved changes — click Save to persist'}
        </span>
        <span className="text-[10px] text-gray-300">
          Double-click text to edit &ensp;·&ensp; Del — delete &ensp;·&ensp; Ctrl+Z — undo &ensp;·&ensp; Ctrl+Shift+Z — redo
        </span>
      </footer>
    </div>
  );
}

/* ─── sub-components ────────────────────────────────────────── */

interface BgPickerProps {
  bg: string; hexInput: string; hexInvalid: boolean;
  showBg: boolean; onToggle: () => void; onClose: () => void;
  onColorChange: (c: string) => void; onHexChange: (v: string) => void; onHexBlur: () => void;
}

const SWATCHES = ['#ffffff','#000000','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#f1f5f9'];

function BgPicker({ bg, hexInput, hexInvalid, showBg, onToggle, onClose, onColorChange, onHexChange, onHexBlur }: BgPickerProps) {
  return (
    <div className="relative flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
      <Palette size={13} className="shrink-0 text-gray-400" />
      <span className="text-xs text-gray-500">BG</span>
      <label className="relative flex cursor-pointer">
        <span className="block h-5 w-5 rounded-md border border-gray-200" style={{ background: bg }} />
        <input type="color" value={bg} onChange={(e) => onColorChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <input
        type="text" value={hexInput} maxLength={7} spellCheck={false} placeholder="#ffffff"
        onChange={(e) => onHexChange(e.target.value)}
        onBlur={onHexBlur}
        className={`w-[68px] rounded-md border px-2 py-0.5 font-mono text-xs focus:outline-none focus:ring-1 ${
          hexInvalid ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 focus:ring-gray-300'
        }`}
      />
      <button onClick={onToggle} className="text-[11px] text-gray-400 hover:text-gray-600">▾</button>
      {showBg && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute left-0 top-full mt-2 z-20 w-52 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
            <div className="grid grid-cols-5 gap-1.5">
              {SWATCHES.map(c => (
                <button key={c} title={c}
                  onClick={() => { onColorChange(c); onClose(); }}
                  className={`h-6 w-6 rounded-md border shadow-sm transition-transform hover:scale-110 ${
                    bg === c ? 'ring-2 ring-indigo-500 ring-offset-1' : 'border-gray-200'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SideBtn({
  onClick, icon, label, disabled = false, danger = false,
}: {
  onClick: () => void; icon: ReactNode; label: string;
  disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={label}
      className={`flex items-center justify-center rounded-xl p-2.5 transition-colors
        md:w-full md:flex-col md:gap-1 md:px-1 md:py-2.5
        disabled:cursor-not-allowed disabled:opacity-30
        ${danger
          ? 'text-gray-400 hover:bg-red-50 hover:text-red-500'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`}
    >
      {icon}
      <span className="hidden md:block text-[9px] font-medium leading-none">{label}</span>
    </button>
  );
}

function ShapeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-gray-900 text-white'
          : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  );
}

function SizeInput({ value, onChange, onEnter, onBlur }: {
  value: string;
  onChange: (v: string) => void;
  onEnter: (e: RKE<HTMLInputElement>) => void;
  onBlur: () => void;
}) {
  return (
    <input
      type="number" min="0.1" step="0.1" value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onEnter}
      onBlur={onBlur}
      className="w-14 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}
