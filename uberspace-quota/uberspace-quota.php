<?php

// extract user name (= uberspace account name) and server
$user = getenv("USER");
$serverRaw = null;
exec("hostname", $serverRaw);
$server = preg_split('/\./', $serverRaw[0])[0];

// retrieve data (i've never seen the quota command return an error, so i'm not
// handling it here – i like to live on the edge)
$output = null;
exec("quota -gl", $output);

// `$output` now is an array containing the three lines output by the quota
// command, the numbers we're interested in are located in the last line (index
// 2), so "parse" that into an array (of integers)
$numbers = preg_split('/\s+/', $output[2], -1, PREG_SPLIT_NO_EMPTY);
$numbers = array_map("intval", $numbers);

// extract relevant numbers (and some irrelevant ones, too)
$blocks = $numbers[1];        // used kilobytes (divide by 1024 to get megabytes)
$blocks_quota = $numbers[2];  // total available kilobytes (including used)
$blocks_limit = $numbers[3];  // hard limit (can be used for a week on uberspace)
$files = $numbers[4];         // number of files
$files_quota = $numbers[5];   // zero on uberspace
$files_limit = $numbers[6];   // ditto

// package 'em up (along with user and server)
$data = array(
    "user" => $user,
    "server" => $server,
    "used" => $blocks,
    "total" => $blocks_quota,
    "files" => $files,
);

// Story time: My original plan was to have this PHP script be accessible via
// the web, where requesting it would return this data as a JSON value...
//header('Content-Type: application/json');
//echo json_encode($data);
// ...but when running via the PHP daemon, the `quota` command doesn't seem to
// have the required permissions on Uberspace, so the script wouldn't return any
// data. Hence, it now simply outputs the data, to be redirected into a file via
// cron (which this script should be run with every 10 minutes or so; it can
// also be run manually via the command line for testing purposes).
echo json_encode($data);
// If I'd known all this beforehand, this would've been a Python script, but oh
// well – having spent way too much time trying to work around the `quota`
// command's permission problems, I'm not in the mood to reimplement it.
