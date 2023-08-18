let contractTable = base.getTable("contract");
let records = await contractTable.selectRecordsAsync();

let currentTime = new Date();
let oneYearFromNow = new Date();
oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

function toYearMonth(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

let updates = [];
for (let record of records.records) {
  let contractStartDate = record.getCellValue("contract_start_date");
  let cancelDate = record.getCellValue("cancel_date");
  let paymentTypeInteger = record.getCellValue("payment_type_integer");

  if (contractStartDate && paymentTypeInteger) {
    let dates = [];
    let currentDate = new Date(contractStartDate);

    let contractCancelDate = cancelDate ? new Date(cancelDate) : null;

    while (true) {
      let currentDateString = toYearMonth(currentDate);

      if (currentDateString >= toYearMonth(currentTime)) {
        if (!dates.includes(currentDateString)) {
          dates.push(currentDateString);
        }
      }

      currentDate.setMonth(currentDate.getMonth() + paymentTypeInteger);

      if (toYearMonth(currentDate) > toYearMonth(oneYearFromNow)) {
        break;
      }
      
      if (contractCancelDate && toYearMonth(currentDate) > toYearMonth(contractCancelDate)) {
        if (toYearMonth(contractCancelDate) === toYearMonth(currentDate)) {
          if (!dates.includes(toYearMonth(contractCancelDate))) {
            dates.push(toYearMonth(contractCancelDate));
          }
        }
        break;
      }
    }

    updates.push({
      id: record.id,
      fields: {
        "cf_script": dates.join(", "),
      },
    });

    // If updates length is 50, update the records in a batch and clear updates
    if (updates.length === 50) {
      await contractTable.updateRecordsAsync(updates);
      updates = [];
    }
  }
}

// If there are any remaining records in updates, update them
if (updates.length > 0) {
  await contractTable.updateRecordsAsync(updates);
}