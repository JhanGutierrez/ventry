import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nestedCellValue',
  pure: true,
})
export class NestedCellValuePipe implements PipeTransform {
  transform(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
