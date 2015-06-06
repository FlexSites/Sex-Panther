module.exports = {
  slugify: function () {
    return function (text) {
      return (render(text, this)||'').replace(/[^-a-z0-9._~]{1,}/gi,'-').toLowerCase();
    };
  },
  truncate: function(){
    return function(text){
      var str = render(text, this), len = 100;
      if(/|\d+$/.test(str)) {
        var idx = str.lastIndexOf('|');
        len = parseInt(str.substr(idx + 1, str.length));
        str = str.substr(0, idx < len ? idx : len);
      } else {
        str = str.substr(0, len);
      }
      return str;
    };
  }
};

function render(text, data){
  return text.replace(/\[\[(.*?)\]\]/g, function(m, m1){
    return data[m1] || '';
  });
}
