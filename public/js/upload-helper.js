jQuery(function($){
  $(document).on('change', '.btn-file :file', function() {
    var input = $(this),
      label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [label]);
  });
  $('.btn-file :file').on('fileselect', function(event, label) {
      var input = $(this).parents('.input-group').find(':text'),
          log = label;
      if( input.length ) {
          input.val(log);
      } else {
          if( log ) alert(log);
      }
  });
})
let readURL = function(input, preview) {
  if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
          preview.attr('src', e.target.result);
      }
      reader.readAsDataURL(input.files[0]);
  }
}
