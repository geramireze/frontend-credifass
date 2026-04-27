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
import { UsuarioListItem, CrearUsuarioDto, EditarUsuarioDto, RolUsuario, Rol, PERMISOS_CATALOGO } from '../data-access/usuarios.model';

const ROL_LABELS: Record<RolUsuario, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  cobrador: 'Cobrador',
};

@Component({
  selector: 'app-feature-usuarios',
  imports: [
    ReactiveFormsModule,
    AppIconComponent,
  ],
  templateUrl: './feature-usuarios.html',
  styleUrl: './feature-usuarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureUsuarios implements OnInit {
  protected readonly store = inject(UsuariosStore);
  private readonly rolesApi = inject(RolesApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly tabActivo = signal<'usuarios' | 'roles'>('usuarios');
  protected readonly mostrarPanel = signal(false);
  protected readonly editando = signal<UsuarioListItem | null>(null);
  protected readonly tempPassword = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly showMenu = signal<string | null>(null);
  protected readonly mostrarPassword = signal(false);

  protected readonly roles = signal<Rol[]>([]);
  protected readonly guardandoRol = signal<string | null>(null);
  protected readonly catalogoPermisos = PERMISOS_CATALOGO;

  protected readonly form = this.fb.nonNullable.group({
    nombre:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email:    ['', [Validators.required, Validators.email]],
    rolCodigo: ['cobrador' as RolUsuario, Validators.required],
    password: ['', [Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.store.cargar();
    this.rolesApi.listar().then(r => this.roles.set(r)).catch(() => undefined);
  }

  protected cambiarTab(tab: 'usuarios' | 'roles'): void {
    this.tabActivo.set(tab);
  }

  protected tienePermiso(rol: Rol, key: string): boolean {
    return rol.permissions['*'] === true || rol.permissions[key] === true;
  }

  protected esAdminTotal(rol: Rol): boolean {
    return rol.permissions['*'] === true;
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
