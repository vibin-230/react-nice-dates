//import colors from "./../styles/colors";
//API CALL for football venues   localhost:3000/api/football/5s

var venues = {
    sport: "football",
    color: "#ffbe43",
    category: ["5'S", "9'S"],
    venues: [
      {
        id: 0,
        venueAverage: 4.2,
        venueName: "TIKI TAKA",
        venueLocation: "T.Nagar",
        venueImage: "http://159.65.146.12/app/turftown/assets/images/venues/TikiTakaTNagar.jpeg",
        venueRating: 432,
        venueDistance: 2,
        venuePrice: 250,
        venueForBook: false,
        exclusive:true,
        new:true,
        latLong: [13.0389622,80.236313],
        featured: [
          {
            type:4,
            zipcode:600017
          },
          {
            type:3,
            zipcode:600018
          },
          {
            type:2,
            zipcode:600019
          },
          {
            type:1,
            zipcode:600020
          }
        ]
      },
      {
        venueName: "WHISTLE",
        venueLocation: "Numgambakkam",
        id: 1,
        venueAverage: 4.2,
        venueImage: "http://159.65.146.12/app/turftown/assets/images/venues/Whistle_football.jpeg",
        // colorOverlay: colors.primaryOp4,
        venueRating: 432,
        venueDistance: 2,
        venuePrice: 250,
        venueForBook: false,
        exclusive:true,
        new:false,
        latLong: [13.0706357,80.2065097],
        featured: [
          {
            type:4,
            zipcode:600006
          },
          {
            type:3,
            zipcode:600008
          },
          {
            type:2,
            zipcode:600031
          },
          {
            type:1,
            zipcode:600034
          }
        ]
      },
      {
        venueName: "CHAOS",
        id: 2,
        venueLocation: "Adyar",
        venueImage: "http://159.65.146.12/app/turftown/assets/images/venues/Chaos.jpeg",
        venueRating: 432,
        venueAverage: 4.2,
        venueDistance: 2,
        venuePrice: 250,
        venueForBook: false,
        exclusive:true,
        new:true,
        latLong: [13.0706357,80.2065097],
        featured: [
          {
            type:4,
            zipcode:600020
          },
          {
            type:3,
            zipcode:600021
          },
          {
            type:2,
            zipcode:600022
          },
          {
            type:1,
            zipcode:600023
          }
        ]
      },
      {
        venueName: "TIKI TAKA ",
        id: 3,
        venueAverage: 4.2,
        venueLocation: "Kilpauk",
        venueImage: "http://159.65.146.12/app/turftown/assets/images/venues/TikiTakaKilpauk.jpeg",
        venueRating: 432,
        venueDistance: 2,
        venuePrice: 250,
        venueForBook: false,
        exclusive:true,
        new:true,
        latLong: [13.0783937,80.2318672],
        featured: [
          {
            type:4,
            zipcode:600010
          },
          {
            type:3,
            zipcode:600030
          },
          {
            type:2,
            zipcode:600031
          },
          {
            type:1,
            zipcode:600039
          }
        ]
      },
      {
        venueName: "TURF 137",
        id: 4,
        venueAverage: 4.2,
        venueLocation: "Velachery",
        venueImage: "http://159.65.146.12/app/turftown/assets/images/venues/Turf137-velachery.jpeg",
        venueRating: 432,
        venueDistance: 2,
        venuePrice: 250,
        venueForBook: false,
        exclusive:false,
        new:true,
        latLong: [12.9968503,80.2141445],
        featured: [
          {
            type:4,
            zipcode:600015
          },
          {
            type:3,
            zipcode:600021
          },
          {
            type:2,
            zipcode:600022
          },
          {
            type:1,
            zipcode:600032
          }
        ]
      },
      {
        venueName: "FUTZORB",
        id: 5,
        venueAverage: 4.2,
        venueLocation: "Besant Nagar",
        venueImage: "http://159.65.146.12/app/turftown/assets/images/venues/Futzorb-besantnagar.jpeg",
        venueRating: 432,
        venueDistance: 2,
        venuePrice: 250,
        venueForBook: false,
        exclusive:false,
        new:false,
        latLong: [13.007441,80.2588354],
        featured: [
          {
            type:4,
            zipcode:600021
          },
          {
            type:3,
            zipcode:600022
          },
          {
            type:2,
            zipcode:600020
          },
          {
            type:1,
            zipcode:600019
          }
        ]
      },
      {
        venueName: "RUSH",
        id: 6,
        venueAverage: 4.2,
        venueLocation: "RA Puram",
        venueImage: "http://159.65.146.12/app/turftown/assets/images/venues/Rush.jpeg",
        venueRating: 432,
        venueDistance: 2,
        venuePrice: 250,
        venueForBook: false,
        exclusive:true,
        new:true,
        latLong: [13.0256759,80.2520045],
        featured: [
          {
            type:4,
            zipcode:600028
          },
          {
            type:3,
            zipcode:600029
          },
          {
            type:2,
            zipcode:600026
          },
          {
            type:1,
            zipcode:600027
          }
        ]
      }
    ]
  }
  
  //API CALL for football venues   localhost:3000/api/football/7s
  
  //  (venues = [
  //   {
  //     id: 0,
  //     venueName: "TIKI TAKA",
  //     venueLocation: "T.Nagar",
  //     venueImage: require("./../assets/images/TikiTakaTNagar.jpg"),
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  //   {
  //     venueName: "WHISTLE",
  //     venueLocation: "Numgambakkam",
  //     id: 1,
  //     venueImage: require("./../assets/images/Whistle_football.jpg"),
  //     colorOverlay: colors.primaryOp4,
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  //   {
  //     venueName: "CHAOS",
  //     id: 2,
  //     venueLocation: "Aadyar",
  //     venueImage: require("./../assets/images/Chaos.jpg"),
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  //   {
  //     venueName: "TIKI TAKA ",
  //     id: 3,
  //     venueLocation: "Kilpauk",
  //     venueImage: require("./../assets/images/TikiTakaKilpauk.jpg"),
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  //   {
  //     venueName: "TURF 137",
  //     id: 4,
  //     venueLocation: "Velachery",
  //     venueImage: require("./../assets/images/Turf137-velachery.jpg"),
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  // ]);
  
  //API CALL for football venues   localhost:3000/api/football/7s
  
  //  (venues = [
  //   {
  //     id: 0,
  //     venueName: "TIKI TAKA",
  //     venueLocation: "T.Nagar",
  //     venueImage: require("./../assets/images/TikiTakaTNagar.jpg"),
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  //   {
  //     venueName: "WHISTLE",
  //     venueLocation: "Numgambakkam",
  //     id: 1,
  //     venueImage: require("./../assets/images/Whistle_football.jpg"),
  //     colorOverlay: colors.primaryOp4,
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  //   {
  //     venueName: "CHAOS",
  //     id: 2,
  //     venueLocation: "Aadyar",
  //     venueImage: require("./../assets/images/Chaos.jpg"),
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  //   {
  //     venueName: "TIKI TAKA ",
  //     id: 3,
  //     venueLocation: "Kilpauk",
  //     venueImage: require("./../assets/images/TikiTakaKilpauk.jpg"),
  //     venueRating: 432,
  //     venueDistance: 2,
  //     venuePrice: 250,
  //     venueForBook: false
  //   },
  // ]);

  module.exports = venues;
  