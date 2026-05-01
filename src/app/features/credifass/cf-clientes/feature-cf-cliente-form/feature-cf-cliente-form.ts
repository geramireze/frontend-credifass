import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../../shared/components/icon/icon';
import { CfClientesStore } from '../data-access/cf-clientes.store';
import type { TipoIdentificacion } from '../data-access/cf-clientes.model';

@Component({
  selector: 'app-feature-cf-cliente-form',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './feature-cf-cliente-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfClienteForm implements OnInit {
  protected readonly store  = inject(CfClientesStore);
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly fb       = inject(FormBuilder);

  protected readonly esEdicion = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error     = signal<string | null>(null);

  protected readonly tiposId: { value: TipoIdentificacion; label: string }[] = [
    { value: 'CC',  label: 'Cédula de ciudadanía' },
    { value: 'CE',  label: 'Cédula de extranjería' },
    { value: 'NIT', label: 'NIT' },
    { value: 'TI',  label: 'Tarjeta de identidad' },
    { value: 'PP',  label: 'Pasaporte' },
  ];

  protected readonly form = this.fb.group({
    tipoIdentificacion:  ['CC' as TipoIdentificacion, Validators.required],
    numeroIdentificacion:['', [Validators.required, Validators.minLength(5)]],
    nombreCompleto:      ['', [Validators.required, Validators.minLength(3)]],
    telefono:            ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    correo:              ['', Validators.email],
    direccion:           [''],
    notas:               [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.cargarParaEditar(id);
    }
  }

  private async cargarParaEditar(id: string): Promise<void> {
    await this.store.cargarDetalle(id);
    const c = this.store.seleccionado();
    if (c) {
      this.form.patchValue({
        tipoIdentificacion:   c.tipoIdentificacion,
        numeroIdentificacion: c.numeroIdentificacion,
        nombreCompleto:       c.nombreCompleto,
        telefono:             c.telefono,
        correo:               c.correo ?? '',
        direccion:            c.direccion ?? '',
        notas:                c.notas ?? '',
      });
    }
  }

  protected campo(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.error.set(null);

    const val = this.form.getRawValue();
    const dto = {
      tipoIdentificacion:   val.tipoIdentificacion as TipoIdentificacion,
      numeroIdentificacion: val.numeroIdentificacion!,
      nombreCompleto:       val.nombreCompleto!,
      telefono:             val.telefono!,
      correo:               val.correo || undefined,
      direccion:            val.direccion || undefined,
      notas:                val.notas || undefined,
    };

    try {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        await this.store.actualizar(id, dto);
      } else {
        await this.store.crear(dto);
      }
      await this.router.navigate(['/credifass/clientes']);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el cliente.';
      this.error.set(msg);
    } finally {
      this.guardando.set(false);
    }
  }
}
