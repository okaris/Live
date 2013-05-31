$(function() {
  
  var showInfo = function(message) {
    $('div.progress').hide();
    $('strong.message').text(message);
    $('div.alert').show();
  };
  
  $('input[type="submit"]').on('click', function(evt) {
    evt.preventDefault();
    $('div.progress').show();
    var formData = new FormData();
    var file = document.getElementById('myFile').files[0];
    var body = document.getElementById('blog_text').value;

    if (file) {
        formData.append('myFile', file);
    };
    formData.append('blog_text', body);
    
    var xhr = new XMLHttpRequest();
    
    xhr.open('post', '/post?secret=CBB1AEC6-DDD0-4C50-B409-F23AC289E825', true);
    
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        var percentage = (e.loaded / e.total) * 100;
        $('div.progress div.bar').css('width', percentage + '%');
      }
    };
    
    xhr.onerror = function(e) {
      showInfo('An error occurred while submitting the form. Maybe your file is too big');
    };
    
    xhr.onload = function() {
      showInfo(this.responseText);
      $("#post-form")[0].reset();
    };
    
    xhr.send(formData);
    
  });
  
});