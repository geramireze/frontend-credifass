import { CopPipe } from './cop-pipe';

describe('CopPipe', () => {
  let pipe: CopPipe;

  beforeEach(() => {
    pipe = new CopPipe();
  });

  it('formatea número entero con separadores de miles', () => {
    expect(pipe.transform(75000)).toBe('$ 75.000');
  });

  it('formatea string numérico', () => {
    expect(pipe.transform('250000')).toBe('$ 250.000');
  });

  it('redondea decimales', () => {
    expect(pipe.transform(1250.75)).toBe('$ 1.251');
  });

  it('retorna guión para null', () => {
    expect(pipe.transform(null)).toBe('$ -');
  });

  it('retorna guión para undefined', () => {
    expect(pipe.transform(undefined)).toBe('$ -');
  });

  it('retorna guión para string vacío', () => {
    expect(pipe.transform('')).toBe('$ -');
  });

  it('retorna guión para NaN string', () => {
    expect(pipe.transform('abc')).toBe('$ -');
  });
});
