
$(document).ready(function(){

    const obs = new OBSWebSocket();
    
    //localhost:4444
    var obs_host = 'localhost:4444';
    var obs_password = '';
    var obs_autoconnect = false;
    var obs_hide_host_fields = false;

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
                    //var cval = 20 * Math.log10(parseFloat($(this).val()) / 1);
                    var cval = $(this).val();
                    $(this).closest('.obs--audio-source').find('.obs--audio-slider').slider({
                        min:0,
                        max:1,
                        step:.001,
                        value: cval,
                        orientation: "horizontal",
                        range: "min",
                        slide: function( event, ui ) {
                            //ui.value = Math.pow(10, (ui.value/20));
                            $(this).closest('.obs--audio-source').find('.obs--audio-value').val(ui.value).trigger('change');
                        }
                    });
                });

            });
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