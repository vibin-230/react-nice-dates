<?php
	// Account details
	$apiKey = urlencode('gpmTc4Ygis4-x4GFBQUxFcflj1qQl3ra6onj0xZhRX');

	// Message details

	$booking_id     = $_GET['booking_id'];
    $refund     = $_GET['refund'];
	$date     = $_GET['date'];
    $phone   = $_GET['phone'];
    $event_name   = $_GET['event_name'];
    $manager_phone   = $_GET['manager_phone'];
	$numbers = array($phone);
	$sender = urlencode('TRFTWN');
	$message = rawurlencode("Your booking ".$booking_id." scheduled ".$date." has been cancelled.Refund of ".$refund." has been initiated. Please contact the Event manager ".$manager_phone."for more info");

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
