import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function AutoHeightHtmlFrame({ src, title, sandbox, style = {}, integrated = false, hideDocumentHeader = false }) {
  const frameRef = useRef(null);
  const [html, setHtml] = useState(null);
  const [height, setHeight] = useState(800);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setHeight(800);
    if (!src || !/\.html?(?:$|[?#])/i.test(src)) return () => { cancelled = true; };

    axios.get(src, { responseType: 'text' }).then(({ data }) => {
      if (cancelled) return;

      const base = `<base href="${new URL(src, window.location.origin).href}"><style>html,body{height:auto!important;min-height:0!important;overflow:visible!important}</style>`;
      const resizeScript = `<script>(function(){var send=function(){var d=document.documentElement,b=document.body;parent.postMessage({type:'auto-html-height',height:Math.max(d?d.scrollHeight:0,b?b.scrollHeight:0,d?d.offsetHeight:0,b?b.offsetHeight:0)},'*')};window.addEventListener('load',send);window.addEventListener('resize',send);new ResizeObserver(send).observe(document.documentElement);if(document.body)new ResizeObserver(send).observe(document.body);setInterval(send,700);send()})()</script>`;
      let documentHtml = String(data || '');
      if (/<head[^>]*>/i.test(documentHtml)) documentHtml = documentHtml.replace(/<head([^>]*)>/i, `<head$1>${base}`);
      else documentHtml = `${base}${documentHtml}`;

      if (integrated) {
        const hideHeaderStyle = hideDocumentHeader
          ? '<style id="hide-document-header">.container > .header:first-child, main > .header:first-child, body .header:first-child, body .resume-header:first-child, body .page-header:first-child, body .document-header:first-child, body > .header:first-of-type, body > header:first-of-type, .container > header:first-child, main > header:first-child { display: none !important; }</style>'
          : '';
        const siteStyle = `<style id="site-content-integration">html,body{margin:0!important;padding:0!important;background:transparent!important;color:#1e293b!important}body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;line-height:1.65!important}.cols{max-width:min(1200px,100%)!important}section{border-color:#dbeafe!important;border-radius:14px!important;box-shadow:0 3px 12px rgba(15,23,42,.06)!important}section h2{background:#0b3675!important;font-family:inherit!important;font-size:1.05rem!important}</style>${hideHeaderStyle}`;
        if (/<\/head>/i.test(documentHtml)) documentHtml = documentHtml.replace(/<\/head>/i, `${siteStyle}</head>`);
        else documentHtml = `${siteStyle}${documentHtml}`;
      }

      const bodyClose = documentHtml.toLowerCase().lastIndexOf('</body>');
      if (bodyClose >= 0) documentHtml = `${documentHtml.slice(0, bodyClose)}${resizeScript}${documentHtml.slice(bodyClose)}`;
      else documentHtml += resizeScript;
      setHtml(documentHtml);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [src, integrated, hideDocumentHeader]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== 'auto-html-height') return;
      const nextHeight = Number(event.data.height);
      if (Number.isFinite(nextHeight) && nextHeight > 0) setHeight(Math.min(Math.max(nextHeight, 320), 100000));
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const isHtml = /\.html?(?:$|[?#])/i.test(src || '');
  return <iframe
    ref={frameRef}
    src={isHtml && html !== null ? undefined : src}
    srcDoc={isHtml && html !== null ? html : undefined}
    title={title}
    sandbox={sandbox}
    scrolling={isHtml && html !== null ? 'no' : undefined}
    style={isHtml && html !== null ? { ...style, height: `${height}px`, overflow: 'hidden' } : style}
  />;
}
