import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { ControllerService } from 'src/app/Presenter/controller.service';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';
import { ThemeControlService } from 'src/app/Presenter/theme-control.service';

/**
 * MemoryField Nodes
 * Each node has a name and an optional list of children.
 */
interface MemoryField {
  name: string;
  children?: MemoryField[];
  address?: number;
}

/** Flat node with expandable and level information */
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

const MEMORY_FIELD:MemoryField[] = [
  {
    name: 'SystemCode',
    children: [],
  },
  {
    name: 'ConstantPool',
    children: [],
  },
  {
    name: "General Memory",
    children:[]
  }
];

@Component({
  selector: 'app-memory-view',
  templateUrl: './memory-view.component.html',
  styleUrls: ['./memory-view.component.css']
})
export class MemoryViewComponent implements OnInit {
  public memory: { [key: number]: number } = {};
  public memoryArr: {address: string, value: number}[] = []
  public headers = ["address", "value"]

  public fontSize: string = "medium";
  public presentationMode: boolean;
  public lightMode = false;

  private memoryFields:MemoryField[] = MEMORY_FIELD;

  preferedValueView: string = '1';

  constructor(
    private presentationController: PresentationControllerService,
    private themeController: ThemeControlService,
    private controller: ControllerService,
    ) {
      this.dataSource.data = this.memoryFields;
     }

  ngOnInit(): void {
    this.presentationController.presentationMode$.subscribe(b => {
      this.presentationMode = b.presentationMode;
    })

    this.presentationController.memoryViewRefresher$.subscribe( result => {
      if(result.bool){
        this.init(result.methodEntries, result.constantEntries, result.generalEntries);
      }
    })

    this.presentationController.memoryUpdate$.subscribe( entry => {
      this.refreshMemoryView(entry.address, entry.value);
    })

    this.themeController.toggleThemeNotifier$.subscribe(
      lightMode => {
        lightMode? this.lightMode = true : this.lightMode = false;
      }
    )
  }

  private init(methodEntries: {name: string, address: number}[], constantEntries: {name: string, address: number}[], generalEntries: {name: string, address: number}[]){
    // reset Fields
    this.memoryFields = MEMORY_FIELD;

    this.memoryFields[0].children = methodEntries;
    this.memoryFields[1].children = constantEntries;
    this.memoryFields[2].children = generalEntries;

    this.dataSource.data = this.memoryFields;
  }

  private refreshMemoryView(address:number, value: number){
    this.memoryFields = this.dataSource.data;
    const updatedEntry = {name: this.controller.dec2hex(address) + " " + value, address: address};

    // update the changed entry in the View
    let index = this.memoryFields[2].children.findIndex(x => x.address === address);
    if (index === -1){
      this.memoryFields[2].children.push(updatedEntry);
    }else{
      this.memoryFields[2].children[index] =  updatedEntry;
    }


    this.dataSource.data = this.memoryFields;

  }






  // Stuff for the Tree:
  private _transformer = (node: MemoryField, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level,
    };
  };

  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: FlatNode) => node.expandable;


}
