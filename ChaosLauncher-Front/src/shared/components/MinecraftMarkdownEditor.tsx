'use client';

import React, { useState, useRef } from 'react';
import { marked } from 'marked';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough as StrikeIcon, 
  Code, 
  Link as LinkIcon, 
  List, 
  ListOrdered, 
  CheckSquare, 
  AlertTriangle, 
  Minus, 
  Eye, 
  Edit3, 
  Quote, 
  Sparkles, 
  Zap, 
  Shield, 
  Bug, 
  Swords, 
  Package, 
  Flame, 
  Info,
  FileText
} from 'lucide-react';

interface MinecraftMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  showMinecraftBadges?: boolean;
}

export const MinecraftMarkdownEditor: React.FC<MinecraftMarkdownEditorProps> = ({
  value,
  onChange,
  label = 'NORMATIVA DEL SERVIDOR (MARKDOWN)',
  placeholder = '# Reglas del Servidor\n1. Respeto mutuo entre jugadores.\n2. Prohibido el uso de hacks, x-ray o cheats.\n> ⚠️ Cualquier infracción conllevará baneo permanente.',
  minHeight = '320px',
  showMinecraftBadges = true,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inserta sintaxis o envuelve texto seleccionado directamente en el textarea
  const insertSyntax = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      // Fallback si no está montado
      onChange(value ? `${value}\n${prefix}${defaultText}${suffix}` : `${prefix}${defaultText}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const nextValue = value.substring(0, start) + replacement + value.substring(end);

    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 15);
  };

  const handleLoadDemoTemplate = () => {
    const demo = `# Registro de Actualizaciones & Novedades

## ✨ Versión 1.0.0 Oficial
- ✨ **Lanzamiento Oficial**: Servidor abierto al público con mapa personalizado.
- ⚡ **Optimización Extrema**: +120 FPS estables con Sodium, Lithium e Iris Shaders.
- 🛡️ **Seguridad Mejorada**: Sistema anticheat de última generación integrado.
- ⚔️ **Jugabilidad & Combate**: Mazmorras dimensionales y nuevas armas épicas.
- 📦 **Nuevos Mods**: Agregados JourneyMap, VoiceChat y Complementos RPG.
- 🐛 **Corrección de Bugs**: Resuelto el lag de renderizado con chunks lejanos.
- 🔥 **Novedad Nether**: Nueva fortaleza Netherite protegida por jefes.

---

> ⚠️ **Sanción:** El uso de hacks o clientes modificados no autorizados causará baneo permanente.
> ℹ️ **Nota:** Recuerda unirte al canal de Discord para recibir recompensas diarias.`;

    onChange(demo);
  };

  // Convertir markdown a HTML seguro con estilos temáticos de Minecraft
  const getRenderedHtml = () => {
    try {
      const rawHtml = marked.parse(value || '*No hay contenido redactado aún. Usa la barra de herramientas para comenzar.*', {
        breaks: true,
        gfm: true,
      }) as string;
      return rawHtml;
    } catch {
      return '<p class="text-red-400 font-minecraft">Error al procesar el formato markdown.</p>';
    }
  };

  return (
    <div className="space-y-2 select-none">
      {/* Header y Toggle entre Editor y Preview */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
        <label className="font-minecraft font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleLoadDemoTemplate}
            className="px-2.5 py-1 font-minecraft text-[10px] flex items-center gap-1 text-stone-300 hover:text-amber-400 bg-stone-900 border border-stone-800 hover:border-amber-600 transition cursor-pointer"
            title="Cargar plantilla de ejemplo completa en el editor"
          >
            <FileText className="w-3 h-3 text-amber-400" />
            <span>CARGAR PLANTILLA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1 font-minecraft text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'edit'
                ? 'minecraft-btn-lava font-bold text-white'
                : 'text-stone-400 hover:text-white bg-black/40'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>EDITOR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 font-minecraft text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'preview'
                ? 'minecraft-btn-lava font-bold text-emerald-400'
                : 'text-stone-400 hover:text-white bg-black/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>VISTA PREVIA</span>
          </button>
        </div>
      </div>

      {/* Toolbar temática expandida de Minecraft (visible en modo Edit) */}
      {activeTab === 'edit' && (
        <div className="space-y-1.5">
          {/* Fila 1: Herramientas de Formato y Estructura */}
          <div className="p-2 minecraft-slot flex flex-wrap items-center gap-1.5 bg-[#0d0707] border-stone-800">
            {/* Formato Básico */}
            <button
              type="button"
              onClick={() => insertSyntax('**', '**', 'texto en negrita')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Negrita (**texto**)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('*', '*', 'texto en cursiva')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Cursiva (*texto*)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('<u>', '</u>', 'texto subrayado')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Subrayado (<u>texto</u>)"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('~~', '~~', 'texto tachado')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Tachado (~~texto~~)"
            >
              <StrikeIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('`', '`', 'código')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Código en línea (`código`)"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('[', '](https://url.com)', 'texto del enlace')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Enlace ([texto](url))"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-stone-800 mx-1" />

            {/* Encabezados */}
            <button
              type="button"
              onClick={() => insertSyntax('\n# ', '\n', 'Título Principal')}
              className="minecraft-btn-gray px-2 py-1 text-xs text-stone-300 hover:text-amber-400 font-minecraft font-bold"
              title="Encabezado 1 (# Título)"
            >
              H1
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('\n## ', '\n', 'Subtítulo')}
              className="minecraft-btn-gray px-2 py-1 text-xs text-stone-300 hover:text-amber-400 font-minecraft font-bold"
              title="Encabezado 2 (## Subtítulo)"
            >
              H2
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('\n### ', '\n', 'Sección')}
              className="minecraft-btn-gray px-2 py-1 text-xs text-stone-300 hover:text-amber-400 font-minecraft font-bold"
              title="Encabezado 3 (### Sección)"
            >
              H3
            </button>

            <div className="w-[1px] h-4 bg-stone-800 mx-1" />

            {/* Listas y Bloques */}
            <button
              type="button"
              onClick={() => insertSyntax('\n- ', '', 'Elemento de lista')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Lista con viñetas (- Item)"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('\n1. ', '', 'Primer elemento')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Lista numerada (1. Item)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('\n- [x] ', '', 'Tarea completada')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Lista de tareas / Checklist (- [x] Item)"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('\n> ', '', 'Texto citado')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Bloque de cita (> Cita)"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('\n```\n', '\n```\n', '// bloque de código o configuración')}
              className="minecraft-btn-gray px-2 py-1 text-xs text-stone-300 hover:text-amber-400 font-minecraft font-mono"
              title="Bloque de código (```)"
            >
              {'{}'}
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('\n---\n', '')}
              className="minecraft-btn-gray p-1.5 text-xs text-stone-300 hover:text-amber-400 font-minecraft"
              title="Línea separadora (---)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-stone-800 mx-1" />

            {/* Avisos especiales */}
            <button
              type="button"
              onClick={() => insertSyntax('\n> ⚠️ **Sanción:** ', '', 'Expulsión temporal o baneo')}
              className="minecraft-btn-gray px-2 py-1 text-xs text-amber-400 hover:text-red-400 font-minecraft flex items-center gap-1"
              title="Aviso de sanción o advertencia"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Sanción</span>
            </button>

            <button
              type="button"
              onClick={() => insertSyntax('\n> ℹ️ **Nota:** ', '', 'Información importante a considerar')}
              className="minecraft-btn-gray px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 font-minecraft flex items-center gap-1"
              title="Nota informativa"
            >
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Nota</span>
            </button>
          </div>

          {/* Fila 2: Badges y Categorías Rápidas de Minecraft / Changelog */}
          {showMinecraftBadges && (
            <div className="p-2 minecraft-slot flex flex-wrap items-center gap-1.5 bg-[#080404] border-stone-800">
              <span className="text-[10px] font-minecraft text-stone-500 uppercase tracking-widest mr-1">
                Insertar:
              </span>

              <button
                type="button"
                onClick={() => insertSyntax('\n- ✨ **Lanzamiento:** ', '', 'Nueva versión disponible')}
                className="px-2 py-1 text-[11px] font-minecraft bg-amber-950/40 border border-amber-600/60 text-amber-300 hover:bg-amber-900/60 transition flex items-center gap-1 cursor-pointer"
                title="Insertar novedad de lanzamiento"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>✨ Lanzamiento</span>
              </button>

              <button
                type="button"
                onClick={() => insertSyntax('\n- ⚡ **Optimización:** ', '', 'Mejora de FPS y carga')}
                className="px-2 py-1 text-[11px] font-minecraft bg-yellow-950/40 border border-yellow-600/60 text-yellow-300 hover:bg-yellow-900/60 transition flex items-center gap-1 cursor-pointer"
                title="Insertar optimización de rendimiento"
              >
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>⚡ Rendimiento</span>
              </button>

              <button
                type="button"
                onClick={() => insertSyntax('\n- 🛡️ **Seguridad:** ', '', 'Protección de servidor y parches')}
                className="px-2 py-1 text-[11px] font-minecraft bg-cyan-950/40 border border-cyan-600/60 text-cyan-300 hover:bg-cyan-900/60 transition flex items-center gap-1 cursor-pointer"
                title="Insertar regla o mejora de seguridad"
              >
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>🛡️ Seguridad</span>
              </button>

              <button
                type="button"
                onClick={() => insertSyntax('\n- 🐛 **Corrección:** ', '', 'Solucionado error de compatibilidad')}
                className="px-2 py-1 text-[11px] font-minecraft bg-emerald-950/40 border border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60 transition flex items-center gap-1 cursor-pointer"
                title="Insertar corrección de bug"
              >
                <Bug className="w-3 h-3 text-emerald-400" />
                <span>🐛 Bugfix</span>
              </button>

              <button
                type="button"
                onClick={() => insertSyntax('\n- ⚔️ **Jugabilidad:** ', '', 'Ajustes de daño, mazmorras y bosses')}
                className="px-2 py-1 text-[11px] font-minecraft bg-red-950/40 border border-red-600/60 text-red-300 hover:bg-red-900/60 transition flex items-center gap-1 cursor-pointer"
                title="Insertar balance de combate o jugabilidad"
              >
                <Swords className="w-3 h-3 text-red-400" />
                <span>⚔️ Jugabilidad</span>
              </button>

              <button
                type="button"
                onClick={() => insertSyntax('\n- 📦 **Mods:** ', '', 'Nuevos mods y datapacks agregados')}
                className="px-2 py-1 text-[11px] font-minecraft bg-purple-950/40 border border-purple-600/60 text-purple-300 hover:bg-purple-900/60 transition flex items-center gap-1 cursor-pointer"
                title="Insertar actualización de mods"
              >
                <Package className="w-3 h-3 text-purple-400" />
                <span>📦 Mods</span>
              </button>

              <button
                type="button"
                onClick={() => insertSyntax('\n- 🔥 **Novedad:** ', '', 'Contenido exclusivo añadido')}
                className="px-2 py-1 text-[11px] font-minecraft bg-orange-950/40 border border-orange-600/60 text-orange-300 hover:bg-orange-900/60 transition flex items-center gap-1 cursor-pointer"
                title="Insertar novedad destacada"
              >
                <Flame className="w-3 h-3 text-orange-400" />
                <span>🔥 Novedad</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor Textarea */}
      {activeTab === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full minecraft-input font-mono text-xs sm:text-sm text-stone-200 p-4 leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-amber-500 rounded-none bg-[#0a0505]"
        />
      ) : (
        /* Vista Previa con estilos visuales temáticos de Minecraft */
        <div
          style={{ minHeight }}
          className="w-full minecraft-card p-6 bg-[#0a0505] border-2 border-stone-800 overflow-y-auto leading-relaxed"
        >
          <div
            className="prose prose-invert max-w-none space-y-4 font-minecraft text-xs sm:text-sm text-stone-200 
              [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-amber-400 [&>h1]:border-b [&>h1]:border-amber-600/40 [&>h1]:pb-2 [&>h1]:mb-3
              [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-emerald-400 [&>h2]:mt-4 [&>h2]:mb-2
              [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-cyan-400 [&>h3]:mt-3 [&>h3]:mb-1
              [&>p]:text-stone-300 [&>p]:leading-relaxed
              [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1.5 [&>ul>li]:text-stone-200
              [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:space-y-1.5 [&>ol>li]:text-stone-200
              [&>blockquote]:border-l-4 [&>blockquote]:border-amber-500 [&>blockquote]:bg-amber-950/20 [&>blockquote]:p-3 [&>blockquote]:text-amber-300 [&>blockquote]:my-3
              [&>hr]:border-stone-800 [&>hr]:my-4
              [&>code]:bg-[#1a0f0f] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-amber-300 [&>code]:font-mono [&>code]:text-xs
              [&>pre]:bg-[#0d0707] [&>pre]:border [&>pre]:border-stone-800 [&>pre]:p-4 [&>pre]:text-stone-300
              [&>strong]:text-white [&>strong]:font-bold
              [&>a]:text-amber-400 [&>a]:underline hover:[&>a]:text-amber-300"
            dangerouslySetInnerHTML={{ __html: getRenderedHtml() }}
          />
        </div>
      )}
    </div>
  );
};
