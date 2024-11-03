import { ParentalLeaveDays } from './ParentalLeaveDays';

class Child {
    constructor() {
        this.name = "";
        this.id = -1;
        this.birthdate = new Date().toISOString().substring(0, 10);
        this.parentalLeaveDays = new ParentalLeaveDays();
    }
}

export { Child };
