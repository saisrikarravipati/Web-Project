# Web-Project

Project Title:
E-Commerce Website

Name of the Website:
Movies Unlimited

Project Description:
People in every part of the world watch movies as a type of entertainment, a way to have fun. For some people, fun movies can mean movies that make them laugh, while for others it can mean movies that make them cry, or feel afraid.
Rather than people going to the movies we decided to bring movies to the people. So, we created an e-commerce website that sells DVDs to customers such that they never miss out on their favorite movies.

The following are the main features of our ecommerce website:
Registration Page-
• This is the first step of the new users coming to the website
• The registration page requests information such as First Name, Last Name, Email, Phone Number and Password
• It handles validation checks like if the user is already registered, password strength, format of email and phone number and if all the fields are filled or not.
• Password is also stored in an encrypted form in the database.
• If the user enters all the details without any flaws, he/she will be registered into the database and then redirected to the login page.

Login Page-
• If the registration is successful, Users will be able to login into the Home page
• The Registration Details are stored in Mongo DB and will be checked against email ID and password when the user logs in.
• If the user enters an email ID or password, it will validate in MongoDB and throw an error.

Home Page –
• As soon as the login is successful, Users will get access to the Home Page
• Home Page displays a list of movies initially displayed in the Descending order of their ratings
• We have included data of 25 Movies with different Stock values in the DB spread across 5 pages in the Home Page
• Home Page has the shopping cart accessibility in the top right corner of the website

• Home page consists of Various features such as
1. Search for a Movie
2. Filter Movies based on Genre, Rating, Language and Country
3. Sort by (Unique Feature) based on Price, Title and Year of Release
• User Icon on the Home page will provide Order History details of the User
• Users can update, delete, clear and checkout the items from the Home Page

• Admin Users will have additional functionalities such as
1. Adding a New Movie
2. Editing an existing Movie (Updating image and Details)
3. Delete a Movie

• Movie Details can accessed by clicking on ‘Know More’ button and It will display the following:
1. An option to directly add to cart
2. Close button
3. Movie Details (Price of the movie, Stock available, Genre, Release Date, Rated, Director, Writer, Actors, Plot, Run time, Ratings, Language, Awards, Production, Box Office, Website)
• The item stays in the cart even after the person has logged out so that the user can continue from where he left off.

Check Out Page –
• Checkout Page will display the list of Movies along with their Names, Price and Quantity that the user wants to purchase
• Final Payment details will be calculated based on the items in the Cart
• Payment Details (Dummy) will require the following details from the user
1. Card Number (Format XXXX-XXXX-XXXX-XXXX)
2. Expiry Month (MM)
3. Expiry year (YYYY)
4. Cvv Code
5. Billing Address
• Once the validations for the payment details are successful, Users will be directed to Transaction successful Page and Stock will be updated in the DB

Transaction Successful Page –
• This page is generated whenever a transaction is successful
• There will be an option to click on Continue Shopping

Database Design:
DB - Mongo DB
