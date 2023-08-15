import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ControllerService } from 'src/app/Presenter/controller.service';


@Component({
  selector: 'app-getting-started-dialog',
  templateUrl: './getting-started-dialog.component.html',
  styleUrls: ['./getting-started-dialog.component.scss']
})

export class GettingStartedDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<GettingStartedDialogComponent>,
    private controller: ControllerService,
  ) { }

  ngOnInit(): void {
  }

  insertDemo(demoCodeOption: string){
    this.controller.setDemoCode(demoCodeOption);
    this.dialogRef.close();
  }

}
