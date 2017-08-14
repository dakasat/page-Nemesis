$(document).ready(function(){
    $(".menu-opener").click(function(){
  $(".menu-opener, .menu-opener-inner, .menu").toggleClass("active");
});
    $(".owl-carousel").owlCarousel({
    	items:1,
    	nav:true,
    	// theme: "owl-my",
    	loop:true,
    	autoplay:true,
    	smartSpeed:1000,
        autoplayTimeout:2000,
    });
    //     $(".owl-big").owlCarousel({
    // 	items:1,
    // 	nav:true,
    // 	// theme: "owl-my-big",
    // 	loop:true,
    // 	autoplay:true,
    // 	smartSpeed:1000,
    //     autoplayTimeout:2000,
    //     dots:false,
    // });





  //   $(".owl-big").owlCarousel({
  //   	items:1,
  //   	nav:true,
  //   	// theme: "owl-my-big",
  //   	loop:true,
  //   	autoplay:true,
  //   	smartSpeed:1000,
  //       autoplayTimeout:2000,
  //       dots:false,
  //   });

  // $('#owl-carousel').each(function(){
  //   $(this).owlCarousel({
  //   	items:1,
  //   	nav:true,
  //   	// theme: "owl-my",
  //   	loop:true,
  //   	autoplay:true,
  //   	smartSpeed:1000,
  //       autoplayTimeout:2000,
  //   });
  // });
  


  });