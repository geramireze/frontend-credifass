import { Injectable } from '@angular/core';
import type { CierreSemana } from '../../features/cierres/data-access/cierres.model';

type RGB = [number, number, number];

const C = {
  primary:     [99,  102, 241] as RGB,
  primaryDark: [67,  56,  202] as RGB,
  blue50:      [239, 246, 255] as RGB,
  blue500:     [59,  130, 246] as RGB,
  blue800:     [30,  64,  175] as RGB,
  green50:     [240, 253, 244] as RGB,
  green600:    [22,  163, 74]  as RGB,
  green800:    [22,  101, 52]  as RGB,
  emerald50:   [236, 253, 245] as RGB,
  emerald600:  [5,   150, 105] as RGB,
  emerald800:  [6,   95,  70]  as RGB,
  teal50:      [240, 253, 250] as RGB,
  teal600:     [13,  148, 136] as RGB,
  teal800:     [17,  94,  89]  as RGB,
  amber50:     [255, 251, 235] as RGB,
  amber700:    [180, 83,  9]   as RGB,
  amber800:    [146, 64,  14]  as RGB,
  orange600:   [234, 88,  12]  as RGB,
  orange100:   [255, 237, 213] as RGB,
  gray200:     [229, 231, 235] as RGB,
  gray400:     [156, 163, 175] as RGB,
  gray600:     [75,  85,  99]  as RGB,
  gray800:     [31,  41,  55]  as RGB,
  white:       [255, 255, 255] as RGB,
};

function cop(v: number): string {
  return '$ ' + Math.round(v).toLocaleString('es-CO');
}

