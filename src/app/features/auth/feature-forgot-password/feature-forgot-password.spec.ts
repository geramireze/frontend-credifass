import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { FeatureForgotPassword } from './feature-forgot-password';
import { AuthApiService } from '../data-access/auth-api';

describe('FeatureForgotPassword', () => {
  let component: FeatureForgotPassword;
  let fixture: ComponentFixture<FeatureForgotPassword>;
  const forgotPasswordMock = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [FeatureForgotPassword],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthApiService, useValue: { forgotPassword: forgotPasswordMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureForgotPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('CA-01: muestra el formulario de recuperación de contraseña', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('CA-02: onSubmit() con email vacío no llama API', async () => {
    fixture.detectChanges();
    await (component as unknown as { onSubmit(): Promise<void> }).onSubmit();
    expect(forgotPasswordMock).not.toHaveBeenCalled();
  });

  it('CA-03: onSubmit() con email válido llama API y marca enviado=true', async () => {
    forgotPasswordMock.mockResolvedValue({ message: 'ok' });
    fixture.detectChanges();
    component['form'].setValue({ email: 'test@test.com' });
    await (component as unknown as { onSubmit(): Promise<void> }).onSubmit();
    expect(forgotPasswordMock).toHaveBeenCalledWith('test@test.com');
    expect(component['enviado']()).toBe(true);
    expect(component['loading']()).toBe(false);
  });

  it('CA-04: onSubmit() error guarda mensaje de error y pone loading=false', async () => {
    forgotPasswordMock.mockRejectedValue(new Error('network'));
    fixture.detectChanges();
    component['form'].setValue({ email: 'test@test.com' });
    await (component as unknown as { onSubmit(): Promise<void> }).onSubmit();
    expect(component['error']()).toBe('No pudimos enviar el correo. Intenta de nuevo.');
    expect(component['loading']()).toBe(false);
  });
});
