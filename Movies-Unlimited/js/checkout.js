$(document).ready(function() {
    var user = null;
    var main_url = window.location.protocol + "//" + window.location.host;
    var cart = null;
    var cart_total = 0;
    var payment = {};

    /*-------------------- Entry point for scripts on page --------------------*/
    var initCheckout = function() {
        if(typeof(sessionStorage) != 'undefined' && sessionStorage.getItem("customer")){
            user = JSON.parse(sessionStorage.getItem("customer"));
        }
        else {
            onLogoutButtonClick();
        }

        if(!user) {
            onLogoutButtonClick();
        }
        else {
            loadUserCart();
        }

        addEventListeners();
    };

    /*-------------------- Loads user cart --------------------*/
    var loadUserCart = function() {
        var url = main_url + "/customer/getcart/" + user._id;

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function(response){
                renderCart(response);
            },
            error: function(response){
                console.log("Error occured: " + response.responseText);
                if(response && response.error) {
                    showPopupMessage("error", response.error);
                }
            }
        });
    };

    /*-------------------- Renders the cart and computes total price --------------------*/
    var renderCart = function(response) {
        if(!response || !response.cart || !response.cart.length) {
            $("#cart_items tbody").empty().append('<tr><td colspan="4" class="center">No cart items found.</td></tr>');
            window.location = main_url + "/mainpage";
        }
        else {
            cart = response.cart;
            $("#cart_items tbody").empty();
            var total = 0.0;
            $.each(response.cart, function(i, movie) {
                var cart_data = '<tr> <td>' + (i+1) + '</td><td>' + movie.Title + '</td>'
                                    + '<td>' + movie.Quantity + ' </td>'
                                    + '<td>$' + movie.Price + '</td></tr>';
                total += movie.Quantity * movie.Price;
                $("#cart_items tbody").append(cart_data);
            });
            cart_total = total;
            $("#total_price").empty().text(total.toFixed(2));
        }
    };

    /*-------------------- Popup message rendering --------------------*/
    var showPopupMessage = function (type, message){
    	var messageElement = $("#pop-up-message");
    	messageElement.text(message);
    	messageElement.addClass(type + " visible");

    	setTimeout(function(){
    		messageElement.removeClass(type + " visible");
    	}, 3500);
    };

    /*-------------------- Validates payment details --------------------*/
    var validateAndReturnPayment = function() {
        var payment_obj = {};

		// Card number validation
		var card_no = $("#cardNumber").val();
		if(card_no != null){
			// If card number is empty
			if(card_no.trim() == ""){
				showPopupMessage("error","Card number is empty!");
				return false;
			}

			// If card number format is invalid
			var regex = /^([0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4})$/g;
			if(!regex.test(card_no)){
				showPopupMessage("error","Card number format is invalid");
				return false;
			}

			payment_obj['card_no'] = card_no.trim();
		}

		// Expiry date validation
		var exp_month = $("#expityMonth").val();
		if(exp_month != null){
			// If expiry month is empty
			if(exp_month.trim() == ""){
				showPopupMessage("error","Expiry month is empty!");
				return false;
			}

			// If expiry month out of range
			if(parseInt(exp_month.trim()) < 1 || parseInt(exp_month.trim()) > 12){
				showPopupMessage("error","Expiry month is out of range!");
				return false;
			}

			payment_obj['exp_month'] = parseInt(exp_month.trim());
		}

		var exp_year = $("#expityYear").val();
		if(exp_year != null){
			// If expiry year is empty
			if(exp_year.trim() == ""){
				showPopupMessage("error","Expiry year is empty!");
				return false;
			}

			// If expiry year out of range
			if(parseInt(exp_year.trim()) < 1900 || parseInt(exp_year.trim()) > 2100){
				showPopupMessage("error","Expiry year is out of range! Allowed range [1900-2100]");
				return false;
			}

			payment_obj['exp_year'] = parseInt(exp_year.trim());
		}

		// CVV number validation
		var card_cvv = $("#cvCode").val();
		if(card_cvv != null){
			// If CVV is empty
			if(card_cvv.trim() == ""){
				showPopupMessage("error","CVV Number is empty!");
				return false;
			}

			// If CVV has invalid format
			var regex = /^([0-9]{3})$/g;
			if(!regex.test(card_cvv)){
				showPopupMessage("error","CVV Number format is invalid!");
				return false;
			}

			payment_obj['card_cvv'] = parseInt(card_cvv.trim());
		}

        // Address validation
		var address = $("#billAddress").val();
		if(address.trim() == ""){
			showPopupMessage("error","Billing address is empty!");
			return false;
		}
		payment_obj['address'] = address.trim();

        return payment_obj;
    };

    /*-------------------- Performs the transaction --------------------*/
    var onConfirmPaymentClick = function() {
        $.each(cart, function(i, movie) {
            delete movie.Stock;
            delete movie.Title;
        });

        var transaction_obj = {};
        transaction_obj['total'] = cart_total;
        transaction_obj['date'] = new Date().toLocaleDateString();
        transaction_obj['payment_mode'] = "credit";
        transaction_obj['cart'] = cart;
        transaction_obj['payment'] = validateAndReturnPayment();

        if(!transaction_obj['payment']) {
            return;
        }

        $(".checkout").addClass("hide");
        $(".success").addClass("hide");
        $(".processing").removeClass("hide");

        var data = {
            'customer_id': user._id,
            'transaction': transaction_obj
        }

        var url = main_url + "/customer/transaction";
        $.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                var message = $(".success").find("h1");
                if(response && response.success) {
                    message.html('<span class="glyphicon glyphicon-ok"></span> Transaction successful.');
                    message.addClass("green");
                }
                else {
                    message.html('<span class="glyphicon glyphicon-remove"></span> Transaction failed.');
                    message.addClass("red");
                }
                $(".processing").addClass("hide");
                $(".success").removeClass("hide");
            },
            error: function(response) {
                var message = $(".success").find("h1");
                message.html('<span class="glyphicon glyphicon-remove"></span> Transaction failed.');
                message.addClass("red");
                $(".processing").addClass("hide");
                $(".success").removeClass("hide");
                console.log("Error occured: " + response.responseText);
            }
        });

    };

    /*-------------------- Redirect to Mainpage --------------------*/
    var backToMainPage = function(){
        var url = main_url + "/mainpage";
        window.location = url;
    };

    /*-------------------- Adds all event listeners on page --------------------*/
    var addEventListeners = function() {
        $("#go_home").on("click", backToMainPage);
        $("#back_to_main").on("click", backToMainPage);
        $("#click_here").on("click", backToMainPage);
        $("#confirm_payment").on("click", onConfirmPaymentClick);
        $("#logout_button").on("click", onLogoutButtonClick);
    };

    /*-------------------- Logout button listener --------------------*/
    var onLogoutButtonClick = function() {
        var url = main_url + "/customer/terminate/logout";
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function(response){
                sessionStorage.clear();
                window.location = main_url + "/index";
            },
            error: function(response){
                console.log("Error occured: " + response.responseText);
                sessionStorage.clear();
                window.location = main_url + "/index";
            }
        });
    };

    initCheckout();
});
