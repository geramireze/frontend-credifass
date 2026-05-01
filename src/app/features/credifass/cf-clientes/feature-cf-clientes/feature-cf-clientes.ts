import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfClientesStore } from '../data-access/cf-clientes.store';

@Component({
  selector: 'app-feature-cf-clientes',
  imports: [RouterLink, FormsModule, CopPipe],
  templateUrl: './feature-cf-clientes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfClientes implements OnInit {
  protected readonly store = inject(CfClientesStore);
  protected busqueda = signal('');

  ngOnInit(): void {
    this.store.cargarLista();
  }

  buscar(): void {
    this.store.cargarLista({ q: this.busqueda(), page: 1 });
  }
}
