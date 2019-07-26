<?php
	// Account details
	$apiKey = urlencode('gpmTc4Ygis4-x4GFBQUxFcflj1qQl3ra6onj0xZhRX');

	// Message details

	$booking_id     = $_GET['booking_id'];
	$venue_name     = $_GET['venue_name'];
	$sport_name     = $_GET['sport_name'];
	$venue_type     = $_GET['venue_type'];
	$date     = $_GET['date'];
	$phone   = $_GET['phone'];
	$numbers = array($phone);
	$sender = urlencode('TRFTWN');
    
	$message = rawurlencode("Your booking ".$booking_id."\n scheduled ".$date."\n at ".$venue_name."\n has been cancelled. Please contact the venue for more info");

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
