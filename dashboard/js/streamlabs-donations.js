
$(document).ready(function(){

    var stream_labs_api_key = '';
    var cors_prefix = 'https://cors-anywhere.herokuapp.com/';
    var polling_timeout = 45000;

    var donations_helper = {


        hooks: function(){
            
            donations_helper.donations_refresh();
            setInterval(donations_helper.donations_refresh, polling_timeout);

        },

        donations_refresh: function(){
            //old streamlabs api
            $.get(cors_prefix+'https://www.twitchalerts.com/api/donations?access_token='+stream_labs_api_key, function(d){
                $.each(d.donations, function(i,v){
                    if($('.sl-donation-'+v.id).length <= 0){
                        $('.sl-donations--body').prepend('<div class="sl-donation-new sl-donation-box sl-donation-'+v.id+'"><div class="sl-donation-header"><h4>'+v.donator.name+' <div class="pull-right">'+v.amount_label+'</div></h4></div><div class="sl-donation-body">'+v.message+'</div></div>');
                    }
                });
                setTimeout(donations_helper.donations_clear_new, 10000);
            });
        },

        donations_clear_new: function(){
            $('.sl-donation-new').removeClass('sl-donation-new');
        }

    }

    donations_helper.hooks();


    
});