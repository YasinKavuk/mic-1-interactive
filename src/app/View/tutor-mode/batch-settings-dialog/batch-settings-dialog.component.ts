import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';


export interface StackPosition {
  index: string;
  value: number;
}

@Component({
  selector: 'app-batch-settings-dialog',
  templateUrl: './batch-settings-dialog.component.html',
  styleUrls: ['./batch-settings-dialog.component.css']
})
export class BatchSettingsDialogComponent implements OnInit {

  public firstStackPosition = { index: "0x00", value: 0 };
  public stackPositions: StackPosition[] = [];
  


  constructor(
    public dialogRef: MatDialogRef<BatchSettingsDialogComponent>
  ) { }


  ngOnInit(): void {
  }

  addStackPosition() {
    let hex = this.dec2hex((this.stackPositions.length + 1) * 4);
    this.stackPositions.push({ index: hex, value: 0 });
  }

  onStackValueChange(index: number, event: any) {
    this.stackPositions[index].value = event.target.value;
  }

  onFirstStackValueChange(event: any){
    this.firstStackPosition.value = event.target.value
  }


  dec2hex(number: number) {
    let num = number;
    let prefix = "0x";
    if (num < 16) {
      prefix = prefix + "0"
    }
    return prefix + num.toString(16).toUpperCase();
  }

  onSave(){

    this.dialogRef.close()
  }


  onExit(){
    this.dialogRef.close();
  }

}

