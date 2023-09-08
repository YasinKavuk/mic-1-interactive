import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ControllerService } from 'src/app/Presenter/controller.service';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.css']
})
export class ImportDialogComponent implements OnInit {
  files:File[] = [];

  constructor(
    private dialogRef: MatDialogRef<ImportDialogComponent>,
    private controller: ControllerService,
  ) { }

  ngOnInit(): void {
  }

  onSelect(event: any){
    console.log(event)
    this.files.push(...event.addedFiles)
  }

  onRemove(event: any){
    this.files.splice(this.files.indexOf(event),1)
  }

  onAddFiles(){
    this.controller.importFiles(this.files);
  }

}
