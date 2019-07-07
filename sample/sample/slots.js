let morningSlots = [
  {
    id: 0,
    sId: 12,
    time: "6 AM",
    timeStart: "6",
    timeEnd: "6.30",
    timeValue: 6,
    timeRepresentation: "0600-0630",
    representation: "AM",
    price: 1500,
    toggle: false,
    available: true
  },
  {
    id: 1,
    sId: 13,
    time: "6.30 AM",
    timeStart: "6.30",
    timeEnd: "7",
    timeRepresentation: "0630-0700",
    representation: "AM",
    timeValue: 7,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 2,
    sId: 14,
    time: "7 AM",
    timeStart: "7",
    timeEnd: "7.30",
    timeRepresentation: "0700-0730",
    representation: "AM",
    timeValue: 7,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 3,
    sId: 15,
    timeStart: "7.30",
    timeEnd: "8",
    timeRepresentation: "0730-0800",
    representation: "AM",
    time: "7.30 AM",
    timeValue: 8,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 4,
    sId: 16,
    time: "8 AM",
    timeStart: "8",
    timeRepresentation: "0800-0830",
    timeEnd: "8.30",
    representation: "AM",
    timeValue: 8,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 5,
    sId: 17,
    timeStart: "8.30",
    timeRepresentation: "0830-0900",
    timeEnd: "9",
    representation: "AM",
    time: "8.30 AM",
    timeValue: 9,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 6,
    sId: 18,
    timeStart: "9",
    timeEnd: "9.30",
    timeRepresentation: "0900-0930",
    representation: "AM",
    time: "9 AM",
    timeValue: 9,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 7,
    sId: 19,
    timeStart: "9.30",
    timeEnd: "10",
    timeRepresentation: "0930-1000",
    representation: "AM",
    time: "9.30 AM",
    timeValue: 10,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 8,
    timeStart: "10",
    timeEnd: "10.30",
    timeRepresentation: "1000-1030",
    representation: "AM",
    time: "10 AM",
    timeValue: 10,
    sId: 20,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 9,
    sId: 21,
    timeStart: "10.30",
    timeRepresentation: "1030-1100",
    timeEnd: "11",
    representation: "AM",
    time: "10.30 AM",
    timeValue: 11,
    duration: 30,
    price: 1500,
    available: true,

    toggle: false
  },
  {
    id: 10,
    sId: 22,
    timeStart: "11",
    timeRepresentation: "1100-1130",
    timeEnd: "11.30",
    representation: "AM",
    time: "11 AM",
    timeValue: 11,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 11,
    sId: 23,
    timeRepresentation: "1130-1200",
    timeStart: "11.30",
    timeEnd: "12",
    representation: "PM",
    time: "11.30 AM",
    available: true,
    timeValue: 12,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 12,
    sId: 24,
    timeRepresentation: "1200-1230",
    timeStart: "12",
    timeEnd: "12.30",
    representation: "PM",
    time: "12 PM",
    available: true,
    timeValue: 12,
    duration: 30,
    price: 1500,
    toggle: false
  }
];

let afternoonSlots = [
  {
    id: 0,
    sId: 24,
    timeStart: "12",
    timeEnd: "12.30",
    timeRepresentation: "1200-1230",
    representation: "PM",
    time: "12 PM",
    available: true,
    timeValue: 12,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 1,
    sId: 25,
    timeStart: "12.30",
    timeEnd: "1",
    timeRepresentation: "1230-1300",
    representation: "PM",
    time: "12.30 PM",
    timeValue: 1,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 2,
    sId: 26,
    timeStart: "1",
    timeEnd: "1.30",
    timeRepresentation: "1300-1330",
    representation: "PM",
    time: "1 PM",
    timeValue: 1,
    duration: 30,
    available: true,
    price: 1500,
    toggle: false
  },
  {
    id: 3,
    sId: 27,
    timeRepresentation: "1330-1400",
    timeStart: "1.30",
    timeEnd: "2",
    representation: "PM",
    time: "1.30 PM",
    timeValue: 2,
    duration: 30,
    available: true,
    price: 1500,
    toggle: false
  },
  {
    id: 4,
    sId: 28,
    timeRepresentation: "1400-1430",
    timeStart: "2",
    timeEnd: "2.30",
    representation: "PM",
    time: "2 PM",
    timeValue: 2,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 5,
    sId: 29,
    timeRepresentation: "1430-1500",
    timeStart: "2.30",
    timeEnd: "3",
    representation: "PM",
    time: "2.30 PM",
    timeValue: 3,
    duration: 30,
    available: true,
    price: 1500,
    toggle: false
  },
  {
    id: 6,
    sId: 30,
    timeRepresentation: "1500-1530",
    timeStart: "3",
    timeEnd: "3.30",
    representation: "PM",
    time: "3 PM",
    timeValue: 3,
    duration: 30,
    available: true,
    price: 1500,
    toggle: false
  },
  {
    id: 7,
    sId: 31,
    timeStart: "3.30",
    timeEnd: "4",
    timeRepresentation: "1530-1600",
    representation: "PM",
    time: "3.30 PM",
    timeValue: 4,
    duration: 30,
    available: true,
    price: 1500,
    toggle: false
  },
  {
    id: 8,
    sId: 32,
    timeStart: "4",
    timeEnd: "4.30",
    timeRepresentation: "1600-1630",
    representation: "PM",
    time: "4 PM",
    timeValue: 4,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 9,
    sId: 33,
    timeStart: "4.30",
    timeEnd: "5",
    timeRepresentation: "1630-1700",
    available: true,
    representation: "PM",
    time: "4.30 PM",
    timeValue: 5,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 10,
    sId: 34,
    timeStart: "5",
    timeEnd: "5.30",
    timeRepresentation: "1700-1730",
    representation: "PM",
    time: "5 PM",
    available: true,
    timeValue: 5,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 11,
    sId: 35,
    timeStart: "5.30",
    timeEnd: "6",
    timeRepresentation: "1730-1800",
    representation: "PM",
    time: "5.30 PM",
    available: true,
    timeValue: 6,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 12,
    sId: 36,
    timeStart: "6",
    timeEnd: "6.30",
    timeRepresentation: "1800-1830",
    representation: "PM",
    time: "6 PM",
    timeValue: 6,
    duration: 30,
    available: true,
    price: 1500,
    toggle: false
  }
];

