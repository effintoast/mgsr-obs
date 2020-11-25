
$(document).ready(function(){

    const obs = new OBSWebSocket();
    
    //localhost:4444
    var obs_host = 'localhost:4444';
    var obs_password = '';
    var obs_autoconnect = false;
    var obs_hide_host_fields = false;

    var player_sources = [
        {source_name: "P1", display_name: "Player 1", runner_slug: 'mgsr-1'},
        {source_name: "P2", display_name: "Player 2", runner_slug: 'mgsr-2'},
        {source_name: "P3", display_name: "Player 3", runner_slug: 'mgsr-3'},
        {source_name: "P4", display_name: "Player 4", runner_slug: 'mgsr-4'}
    ];

    var player_sources_values = [
        {source_url: "rtmp://rtmp.metalgearspeedrunners.com/runners/", display_name: "NA RTMP"},
        {source_url: "rtmp://eu-rtmp.metalgearspeedrunners.com/runners/", display_name: "EU RTMP"},
        {source_url: "rtmp://oce-rtmp.metalgearspeedrunners.com/runners/", display_name: "OCE RTMP"}
    ];


    var obs_helper = {

        audio_sources: [],

        hooks: function(){
            
            //set host and password fields
            if(obs_host != ''){
                $('.obs--host').val(obs_host);
            }
            if(obs_password != ''){
                $('.obs--password').val(obs_password);
            }
            
            
            if(obs_hide_host_fields){
                $('.obs--host').hide();
                $('.obs--password').hide();
            }

            //auto connect
            if(obs_host != '' && obs_autoconnect){
                obs_helper.set_status('connecting...');
                obs.connect({
                    address: $('.obs--host').val(),
                    password: $('.obs--password').val()
                });
            }

            $('.obs--connect-btn').click(obs_helper.connect_btn);
            $(document).on('click', '.obs--scene', obs_helper.scene_btn);
            $(document).on('change', '.obs--audio-value', obs_helper.audio_change_btn);
            $(document).on('click', '.obs--start-stop-recording', obs_helper.toggle_recording);
            $(document).on('click', '.obs--start-stop-streaming', obs_helper.toggle_streaming);
            $(document).on('click', '.obs--audio-mute', obs_helper.toggle_mute_btn);

            /* OBS Callbacks */
            obs.on('ConnectionOpened', obs_helper.connection_opened);
            obs.on('ConnectionClosed', obs_helper.connection_closed);
            obs.on('AuthenticationFailure', obs_helper.auth_fail);
            obs.on('AuthenticationSuccess', obs_helper.auth_pass);
            obs.on('SwitchScenes', obs_helper.scene_switched);
            obs.on('Heartbeat', obs_helper.stream_status);
            obs.on('SourceVolumeChanged', obs_helper.source_audio_change);
            obs.on('SourceMuteStateChanged', obs_helper.source_audio_mute);
        },

        main_show_callback: function(){

            obs_helper.player_source_load();
           
        },

        player_source_load: function(){
            /*Object
            message-id: "4"
            messageId: "4"
            sourceName: "P1"
            sourceSettings:
            input: ""
            is_local_file: false
            __proto__: Object
            sourceType: "ffmpeg_source"
            status: "ok"
            __proto__: Object*/
            var tmp_html = '';

            //setup reference dropdown
            var tmp_dropdown = '';
            tmp_dropdown += '<select class="obs--update-source-select" data-source="{source}">';
            tmp_dropdown += '<option value="">--</option>';
            $.each(player_sources_values, function(i,v){
                tmp_dropdown += '<option value="'+v.source_url+'{slug}" data-og="'+v.source_url+'">'+v.display_name+'</option>';
            });
            tmp_dropdown += '</select>';

            
            $.each(player_sources, function(i,v){
                tmp_html += '<div class="clr">';
                    tmp_html += '<h4 style="margin-bottom:5px;clear:both;">'+v.display_name+'</h4>';
                    tmp_html += '<div class="row">';
                        tmp_html += '<div class="col-xs-6"><label>Region</label><br>'+tmp_dropdown.replace('{source}', v.source_name).replace(/{slug}/g, v.runner_slug)+'</div>';
                        tmp_html += '<div class="col-xs-6"><label>Slug</label><br><input class="obs--runner-slug" value="'+v.runner_slug+'"></div>';
                    tmp_html += '</div>';
                tmp_html += '</div>';
            });


            $('.obs--source-settings').html(tmp_html);

            obs_helper.player_source_refresh_selected();

            $(document).on('change', '.obs--update-source-select', obs_helper.player_source_update_input);
            $(document).on('keyup', '.obs--runner-slug', obs_helper.player_source_update_slug);
        },

        player_source_update_slug: function(e){
            var tmp_slug = $(this).val();
            var tmp_element = $(this).closest('.row').find('.obs--update-source-select');
            tmp_element.find('option').each(function(i,v){
                var tmp_og = $(this).data('og');
                if(tmp_og != undefined){
                    $(this).val(tmp_og+tmp_slug);
                }
                
            });
            tmp_element.trigger('change');
            obs_helper.player_source_refresh_selected();
        },

        player_source_update_input: function(e){
            e.preventDefault();
            var tmp_src = $(this).data('source');
            var tmp_input = $(this).val();
            if(tmp_src != ''){
                obs.send('SetSourceSettings', {
                    'sourceName': tmp_src,
                    'sourceSettings': {input: tmp_input}
                }).then(function(data){
                    //console.log(data);
                });
            }
        },

        player_source_refresh_selected: function(){
            $('.obs--update-source-select').each(function(i,v){
                var tmp_src = $(this).data('source');
                var tmp_element = $(this);
                obs.send('GetSourceSettings', {
                    'sourceName': tmp_src,
                }).then(function(data){
                    try {
                        tmp_element.val(data.sourceSettings.input);
                    }
                    catch(e) {}
                });
            });
        },

        set_status: function(status){
            $('.obs--status').html(status);
        },

        stream_status: function(d){
            if(d.streaming){
                $('.obs--streaming-status').addClass('active');
            }
            else{
                $('.obs--streaming-status').removeClass('active');
            }
            if(d.recording){
                $('.obs--recording-status').addClass('active');
            }
            else{
                $('.obs--recording-status').removeClass('active');
            }
        },

        connect_btn: function(e){
            e.preventDefault();
            obs_helper.set_status('connecting...');
            obs.connect({
                address: $('.obs--host').val(),
                password: $('.obs--password').val()
            });
        },

        toggle_mute_btn: function(e){
            e.preventDefault();
            if($(this).hasClass('fa-volume-mute')){
                obs.send('SetMute', { source: $(this).closest('.obs--audio-source').data('source-name'), mute: false});
                $(this).removeClass('fa-volume-mute').addClass('fa-volume-up');
            }
            else{
                obs.send('SetMute', { source: $(this).closest('.obs--audio-source').data('source-name'), mute: true});
                $(this).removeClass('fa-volume-up').addClass('fa-volume-mute');
            }
        },

        toggle_recording: function(e){
            e.preventDefault();
            if($('.obs--recording-status').hasClass('active') && confirm('Are you SURE you want to stop RECORDING?')){
                obs.send('StartStopRecording');
            }
            else if(!$('.obs--recording-status').hasClass('active')){
                obs.send('StartStopRecording');
            }
        },

        toggle_streaming: function(e){
            e.preventDefault();
            if($('.obs--streaming-status').hasClass('active') && confirm('Are you SURE you want to stop STREAMING?')){
                obs.send('StartStopStreaming');
            }
            else if(!$('.obs--streaming-status').hasClass('active')){
                obs.send('StartStopStreaming');
            }
        },

        scene_btn: function(e){
            e.preventDefault();
            $('.obs--scene').removeClass('active');
            $(this).addClass('active');
            obs_helper.set_scene($(this).data('sname'));
        },

        get_scenes: function(){
            obs.send('GetSceneList').then(data => {
                const scene_list_wrapper = $('.obs--scene-list');
                scene_list_wrapper.html('');
                data.scenes.forEach(scene => {
                    var clean_name = obs_helper.slug_gen(scene.name);
                    scene_list_wrapper.append('<div class="obs--scene obs--scene-'+clean_name+'" data-sname="'+scene.name+'"><div class="inner"><span>'+scene.name+'</span></div></div>');
                });
              });
        },

        get_sources: function(){

            if(obs_helper.audio_sources.length <= 0){
                obs.send('GetSourceTypesList').then(data => {
                    data.types.forEach(t => {
                        if(t.caps['hasAudio']){
                            obs_helper.audio_sources.push(t.typeId);
                        }
                    });
                    obs_helper.get_sources_audio();
                });
            }
            else{
                obs_helper.get_sources_audio();
            }

            

        },

        get_sources_audio: function(){
            $('.obs--audio-list').html('loading...');
            obs.send('GetCurrentScene').then(data => {
                $('.obs--audio-list').html('');

                //clean up
                var clean_name = obs_helper.slug_gen(data.name);

                $('.obs--scene').removeClass('active');
                $('.obs--scene-'+clean_name).addClass('active');

                data.sources.forEach(source => {

                    if(source.render == false || obs_helper.audio_sources.indexOf(source.type) < 0){
                        return;
                    }
                    //skip, fix this in future to check for control.
                    if(source.type == "browser_source"){
                        return;
                    }


                    
                    $('.obs--audio-list').append('<div class="obs--audio-source obs--audio-source-'+obs_helper.slug_gen(source.name)+'" data-source-name="'+source.name+'">'+source.name+' <span class="obs--audio-mute fas fa-volume-up" style="display:none;"></span> <div class="obs--audio-slider"></div> <input type="hidden" class="obs--audio-value" data-source="'+source.name+'" value="'+source.volume+'"></div>');

                    obs.send('GetMute',{source: source.name}).then(mdata => {
                        var clean_name = obs_helper.slug_gen(mdata.name);
                        if(mdata.muted){
                            $('.obs--audio-source-'+clean_name).find('.obs--audio-mute').removeClass('fa-volume-up').addClass('fa-volume-mute').show();
                        }
                        else{
                            $('.obs--audio-source-'+clean_name).find('.obs--audio-mute').removeClass('fa-volume-mute').addClass('fa-volume-up').show();
                        }
                    });
                });
                $('.obs--audio-value').each(function(i,v){
                    var cval = 20 * Math.log10(parseFloat($(this).val()) / 1);
                    //var cval = $(this).val();
                    if(cval < -20){
                        cval = -20 * ((-cval-20) / 80 ) -20;
                    }
                    $(this).closest('.obs--audio-source').find('.obs--audio-slider').slider({
                        min:-40,
                        max:0,
                        step:.2,
                        value: cval,
                        orientation: "horizontal",
                        range: "min",
                        slide: function( event, ui ) {
                            if(ui.value < -20){
                                ui.value = -80 * ((-ui.value-20) / 20 ) - 20;
                            }
                            ui.value = Math.pow(10, (ui.value/20));
                            $(this).closest('.obs--audio-source').find('.obs--audio-value').val(ui.value).trigger('change');
                        }
                    });
                });

            });
        },

        source_audio_change: function(d){
            d.sourceName = obs_helper.slug_gen(d.sourceName);
            var cval = 20 * Math.log10(parseFloat(d.volume) / 1);
            if(cval < -20){
                cval = -20 * ((-cval-20) / 80 ) -20;
            }
            $('.obs--audio-source-'+d.sourceName).find('.obs--audio-slider').slider('value',cval);
        },

        source_audio_mute: function(d){
            d.sourceName = obs_helper.slug_gen(d.sourceName);
            if(d.muted){
                $('.obs--audio-source-'+d.sourceName).find('.obs--audio-mute').removeClass('fa-volume-up').addClass('fa-volume-mute');
            }else{
                $('.obs--audio-source-'+d.sourceName).find('.obs--audio-mute').removeClass('fa-volume-mute').addClass('fa-volume-up');
            }
        },

        set_source_volume: function(source, vol){
            obs.send('SetVolume', {
                'source': source,
                'volume': parseFloat(vol)
            }).then(function(data){
                
            });
        },

        audio_change_btn: function(e){
            e.preventDefault();
            obs_helper.set_source_volume($(this).data('source'), $(this).val());
        },

        set_scene: function(scene_name){
            obs.send('SetCurrentScene', {
                'scene-name': scene_name
            }).then(function(){
                obs_helper.get_sources_audio();
            });
            
        },

        scene_switched: function(d){
            obs_helper.get_sources();
        },

        connection_opened: function(d){
            obs_helper.set_status('connection opened');
        },

        connection_closed: function(d){
            obs_helper.set_status('connection closed');
        },

        auth_pass: function(d){
            obs_helper.set_status('connected');
            obs_helper.get_scenes();
            obs_helper.get_sources();
            obs.send('SetHeartbeat', { 'enable': true });
            $('.obs--main').show();
            obs_helper.main_show_callback();
        },

        auth_fail: function(d){
            obs_helper.set_status('auth fail');
        },

        slug_gen: function(d){
            d = d.replace(/[^a-zA-Z0-9 ]/g, "");
            d = d.replace(/ /g, '_');
            return d;
        }
    }

    obs_helper.hooks();


    
});