import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AppLoggerService } from './app-logger';

describe('AppLoggerService', () => {
  let service: AppLoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppLoggerService);
  });

  it('CA-01: se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('CA-02: debug() llama console.debug en entorno no productivo', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    service.debug('test_event', { key: 'value' });
    expect(spy).toHaveBeenCalledWith('[DEBUG] test_event', { key: 'value' });
    spy.mockRestore();
  });

  it('CA-03: debug() sin contexto llama console.debug con string vacío', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    service.debug('test_event');
    expect(spy).toHaveBeenCalledWith('[DEBUG] test_event', '');
    spy.mockRestore();
  });

  it('CA-04: info() llama console.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    service.info('info_event', { data: 1 });
    expect(spy).toHaveBeenCalledWith('[INFO] info_event', { data: 1 });
    spy.mockRestore();
  });

  it('CA-05: warn() siempre llama console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    service.warn('warn_event');
    expect(spy).toHaveBeenCalledWith('[WARN] warn_event', '');
    spy.mockRestore();
  });

  it('CA-06: error() siempre llama console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    service.error('api_error', { statusCode: 500 });
    expect(spy).toHaveBeenCalledWith('[ERROR] api_error', { statusCode: 500 });
    spy.mockRestore();
  });
});
