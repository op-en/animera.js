<?php

    //The directory (relative to this file) that holds the images

    $myDir = $_GET['myDir'];

    //$dir = "images";
    $dir = $myDir;


    //This array will hold all the image addresses
    $result = array();

    //Get all the files in the specified directory
    $files = scandir($dir);


    foreach($files as $file) {

        switch(ltrim(strstr($file, '.'), '.')) {

            //If the file is an image, add it to the array
            case "jpg": case "jpeg":case "png":case "gif":

               // $result[] = $dir . "/" . $file;
                 $result[] = $file;

        }
    }

    //Convert the array into JSON
    $resultJson = json_encode($result);

    //Output the JSON object
    //This is what the AJAX request will see
    
    $startJson = "elements";
    echo('{"element":' . $resultJson . '}');

?>