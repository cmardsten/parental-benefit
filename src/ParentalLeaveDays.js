class ParentalLeaveDays {
   constructor(tuplet) {
      const extraDays = (tuplet - 1) * 45;
      this.mother = {
         reserved: 90,
         transferable: { high: 105 + extraDays, low: 45 + extraDays }
      }
      this.father = {
         reserved: 90,
         transferable: { high: 105 + extraDays, low: 45 + extraDays }
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
   getHighLevelDaysLeft(parent, type) {
      return this[parent].reserved + this[parent].transferable.high;
   }
}

export { ParentalLeaveDays };