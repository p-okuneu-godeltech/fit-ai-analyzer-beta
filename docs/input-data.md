### Input Data Characteristics

#### FIT File (Phone-recorded)
Available per-record fields
- GPS position (lat, long)
- Timestamp (1s resolution)
- Distance (cumulative)
- Enhanced speed
- Cadence
- GPS accuracy

Not available
- Heart rate
- Power
- Ground contact time
- Vertical oscillation
- Lactate, VO₂max, training load fantasies
- Implication

##### File structure
- FIT is a custom format with binary encoding, so the structure depends on libraries that parse the file.
- But https://runalyze.com/tool/fit-viewer parses it so the output MAY (but not necessarily) correspond to the following:

    - A bunch of records, outputted per second (according to timestamp fields)
    - Might contain duplicated records (per timestamp, TYPE and NAME)

    = TYPE=0 NAME=record NUMBER=20
    --- position_lat=609849964=51.1170335 deg
    --- position_long=202874509=17.0047449 deg
    --- cadence=67=67 rpm
    --- distance=0=0.00 m
    --- gps_accuracy=14=14 m
    --- enhanced_speed=460=1.656 km/h
    --- timestamp=1137674974=2026-01-18T12:49:34Z
    ==
    = TYPE=0 NAME=record NUMBER=20
    --- position_lat=609849964=51.1170335 deg
    --- position_long=202874509=17.0047449 deg
    --- cadence=67=67 rpm
    --- distance=0=0.00 m
    --- gps_accuracy=14=14 m
    --- enhanced_speed=460=1.656 km/h
    --- timestamp=1137674974=2026-01-18T12:49:34Z
    ==
    = TYPE=0 NAME=record NUMBER=20
    --- position_lat=609850859=51.1171085 deg
    --- position_long=202874395=17.0047353 deg
    --- cadence=67=67 rpm
    --- distance=821=8.21 m
    --- gps_accuracy=14=14 m
    --- enhanced_speed=2069=7.448 km/h
    --- timestamp=1137674975=2026-01-18T12:49:35Z
    ==
    = TYPE=0 NAME=record NUMBER=20
    --- position_lat=609850859=51.1171085 deg
    --- position_long=202874395=17.0047353 deg
    --- cadence=67=67 rpm
    --- distance=821=8.21 m
    --- gps_accuracy=14=14 m
    --- enhanced_speed=2069=7.448 km/h
    --- timestamp=1137674975=2026-01-18T12:49:35Z
    ==

    - Some meta information at the start of the output

    = TYPE=0 NAME=file_id NUMBER=0
    --- type=4=activity
    --- time_created=1137674973=2026-01-18T12:49:33Z
    --- product_name="iPhone"
    ==
    = TYPE=0 NAME=file_creator NUMBER=49
    --- software_version=9902=9902
    ==
    = TYPE=0 NAME=device_info NUMBER=23
    --- device_index=0=creator
    --- source_type=5=local
    --- product_name="iPhone"
    --- timestamp=1139395704=2026-02-07T10:48:24Z

    - Some meta information at the end of the output (and may be irrelevant training data, like **timer events**)

    // event
    = TYPE=0 NAME=event NUMBER=21
    --- event=0=timer
    --- event_type=0=start
    --- event_group=0=0
    --- timestamp=1137674973=2026-01-18T12:49:33Z

    // session
    = TYPE=0 NAME=session NUMBER=18
    --- event_type=1=stop
    --- start_time=1137674973=2026-01-18T12:49:33Z
    --- sport=1=running
    --- total_elapsed_time=5451019=5451.019 s
    --- total_timer_time=5406327=5406.327 s
    --- total_distance=1641339=16413.39 m
    --- total_calories=1049=1049 kcal
    --- avg_running_cadence=159=159 strides/min
    --- first_lap_index=0=0
    --- num_laps=10=10
    --- trigger=0=activity_end
    --- total_moving_time=5406327=5406.327 s
    --- enhanced_avg_speed=3035=10.926 km/h
    --- timestamp=1137680424=2026-01-18T14:20:24Z
    --- message_index=0=selected=0,reserved=0,mask=0

    // activity
    = TYPE=0 NAME=activity NUMBER=34
    --- total_timer_time=5451019=5451.019 s
    --- num_sessions=1=1
    --- type=0=manual
    --- event=26=activity
    --- event_type=1=stop
    --- local_timestamp=1137684024=1137684024
    --- timestamp=1137680424=2026-01-18T14:20:24Z

    // lap
    = TYPE=0 NAME=lap NUMBER=19
    --- event=9=lap
    --- event_type=1=stop
    --- start_time=1137674973=2026-01-18T12:49:33Z
    --- total_elapsed_time=899977=899.977 s
    --- total_timer_time=899977=899.977 s
    --- total_distance=272500=2725.00 m
    --- total_calories=175=175 kcal
    --- avg_running_cadence=154=154 strides/min
    --- sport=1=running
    --- timestamp=1137675873=2026-01-18T13:04:33Z
    --- message_index=0=selected=0,reserved=0,mask=0
