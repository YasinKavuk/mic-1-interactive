import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

export function minOneCheckedValidator(): ValidatorFn {
  return function validate(abstractControl:AbstractControl){
    var checked = 0;
    var formGroup = abstractControl as FormGroup;

    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);

      if (control.value === true) {
        checked++;
      }
    });

    if(checked < 1){
      return{
        minOneChecked: true,
      };
    }

    return null;
  };
}