import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { FeatureLogin } from './feature-login';
import { AuthStore } from '../data-access/auth.store';

describe('FeatureLogin', () => {
  let component: FeatureLogin;
  let fixture: ComponentFixture<FeatureLogin>;
  const loginMock = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [FeatureLogin],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: AuthStore,
          useValue: {
            login: loginMock,
            loading: vi.fn().mockReturnValue(false),
            error: vi.fn().mockReturnValue(null),
            estaAutenticado: vi.fn().mockReturnValue(false),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('CA-01: muestra el formulario de inicio de sesión', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
  });

  it('CA-02: el botón submit existe', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();
  });

  it('CA-03: onSubmit() con formulario inválido marca campos como tocados y no llama store', async () => {
    fixture.detectChanges();
    // Access protected method via type assertion
    await (component as unknown as { onSubmit(): Promise<void> }).onSubmit();
    expect(loginMock).not.toHaveBeenCalled();
    expect(component['form'].touched || component['form'].controls['email'].touched).toBe(true);
  });

  it('CA-04: onSubmit() con formulario válido llama store.login', async () => {
    loginMock.mockResolvedValue(undefined);
    fixture.detectChanges();
    component['form'].setValue({ email: 'test@test.com', password: 'Password1' });
    await (component as unknown as { onSubmit(): Promise<void> }).onSubmit();
    expect(loginMock).toHaveBeenCalledWith({ email: 'test@test.com', password: 'Password1' }, false);
  });
});
