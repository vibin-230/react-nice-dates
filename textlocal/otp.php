<?php
	// Account details
	$apiKey = urlencode('gpmTc4Ygis4-x4GFBQUxFcflj1qQl3ra6onj0xZhRX');

	// Message details

	$otp     = $_GET['otp'];
	$phone   = $_GET['phone'];
	$numbers = array($phone);
	$sender = urlencode('TRFTWN');
	$message = rawurlencode('Welcome to Turftown! Your OTP is '.$otp);

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
