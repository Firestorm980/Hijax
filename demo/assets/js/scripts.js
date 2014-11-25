jQuery(document).ready(function($) {
		
	$.Hijax({
		beforeLoad: function(){
			$('#hijaxLoader').addClass('loading');
		},
		afterLoad: function(){
			$('#hijaxLoader').removeClass('loading');
		}
	});

});