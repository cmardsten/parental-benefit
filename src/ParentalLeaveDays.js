class ParentalLeaveDays {
   constructor(tuplet, mother=false, father=false, adjustedInitialDays=false) {
      const extraDays = (tuplet - 1) * 45;
      if (mother)
      {
         this.mother = mother;
      }
      else
      {
         this.mother = {
            reserved: 90,
            transferable: { high: 105 + extraDays, low: 45 + extraDays }
         }
      }
      if (father)
      {
         this.father = father;
      }
      else
      {
         this.father = {
            reserved: 90,
            transferable: { high: 105 + extraDays, low: 45 + extraDays }
         }
      }
      if (adjustedInitialDays)
      {
         this.adjustedInitialDays = adjustedInitialDays;
         this.adjustForAdjustedInitialDays(this.adjustedInitialDays.father, 'father', this.tuplet);
         this.adjustForAdjustedInitialDays(this.adjustedInitialDays.mother, 'mother', this.tuplet);
      }
      else
      {
         this.adjustedInitialDays = {
            mother: {
               high: this.getHighLevelDaysLeft('mother'),
               low: this.getLowLevelDaysLeft('mother')
            },
            father: {
               high: this.getHighLevelDaysLeft('father'),
               low: this.getLowLevelDaysLeft('father')
            }
         }
      }
   }

   /**
    * Adds leave days for a specific type (high or low level) to the transferable or reserved pool
    * 
    * @param {string} parent - The parent to add days for
    * @param {number} days - The number of days to add
    * @param {boolean} isLowLevel - The day type, true for low-level
    */
   addDays(parent, days, isLowLevel) {
      if (isLowLevel) {
         // Transferable low level days
         if (this[parent].transferable.low < 90) {
            const availableToReserve = 90 - this[parent].transferable.low;
            const daysToReserve = Math.min(days, availableToReserve);
            this[parent].transferable.low += daysToReserve;
         }
      }
      else {
         let remainingDays = days;
         // Reserved days
         if (this[parent].reserved < 90) {
            const availableToReserve = 90 - this[parent].reserved;
            const daysToReserve = Math.min(days, availableToReserve);
            this[parent].reserved += daysToReserve;
            remainingDays -= daysToReserve;
         }
         // Transferable high level days
         if (remainingDays > 0) {
            this[parent].transferable.high += remainingDays;
         }
      }
   }

   /**
    * Deducts leave days from the appropriate pool.
    * @param {string} parent - The parent to add days for
    * @param {string} days - The number of days to deduct
    * @param {boolean} isLowLevel - The number of days to deduct
    */
   deductDays(parent, days, isLowLevel) {
      // Subtract a day from the specified parent and day type
      if (isLowLevel) {
         if (this[parent].transferable.low >= days) {
            this[parent].transferable.low -= days;
         }
         else {
            alert("No low days left. You need to transfer days.");
         }
      }
      else {
         if (this[parent].reserved >= days) {
            this[parent].reserved -= days;
         }
         else if (this[parent].transferable.high >= days) {
            this[parent].transferable.high -= days;
         }
      }
   }

   /**
    * Gets the total days left for a specific type
    * @param {string} parent - The parent to calculate days left for
    * @returns {number} Total days left of the specified type
    */
   getLowLevelDaysLeft(parent) {
      return this[parent].transferable.low;
   }

   /**
    * Gets the total days left for a specific type
    * @param {string} parent - The parent to calculate days left for
    * @returns {number} Total days left of the specified type
    */
   getHighLevelDaysLeft(parent) {
      return this[parent].reserved + this[parent].transferable.high;
   }

   getInitialLowLevelDays(tuplet) {
      const extraDays = (tuplet - 1) * 45;
      return 45 + extraDays;
   }


   getInitialTransferableHighLevelDays(tuplet) {
      const extraDays = (tuplet - 1) * 45;
      return 105 + extraDays;
   }

   getInitialReservedHighLevelDays() {
      return 90;
   }

   /**
    * Adjust number of days left, depending on initial days current days left
    * @param {adjustedInitialDays} adjustedInitialDays - An object with initial high and low 
    *    level days for the father and mother respectively.
    */
   adjustForAdjustedInitialDays(adjustedInitialDays, parent, tuplet) {
      this[parent].transferable.low = adjustedInitialDays.low;
      const initialTransferableHighLevelDays = this.getInitialTransferableHighLevelDays(tuplet)
      if (adjustedInitialDays.high > initialTransferableHighLevelDays)
      {
         this[parent].transferable.high = initialTransferableHighLevelDays;
         this[parent].reserved = adjustedInitialDays.high - initialTransferableHighLevelDays;
      }
      else
      {
         this[parent].transferable.high = adjustedInitialDays.high;
         this[parent].reserved = 0;
      }
   }

   setAdjustedInitialDays(parent, highLevelDays, lowLevelDays) {
      this.adjustedInitialDays[parent].highLevelDays = highLevelDays;
      this.adjustedInitialDays[parent].lowLevelDays = lowLevelDays;
      this.adjustForAdjustedInitialDays(this.adjustedInitialDays[parent], parent, this.tuplet);
    }

    getAdjustedInitialDays() {
      if (this.adjustedInitialDays)
      {
         return this.adjustedInitialDays;
      }
      else
      {
         return {}
      }
    }
}

export { ParentalLeaveDays };