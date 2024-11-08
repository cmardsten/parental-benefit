import { ParentalLeaveDays } from './ParentalLeaveDays';

class Child {
   constructor(name, birthdate, id) {
      this.name = name;
      this.id = id;
      this.birthdate = birthdate;
      this.tuplet = 1;
      this.parentalLeaveDays = new ParentalLeaveDays(this.tuplet);
   }

   tupletify(name) {
      this.name = `${this.name} & ${name}`;
      this.tuplet++;
      this.parentalLeaveDays = new ParentalLeaveDays(this.tuplet);
   }
   
   resetParentalLeaveDays() {
      this.parentalLeaveDays = new ParentalLeaveDays(this.tuplet);
   }
}

export { Child };
