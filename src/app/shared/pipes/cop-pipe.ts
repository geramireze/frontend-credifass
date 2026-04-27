import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cop',
})
export class CopPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '$ -';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$ -';
    return '$ ' + Math.round(num).toLocaleString('es-CO');
  }
}
