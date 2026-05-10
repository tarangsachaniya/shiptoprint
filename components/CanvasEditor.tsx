'use client';

import {
  useCallback, useEffect, useRef, useState,
  type ChangeEvent, type KeyboardEvent as RKE, type ReactNode,
} from 'react';
import * as fabric from 'fabric';
import {
  ArrowLeft, Download, ImageIcon, Loader2,
  Palette, Redo2, RefreshCw, Save, Scissors, Trash2, Type, Undo2, X,
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
  canvas.clipPath = new fabric.Ellipse({
    rx: w / 2, ry: h / 2,
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
  const designId       = useRef<string | null>(null);
  const curveSourceRef = useRef<fabric.IText | null>(null);

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

  /* die-cut border */
  const [dieCutColor, setDieCutColor] = useState('#ff0000');
  const [showDieCut,  setShowDieCut]  = useState(false);

  /* curved text */
  const [showCurve,      setShowCurve]      = useState(false);
  const [curveText,      setCurveText]      = useState('My Text');
  const [curveFontSize,  setCurveFontSize]  = useState(28);
  const [curveRadius,    setCurveRadius]    = useState(140);
  const [curveColor,     setCurveColor]     = useState('#111111');
  const [curveDir,       setCurveDir]       = useState<'top' | 'bottom'>('top');
  const [curveScale,     setCurveScale]     = useState(1);

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
    // square forces equal sides; circle/oval and rect keep current dims
    const fw = t === 'square' ? sq : w;
    const fh = t === 'square' ? sq : h;
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
    // square forces W=H; circle and rect allow independent H
    const fh = t === 'square' ? fw : (isNaN(hv) || hv <= 0 ? fw : toPx(hv, u));
    fc.current.setDimensions({ width: fw, height: fh });
    setClip(fc.current, fw, fh, t);
    fc.current.renderAll();
    setCw(fw); setCh(fh);
    setInputW(String(fromPx(fw, u)));
    setInputH(String(fromPx(fh, u)));
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

  const openCurveModal = () => {
    const active = fc.current?.getActiveObject();
    if (active instanceof fabric.IText) {
      curveSourceRef.current = active;
      setCurveText(active.text ?? 'My Text');
      const fill = active.fill;
      if (typeof fill === 'string') setCurveColor(fill);
      if (active.fontSize) setCurveFontSize(active.fontSize);
    } else {
      curveSourceRef.current = null;
    }
    setShowCurve(true);
  };

  const addCurvedText = () => {
    const cv = fc.current;
    if (!cv || !curveText.trim()) return;
    const fw = cv.width!, fh = cv.height!;
    const src = curveSourceRef.current;

    // place at source position if converting existing text, else canvas center
    const cx = (src?.left != null) ? src.left : fw / 2;
    const cy = (src?.top  != null) ? src.top  : fh / 2;

    const tmp = document.createElement('canvas');
    const ctx2d = tmp.getContext('2d')!;
    ctx2d.font = `${curveFontSize}px Arial`;

    const chars = curveText.split('');
    const spacing = curveFontSize * 0.05;
    const widths = chars.map(c => Math.max(ctx2d.measureText(c).width, curveFontSize * 0.25));
    const totalLen = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
    const totalAngle = totalLen / curveRadius;

    let accum = 0;
    const objs = chars.map((char, i) => {
      const hw = widths[i];
      const θ = -totalAngle / 2 + (accum + hw / 2) / curveRadius;
      accum += hw + spacing;

      const x   = Math.sin(θ) * curveRadius;
      const y   = curveDir === 'top' ? -Math.cos(θ) * curveRadius : Math.cos(θ) * curveRadius;
      const rot = curveDir === 'top' ? θ * 180 / Math.PI : θ * 180 / Math.PI + 180;

      return new fabric.FabricText(char, {
        left: x, top: y,
        originX: 'center', originY: 'center',
        angle: rot,
        fontSize: curveFontSize,
        fill: curveColor,
        fontFamily: 'Arial, sans-serif',
        selectable: false,
      });
    });

    // remove original text if converting
    if (src && cv.contains(src)) cv.remove(src);
    curveSourceRef.current = null;

    const group = new fabric.Group(objs, {
      left: cx, top: cy,
      originX: 'center', originY: 'center',
      scaleX: curveScale, scaleY: curveScale,
    });

    cv.add(group);
    cv.setActiveObject(group);
    cv.renderAll();
    setShowCurve(false);
  };

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
  const sizeLabel    = stickerType === 'square'
    ? `${physW} ${unit}`
    : stickerType === 'circle' && cw === ch
    ? `Ø ${physW} ${unit}`
    : `${physW} × ${physH} ${unit}`;

  const canvasWrap   = stickerType === 'circle'
    ? { borderRadius: '50%' }
    : {};

  // die-cut: always 0.5 mm offset, shown as CSS box-shadow ring outside canvas
  const dieCutPx = Math.max(2, Math.round(0.5 * DPI / 25.4));

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
              {stickerType === 'square' ? (
                <>
                  <span className="text-[10px] text-gray-400">Size</span>
                  <SizeInput value={inputW} onChange={(v) => { setInputW(v); setInputH(v); }} onEnter={onEnter} onBlur={applySize} />
                </>
              ) : (
                <>
                  <span className="text-[10px] text-gray-400">W</span>
                  <SizeInput value={inputW} onChange={setInputW} onEnter={onEnter} onBlur={applySize} />
                  <span className="text-[10px] text-gray-400">H</span>
                  <SizeInput value={inputH} onChange={setInputH} onEnter={onEnter} onBlur={applySize} />
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
            {stickerType === 'square' ? (
              <>
                <span className="text-[10px] text-gray-400">S</span>
                <SizeInput value={inputW} onChange={(v) => { setInputW(v); setInputH(v); }} onEnter={onEnter} onBlur={applySize} />
              </>
            ) : (
              <>
                <span className="text-[10px] text-gray-400">W</span>
                <SizeInput value={inputW} onChange={setInputW} onEnter={onEnter} onBlur={applySize} />
                <span className="text-[10px] text-gray-400">H</span>
                <SizeInput value={inputH} onChange={setInputH} onEnter={onEnter} onBlur={applySize} />
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

          <SideBtn onClick={openCurveModal} icon={<RefreshCw size={20} />} label="Curve" />
          <SideBtn onClick={() => setShowDieCut(true)} icon={<Scissors size={20} />} label="Border" />

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
                boxShadow: [
                  dieCutPx > 0 && `0 0 0 ${dieCutPx}px ${dieCutColor}`,
                  '0 4px 6px -1px rgb(0 0 0/.08)',
                  '0 20px 40px -8px rgb(0 0 0/.18)',
                ].filter(Boolean).join(', '),
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

      {/* ── Curved Text Modal ───────────────────────────────── */}
      {showCurve && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowCurve(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold">Curved Text</h3>
              <button onClick={() => setShowCurve(false)} className="text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              {/* text */}
              <label className="block">
                <span className="mb-1 block text-xs text-gray-500">Text</span>
                <input
                  value={curveText}
                  onChange={e => setCurveText(e.target.value)}
                  placeholder="Your curved text…"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </label>

              {/* font size + radius */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-500">Font size (px)</span>
                  <input
                    type="number" min="8" max="120" value={curveFontSize}
                    onChange={e => setCurveFontSize(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-500">Radius (px)</span>
                  <input
                    type="number" min="20" max="600" value={curveRadius}
                    onChange={e => setCurveRadius(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </label>
              </div>

              {/* scale */}
              <label className="block">
                <span className="mb-1 flex items-center justify-between text-xs text-gray-500">
                  <span>Scale</span>
                  <span className="font-mono text-gray-700">{Math.round(curveScale * 100)}%</span>
                </span>
                <input
                  type="range" min="0.25" max="3" step="0.05" value={curveScale}
                  onChange={e => setCurveScale(Number(e.target.value))}
                  className="w-full accent-gray-900"
                />
              </label>

              {/* color */}
              <label className="block">
                <span className="mb-1 block text-xs text-gray-500">Color</span>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <span className="block h-8 w-8 rounded-lg border border-gray-200" style={{ background: curveColor }} />
                    <input type="color" value={curveColor} onChange={e => setCurveColor(e.target.value)} className="sr-only" />
                  </label>
                  <input
                    type="text" value={curveColor} maxLength={7} spellCheck={false}
                    onChange={e => setCurveColor(e.target.value)}
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </div>
              </label>

              {/* direction */}
              <div>
                <span className="mb-1 block text-xs text-gray-500">Direction</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurveDir('top')}
                    className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${curveDir === 'top' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                  >
                    ⌢ Curve Up
                  </button>
                  <button
                    onClick={() => setCurveDir('bottom')}
                    className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${curveDir === 'bottom' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                  >
                    ⌣ Curve Down
                  </button>
                </div>
              </div>

              <button
                onClick={addCurvedText}
                disabled={!curveText.trim()}
                className="w-full rounded-xl bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add to Canvas
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Die-Cut Border Modal ────────────────────────────── */}
      {showDieCut && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowDieCut(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-72 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold">Die-Cut Border</h3>
              <button onClick={() => setShowDieCut(false)} className="text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <p className="text-xs text-gray-500">
                Die-cut line is always visible — fixed 0.5 mm outside the sticker boundary.
              </p>

              {/* color */}
              <label className="block">
                <span className="mb-1 block text-xs text-gray-500">Line color</span>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <span className="block h-8 w-8 rounded-lg border border-gray-200" style={{ background: dieCutColor }} />
                    <input type="color" value={dieCutColor} onChange={e => setDieCutColor(e.target.value)} className="sr-only" />
                  </label>
                  <input
                    type="text" value={dieCutColor} maxLength={7} spellCheck={false}
                    onChange={e => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setDieCutColor(e.target.value); }}
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </div>
              </label>
            </div>
          </div>
        </>
      )}

      {/* ── Status bar — hidden on small screens ────────────── */}
      <footer className="hidden sm:flex shrink-0 items-center justify-between border-t border-gray-100 bg-white px-5 py-1">
        <span className={`text-[10px] font-medium ${isSaved ? 'text-emerald-600' : 'text-gray-400'}`}>
          {isSaved ? '✓ Saved' : 'Unsaved changes — click Save to persist'}
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
