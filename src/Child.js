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

   getDoubleDaysExpiryDate() {
      let expiryDate = new Date(this.birthdate);
      expiryDate.setMonth(expiryDate.getMonth() + 15);
      return expiryDate;
   }
}

export { Child };
