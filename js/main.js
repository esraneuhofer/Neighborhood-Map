var map;
var markers=[];

//Foursquare Information for Api Call
var clientID="AZYB5IEK50AQCSPHVWKLS0YLU5PQMY2DJGBYEAGIEK2JMXWP";
var clientSecret="T1UPSXQ3PJ2PFQ3FY5RQYRZBDP4DBUWFKUQDGXUCYPSDJSIJ";
var date =20161016;

//Locations for Markers on Map
var locationsMarker = [{title: 'Börse Frankfurt', location: {lat: 50.115270, lng: 8.67771}},
    {title: 'Europäische Zentralbank (EZB)', location: {lat: 50.110266, lng: 8.701761}},
    {title: 'Oper Frankfurt', location: {lat: 50.108753, lng: 8.673012}},
    {title: 'Schauspiel Frankfurt', location: {lat: 50.110922,lng: 8.682127}},
    {title: 'Frankfurt School of Finance & Management', location: {lat: 50.109789, lng: 8.697420}}];

//Stylesettings GoogleMap
var styles = [{
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#444444"}]
}, {"featureType": "landscape", "elementType": "all", "stylers": [{"color": "#f2f2f2"}]}, {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [{"visibility": "off"}]
}, {
    "featureType": "road",
    "elementType": "all",
    "stylers": [{"saturation": -100}, {"lightness": 45}]
}, {
    "featureType": "road.highway",
    "elementType": "all",
    "stylers": [{"visibility": "simplified"}]
}, {
    "featureType": "road.arterial",
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}]
}, {"featureType": "transit", "elementType": "all", "stylers": [{"visibility": "off"}]}, {
    "featureType": "water",
    "elementType": "all",
    "stylers": [{"color": "#46bcec"}, {"visibility": "on"}]
}];
function initMap() {


    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat:  50.110924,lng: 8.682127},
        styles: styles,
        mapTypeControl: false,
        zoom: 14
    });


    var largeInfoWindow = new google.maps.InfoWindow();

    //Setting Color for Icons normal,and hovered
    var defaultIcon = makeMarkerIcon('0091ff');
    var highlightedIcon = makeMarkerIcon('FFF824');

    //Iterating through locationsArray
    for (var i = 0; i < locationsMarker.length; i++) {

        //Setting lng and lat coordinates for foursquare api call
        var lng = locationsMarker[i].location.lng;
        var lat = locationsMarker[i].location.lat;

        //Api call foursquare
        var foursquareURL ="https://api.foursquare.com/v2/venues/search?ll="+ lat +" , " + lng + "&client_id="+ clientID +"&client_secret="+ clientSecret +"&v="+ date ;
        $.getJSON(foursquareURL).done(function(data) {
            var array = data.response.venues;

            //Iterating through Array
            //Adding further Information to Location Array Properties
            for ( var y = 0 ; y< array.length;y++){
                for( var x = 0;x<locationsMarker.length;x++){
                    if(array[y].name === locationsMarker[x].title){
                        locationsMarker[x].url =array[y].url;
                        locationsMarker[x].address =array[y].location.address;
                        locationsMarker[x].city =array[y].location.city;
                    }
                }
            }

        }).fail(function() {
            alert('Problems connection to Foursquare server, please reload the page or contact support');
        });

        //Setting marker attributes
        var position = locationsMarker[i].location;
        var title = locationsMarker[i].title;
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            icon: defaultIcon,
            animation: google.maps.Animation.DROP,
            id: i
        });
        //pushing each marker into Array
        markers.push(marker);

        //Two event listeners to open an infowindow at each marker
        marker.addListener('click', function () {
            populateInfoWindowClick(this, largeInfoWindow);
        });

        //Adding marker and windwo to location Array
        //Used to
        var model =marker;
        locationsMarker[i].marker=model;
        locationsMarker[i].window=largeInfoWindow;

        //Two event listeners one for mouseover and one for mouseout
        //to change colors back and fourth
        marker.addListener('mouseover',function () {
            this.setIcon(highlightedIcon)
        });
        marker.addListener('mouseout',function () {
            this.setIcon(defaultIcon)
        });
    }
    //Setting marker on map on load
    for (var i = 0;i <markers.length;i++){
        markers[i].setMap(map);
    }

    // document.getElementById('show-listing').addEventListener('click', showListings);
    // document.getElementById('hide-listing').addEventListener('click', hideListings);

}


//Populating Info Windows on click
function populateInfoWindowClick(marker, infowindow) {

    var address;
    var city;
    var url;

    //Matching information from foursquare to click target
    for (var i = 0;i<locationsMarker.length;i++){
        if(locationsMarker[i].title === marker.title){
            address =locationsMarker[i].address;
            city = locationsMarker[i].city;
            url= locationsMarker[i].url;
        }
    }

    //check the if infowindow isnt opend already on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title + '</div>');
        infowindow.open(map, marker);

        //Make sure the marker property is cleared if the indowindow is closed.
        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
        });
        var streetViewService  =new google.maps.StreetViewService();
        var radius = 50;

        //In case the status is OK which mean the pano as found,compute the
        //position of the streetView image, then calculate the heading then get a
        //panorama from that end set the options
        //Populating Infowindow with Image and foursquare information
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {

                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title +'</div><div id="pano"></div><div><span>'+city+'</span><span>'+address+'</span><span>'+url+'</span></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
            }
        }
        //User streetview service to get the closest streetview image within
        //50 meters of markers postion
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }

}


//Shows all Location Listings on Map
function showListings() {
    for (var i = 0;i <markers.length;i++){
        markers[i].setMap(map);
    }
}
//Hides all Location Listing on Map
function hideListings(){
    for (var i = 0;i <markers.length;i++) {
        markers[i].setMap(null);
    }
}


function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));

    return markerImage
}

var viewModel = {
    locations: ko.observableArray(locationsMarker),
    selectedOption: ko.observable(''),
    openWindow:function () {
        populateInfoWindowClick(this.marker,this.window)
    },
    //Filters dropdown select
    //returns all if undefined
    getCurrentLocations: function() {
        var selectedVal = this.selectedOption();
        console.log(selectedVal)
        if (!selectedVal)
            return this.locations;

        return this.locations().filter(function(f) {
            return f.location == selectedVal.location;
        });
    }
};

ko.applyBindings(viewModel);
//Filtering markers on Map
//returns all if undefined
//else places chosen marker
viewModel.selectedOption.subscribe(function(newValue) {

    if(newValue === undefined){
        showListings();
    }
    else{
        for (var i = 0;i <markers.length;i++) {
            markers[i].setMap(null);
        }
        newValue.marker.setMap(map);
    }

});
