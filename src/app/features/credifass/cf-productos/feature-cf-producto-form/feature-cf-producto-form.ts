import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../../shared/components/icon/icon';
import { CfProductosStore } from '../data-access/cf-productos.store';
import { CfProductosApi } from '../data-access/cf-productos-api';
import { CfCategoriasApi } from '../../cf-categorias/data-access/cf-categorias-api';
import type { CfCategoria } from '../../cf-categorias/data-access/cf-categorias.model';

@Component({
  selector: 'app-feature-cf-producto-form',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './feature-cf-producto-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfProductoForm implements OnInit {
  protected readonly store        = inject(CfProductosStore);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);
  private readonly fb             = inject(FormBuilder);
  private readonly categoriasApi  = inject(CfCategoriasApi);
  private readonly productosApi   = inject(CfProductosApi);

  protected readonly guardando    = signal(false);
  protected readonly error        = signal<string | null>(null);
  protected readonly categorias   = signal<CfCategoria[]>([]);
  protected readonly modoEdicion  = signal(false);
  protected readonly productoId   = signal<string | null>(null);
  protected readonly stockActual  = signal<number>(0);

  protected readonly form = this.fb.group({
    nombre:        ['', [Validators.required, Validators.minLength(2)]],
    descripcion:   [''],
    categoriaId:   [''],
    valorCompra:   ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    valorVenta:    ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    stockInicial:  [0, [Validators.required, Validators.min(0)]],
    stockMinimo:   [1, [Validators.required, Validators.min(0)]],
    ajusteStock:   [0 as number],
    motivoAjuste:  [''],
  });

  private readonly formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly margenInfo = computed(() => {
    const v = this.formValues();
    const compra = parseFloat(String(v.valorCompra ?? '0')) || 0;
    const venta  = parseFloat(String(v.valorVenta  ?? '0')) || 0;
    if (compra <= 0 || venta <= 0) return null;
    const margen = venta - compra;
    const pct    = ((margen / compra) * 100).toFixed(1);
    return { margen, pct: Number(pct), bajoCompra: margen < 0 };
  });

  async ngOnInit(): Promise<void> {
    const [cats] = await Promise.all([
      this.categoriasApi.listar(true).catch(() => []),
    ]);
    this.categorias.set(cats);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicion.set(true);
      this.productoId.set(id);
      await this.cargarProducto(id);
    }
  }

  private async cargarProducto(id: string): Promise<void> {
    try {
      const p = await this.productosApi.obtener(id);
      this.stockActual.set(p.stockDisponible);
      this.form.patchValue({
        nombre:       p.nombre,
        descripcion:  p.descripcion ?? '',
        categoriaId:  p.categoriaId ?? '',
        valorCompra:  p.valorCompra,
        valorVenta:   p.valorVenta,
        stockMinimo:  p.stockMinimo ?? 1,
        ajusteStock:  0,
        motivoAjuste: '',
      });
      this.form.get('stockInicial')?.disable();
    } catch {
      this.error.set('No se pudo cargar el producto.');
    }
  }

  protected campo(name: string): boolean {
    const c = this.form.get(name);
    return !!(c?.invalid && c.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();
    const ajuste = Number(v.ajusteStock ?? 0);

    if (ajuste !== 0 && !v.motivoAjuste?.trim()) {
      this.form.get('motivoAjuste')?.markAsTouched();
      this.error.set('El motivo del ajuste de stock es requerido.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    try {
      if (this.modoEdicion()) {
        const id = this.productoId()!;
        await this.store.editar(
          id,
          {
            nombre:      v.nombre ?? undefined,
            descripcion: v.descripcion || undefined,
            stockMinimo: v.stockMinimo !== null ? Number(v.stockMinimo) : undefined,
          },
          {
            valorCompra: String(v.valorCompra!),
            valorVenta:  String(v.valorVenta!),
          },
        );
        if (ajuste !== 0) {
          await this.store.ajustarStock(id, ajuste, v.motivoAjuste!.trim());
        }
      } else {
        await this.store.crear({
          nombre:       v.nombre!,
          descripcion:  v.descripcion || undefined,
          categoriaId:  v.categoriaId || undefined,
          valorCompra:  String(v.valorCompra!),
          valorVenta:   String(v.valorVenta!),
          stockInicial: Number(v.stockInicial),
        });
      }
      await this.router.navigate(['/credifass/productos']);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Error al guardar el producto.');
    } finally {
      this.guardando.set(false);
    }
  }
}
