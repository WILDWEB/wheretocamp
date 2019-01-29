$("#country").countrySelect({
    preferredCountries: ["xx"]
  });

  blankFlag.call(this);

  $("#country").on('change', blankFlag);

  function blankFlag(e) {
    if ($('.flag').hasClass('xx')) {

      $('.xx').addClass('blank');

     } else {
     
       return false;
     }
  }
  
  