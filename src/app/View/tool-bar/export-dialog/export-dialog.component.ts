import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ControllerService } from 'src/app/Presenter/controller.service';
import { minOneCheckedValidator } from 'src/app/minOneCheckedValidator';

@Component({
  selector: 'app-export-dialog',
  templateUrl: './export-dialog.component.html',
  styleUrls: ['./export-dialog.component.css']
})
export class ExportDialogComponent implements OnInit {
  exportForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    checkboxes: new FormGroup({
      macroBool: new FormControl(true),
      microBool: new FormControl(true),
    }, minOneCheckedValidator()),
    comment: new FormControl('')
  })

  checkboxesValidation: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ExportDialogComponent>,
    private controller: ControllerService,
  ) { }

  ngOnInit(): void {
  }

  onExport(){
    if(this.exportForm.valid){
      this.controller.export(this.exportForm.value.name, this.exportForm.value.checkboxes.macroBool, this.exportForm.value.checkboxes.microBool, this.exportForm.value.comment);
    }
  }
}
