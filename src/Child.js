import { ParentalLeaveDays } from './ParentalLeaveDays';

class Child {
   constructor(name, birthdate, id, tuplet, parentalLeaveDays) {
      this.name = name;
      this.id = id;
      this.birthdate = birthdate;
      this.tuplet = tuplet;
      this.parentalLeaveDays = parentalLeaveDays;
   }

   tupletify(name) {
      this.name = `${this.name} & ${name}`;
      this.tuplet++;
      this.parentalLeaveDays = new ParentalLeaveDays(this.tuplet);
   }
   
   resetParentalLeaveDays() {
      this.parentalLeaveDays = new ParentalLeaveDays(
         this.tuplet,
         false,
         false,
         this.parentalLeaveDays.adjustedInitialDays);
   }
}

export { Child };
