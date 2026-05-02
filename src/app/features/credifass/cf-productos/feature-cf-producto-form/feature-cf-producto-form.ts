import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../../shared/components/icon/icon';
import { CfProductosStore } from '../data-access/cf-productos.store';
import { CfProductosApi } from '../data-access/cf-productos-api';
import { CfCategoriasApi } from '../../cf-categorias/data-access/cf-categorias-api';
import type { CfCategoria } from '../../cf-categorias/data-access/cf-categorias.model';

@Component({
  selector: 'app-feature-cf-producto-form',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
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

  protected readonly form = this.fb.group({
    nombre:       ['', [Validators.required, Validators.minLength(2)]],
    descripcion:  [''],
    categoriaId:  [''],
    valorCompra:  ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    valorVenta:   ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    stockInicial: [0, [Validators.required, Validators.min(0)]],
    stockMinimo:  [1, [Validators.required, Validators.min(0)]],
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
      this.form.patchValue({
        nombre:       p.nombre,
        descripcion:  p.descripcion ?? '',
        categoriaId:  p.categoriaId ?? '',
        valorCompra:  p.valorCompra,
        valorVenta:   p.valorVenta,
        stockMinimo:  p.stockMinimo ?? 1,
      });
      // El stock disponible se ajusta por operación separada, no aquí
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
    this.guardando.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();

    try {
      if (this.modoEdicion()) {
        await this.store.editar(
          this.productoId()!,
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
