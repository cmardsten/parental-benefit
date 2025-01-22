class ParentalLeaveDays {
   constructor(parentIds, tuplet=1) {
      this.tuplet = tuplet;
      this.double = this.tuplet == 1 ? 60 : Infinity;
      this.parentIds = parentIds;
      this.days = {}
      if (parentIds.length == 1) {
         this.days[parentId] = {
            reserved: 90,
            transferable: {
               high: this.getInitialTransferableHighLevelDays() * 2,
               low: this.getInitialLowLevelDays() * 2
            }
         }
      } else {
         for (const parentId of parentIds) {
            this.days[parentId] = {
               reserved: 90,
               transferable: {
                  high: this.getInitialTransferableHighLevelDays(),
                  low: this.getInitialLowLevelDays()
               }
            }
         }
      }
   }

   initializeFromObject(parentalLeaveDays)
   {
      this.tuplet = parentalLeaveDays.tuplet;
      this.double = parentalLeaveDays.double;
      this.parentIds = parentalLeaveDays.parentIds;
      this.days = parentalLeaveDays.days;
   }

   initializeDaysForParent(parentId, reservedDays, transferableDays) {
      if (!this.days[parentId]) {
        this.days[parentId] = {
          reserved: reservedDays || 90, // Default to 90 if not provided
          transferable: {
            high: transferableDays?.high || 0,
            low: transferableDays?.low || 0,
          },
        };
      }
    }

   /**
    * Adds leave days for a specific type (high or low level) to the transferable or reserved pool
    * 
    * @param {string} parent - The parent to add days for
    * @param {number} days - The number of days to add
    * @param {boolean} isLowLevel - The day type, true for low-level
    */
   addDays(parentId, days, isLowLevel) {
      if (isLowLevel) {
         // Transferable low level days
         if (this.days[parentId].transferable.low < 90) {
            const availableToReserve = 90 - this.days[parentId].transferable.low;
            const daysToReserve = Math.min(days, availableToReserve);
            this.days[parentId].transferable.low += daysToReserve;
         }
      }
      else {
         let remainingDays = days;
         // Reserved days
         if (this.days[parentId].reserved < 90) {
            const availableToReserve = 90 - this.days[parentId].reserved;
            const daysToReserve = Math.min(days, availableToReserve);
            this.days[parentId].reserved += daysToReserve;
            remainingDays -= daysToReserve;
         }
         // Transferable high level days
         if (remainingDays > 0) {
            this.days[parentId].transferable.high += remainingDays;
         }
      }
   }

   /**
    * Deducts leave days from the appropriate pool.
    * @param {string} parentId - The parent to add days for
    * @param {string} days - The number of days to deduct
    * @param {boolean} isLowLevel - The number of days to deduct
    */
   deductDays(parentId, days, isLowLevel) {
      // Subtract a day from the specified parent and day type
      if (isLowLevel) {
         if (this.days[parentId].transferable.low >= days) {
            this.days[parentId].transferable.low -= days;
         }
         else {
            alert("No low days left. You need to transfer days.");
         }
      }
      else {
         if (this.days[parentId].reserved >= days) {
            this.days[parentId].reserved -= days;
         }
         else if (this.days[parentId].transferable.high >= days) {
            this.days[parentId].transferable.high -= days;
         }
      }
   }

   getTotalLowLevelDaysLeft() {
      let totalLowLevelDays = 0;
      for (const parentId in this.days) {
         if (this.days.hasOwnProperty(parentId)) {
            totalLowLevelDays += this.days[parentId].transferable.low;
         }
      }
      return totalLowLevelDays;
   }

   getTotalHighLevelDaysLeft() {
      let totalHighLevelDays = 0;
      for (const parentId in this.days) {
         if (this.days.hasOwnProperty(parentId)) {
            totalHighLevelDays += this.days[parentId].transferable.high + this.days[parentId].reserved;
         }
      }
      return totalHighLevelDays;
   }

   getLowLevelDaysLeft(parentId) {
      let days = 0;
      if (parentId in this.days)
      {
         days = this.days[parentId].transferable.low
      }
      return days;
   }

   getHighLevelDaysLeft(parentId) {
      let days = 0;
      if (parentId in this.days)
      {
         days = this.days[parentId].reserved + this.days[parentId].transferable.high
      }
      return days;
   }

   getInitialTransferableHighLevelDays() {
      const extraDays = (this.tuplet - 1) * 45;
      return 105 + extraDays;
   }

   getInitialLowLevelDays() {
      const extraDays = (this.tuplet - 1) * 45;
      return 45 + extraDays;
   }

   distributeHighLevelDays(days, parentId) {
      const initialTransferableHighLevelDays = this.getInitialTransferableHighLevelDays()
      if (days > initialTransferableHighLevelDays)
      {
         this.days[parentId].transferable.high = initialTransferableHighLevelDays;
         this.days[parentId].reserved = days - initialTransferableHighLevelDays;
      }
      else
      {
         this.days[parentId].transferable.high = days;
         this.days[parentId].reserved = 0;
      }
   }

   setAllDays(days) {
      console.log(days);
      for (const ii in days) {
         let parentId = days[ii].parentId;
         if (this.days.hasOwnProperty(parentId)) {
            this.days[parentId].transferable.low = days[ii].low;
            this.distributeHighLevelDays(days[ii].high, parentId);
         }
      }
    }

    getAllDays() {
      return Object.entries(this.days).map(([parentId]) => ({
        parentId,
        high: this.getHighLevelDaysLeft(parentId),
        low: this.getLowLevelDaysLeft(parentId)
      }));
    }

    getDoubleDaysLeft()
    {
      return this.double;
    }

    setDoubleDaysLeft(doubleDays)
    {
      this.double = doubleDays;
    }

    deductDoubleDays(numberOfDays)
    {
      this.double -= numberOfDays;
    }

    addDoubleDay() {
      this.double++;
   }
}

export { ParentalLeaveDays };