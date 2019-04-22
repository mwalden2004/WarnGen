const StaticMaps = require("staticmaps");
const fetch = require("fetch");
const options = {
  width: 600,
  height: 400
};

/*
Welcome to the party!
One second I'll be righht back.

*/
const sites = require("./sites.json");
        jid = 'USERNAME SENT FROM EMAIL@nwws-oi.weather.gov',
        room_jid = 'nwws@conference.nwws-oi.weather.gov',
        room_nick = 'bobiscool'

const {client, xml} = require('@xmpp/client')
 const mysql = require('mysql2');
 
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'test',
  password: '',
  database: 'weatherdb'
});
const xmpp = client({
  service: 'nwws-oi.weather.gov',
  domain: 'nwws-oi.weather.gov',
  username: 'XMPP USERNAME EHRE FROM EMAIL',
  password: 'PASSWORD FORM EMAIIL',
}).setMaxListeners(0);
 
xmpp.on('error', err => {
  console.error('❌', err.toString())
})


function distanceFunction(lat1, lon1, lat2, lon2) {
  var radlat1 = Math.PI * lat1 / 180
  var radlat2 = Math.PI * lat2 / 180
  var theta = lon1 - lon2
  var radtheta = Math.PI * theta / 180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist)
  dist = dist * 180 / Math.PI
  dist = dist * 60 * 1.1515
  return dist
}