function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${meses[+m - 1]} ${y}`;
}

function fechaHora(v: string | Date): string {
  const d = typeof v === 'string' ? new Date(v) : v;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

@Injectable({ providedIn: 'root' })
export class PdfService {
  async exportarCierre(c: CierreSemana): Promise<void> {
    const { default: jsPDF } = await import('jspdf');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const W   = 210;
    const ml  = 14;
    const cw  = W - ml * 2;        // 182 mm
    const bw2 = (cw - 4) / 2;      // ancho 2 columnas ≈ 89 mm
    const bw3 = (cw - 8) / 3;      // ancho 3 columnas ≈ 58 mm

    // ── Rectángulo redondeado con relleno ──────────────────────────────
    const fillBox = (x: number, y: number, w: number, h: number, color: RGB) => {
      pdf.setFillColor(...color);
      pdf.roundedRect(x, y, w, h, 2.5, 2.5, 'F');
    };

    // ── Tarjeta de métrica ────────────────────────────────────────────
    const card = (
      x: number, y: number, w: number, h: number,
      bg: RGB, labelClr: RGB, valueClr: RGB,
      label: string, value: string, sub?: string,
    ) => {
      fillBox(x, y, w, h, bg);
      const cx = x + w / 2;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(...labelClr);
      pdf.text(label.toUpperCase(), cx, y + 7, { align: 'center' });

      pdf.setFontSize(value.startsWith('$') ? 11 : 17);
      pdf.setTextColor(...valueClr);
      pdf.text(value, cx, y + h / 2 + 3.5, { align: 'center' });

      if (sub) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5.5);
        pdf.setTextColor(...labelClr);
        pdf.text(sub, cx, y + h - 5.5, { align: 'center' });
      }
    };

    // ── Barra de sección ──────────────────────────────────────────────
    const sectionBar = (y: number, titulo: string, color: RGB) => {
      fillBox(ml, y, cw, 8.5, color);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(...C.white);
      pdf.text(titulo.toUpperCase(), ml + 5, y + 5.7);
    };

    // ════════════════════════════════════════════════════════
    // CABECERA
    // ════════════════════════════════════════════════════════
    pdf.setFillColor(...C.primary);
    pdf.rect(0, 0, W, 5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(...C.primaryDark);
    pdf.text('CrediFass', W / 2, 22, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(...C.gray800);
    pdf.text('INFORME DE CIERRE DE SEMANA', W / 2, 31, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.gray600);
    pdf.text(
      `Período: ${fechaCorta(c.fechaDesde)}  —  ${fechaCorta(c.fechaHasta)}`,
      W / 2, 39, { align: 'center' },
    );

    pdf.setFontSize(7);
    pdf.setTextColor(...C.gray400);
    pdf.text(`Generado: ${fechaHora(c.createdAt)}`, W / 2, 45, { align: 'center' });

    pdf.setDrawColor(...C.gray200);
    pdf.setLineWidth(0.3);
    pdf.line(ml, 50, W - ml, 50);

    // ════════════════════════════════════════════════════════
    // SECCIÓN 1 — PRÉSTAMOS
    // ════════════════════════════════════════════════════════
    const p = c.datos.prestamos;

    sectionBar(54, 'Módulo Préstamos', C.blue500);

    card(ml,           63, bw2, 30, C.blue50,  C.blue500,  C.blue800,  'Nuevos préstamos', String(p.nuevos));
    card(ml + bw2 + 4, 63, bw2, 30, C.blue50,  C.blue500,  C.blue800,  'Monto prestado',   cop(p.monto_prestado));

    card(ml,           96, bw2, 30, C.green50, C.green600, C.green800, 'Pagos recibidos',  String(p.pagos_count));
    card(ml + bw2 + 4, 96, bw2, 30, C.green50, C.green600, C.green800, 'Monto recaudado',  cop(p.pagos_monto));

    // ════════════════════════════════════════════════════════
    // SECCIÓN 2 — INVENTARIO / VENTAS
    // ════════════════════════════════════════════════════════
    const cf = c.datos.credifass;

    sectionBar(130, 'Módulo Inventario / Ventas', C.emerald600);

    card(ml,           139, bw2, 30, C.emerald50, C.emerald600, C.emerald800, 'Ventas realizadas', String(cf.ventas_count));
    card(ml + bw2 + 4, 139, bw2, 30, C.emerald50, C.emerald600, C.emerald800, 'Monto ventas',      cop(cf.ventas_monto));

    card(ml,           172, bw2, 30, C.teal50, C.teal600, C.teal800, 'Abonos mercancía', String(cf.abonos_count));
    card(ml + bw2 + 4, 172, bw2, 30, C.teal50, C.teal600, C.teal800, 'Monto abonos',     cop(cf.abonos_monto));

    // ════════════════════════════════════════════════════════
    // SECCIÓN 3 — CARTERA
    // ════════════════════════════════════════════════════════
    const cart = c.datos.cartera;

    sectionBar(206, 'Cartera pendiente por recoger', C.amber700);

    card(ml,                  215, bw3, 52, C.amber50,   C.amber700, C.amber800, 'Cartera préstamos', cop(cart.prestamos_pendiente), 'Saldo activo al cierre');
    card(ml + bw3 + 4,        215, bw3, 52, C.amber50,   C.amber700, C.amber800, 'Cartera mercancía', cop(cart.credifass_pendiente), 'Ventas en abono activas');
    card(ml + (bw3 + 4) * 2,  215, bw3, 52, C.orange600, C.orange100, C.white,  'Total por recoger', cop(cart.total_pendiente),      'Préstamos + Mercancía');

    // ════════════════════════════════════════════════════════
    // PIE DE PÁGINA
    // ════════════════════════════════════════════════════════
    pdf.setFillColor(...C.primary);
    pdf.rect(0, 282, W, 15, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.white);
    pdf.text(
      `CrediFass  ·  Cierre ${fechaCorta(c.fechaHasta)}  ·  Documento generado automáticamente`,
      W / 2, 291, { align: 'center' },
    );

    pdf.save(`cierre-${c.fechaDesde}-${c.fechaHasta}.pdf`);
  }
}
