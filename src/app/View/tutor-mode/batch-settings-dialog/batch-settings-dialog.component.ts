import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ControllerService } from 'src/app/Presenter/controller.service';


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

  public firstStackPosition: StackPosition = { index: "0x00", value: 0 };
  public stackPositions: StackPosition[] = [];
  public testTos = false;
  public testStack = false;
  public tosValue = "0";



  constructor(
    public dialogRef: MatDialogRef<BatchSettingsDialogComponent>,
    private controller: ControllerService,
  ) { }


  ngOnInit(): void {
    const settings = this.controller.getTestSettings();
    
    this.firstStackPosition = { index: "0x00", value: settings.stackPositions[0] };
    this.testTos = settings.testTos;
    this.testStack = settings.testStack;
    this.tosValue = settings.tosValue.toString();

    for (let i = 1; i < settings.stackPositions.length; i++){
      this.stackPositions.push( {index: this.dec2hex(i*4), value: settings.stackPositions[i] });
    }


  }

  addStackPosition() {
    let hex = this.dec2hex((this.stackPositions.length + 1) * 4);
    this.stackPositions.push({ index: hex, value: 0 });
  }

  onStackValueChange(index: number, event: any) {
    this.stackPositions[index].value = parseInt(event.target.value);
  }

  onFirstStackValueChange(event: any) {
    this.firstStackPosition.value = parseInt(event.target.value);
  }

  onTosValueChange(event: any) {
    this.tosValue = event.target.value;
  }

  toggleTestTOS(testTos: boolean) {
    this.testTos = !testTos;
  }

  toggleTestStack(testStack: boolean) {
    this.testStack = !testStack;
  }


  dec2hex(number: number): string {
    let num = number;
    let prefix = "0x";
    if (num < 16) {
      prefix = prefix + "0"
    }
    return prefix + num.toString(16).toUpperCase();
  }

  onSave() {
    let stackValues = [this.firstStackPosition].concat(this.stackPositions).map( x => x.value);

    this.controller.setTestSettings(this.testTos, parseInt(this.tosValue), this.testStack, stackValues);
    this.dialogRef.close()
  }


  onExit() {
    this.dialogRef.close();
  }

}

