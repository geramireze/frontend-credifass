import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientesStore } from '../data-access/clientes.store';
import { AppIconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-feature-cliente-form',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './feature-cliente-form.html',
  styleUrl: './feature-cliente-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureClienteForm implements OnInit {
  protected readonly store = inject(ClientesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly esEdicion = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    nombre:    ['', [Validators.required, Validators.minLength(2)]],
    documento: ['', [Validators.required, Validators.minLength(6)]],
    telefono:  ['', [Validators.required]],
    direccion: ['', [Validators.required]],
    ciudad:    ['', [Validators.required]],
    notas:     [''],
    referencias: this.fb.array([]),
  });

  get referencias(): FormArray {
    return this.form.get('referencias') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.cargarParaEditar(id);
    }
  }

  private async cargarParaEditar(id: string): Promise<void> {
    this.loading.set(true);
    await this.store.cargarDetalle(id);
    const c = this.store.seleccionado();
    if (c) {
      this.form.patchValue({
        nombre: c.nombre,
        documento: c.documento,
        telefono: c.telefono,
        direccion: c.direccion ?? '',
        ciudad: c.ciudad,
        notas: c.notas ?? '',
      });
      while (this.referencias.length) this.referencias.removeAt(0);
      c.referencias?.forEach((r) => this.agregarReferencia(r.nombre, r.telefono, r.parentesco));
    }
    this.loading.set(false);
  }

  protected agregarReferencia(nombre = '', telefono = '', parentesco = ''): void {
    this.referencias.push(this.fb.group({
      nombre:     [nombre, [Validators.required]],
      telefono:   [telefono, [Validators.required]],
      parentesco: [parentesco, [Validators.required]],
    }));
  }

  protected eliminarReferencia(i: number): void {
    this.referencias.removeAt(i);
  }

  protected async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const dto = {
      nombre:     raw.nombre ?? '',
      documento:  raw.documento ?? '',
      telefono:   raw.telefono ?? '',
      direccion:  raw.direccion ?? '',
      ciudad:     raw.ciudad ?? '',
      notas:      raw.notas || undefined,
      referencias: (raw.referencias as { nombre: string; telefono: string; parentesco: string }[]),
    };
    try {
      if (this.esEdicion()) {
        const id = this.route.snapshot.paramMap.get('id')!;
        await this.store.actualizar(id, dto);
        await this.router.navigate(['/clientes', id]);
      } else {
        await this.store.crear(dto);
        await this.router.navigate(['/clientes']);
      }
    } catch (err: unknown) {
      const body = (err as { error?: { message?: string | string[] } })?.error;
      const msg = Array.isArray(body?.message) ? body!.message[0] : body?.message;
      this.error.set(msg ?? 'No se pudo guardar el cliente. Verifica los datos e intenta de nuevo.');
      this.loading.set(false);
    }
  }

  protected campo(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  protected refCampo(i: number, name: string): boolean {
    const ctrl = this.referencias.at(i)?.get(name);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
