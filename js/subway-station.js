class Station {
    constructor(marker, name, info, riders) {
        this.marker = marker;
        this.name = name;
        this.info = info;
        this.riders = riders;

        this.lines = []; // Lines that contain this station.
        this.drawmaps = []; // Lines that contain this station within its draw map.

        this.id = station_id_generator.generate();
        this.active = true;
    }
    
    to_json() {
        var json = {
            "lat": this.marker.getLatLng().lat,
            "lng": this.marker.getLatLng().lng,
            "name": this.name,
            "info": this.info,
            "riders": this.riders,
            "lines": this.lines,
            "drawmaps": this.drawmaps,
            "id": this.id,
            "active": this.active
        };
        return json;
    }

    generate_popup() {
        
        var station_popup = L.popup({'className': 'station-popup'});
        
        var station_content = '<div class="station-name" id="station-'+this.id.toString()+'">'+this.name+'   <i class="fa fa-pencil" style="margin-left: 5px;" aria-hidden="true"></i></div>';
        station_content += '<div class="station-content"><div class="station-info">'+this.info+'<br /><i class="fa fa-user" aria-hidden="true"></i> '+Math.round(this.riders).toString()+'</div>';
        station_content += '<div class="station-info subway-lines">';
        
        for (var i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            station_content += '<div class="subway-line '+N_lines[line].css+'"><div class="height_fix"></div><div class="content">'+N_lines[line].html+'</div></div>';
        }
        station_content += '</div>';


        station_content += '<div class="station-content-button station-transfer" id="transfer-'+this.id.toString()+'">Transfer</div>';
        
        if (!is_in_array(N_active_line.id, this.lines)) {
            station_content += '<div class="station-content-button station-build line-'+N_active_line.id.toString()+'" id="build-'+this.id.toString()+'">Build <div class="subway-line-mini '+N_active_line.css+'"><div class="height_fix"></div><div class="content">'+N_active_line.html+'</div></div></div>';
        }
        
        station_content += '<div class="station-content-button station-delete ';
        for (i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            station_content += 'line-'+N_lines[line].id.toString()+' ';
        }
        station_content += '" id="delete-'+this.id.toString()+'">Delete</div>';
        station_content += '</div>';
        
        station_popup.setContent(station_content);
        
        this.marker.unbindPopup();
        this.marker.bindPopup(station_popup);
        
        return station_popup;
    }

    delete() {
        
        // Remove the marker.
        station_layer.removeLayer(this.marker);
        
        // Set the station to "inactive".
        this.active = false;

        var impacted_lines = [];

        for (var i = 0; i < N_lines.length; i++) {

            // Remove from station array.
            if (is_in_array(this.id, N_lines[i].stations)) {
                if (!is_in_array(i, impacted_lines))
                    impacted_lines.push(i);
                var station_id_index = N_lines[i].stations.indexOf(this.id);
                N_lines[i].stations.splice(station_id_index, 1);
            }

            // Remove from drawmap.
            if (is_in_array(this.id, N_lines[i].draw_map)) {
                if (!is_in_array(i, impacted_lines))
                    impacted_lines.push(i);
                var station_id_index = N_lines[i].draw_map.indexOf(this.id);
                N_lines[i].draw_map.splice(station_id_index, 1);
            }

        }

    }
}

function geocode_to_station(geo, line) {
    
    var ridership = calculate_ridership(geo.latlng);
    var marker = create_station_marker(geo.latlng);
        
    var N_station = new Station(marker, geo.name, geo.info, ridership);
    N_stations[N_station.id] = N_station;
    var new_index = N_active_line.insert_station(N_station.id);

    N_station.generate_popup();
    N_station.marker.openPopup();
    
    var impacted_lines = [N_active_line.id];
    // Add drawmaps of nearby stations
    var start_index = Math.max(0, new_index - SHARED_STRETCH_THRESHOLD);
    var end_index = Math.min(new_index + SHARED_STRETCH_THRESHOLD, N_active_line.stations.length);
    for (var j = start_index; j < end_index; j++) {
        for (var k = 0; k < N_stations[N_active_line.stations[j]].drawmaps.length; k++) {
            var drawmaps = N_stations[N_active_line.stations[j]].drawmaps;
            if (!is_in_array(drawmaps[k], impacted_lines))
                impacted_lines.push(drawmaps[k]);
        }
    }
    
    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].generate_draw_map();
    }
    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].draw();
    }

    generate_route_diagram(line);
    calculateTotalRidership();
            
}

var N_stations = [];