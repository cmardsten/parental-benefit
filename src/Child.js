import { ParentalLeaveDays } from './ParentalLeaveDays';

class Child {
   constructor() {
      this.name = "";
      this.id = -1;
      this.birthdate = new Date().toISOString().substring(0, 10);
      this.tuplet = 1;
      this.parentalLeaveDays = new ParentalLeaveDays(this.tuplet);
   }

   tupletify(name) {
      this.name = `${this.name} & ${name}`;
      this.tuplet++;
      this.parentalLeaveDays = new ParentalLeaveDays(this.tuplet);
   }

}

export { Child };
