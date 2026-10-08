import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { CmsService } from '../../cms/cms.service';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import ts from 'highlight.js/lib/languages/typescript';
import js from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import yaml from 'highlight.js/lib/languages/yaml';
import md from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';

for (const [n, l] of [['typescript', ts], ['javascript', js], ['json', json], ['sql', sql], ['bash', bash], ['xml', xml], ['html', xml], ['css', css], ['yaml', yaml], ['markdown', md], ['diff', diff]] as const) {
  hljs.registerLanguage(n, l as never);
}
marked.setOptions({ gfm: true, breaks: true });

/**
 * Split markdown editor (WJ6): textarea left / preview right (toggle on mobile). marked GFM + DOMPurify +
 * highlight.js (small language set), Tab = 2 spaces, Ctrl+B/I, copy button on every code block.
 * Two-way bindable via `value` / `valueChange`.
 */
@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './markdown-editor.html',
  styleUrl: './markdown-editor.scss',
})
export class MarkdownEditor {
  private cms = inject(CmsService);
  readonly value = input('');
  readonly valueChange = output<string>();
  readonly mode = signal<'split' | 'edit' | 'preview'>('split');
  private previewEl = viewChild<ElementRef<HTMLElement>>('preview');
  private taEl = viewChild<ElementRef<HTMLTextAreaElement>>('ta');

  readonly html = computed(() => DOMPurify.sanitize(marked.parse(this.value() || '', { async: false }) as string));
  readonly chars = computed(() => this.value().length);
  readonly words = computed(() => (this.value().trim() ? this.value().trim().split(/\s+/).length : 0));

  constructor() {
    // After each render of the preview, syntax-highlight code blocks and add a "copiar" button.
    afterRenderEffect(() => {
      this.html(); // dependency
      const root = this.previewEl()?.nativeElement;
      if (!root) return;
      root.querySelectorAll('pre code').forEach((block) => {
        const el = block as HTMLElement;
        if (el.dataset['hl']) return;
        try { hljs.highlightElement(el); } catch { /* unknown lang */ }
        el.dataset['hl'] = '1';
        const pre = el.parentElement!;
        if (!pre.querySelector('.md-copy')) {
          const btn = document.createElement('button');
          btn.type = 'button'; btn.className = 'md-copy'; btn.textContent = 'copiar';
          btn.onclick = () => { void navigator.clipboard.writeText(el.innerText); btn.textContent = '✓'; setTimeout(() => (btn.textContent = 'copiar'), 1200); };
          pre.appendChild(btn);
        }
      });
    });
  }

  onInput(v: string): void { this.valueChange.emit(v); }

  /** Paste an image from the clipboard → upload to web-media/notes and insert a markdown link. */
  async onPaste(e: ClipboardEvent): Promise<void> {
    const items = e.clipboardData?.items;
    if (!items) return;
    const entry = Array.from(items).find((it) => it.kind === 'file' && it.type.startsWith('image/'));
    const file = entry?.getAsFile();
    if (!file) return;
    e.preventDefault();
    const marker = `![subiendo imagen…](#${crypto.randomUUID()})`;
    const ta = this.taEl()?.nativeElement;
    const pos = ta ? ta.selectionStart : this.value().length;
    const v = this.value();
    this.valueChange.emit(v.slice(0, pos) + marker + v.slice(pos));
    try {
      const url = await this.cms.uploadInline(file);
      this.replaceMarker(marker, `![imagen](${url})`);
    } catch (err) {
      this.replaceMarker(marker, `*(no se pudo subir la imagen: ${(err as Error).message})*`);
    }
  }
  private replaceMarker(marker: string, repl: string): void {
    const v = this.value();
    const i = v.indexOf(marker);
    if (i < 0) return;
    this.valueChange.emit(v.slice(0, i) + repl + v.slice(i + marker.length));
  }

  onKeydown(e: KeyboardEvent): void {
    const ta = e.target as HTMLTextAreaElement;
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      const v = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
      this.valueChange.emit(v);
      queueMicrotask(() => ta.setSelectionRange(s + 2, s + 2));
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i')) {
      e.preventDefault();
      const wrap = e.key === 'b' ? '**' : '*';
      const s = ta.selectionStart, en = ta.selectionEnd;
      const sel = ta.value.slice(s, en);
      const v = ta.value.slice(0, s) + wrap + sel + wrap + ta.value.slice(en);
      this.valueChange.emit(v);
      queueMicrotask(() => ta.setSelectionRange(s + wrap.length, en + wrap.length));
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      const sel = ta.value.slice(s, en) || 'texto';
      const v = ta.value.slice(0, s) + `[${sel}](url)` + ta.value.slice(en);
      this.valueChange.emit(v);
      const urlStart = s + sel.length + 3; // after "[sel]("
      queueMicrotask(() => ta.setSelectionRange(urlStart, urlStart + 3)); // select "url"
    }
  }
}
