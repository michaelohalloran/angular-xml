import { Component, OnInit } from "@angular/core";

@Component({
	selector: "app-bug",
	templateUrl: "./bug.component.html",
	styleUrls: [ "./bug.component.css" ]
})
export class BugComponent implements OnInit {
	defaultText1 = "Hello";
	defaultText2 = "world";
	count = 0;
	obj1Count = 0;
	obj2Count = 0;
	changedCounter = 0;

	constructor() {}

	ngOnInit() {}

	incCount() {
		this.count++;
	}

	incTextCount(evt) {
		if (evt.target.name === "observedObject1") {
			this.obj1Count++;
			this.changedCounter = this.obj1Count;
		} else {
			this.obj2Count++;
			this.changedCounter = this.obj2Count;
		}
	}
}
