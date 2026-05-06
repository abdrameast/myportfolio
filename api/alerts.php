<?php
// Autoriser CORS pour votre frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

$RSS_URL = "https://www.google.fr/alerts/feeds/00897495945337774141/7724303843141150050";

$options = [
    "http" => [
        "header" => "User-Agent: Mozilla/5.0 (compatible; RSS Reader)\r\n" .
                    "Accept: application/rss+xml, application/xml, text/xml, */*\r\n"
    ]
];

$context = stream_context_create($options);
$xmlString = @file_get_contents($RSS_URL, false, $context);

if ($xmlString === FALSE) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur de récupération du flux RSS", "items" => []]);
    exit;
}

$xml = simplexml_load_string($xmlString);
if ($xml === FALSE) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur de parsing XML", "items" => []]);
    exit;
}

$items = [];
if (isset($xml->entry)) {
    foreach ($xml->entry as $entry) {
        $link = "";
        if (isset($entry->link)) {
            foreach ($entry->link as $l) {
                if ((string)$l['rel'] === 'alternate' || !isset($l['rel'])) {
                    $link = (string)$l['href'];
                    break;
                }
            }
        }
        $items[] = [
            "title" => strip_tags((string)$entry->title),
            "link" => $link,
            "pubDate" => (string)$entry->published,
            "description" => strip_tags((string)$entry->content)
        ];
    }
}

echo json_encode(["status" => "ok", "items" => $items]);
?>