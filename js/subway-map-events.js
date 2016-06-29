function create_station_marker(latlng_orig) {
    var station = L.circleMarker(latlng_orig, {color: "black", opacity: 1.0, fillColor: "white", fillOpacity: 1.0}).setRadius(MARKER_RADIUS_DEFAULT);
    
    station.on('click', function(s_e) {

        // Disable new station creation.
        map.off('click', handle_map_click);

        // Wait a second before you can create a new station.
        setTimeout(function() {
            map.on('click', handle_map_click);
        }, 1000);
    });
    
    station_layer.addLayer(station);
    return station;
}

function handle_map_click(e) {

    var latlng = e.latlng;

    if (N_active_line != null) {

        var geo = new Geocoder(latlng);
        geo.geocode(N_active_line); // Pass the active line in case it changes. Contains a call back to create the station

    }

}
    
function delete_station_event(e) {

    var station_id = $(this).attr('id').replace('delete-', '');
    var station = N_stations[station_id];
    
    N_stations[station_id].delete();

    for (var i = 0; i < N_stations[station_id].drawmaps.length; i++) {
        var line_id = N_stations[station_id].drawmaps[i];
        N_lines[line_id].generate_draw_map();
        N_lines[line_id].draw();
    }

    regenerate_popups();
    generate_route_diagram(N_active_line);
    calculateTotalRidership();

}

function build_to_station_event(e) {


    var station_id = $(this).attr('id').replace('build-', '');

    var build_classes = $(this).attr('class').split(' ');
    var station_lines = [];
    for (c in build_classes) {
        if (build_classes[c].indexOf('line-') > -1) {
            var line = build_classes[c].replace('line-', '');
            station_lines.push(line);
        }
    }
    
    var impacted_lines = N_stations[station_id].drawmaps;

    for (var i = 0; i < station_lines.length; i++) {
        var line_id = station_lines[i];
        var line = N_lines[line_id];
        
        $('div.subway-lines').append('<div class="subway-line '+line.css+'"><div class="height_fix"></div><div class="content">'+line.html+'</div></div>');

        var new_index = line.insert_station(parseInt(station_id));
        
        var start_index = Math.max(0, new_index - SHARED_STRETCH_THRESHOLD);
        var end_index = Math.min(new_index + SHARED_STRETCH_THRESHOLD, line.stations.length);
        
        // Add drawmaps of nearby stations
        for (var j = start_index; j < end_index; j++) {
            for (var k = 0; k < N_stations[line.stations[j]].drawmaps.length; k++) {
                var drawmaps = N_stations[line.stations[j]].drawmaps;
                if (!is_in_array(drawmaps[k], impacted_lines))
                    impacted_lines.push(drawmaps[k]);
            }
        }
        
    }

    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].generate_draw_map();
    }
    for (var i = 0; i < impacted_lines.length; i++) {
        N_lines[impacted_lines[i]].draw();
    }

    regenerate_popups();
    generate_route_diagram(N_active_line);
}

function line_select_click_handler(td) {

    if ($(td).hasClass('subway-selected')) {
        $(td).removeClass('subway-selected');
        active_line = 'None';
        N_active_line = null;
    } else {
        $('.subway-clickable').removeClass('subway-selected');
        $(td).addClass('subway-selected');
        if ($(td).attr('id') == "subway-airtrain") {
            // Special case for AirTrain.
            active_line = "AIR";

            N_active_line = find_line_by_name("AirTrain JFK", 1);


        } else if ($(td).hasClass("subway-shuttle")) {
            active_line = $(td).attr('id');
            N_active_line = find_line_by_name($(td).attr('id'));
            if ($(td).hasClass("subway-shuttle-add")) {
                $(td).children(".content").text("S");
                $(td).removeClass("subway-shuttle-add");
                number_of_shuttles += 1;
                if (number_of_shuttles < 5) {
                    $(td).parent().append(newShuttleTemplate(number_of_shuttles+1));
                }
            }
        } else {
            active_line = $(td).text();
            N_active_line = find_line_by_html($(td).text(), 1);
        }
    }
    regenerate_popups();
    generate_route_diagram(N_active_line);
}