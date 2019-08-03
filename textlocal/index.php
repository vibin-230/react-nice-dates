<?php
$json = array();

    $json[]= array(
       'name' => "Kishore",
        'password' => "1234"
    );

$jsonstring = json_encode($json);
echo $jsonstring;
?>
