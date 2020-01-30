import 'lazysizes/plugins/object-fit/ls.object-fit';
import 'lazysizes/plugins/parent-fit/ls.parent-fit';
import 'lazysizes/plugins/rias/ls.rias';
import 'lazysizes/plugins/bgset/ls.bgset';
import 'lazysizes';
import 'lazysizes/plugins/respimg/ls.respimg';

import '../../styles/theme.scss';
import '../../styles/theme.scss.liquid';

import {focusHash, bindInPageLinks} from '@shopify/theme-a11y';
import {cookiesEnabled} from '@shopify/theme-cart';

// Common a11y fixes
focusHash();
bindInPageLinks();

// Apply a specific class to the html element for browser support of cookies.
if (cookiesEnabled()) {
  document.documentElement.className = document.documentElement.className.replace(
    'supports-no-cookies',
    'supports-cookies',
  );
}

function searchPosition() {
  // elements
  var search_input = $('.search-input');
  var search_wrap = $('.additional-info');

  //Search input position
  var wrap_width = search_wrap.width();
  var left_position = Math.ceil(search_input.position().left);
  var right_position = wrap_width - left_position - search_input.outerWidth();
  //console.log("width" + wrap_width + "left_position " + left_position + "right_position " +right_position);
  search_input.css('right', right_position);
}

$(document).ready(function () {

  searchPosition();

  //Show/hide input search
  search_input.on('focus', function(){
    $(this).parent().addClass('input-focus');
  });

  $('body').click(function(event){
    if(!$(event.target).closest('.search-button, .search-input, .search-form').length) {
      search_input.parent().removeClass('input-focus');
    }
  });

});

var resizeId;
$(document).resize(function () {
  clearTimeout(resizeId);
  resizeId = setTimeout(searchPosition, 500);
});

// Mobile menu
var mobile_btn = $('.menu-toggle');
var menu = $('.navigation');

mobile_btn.click(function(){
  if ($(this).hasClass('show-menu')) {
    $(this).removeClass('show-menu');
    menu.hide();
  }
  else {
    $(this).addClass('show-menu');
    menu.show();
  }
});


// Input with +/- buttons
function incrementValue(e) {
  e.preventDefault();
  var fieldName = $(e.target).data('field');
  var parent = $(e.target).closest('div');
  var currentVal = parseInt(parent.find('input.' + fieldName).val(), 10);

  if (!isNaN(currentVal)) {
    parent.find('input.' + fieldName).val(currentVal + 1);
  } else {
    parent.find('input.' + fieldName).val(0);
  }
}

function decrementValue(e) {
  e.preventDefault();
  var fieldName = $(e.target).data('field');
  var parent = $(e.target).closest('div');
  var currentVal = parseInt(parent.find('input.' + fieldName).val(), 10);

  if (!isNaN(currentVal) && currentVal > 0) {
    parent.find('input.' + fieldName).val(currentVal - 1);
  } else {
    parent.find('input.' + fieldName).val(0);
  }
}

var quantity_wrap = $('.input-group');

quantity_wrap.on('click', '.button-plus', function(e) {
  incrementValue(e);
});

quantity_wrap.on('click', '.button-minus', function(e) {
  decrementValue(e);
});

function changeQuantityInCart(elem) {

  var quantity = elem.parent().find('.quantity-field').val(),
    item_key = elem.parent().find('.quantity-field').attr('data-id'),
    item_id = item_key.substr(0, item_key.indexOf(':')),
    item = elem.parents('.responsive-table-row'),
    total = elem.parents('.responsive-table-row').find('.product-cart-total'),
    subtotal = $('.cart-order-subtotal');

  $.ajax({
    type: 'POST',
    url: '/cart/change.js',
    dataType: 'json',
    data: {
      quantity: quantity,
      id: item_key
    },
    success: function(cart) {
      if ( quantity == 0 ) {
        item.remove();
      } else {
        $.each(cart.items, function (index, row) {
          if (item_id == row.variant_id) {
            total.html('$' + parseFloat(row.line_price / 100).toFixed(2));
          }
        });
      }
      subtotal.html( '$' + parseFloat(cart.total_price / 100).toFixed(2) );
    },
    error: function(response) {
      alert(response);
    }
  });
}

quantity_wrap.on('click', '.button-plus-cart', function(e) {
  incrementValue(e);
  changeQuantityInCart($(this));
});

quantity_wrap.on('click', '.button-minus-cart', function(e) {
  decrementValue(e);
  changeQuantityInCart($(this));
});

$(".checkbox input").on("click", function() {
  $(this).parent().toggleClass("is-checked");
});
