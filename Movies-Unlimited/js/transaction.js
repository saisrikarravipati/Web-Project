$(document).ready(function() {
    var main_url = window.location.protocol + "//" + window.location.host;
    var user = null;
    var curr_transactions = null;

    /*-------------------- Entry point for scripts on page --------------------*/
    var initTransaction = function() {
        if(typeof(sessionStorage) != 'undefined' && sessionStorage.getItem("customer")){
            user = JSON.parse(sessionStorage.getItem("customer"));
        }
        else {
            onLogoutButtonClick();
        }

        loadTransactions();
        addEventListeners();
    };

    /*-------------------- Loads user transactions --------------------*/
    var loadTransactions = function() {
        var url = main_url + "/customer/transactions/" + user._id;

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function(response){
                curr_transactions = response;
                renderTransactions(response);
            },
            error: function(response){
                console.log("Error occured: " + response.responseText);
                showPopupMessage("error", response.error);
            }
        });
    };

    /*-------------------- Render user transactions --------------------*/
    var renderTransactions = function(response) {
        if(!response || !response.transactions || !response.transactions.length) {
            $("#transaction_container tbody").empty().append('<tr><td colspan="5" class="center">No transactions found.</td></tr>');
            return;
        }

        $("#transaction_container tbody").empty();
        $.each(response.transactions, function(i, transaction){
            var transaction_data = '<tr class="transaction_row" data-id="' + transaction._id + '">' +
            '<td class="pointer heading">' + transaction._id + '</td>' +
            '<td>' + transaction.items[0].transaction.date + '</td>' +
            '<td>' + transaction.items[0].transaction.payment.address + '</td>' +
            '<td>$' + transaction.items[0].transaction.total + '</td>' +
            '<td class="text-transform">' + transaction.items[0].transaction.payment_mode + '</td>' +
            '</tr>';
            $("#transaction_container tbody").append(transaction_data);
        });
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

    /*-------------------- Adds all event listeners on page --------------------*/
    var addEventListeners = function() {
        $(".closeModal").click(function(){
            $(".modal").removeClass("active");
        });

        $("#go_home").on("click", backToMainPage);
        $(document).on("click", ".transaction_row .heading", onExpandTransaction);
        $("#logout_button").on("click", onLogoutButtonClick);
    };

    /*-------------------- Redirect to Mainpage --------------------*/
    var backToMainPage = function(){
        var url = main_url + "/mainpage";
        window.location = url;
    };
    
    /*-------------------- Adds all event listeners on page --------------------*/
    var onExpandTransaction = function() {
        var transaction_id = $(this).parent().attr("data-id");

        $.each(curr_transactions.transactions, function(i, transaction){
            if(transaction._id == transaction_id) {
                var details = '';

                $.each(transaction.items, function(index, item) {
                    details += '<tr><td>' + item.movie.Title + '</td>';
                    details += '<td>' + item.transaction.cart.Price + '</td>';
                    details += '<td>' + item.transaction.cart.Quantity + '</td>';
                    details += '<td>' + item.transaction.cart.Price * item.transaction.cart.Quantity + '</td></tr>';
                });

                $("#details_table tbody").empty().append(details);
            }
        });

        $("#myModal").addClass("active");
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

    initTransaction();
});