let primeSlots = [
  {
    id: 0,
    timeStart: "6",
    sId: 36,
    timeRepresentation: "1800-1830",
    timeEnd: "6.30",
    available: true,
    representation: "PM",
    time: "6 PM",
    timeValue: 6,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 1,
    timeStart: "6.30",
    sId: 37,
    timeEnd: "7",
    available: true,
    timeRepresentation: "1830-1900",
    representation: "PM",
    time: "6.30 PM",
    timeValue: 7,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 2,
    timeStart: "7",
    sId: 38,
    timeEnd: "7.30",
    timeRepresentation: "1900-1930",
    available: true,
    representation: "PM",
    time: "7 PM",
    timeValue: 7,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 3,
    sId: 39,
    timeStart: "7.30",
    timeEnd: "8",
    timeRepresentation: "1930-2000",
    available: true,
    representation: "PM",
    time: "7.30 PM",
    timeValue: 8,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 4,
    sId: 40,
    timeRepresentation: "2000-2030",
    timeStart: "8",
    timeEnd: "8.30",
    available: true,
    representation: "PM",
    time: "8 PM",
    timeValue: 8,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 5,
    sId: 41,
    timeRepresentation: "2030-2100",
    timeStart: "8.30",
    timeEnd: "9",
    representation: "PM",
    time: "8.30 PM",
    available: true,
    timeValue: 9,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 6,
    sId: 42,
    timeRepresentation: "2100-2130",
    timeStart: "9",
    timeEnd: "9.30",
    representation: "PM",
    available: true,
    time: "9 PM",
    timeValue: 9,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 7,
    sId: 43,
    timeRepresentation: "2130-2200",
    timeStart: "9.30",
    available: true,
    timeEnd: "10",
    representation: "PM",
    time: "9.30 PM",
    timeValue: 10,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 8,
    sId: 44,
    timeStart: "10",
    timeRepresentation: "2200-2230",
    timeEnd: "10.30",
    representation: "PM",
    time: "10 PM",
    timeValue: 10,
    available: true,

    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 9,
    sId: 45,
    timeRepresentation: "2230-2300",
    timeStart: "10.30",
    timeEnd: "11",
    representation: "PM",
    available: true,
    time: "10.30 PM",
    timeValue: 11,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 10,
    sId: 46,
    timeRepresentation: "2300-2330",
    time: "11 PM",
    timeStart: "11.30",
    available: true,
    timeEnd: "11",
    representation: "PM",
    timeValue: 11,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 11,
    sId: 47,
    timeRepresentation: "2330-0000",
    timeStart: "11.30",
    timeEnd: "12",
    representation: "AM",
    time: "11.30 PM",
    timeValue: 12,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 12,
    sId: 48,
    timeStart: "12",
    available: true,
    timeRepresentation: "0000-0030",
    timeEnd: "12.30",
    representation: "AM",
    time: "12 AM",
    timeValue: 12,
    duration: 30,
    price: 1500,
    toggle: false
  }
];

