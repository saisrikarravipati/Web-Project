$(document).ready(function() {
    var register_fname = "", register_lname = "", register_email = "", register_phone = "", register_pass = "", register_cpass = "";
    var login_email = "", login_pass = "";
    var pass_strength = -1;
    var main_url = window.location.protocol + "//" + window.location.host;

    /*-------------------- Adds register form event listeners on page --------------------*/
    var addRegisterValidations = function(){

        /*-------------------- First Name Validation --------------------*/
        $("#firstname").parent().append('<tr><td><span class="error_firstname"></span></td></tr>');
        $(".error_firstname").addClass("error");
        $("#firstname").on('blur', function() {
            var regex_name = /^^[a-zA-Z]*$/i;
            var name = $('#firstname').val();
            var valid = regex_name.test(name);
            if (name == "") {
                $(".error_firstname").text("First name cannot be empty");
                $(".error_firstname").show();
                register_fname = "true";
            } else if (!valid) {
                $(".error_firstname").text("First name cannot contain numbers");
                $(".error_firstname").show();
                register_fname = "true";
            } else {
                $(".error_firstname").hide();
                register_fname = "false";
            }
        });

        /*-------------------- Last Name Validation --------------------*/
        $("#lastname").parent().append('<tr><td><span class="error_lastname"></span></td></tr>');
        $(".error_lastname").addClass("error");
        $("#lastname").on('blur', function() {
            var regex_name = /^^[a-zA-Z]*$/i;
            var name = $('#lastname').val();
            var valid = regex_name.test(name);
            if (name == "") {
                $(".error_lastname").text("Last name cannot be empty");
                $(".error_lastname").show();
                register_lname = "true";
            } else if (!valid) {
                $(".error_lastname").text("Last name cannot contain numbers");
                $(".error_lastname").show();
                register_lname = "true";
            } else {
                $(".error_lastname").hide();
                register_lname = "false";
            }
        });

        /*-------------------- Email validation --------------------*/
        $("#remail").parent().append('<tr><td><span class="error_remail"></span></td></tr>');
        $(".error_remail").addClass("error");
        $("#remail").on('blur', function() {
            var regex_email = /^[\w-]+@([\w-]+\.)+[\w-]+$/i;
            var email = $("#remail").val();
            var valid = regex_email.test(email);
            if (email == "") {
                $(".error_remail").text("Email cannot be empty");
                $(".error_remail").show();
                register_email = "true";
            } else if (!valid) {
                $(".error_remail").text("Invalid email address");
                $(".error_remail").show();
                register_email = "true";
            } else {

                var url = main_url + "/customer/checkemail/" + email;
                $.ajax({
                    type: "GET",
                    url: url,
                    dataType: "json",
                    success: function(response){
                        if(response && response.found){
                            $(".error_remail").text("Email address already exists.");
                            $(".error_remail").show();
                            register_email = "true";
                        }
                        else{
                            $(".error_remail").hide();
                            register_email = "false";
                        }
                    },
                    error: function(response){
                        console.log("Error occured: " + response.responseText);
                        $(".error_remail").text("Unable to verify email.");
                        $(".error_remail").show();
                        register_email = "true";
                    }
                });
            }
        });

        /*-------------------- Phone number validation --------------------*/
        $("#phone").parent().append('<tr><td><span class="error_phone"></span></td></tr>');
        $(".error_phone").addClass("error");
        $("#phone").on('blur', function() {
            var regex_phone = /^(\([0-9]{3}\)\s|[0-9]{3}-)[0-9]{3}-[0-9]{4}$/i;
            var phone = $("#phone").val();
            var valid = regex_phone.test(phone);
            if (phone == "") {
                $(".error_phone").text("Phone number cannot be empty");
                $(".error_phone").show();
                register_phone = "true";
            } else if (!valid) {
                $(".error_phone").text("Invalid phone format (xxx) xxx-xxxx");
                $(".error_phone").show();
                register_phone = "true";
            } else {
                $(".error_phone").hide();
                register_phone = "false";
            }
        });

        /*-------------------- Password Validation --------------------*/
        $("#rpassword").parent().append('<tr><td><span class="error_rpwd">Password cannot be empty</span></td></tr>');
        $(".error_rpwd").addClass("error");
        $('#password-strength-meter').hide();
        $("#rpassword").on('input', function() {
            $(".error_rpwd").hide();
            var pwd = $("#rpassword").val();
            $('#password-strength-meter').show();
            var meter = $('#password-strength-meter').val();
            var strength = zxcvbn(pwd);
            pass_strength = strength.score;
            $('#password-strength-meter').attr("value", pass_strength);
            if (pwd != "") {
                $('#password-strength-text').show().html('<p>' + strength.feedback.suggestions + '</p>').addClass("error");
                if(pass_strength >= 3){
                    register_pass = "false";
                }
                else{
                    register_pass = "true";
                }
            }
            if (pwd == "") {
                $('#password-strength-meter').hide();
                $('#password-strength-text').hide();
                register_pass = "true";
            }
        });

        $("#rpassword").on('blur', function() {
            var pwd = $("#rpassword").val();
            if (pwd == "") {
                $('#password-strength-meter').hide();
                $('#password-strength-text').hide();
                $(".error_rpwd").show();
                register_pass = "true";
            } else if (pwd != "") {
                $('#password-strength-meter').hide();
                $(".error_rpwd").hide();
                if(pass_strength >= 3){
                    register_pass = "false";
                }
                else{
                    register_pass = "true";
                }
            }
            $("#cpassword").trigger("blur");
        });

        /*-------------------- Confirm Password Validation --------------------*/
        $("#cpassword").parent().append('<tr><td><span class="error_cpwd"></span></td></tr>');
        $(".error_cpwd").addClass("error");
        $("#cpassword").on('blur', function() {
            var pwd = $("#rpassword").val();
            var cpwd = $("#cpassword").val();
            if (cpwd == "") {
                $(".error_cpwd").text("Confirm Password cannot be empty");
                $(".error_cpwd").show();
                register_cpass = "true";
            } else if(cpwd != pwd){
                $(".error_cpwd").text("Passwords do not match");
                $(".error_cpwd").show();
                register_cpass = "true";
            } else {
                $(".error_cpwd").hide();
                register_cpass = "false";
            }
        });
    };

    /*-------------------- Adds login form event listeners on page --------------------*/
    var addLoginValidations = function(){

        /*-------------------- Email validation --------------------*/
        $("#email").after('<div class="error_email"></div>');
        $(".error_email").addClass("error");
        $("#email").on('blur', function() {
            var regex_email = /^[\w-]+@([\w-]+\.)+[\w-]+$/i;
            var email = $("#email").val();
            var valid = regex_email.test(email);
            if (email == "") {
                $(".error_email").text("Email cannot be empty");
                $(".error_email").show();
                login_email = "true";
            } else if (!valid) {
                $(".error_email").text("Invalid email address");
                $(".error_email").show();
                login_email = "true";
            } else {
                $(".error_email").hide();
                login_email = "false";
            }
        });

        /*-------------------- Password Validation --------------------*/
        $("#password").after('<div class="error_password"></div>');
        $(".error_password").addClass("error");
        $("#password").on('blur', function() {
            var password = $('#password').val();
            if (password == "") {
                $(".error_password").text("Password cannot be empty");
                $(".error_password").show();
                login_pass = "true";
            } else {
                $(".error_password").hide();
                login_pass = "false";
            }
        });
    };

    /*-------------------- Register user --------------------*/
    var onRegisterUser = function() {
        if(register_fname != "false" || register_lname != "false" || register_email != "false" || register_phone != "false" || register_pass != "false" || register_cpass != "false"){
            return;
        }

        register_fname = "", register_lname = "", register_email = "", register_phone = "", register_pass = "", register_cpass = "";
        pass_strength = -1;

        var customer = {
            "firstname" : $('#firstname').val(),
            "lastname" : $('#lastname').val(),
            "email" : $("#remail").val(),
            "phone" : $("#phone").val(),
            "password" : $("#cpassword").val(),
            "role" : 1,
            "cart" : [],
            "transactions" : []
        };

        var url = main_url + "/customer/insert";

        $.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(customer),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(response){
                if(response && response.success){
                    $("#register_success").show();
                    $("#back_to_login").trigger("click");
                }
                else{
                    $("#register_fail").show();
                    $(".error").hide();
                    $('.reg_input').val('');
                }
            },
            error: function(response){
                console.log("Error occured: " + response.responseText);
                $("#register_fail").show();
                $(".error").hide();
                $('.reg_input').val('');
            }
        });
    };

    /*-------------------- Login user --------------------*/
    var onLoginUser = function(){
        if(login_email != "false" || login_pass != "false") {
            return;
        }

        login_pass = "", login_email = "";
        $("#register_success").hide();

        var url = main_url + "/customer/login";
        $.ajax({
            type: "POST",
            url: url,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({"email": $("#email").val(), "password": $("#password").val()}),
            success: function(response){
                if(response && response.success && response.customer){
                    $("#login_fail").hide();
                    $('#email, #password').val('');
                    sessionStorage.setItem("customer", JSON.stringify(response.customer));
                    window.location = main_url + "/mainpage";
                }
                else{
                    $("#login_fail").show();
                    $('#email, #password').val('');
                }
            },
            error: function(response){
                console.log("Error occured: " + response.responseText);
                $("#login_fail").show();
                $('#email, #password').val('');
            }
        });
    };

    /*-------------------- Adds all event listeners on page --------------------*/
    var addEventListeners = function(){

        /*-------------------- Animations on clicking register button --------------------*/
        $("#register_link").click(function() {
            $(".login").removeClass("flipInY delay-1s").addClass("animated flipOutY");
            $(".register").show();
            $(".register").removeClass("flipOutY").addClass("animated flipInY delay-1s");

            $(".error").hide();
            $('#email, #password').val('');
            $("#register_success").hide();
            $("#login_fail").hide();

            login_pass = "", login_email = "";
        });

        /*-------------------- Animations on clicking back_to_login buttton --------------------*/
        $("#back_to_login").click(function() {
            $(".register").removeClass("flipInY delay-1s").addClass("flipOutY");
            $(".login").show();
            $(".login").removeClass("flipOutY").addClass("flipInY delay-1s");

            $(".error").hide();
            $('.reg_input').val('');
            $("#register_fail").hide();

            register_fname = "", register_lname = "", register_email = "", register_phone = "", register_pass = "", register_cpass = "";
            pass_strength = -1;
        });

        $("#register").on("click", onRegisterUser);
        $("#login").on("click", onLoginUser);

        addLoginValidations();
        addRegisterValidations();
    };

    /*-------------------- Entry point for scripts on page --------------------*/
    var initIndex = function(){
        $("#register_success").hide();
        $("#register_fail").hide();
        $("#login_fail").hide();

        addEventListeners();
    };

    initIndex();

}); //ready
