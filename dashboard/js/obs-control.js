

function scaleBetween(num, min, max, scaledMin, scaledMax){
    return (scaledMax-scaledMin)*(num-min)/(max-min)+scaledMin;
}


$(document).ready(function(){

    
    const obs = new OBSWebSocket();

    var obs_helper = {

        audio_sources: [],

        hooks: function(){
            
            $('.obs--connect-btn').click(obs_helper.connect_btn);
            $(document).on('click', '.obs--scene', obs_helper.scene_btn);
            $(document).on('change', '.obs--audio-value', obs_helper.audio_change_btn);
            $(document).on('click', '.obs--start-stop-recording', obs_helper.toggle_recording);
            $(document).on('click', '.obs--start-stop-streaming', obs_helper.toggle_streaming);

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
            console.log(d);
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

        toggle_recording: function(e){
            e.preventDefault();
            if(confirm('Are you SURE you want to stop RECORDING?')){
                obs.send('StartStopRecording');
            }
        },

        toggle_streaming: function(e){
            e.preventDefault();
            if(confirm('Are you SURE you want to stop STREAMING?')){
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
                    var clean_name = scene.name;
                    clean_name = clean_name.replace(' ','_');
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
                var clean_name = data.name;
                clean_name = clean_name.replace(' ','_');
                $('.obs--scene').removeClass('active');
                $('.obs--scene-'+clean_name).addClass('active');
                console.log(data.sources);
                data.sources.forEach(source => {

                    if(source.render == false || obs_helper.audio_sources.indexOf(source.type) < 0){
                        return;
                    }
                    //skip, fix this in future to check for control.
                    if(source.type == "browser_source"){
                        return;
                    }

                    $('.obs--audio-list').append('<div class="obs--audio-source">'+source.name+' <div class="obs--audio-slider"></div> <input type="hidden" class="obs--audio-value" data-source="'+source.name+'" value="'+source.volume+'"></div>');
                });
                $('.obs--audio-value').each(function(i,v){
                    var cval = $(this).val();
                    $(this).closest('.obs--audio-source').find('.obs--audio-slider').slider({
                        min:0,
                        max:1,
                        step:.01,
                        value: cval,
                        orientation: "horizontal",
                        range: "min",
                        slide: function( event, ui ) {
                            if(ui.value <= .1){
                                ui.value = scaleBetween(ui.value, 0, .1, 0, .0001);
                            }
                            else if(ui.value <= .2){
                                ui.value = scaleBetween(ui.value, .1, .2, .0001, .0003162);
                            }
                            else if(ui.value <= .3){
                                ui.value = scaleBetween(ui.value, .2, .3, .0003162, .001);
                            }
                            else if(ui.value <= .4){
                                ui.value = scaleBetween(ui.value, .3, .4, .001, .003162);
                            }
                            else if(ui.value <= .5){
                                ui.value = scaleBetween(ui.value, .4, .5, .003162, .01);
                            }
                            else if(ui.value <= .6){
                                ui.value = scaleBetween(ui.value, .5, .6, .01, .3162);
                            }
                            else if(ui.value <= .7){
                                ui.value = scaleBetween(ui.value, .6, .7, .3162, .501);
                            }
                            else if(ui.value <= .8){
                                ui.value = scaleBetween(ui.value, .7, .8, .501, .708);
                            }
                            else if(ui.value <= .9){
                                ui.value = scaleBetween(ui.value, .8, .9, .708, .891);
                            }
                            else{
                                ui.value = scaleBetween(ui.value, .9, 1, .891, 1);
                            }


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
        }

    }

    obs_helper.hooks();


    
});