import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { AuthApiService } from '../data-access/auth-api';

@Component({
  selector: 'app-feature-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './feature-forgot-password.html',
  styleUrl: './feature-forgot-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureForgotPassword {
  private readonly api = inject(AuthApiService);

  protected readonly loading = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.api.forgotPassword(this.form.getRawValue().email);
      this.enviado.set(true);
    } catch {
      this.error.set('No pudimos enviar el correo. Intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
