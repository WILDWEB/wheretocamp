/*global google*/
/*global map*/

var map;
var autocomplete;
var infowindow;
var places;
var markers = [];
var MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';
var hostnameRegexp = new RegExp('^https?://.+?/');

function initMap() {
  
    map = new google.maps.Map(document.getElementById('map'), {
         center: {lat:50.969049, lng:11.1758515},
         zoom: 4.5
         
    });

  // get places auto-complete when user type in location-text-box
  var input = // @type {HTMLInputElement}
    ( document.getElementById('location-text-box'));

  autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  infowindow = new google.maps.InfoWindow({
    content: document.getElementById('info-content')
  });
  
  marker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29),
    draggable: true
  });

  places = new google.maps.places.PlacesService(map);
  
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      return;
    }
	else
	{
      map.panTo(place.geometry.location);
      map.setZoom(15);
      searchForCampsites();
    } 

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17); // Why 17? Because it looks good.
    }
    marker.setIcon( // @type {google.maps.Icon} 
    ({
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(35, 35)
    }));
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''), (place.address_components[1] && place.address_components[1].short_name || ''), (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }

  });
  

  //google.maps.event.addDomListener(window, 'load', initialize);
  
  document.getElementById("submit").addEventListener("click", searchForCampsites);
}


function searchForCampsites() {

 var search = {
          bounds: map.getBounds(),
          types: ['campground'],
		      query: 'camp'
        };

        places.nearbySearch(search, function(results, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            clearResults();
            clearMarkers();
            // Create a marker for each campsite found, and
            // assign a letter of the alphabetic to each marker icon.
            for (var i = 0; i < results.length; i++) {
              var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
              var markerIcon = MARKER_PATH + markerLetter + '.png';
              // Use marker animation to drop the icons incrementally on the map.
              markers[i] = new google.maps.Marker({
                position: results[i].geometry.location,
                animation: google.maps.Animation.DROP,
                icon: markerIcon
              });
              // If the user clicks a hotel marker, show the details of that hotel
              // in an info window.
              markers[i].placeResult = results[i];
              google.maps.event.addListener(markers[i], 'click', showInfoWindow);
              setTimeout(dropMarker(i), i * 100);
              addResult(results[i], i);
            }
          }
        });
}

function clearMarkers() {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i]) {
      markers[i].setMap(null);
    }
  }
  markers = [];
}

function dropMarker(i) {
  return function() {
    markers[i].setMap(map);
  };
}

function addResult(result, i) {
	var results = document.getElementById('results');
	var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
	var markerIcon = MARKER_PATH + markerLetter + '.png';

	var tr = document.createElement('tr');
	tr.style.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
	tr.onclick = function() {
	  google.maps.event.trigger(markers[i], 'click');
	};

	var iconTd = document.createElement('td');
	var nameTd = document.createElement('td');
	var icon = document.createElement('img');
	icon.src = markerIcon;
	icon.setAttribute('class', 'placeIcon');
	icon.setAttribute('className', 'placeIcon');
	var name = document.createTextNode(result.name);
	iconTd.appendChild(icon);
	nameTd.appendChild(name);
	tr.appendChild(iconTd);
	tr.appendChild(nameTd);
	results.appendChild(tr);
}

function clearResults() {
	var results = document.getElementById('results');
	while (results.childNodes[0]) {
	  results.removeChild(results.childNodes[0]);
	}
}

function showInfoWindow() {
	var marker = this;
	places.getDetails({placeId: marker.placeResult.place_id},
	function(place, status) {
	  if (status !== google.maps.places.PlacesServiceStatus.OK) {
	    alert("Can't show Info Window");
		    return;
	  }
	  infowindow.open(map, marker);
	  buildIWContent(place);
	});
}

function buildIWContent(place) {
	document.getElementById('iw-icon').innerHTML = '<img class="hotelIcon" ' + 'src="' + place.icon + '"/>';
	document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url + '">' + place.name + '</a></b>';
	document.getElementById('iw-address').textContent = place.vicinity;

	if (place.formatted_phone_number) {
	  document.getElementById('iw-phone-row').style.display = '';
	  document.getElementById('iw-phone').textContent =
		  place.formatted_phone_number;
	} else {
	  document.getElementById('iw-phone-row').style.display = 'none';
	}

	// Assign a five-star rating to the hotel, using a black star ('&#10029;')
	// to indicate the rating the hotel has earned, and a white star ('&#10025;')
	// for the rating points not achieved.
	if (place.rating) {
	  var ratingHtml = '';
	  for (var i = 0; i < 5; i++) {
		if (place.rating < (i + 0.5)) {
		  ratingHtml += '&#10025;';
		} else {
		  ratingHtml += '&#10029;';
		}
	  document.getElementById('iw-rating-row').style.display = '';
	  document.getElementById('iw-rating').innerHTML = ratingHtml;
	  }
	} else {
	  document.getElementById('iw-rating-row').style.display = 'none';
	}

	// The regexp isolates the first part of the URL (domain plus subdomain)
	// to give a short URL for displaying in the info window.
	if (place.website) {
	  var fullUrl = place.website;
	  var website = hostnameRegexp.exec(place.website);
	  if (website === null) {
		website = 'http://' + place.website + '/';
		fullUrl = website;
	  }
	  document.getElementById('iw-website-row').style.display = '';
	  document.getElementById('iw-website').textContent = website;
	} else {
	  document.getElementById('iw-website-row').style.display = 'none';
	}
	
	var streetViewMap = map.getStreetView();
	 var placeLocation = place.geometry.location;
	 
	document.getElementById('streetview-toggle').addEventListener('click', function(){
	   /*
	    var panviewRequest = {
	      location: placeLocation,
	      preference:google.maps.StreetViewPreference.BEST,
	      source: google.maps.StreetViewSource.OUTDOOR
	    };
	    
	    streetView.getPanorama(panviewRequest, function(panData, status){
	      if (status=== google.maps.StreetViewStatus.OK){
	        streetViewMap.setPosition(panData.location.latLng);
	        streetViewMap.setVisible(true);
	      }
	      else {
	        streetViewMap.setPosition(placeLocation);
	        streetViewMap.setVisible(true);
	      }
	      */
	    streetViewMap.setPosition(placeLocation);
	    streetViewMap.setVisible(true);
	 });
	    
	 // don't think we need this
	 window.place=place;
	    
	 var streetMarker = new google.maps.Marker({
	   position: placeLocation,
	   map: map,
	   title: "Place"
	 });
	    
	 streetMarker.addListener("click", function(ev){
	   console.log("street view switch", ev);
	   streetViewMap.setPosition(ev.latLng);
	   streetViewMap.setVisible(true);
	 });
	
}

function handleReturnData(responseText){
  //var result = responseText.Results[0]
  console.log(responseText);
}