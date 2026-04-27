import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../data-access/auth.store';
import { AppIconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-feature-login',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './feature-login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureLogin {
  protected readonly store        = inject(AuthStore);
  protected readonly verPassword  = signal(false);
  protected readonly recordarme   = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    await this.store.login(this.form.getRawValue(), this.recordarme());
  }
}
