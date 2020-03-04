<?php
	// Account details
	$apiKey = urlencode('gpmTc4Ygis4-x4GFBQUxFcflj1qQl3ra6onj0xZhRX');

	// Message details

	$booking_id     = $_GET['booking_id'];
	$date     = $_GET['date'];
	$event_name     = $_GET['event_name'];
	$name     = $_GET['name'];
	$amount_paid     = $_GET['amount_paid'];
	$balance   = $_GET['balance'];
	$phone   = $_GET['phone'];
	$sport   = $_GET['sport'];
	$game_type   = $_GET['game_type'];
	$manager_phone   = $_GET['manager_phone'];
	$numbers = array($phone, $manager_phone);
	$sender = urlencode('TRFTWN');
	// $message = rawurlencode("Your TURF TOWN booking has been confirmed.\nBooking Id: ".$booking_id."\nVenue: ".$venue_name."\nDate and Time: ".$date);
  $message = rawurlencode("You have received a Turftown event booking\nEvent : ".$event_name."\nDate : ".$date."\nTeam Name : ".$name."\nSport : ".$sport."\nType : ".$game_type."\nRegisteration ID : ".$booking_id."\nAmount Paid : ".$amount_paid."\nBalance to be paid at event : ".$balance."");
    
// 	You have received a new registration.
// Event : %%|eventname^{"inputtype" : "text", "maxlength" : "50"}%%
// Date : %%|time^{"inputtype" : "text", "maxlength" : "30"}%%
// Name : %%|teamname^{"inputtype" : "text", "maxlength" : "30"}%%
// Registeration ID : %%|bookingid^{"inputtype" : "text", "maxlength" : "10"}%%
// Amount Paid : %%|price^{"inputtype" : "text", "maxlength" : "10"}%%
// Balance to be paid at event : %%|balance^{"inputtype" : "text", "maxlength" : "10"}%%
// Do get in touch with the team and communicate further details

	$numbers = implode(',', $numbers);


	// Prepare data for POST request
	$data = array('apikey' => $apiKey, 'numbers' => $numbers, "sender" => $sender, "message" => $message);
	// echo $data;
	// Send the POST request with cURL
	$ch = curl_init('https://api.textlocal.in/send/');
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($ch);
	curl_close($ch);

	// Process your response here
	echo $response;
?>