let allNighterSlots = [
  {
    id: 0,
    sId: 0,
    timeStart: "12",
    timeEnd: "12.30",
    timeRepresentation: "0000-0030",
    representation: "AM",
    time: "12 AM",
    timeValue: 12,
    duration: 30,
    available: true,
    price: 1500,
    toggle: false
  },
  {
    id: 1,
    sId: 1,
    timeStart: "12.30",
    timeEnd: "1",
    timeRepresentation: "0030-0100",
    representation: "AM",
    time: "12.30 AM",
    available: true,
    timeValue: 1,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 2,
    sId: 2,
    available: true,
    time: "1 AM",
    timeStart: "1",
    timeRepresentation: "0100-0130",
    timeEnd: "1.30",
    representation: "AM",
    timeValue: 1,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 3,
    sId: 3,
    time: "1.30 AM",
    timeRepresentation: "0130-0200",
    timeStart: "1.30",
    available: true,
    timeEnd: "2",
    representation: "AM",
    timeValue: 2,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 4,
    sId: 4,
    time: "2 AM",
    timeRepresentation: "0200-0230",
    timeStart: "2",
    available: true,
    timeEnd: "2.30",
    representation: "AM",
    timeValue: 2,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 5,
    sId: 5,
    timeRepresentation: "0230-0300",
    timeStart: "2.30",
    time: "2.30 AM",
    timeEnd: "3",
    representation: "AM",
    timeValue: 3,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 6,
    sId: 6,
    timeRepresentation: "0300-0330",
    timeStart: "3",
    timeEnd: "3.30",
    representation: "AM",
    time: "3 AM",
    timeValue: 3,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 7,
    sId: 7,
    timeRepresentation: "0330-0400",
    timeStart: "3.30",
    timeEnd: "4",
    representation: "AM",
    time: "3.30 AM",
    available: true,
    timeValue: 4,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 8,
    sId: 8,
    timeStart: "4",
    timeRepresentation: "0400-0430",
    timeEnd: "4.30",
    representation: "AM",
    time: "4 AM",
    timeValue: 4,
    duration: 30,
    price: 1500,
    available: true,
    toggle: false
  },
  {
    id: 9,
    sId: 9,
    timeRepresentation: "0430-0500",
    timeStart: "4.30",
    timeEnd: "5",
    representation: "AM",
    time: "4.30 AM",
    timeValue: 5,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 10,
    sId: 10,
    timeRepresentation: "0500-0530",
    timeStart: "5",
    timeEnd: "5.30",
    representation: "AM",
    time: "5 AM",
    timeValue: 5,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 11,
    sId: 11,
    timeRepresentation: "0530-0600",
    timeStart: "5.30",
    timeEnd: "6",
    representation: "AM",
    time: "5.30 AM",
    timeValue: 6,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  },
  {
    id: 12,
    sId: 12,
    timeRepresentation: "0600-0630",
    timeStart: "6",
    timeEnd: "6.30",
    representation: "AM",
    time: "6 AM",
    timeValue: 6,
    available: true,
    duration: 30,
    price: 1500,
    toggle: false
  }
];

module.exports =  (slots = [
  {
    text: "ALL NIGHTERS",
    id: 0,
    item: allNighterSlots
  },
  {
    text: "MORNING",
    id: 1,
    item: morningSlots
  },
  {
    text: "AFTERNOON",
    id: 2,
    item: afternoonSlots
  },
  {
    text: "PRIME TIME",
    id: 3,
    item: primeSlots
  }
]);

// Programmatic way to generate data
// const _itemObjectGenerator = (a,b,c,d,e,f) => (
//   {
//     id: a,
//     time: b,
//     name: c,
//     code: d,
//     price: e,
//     toggle: f
//   }
// )

// const _itemArrayGenerator = (id,time,code,price,toggle) => {
//   let itemArray = []
//   let name = `${time}:00 - ${time}:30`
//   for (let i = 0; i < 12; i+=2) {
//     timeNumber = parseInt(time.slice(0,2)).toString()
//     itemArray.push(_itemObjectGenerator(id, timeNumber, name, code, price, toggle))
//     id += 1 // id updates by 1 each time
//     if (time.length === 1) {
//       time += '.30'
//     } else {
//       time = (parseInt(time.slice(0,2))+1).toString()
//     }
//     if (timeNumber < 9) {
//       name = `0${timeNumber}:30 - 0${timeNumber+1}:00`
//     } else if (timeNumber === 9) {
//       name = `09:30 - 10:00`
//     } else {
//       name = `${timeNumber}:30 - ${timeNumber+1}:00`
//     }
//     itemArray.push(_itemObjectGenerator(id, timeNumber, name, code, price, toggle))
//     let name = `${time}:00 - ${time}:30`
//   }
//   return(itemArray)
// }

// // Console to check array
// morningSlots.forEach(function(element){
//     console.log(element)
// })
