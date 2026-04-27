import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { UsuariosStore } from '../data-access/usuarios.store';
import { RolesApiService } from '../data-access/roles-api';
import {
  UsuarioListItem, CrearUsuarioDto, EditarUsuarioDto,
  RolUsuario, Rol, CrearRolDto, PERMISOS_CATALOGO,
} from '../data-access/usuarios.model';

const SYSTEM_ROLES = ['admin', 'supervisor', 'cobrador'];

const ROL_LABELS: Record<RolUsuario, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  cobrador: 'Cobrador',
};

@Component({
  selector: 'app-feature-usuarios',
  imports: [ReactiveFormsModule, AppIconComponent],
  templateUrl: './feature-usuarios.html',
  styleUrl: './feature-usuarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureUsuarios implements OnInit {
  protected readonly store = inject(UsuariosStore);
  private readonly rolesApi = inject(RolesApiService);
  private readonly fb = inject(FormBuilder);

  // ── Tab ────────────────────────────────────────────
  protected readonly tabActivo = signal<'usuarios' | 'roles'>('usuarios');

  // ── Panel usuario ──────────────────────────────────
  protected readonly mostrarPanel = signal(false);
  protected readonly editando = signal<UsuarioListItem | null>(null);
  protected readonly tempPassword = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly showMenu = signal<string | null>(null);
  protected readonly mostrarPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombre:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email:     ['', [Validators.required, Validators.email]],
    rolCodigo: ['cobrador' as RolUsuario, Validators.required],
    password:  ['', [Validators.minLength(6)]],
  });

  // ── Roles ──────────────────────────────────────────
  protected readonly roles = signal<Rol[]>([]);
  protected readonly guardandoRol = signal<string | null>(null);
  protected readonly errorRol = signal<string | null>(null);
  protected readonly catalogoPermisos = PERMISOS_CATALOGO;

  // ── Panel crear rol ────────────────────────────────
  protected readonly mostrarPanelRol = signal(false);
  protected readonly guardandoNuevoRol = signal(false);

  protected readonly formRol = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    codigo: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/), Validators.minLength(2), Validators.maxLength(50)]],
  });

  readonly systemRoles = SYSTEM_ROLES;

  ngOnInit(): void {
    this.store.cargar();
    this.cargarRoles();
  }

  private cargarRoles(): void {
    this.rolesApi.listar().then(r => this.roles.set(r)).catch(() => undefined);
  }

  // ── Tab ────────────────────────────────────────────
  protected cambiarTab(tab: 'usuarios' | 'roles'): void {
    this.tabActivo.set(tab);
  }

  // ── Permisos ───────────────────────────────────────
  protected tienePermiso(rol: Rol, key: string): boolean {
    return rol.permissions['*'] === true || rol.permissions[key] === true;
  }

  protected esAdminTotal(rol: Rol): boolean {
    return rol.permissions['*'] === true;
  }

  protected esRolSistema(rol: Rol): boolean {
    return SYSTEM_ROLES.includes(rol.codigo);
  }

  protected async togglePermiso(rol: Rol, key: string): Promise<void> {
    if (this.guardandoRol() || this.esAdminTotal(rol)) return;
    this.guardandoRol.set(rol.id);
    try {
      const nuevos = { ...rol.permissions, [key]: !rol.permissions[key] };
      const actualizado = await this.rolesApi.actualizarPermisos(rol.id, nuevos);
      this.roles.update(list => list.map(r => r.id === actualizado.id ? actualizado : r));
    } finally {
      this.guardandoRol.set(null);
    }
  }

  // ── Panel crear rol ────────────────────────────────
  protected abrirPanelRol(): void {
    this.formRol.reset({ nombre: '', codigo: '' });
    this.errorRol.set(null);
    this.mostrarPanelRol.set(true);
  }

  protected cerrarPanelRol(): void {
    this.mostrarPanelRol.set(false);
    this.errorRol.set(null);
  }

  protected async crearRol(): Promise<void> {
    this.formRol.markAllAsTouched();
    if (this.formRol.invalid || this.guardandoNuevoRol()) return;
    this.guardandoNuevoRol.set(true);
    this.errorRol.set(null);
    const v = this.formRol.getRawValue();
    const dto: CrearRolDto = { codigo: v.codigo, nombre: v.nombre };
    try {
      const nuevo = await this.rolesApi.crear(dto);
      this.roles.update(list => [...list, nuevo].sort((a, b) => a.codigo.localeCompare(b.codigo)));
      this.cerrarPanelRol();
    } catch (err: unknown) {
      const body = (err as { error?: { message?: string } })?.error;
      this.errorRol.set(body?.message ?? 'No se pudo crear el rol.');
    } finally {
      this.guardandoNuevoRol.set(false);
    }
  }

  protected async eliminarRol(rol: Rol): Promise<void> {
    if (!confirm(`¿Eliminar el rol "${rol.nombre}"? Los usuarios con este rol quedarán sin rol asignado.`)) return;
    try {
      await this.rolesApi.eliminar(rol.id);
      this.roles.update(list => list.filter(r => r.id !== rol.id));
    } catch (err: unknown) {
      const body = (err as { error?: { message?: string } })?.error;
      this.errorRol.set(body?.message ?? 'No se pudo eliminar el rol.');
    }
  }

  // ── Panel usuario ──────────────────────────────────
  protected abrirCrear(): void {
    this.form.reset({ nombre: '', email: '', rolCodigo: 'cobrador', password: '' });
    this.form.get('email')!.enable();
    this.editando.set(null);
    this.mostrarPassword.set(false);
    this.mostrarPanel.set(true);
  }

  protected abrirEditar(u: UsuarioListItem): void {
    this.form.reset({ nombre: u.nombre, email: u.email, rolCodigo: u.rol, password: '' });
    this.form.get('email')!.disable();
    this.editando.set(u);
    this.mostrarPassword.set(false);
    this.mostrarPanel.set(true);
    this.showMenu.set(null);
  }

  protected cerrarPanel(): void {
    this.mostrarPanel.set(false);
    this.editando.set(null);
    this.store.limpiarError();
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    try {
      const val = this.form.getRawValue();
      const editar = this.editando();
      if (editar) {
        const dto: EditarUsuarioDto = {
          nombre: val.nombre,
          rolCodigo: val.rolCodigo,
          ...(val.password ? { password: val.password } : {}),
        };
        await this.store.editar(editar.id, dto);
        this.cerrarPanel();
      } else {
        const dto: CrearUsuarioDto = {
          nombre: val.nombre,
          email: val.email,
          rolCodigo: val.rolCodigo,
          ...(val.password ? { password: val.password } : {}),
        };
        await this.store.crear(dto);
        const pwd = this.store.passwordTemporal();
        if (pwd) this.tempPassword.set(pwd);
        this.cerrarPanel();
      }
    } finally {
      this.guardando.set(false);
    }
  }

  protected async resetPassword(id: string): Promise<void> {
    const pwd = await this.store.resetPassword(id);
    this.tempPassword.set(pwd);
    this.showMenu.set(null);
  }

  protected cerrarTempPassword(): void {
    this.tempPassword.set(null);
    this.store.limpiarPasswordTemporal();
  }

  protected rolLabel(rol: RolUsuario): string {
    return ROL_LABELS[rol] ?? rol;
  }

  protected rolBadge(rol: RolUsuario): string {
    const map: Record<RolUsuario, string> = {
      admin: 'role-admin',
      supervisor: 'role-supervisor',
      cobrador: 'role-cobrador',
    };
    return map[rol] ?? 'badge';
  }

  protected toggleMenu(id: string): void {
    this.showMenu.set(this.showMenu() === id ? null : id);
  }
}