function parsewmo(msg,attrs){
	try{
  const awipsid = attrs.awipsid;
  const id = attrs.id;
  const ttaaii=attrs.ttaaii;
  const station=attrs.station;
  const issue=attrs.issue;
    const message=unescape(msg);
    const testregex = new RegExp('.\....\.....\...\..\.....\.............-............');
	if (message.match(testregex)){
    const awips = message.match(testregex)[0];
    const split = awips.split(".")
	if (split.length >= 5){
    let ret = {

    }
    const LATLON = message.indexOf("LAT...LON ")
    const TIMEMOTLOC = message.indexOf("TIME...MOT...LOC")
    const times = split[6].split("-");
    const beggining = times[0]
    const ending = times[1];
    if (split[0] == "O"){
		const map = new StaticMaps(options);
        if (split[1] == "NEW" || split[1] == "CON"){
            if (split[3] == "TO"){
                if (split[4] == "W"){
                    const begtime = "20" + beggining.substring(0, 2) + "-" + beggining.substring(2, 4) + "-" + beggining.substring(4, 6) + "T" + beggining.substring(7,9) + ":" + beggining.substring(9, 11) + ":00";
                    const endtime = "20" + ending.substring(0, 2) + "-" + ending.substring(2, 4) + "-" + ending.substring(4, 6) + "T" + ending.substring(7, 9) + ":" + ending.substring(9, 11) + ":00";
                    const startdate = new Date(begtime);
                    const enddate = new Date(endtime);
                    const locations = unescape(message.substring(LATLON,TIMEMOTLOC));
                    const locSplit = locations.split(" ");
                    locSplit.splice(0,2);
                    let newLocations=[];
                    locSplit.forEach(on=>{
                        if (on == ""){
                        }else{
                            newLocations.push(on.replace("\n", ""))
                        }
                    })
                    const oldLocations = newLocations;
                    newLocations=[];
                    for (let i = 0; i < oldLocations.length; i=eval(i+"+2")) {
                        if (oldLocations[i] && oldLocations[eval(i+"+1")]){
                        let lat=oldLocations[i];
                        let long=oldLocations[eval(i + "+1")];
                        lat=lat.substring(0,2)+"."+lat.substring(2,4);
                        long = long.substring(0, 2) + "." + long.substring(2,4);
                        lat=-lat;
                        newLocations.push([lat, long])
                        }
                    }
/*
                    let lat = oldLocations[oldLocations.length-1];
                    let long = oldLocations[oldLocations.length];
                    lat = lat.substring(0, 2) + "." + lat.substring(2, 4);
                    long = long.substring(0, 2) + "." + long.substring(2, 4);
                    lat = -lat;
                    newLocations.push([lat, long])
*/					
					fetch.fetchUrl(`https://api.weather.gov/alerts?point=${newLocations[0][1]},${newLocations[0][0]}&point=${newLocations[1][1]},${newLocations[1][0]}&point=${newLocations[2][1]},${newLocations[2][0]}&event=Tornado Warning`,[],function(er,meta,body){
						const info = body.toString();
						const parse = JSON.parse(info)
						console.log(parse)
						if (parse.features[0]){
							const polygon = {
								coords: parse.features[0].geometry.coordinates[0],
								color: '#FF0000',
								opacity: 0.5,
								width: 3
							};

							map.addPolygon(polygon);
							
							sites.features.forEach(function(site){
								const id = site.properties.siteID;
								const name = site.properties.siteName;
								const type = site.properties.radarType;
								const coords = site.geometry.coordinates
								
								const text = {
									coord: coords,
									text: id+" "+name+" "+type,
									size: 14,
									width: 1,
									fill: "#000000",
									color: "#ffffff",
									font: "Calibri"
                  };
                  

								 
								  map.addText(text);
              })
              let distance = 10000;
              let store = "";
              for (let i=0; i==site.features.length; i++){
                  let fea = site.features[i];
                  let test = distanceFunction(parse.features[0].geometry.coordinates[0][0][0], parse.features[0].geometry.coordinates[0][0][1], fea.geometry.coordinates[0], fea.geometry.coordinates[0])
                  if (distance > test) {
                    distance = test;
                    store = sites.features[i]
                  }
              }

							console.log("TORNADO WARNING ISSUED")
							console.log(begtime+" - "+endtime)

							const zoom = 8;
							const center = parse.features[0].geometry.coordinates[0][0];
							
							map.render(center, zoom)
							.then(() => map.image.save("./images/tor-"+awipsid+"-"+id+"-"+split[1]+".png"))  
							.then(() => {})
							.catch(function(err) {console.log(err)});
						}
					});
                }
            }
            if (split[3] == "SV"){
                if (split[4] == "W"){
                    const begtime = "20" + beggining.substring(0, 2) + "-" + beggining.substring(2, 4) + "-" + beggining.substring(4, 6) + "T" + beggining.substring(7,9) + ":" + beggining.substring(9, 11) + ":00";
                    const endtime = "20" + ending.substring(0, 2) + "-" + ending.substring(2, 4) + "-" + ending.substring(4, 6) + "T" + ending.substring(7, 9) + ":" + ending.substring(9, 11) + ":00";
                    const startdate = new Date(begtime);
                    const enddate = new Date(endtime);
                    const locations = unescape(message.substring(LATLON,TIMEMOTLOC));
                    const locSplit = locations.split(" ");
                    locSplit.splice(0,2);
                    let newLocations=[];
                    locSplit.forEach(on=>{
                        if (on == ""){
                        }else{
                            newLocations.push(on.replace("\n", ""))
                        }
                    })
                    const oldLocations = newLocations;
                    newLocations=[];
                    for (let i = 0; i < oldLocations.length; i=eval(i+"+2")) {
                        if (oldLocations[i] && oldLocations[eval(i+"+1")]){
                        let lat=oldLocations[i];
                        let long=oldLocations[eval(i + "+1")];
                        lat=lat.substring(0,2)+"."+lat.substring(2,4);
                        long = long.substring(0, 2) + "." + long.substring(2,4);
                        lat=-lat;
                        newLocations.push([lat, long])
                        }
                    }/*

                    let lat = oldLocations[0];
                    let long = oldLocations[eval(0 + "+1")];
                    lat = lat.substring(0, 2) + "." + lat.substring(2, 4);
                    long = long.substring(0, 2) + "." + long.substring(2, 4);
                    lat = -lat;
                    newLocations.push([lat, long])*/
					fetch.fetchUrl(`https://api.weather.gov/alerts?point=${newLocations[0][1]},${newLocations[0][0]}&point=${newLocations[1][1]},${newLocations[1][0]}&point=${newLocations[2][1]},${newLocations[2][0]}&event=Severe Thunderstorm Warning`,[],function(er,meta,body){
						const info = body.toString();
						const parse = JSON.parse(info)
						console.log(parse)
						if (parse.features[0]){
							const polygon = {
								coords: parse.features[0].geometry.coordinates[0],
								color: '#FFA500',
								opacity: 0.5,
								width: 3
							};

							map.addPolygon(polygon);
							
							
							
							
							sites.features.forEach(function(site){
								const id = site.properties.siteID;
								const name = site.properties.siteName;
								const type = site.properties.radarType;
								const coords = site.geometry.coordinates
								
								const text = {
									coord: coords,
									text: id+" "+name+" "+type,
									size: 14,
									width: 1,
									fill: "#000000",
									color: "#ffffff",
									font: "Calibri"
								  };
								 
								  map.addText(text);
							})

							console.log("SEVERE THUNDERSTORM WARNING ISSUED")
							console.log(begtime+" - "+endtime)

							const zoom = 8;
							const center = parse.features[0].geometry.coordinates[0][0];
							
							map.render(center, zoom)
							.then(() => map.image.save("./images/sv-"+awipsid+"-"+id+"-"+split[1]+".png"))  
							.then(() => {})
						}
					})
                }
            }
        }
    }
	}
	}
	}catch(err){
	}
}

function parse(stanz){
	const x = stanz.getChild('x');
	if (x.children){
	const msg = x.children[0];
  const attrs = x.attrs;
  if (msg&&attrs){
  const awipsid = attrs.awipsid;
  const id = attrs.id;
  const ttaaii=attrs.ttaaii;
  const station=attrs.station;
  const issue=attrs.issue;
  if (awipsid){
    parsewmo(msg,attrs)
  }
	connection.execute("INSERT INTO `events` (eventjson) VALUES (?)", [JSON.stringify(stanz)], function(err,data,fields){
	})
  }
	}
}
 
xmpp.on('stanza', async stanza => {
  if (stanza.is('message')) {
	  parse(stanza)
  }
})
 
xmpp.on('online', address => {
  const newxml = xml('presence', { to: room_jid +'/' + room_nick}, { xmlns: 'http://jabber.org/protocol/muc' });
  xmpp.send(newxml)
})
 /*
// Debug
xmpp.on('status', status => {
  console.debug('🛈', 'status', status)
})
xmpp.on('input', input => {
  console.debug('⮈', input)
})
xmpp.on('output', output => {
  console.debug('⮊', output)
})*/
 
xmpp.start().catch(console.error)